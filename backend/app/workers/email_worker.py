"""
Background Email Worker for automatic email processing
"""
import asyncio
import logging
import signal
import sys
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import SessionLocal
from app.services.email_service import EmailService
from app.services.retry_log_service import RetryLogService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('email_worker.log')
    ]
)

logger = logging.getLogger(__name__)


class EmailWorker:
    """Background worker for processing email queue"""
    
    def __init__(self, check_interval: int = 30):
        self.check_interval = check_interval
        self.email_service = EmailService()
        self.running = False
    
    async def start(self):
        """Start the email worker"""
        self.running = True
        logger.info(f"📧 Email worker started and polling every {self.check_interval}s...")
        
        while self.running:
            try:
                await self.process_pending_emails()
                if self.running:  # Only sleep if still running
                    await asyncio.sleep(self.check_interval)
            except asyncio.CancelledError:
                logger.info("📧 Email worker cancelled")
                break
            except Exception as e:
                logger.error(f"Email worker error: {str(e)}")
                if self.running:
                    await asyncio.sleep(self.check_interval)
    
    def stop(self):
        """Stop the email worker"""
        self.running = False
        logger.info("📧 Email worker stopped")
    
    async def process_pending_emails(self):
        """Process all pending emails in the queue"""
        db = SessionLocal()
        try:
            # Get pending emails that are ready to be sent
            result = db.execute(text("""
                SELECT id, to_email, subject, html_content, text_content, attempts, max_retries
                FROM email_queue 
                WHERE status = 'pending' 
                AND (next_retry_at IS NULL OR next_retry_at <= NOW())
                ORDER BY priority ASC, created_at ASC
                LIMIT 20;
            """))
            
            pending_emails = result.fetchall()
            
            if not pending_emails:
                return
            
            logger.info(f"📬 Processing {len(pending_emails)} pending emails")
            
            sent_count = 0
            failed_count = 0
            
            for email in pending_emails:
                email_id, to_email, subject, html_content, text_content, attempts, max_retries = email
                retry_log_id = None
                
                try:
                    # Log retry attempt start (skip order_id to avoid foreign key constraint)
                    retry_log_id = RetryLogService.log_retry_start(
                        db=db,
                        retry_type="email_sending",
                        attempt_number=attempts + 1,
                        max_attempts=max_retries,
                        order_id=None,  # Skip order_id to avoid foreign key constraint issues
                        metadata={
                            "email_id": email_id,
                            "to_email": to_email,
                            "subject": subject
                        }
                    )
                    
                    # Mark as sending
                    db.execute(text("""
                        UPDATE email_queue 
                        SET status = 'sending', updated_at = NOW()
                        WHERE id = :email_id
                    """), {'email_id': email_id})
                    db.commit()
                    
                    # Send email
                    success = await self.email_service.send_email(
                        to_email=to_email,
                        subject=subject,
                        html_content=html_content,
                        text_content=text_content
                    )
                    
                    if success:
                        # Mark as sent
                        db.execute(text("""
                            UPDATE email_queue 
                            SET status = 'sent', sent_at = NOW(), updated_at = NOW()
                            WHERE id = :email_id
                        """), {'email_id': email_id})
                        
                        # Log retry success
                        if retry_log_id:
                            RetryLogService.log_retry_result(
                                db=db,
                                retry_log_id=retry_log_id,
                                success=True
                            )
                        
                        logger.info(f"✅ Email {email_id} sent to {to_email}")
                        sent_count += 1
                    else:
                        # Handle failure
                        await self._handle_email_failure(db, email_id, attempts, max_retries, "Send failed", retry_log_id)
                        failed_count += 1
                    
                    db.commit()
                    
                except Exception as e:
                    logger.error(f"❌ Error sending email {email_id}: {str(e)}")
                    await self._handle_email_failure(db, email_id, attempts, max_retries, str(e), retry_log_id)
                    failed_count += 1
                    db.commit()
            
            if sent_count > 0 or failed_count > 0:
                logger.info(f"📊 Email processing complete: {sent_count} sent, {failed_count} failed")
        
        except Exception as e:
            logger.error(f"Error processing email queue: {str(e)}")
            db.rollback()
        finally:
            db.close()
    
    async def _handle_email_failure(self, db: Session, email_id: int, attempts: int, max_retries: int, error: str, retry_log_id: int = None):
        """Handle email sending failure with retry logic"""
        new_attempts = attempts + 1
        
        if new_attempts >= max_retries:
            # Mark as permanently failed
            db.execute(text("""
                UPDATE email_queue 
                SET status = 'failed', attempts = :attempts, 
                    last_error = :error, updated_at = NOW()
                WHERE id = :email_id
            """), {
                'email_id': email_id, 
                'attempts': new_attempts, 
                'error': error[:500]
            })
            
            # Log final failure
            if retry_log_id:
                RetryLogService.log_retry_result(
                    db=db,
                    retry_log_id=retry_log_id,
                    success=False,
                    error_code="MAX_RETRIES_EXCEEDED",
                    error_message=f"Email sending failed after {new_attempts} attempts: {error}"
                )
            
            logger.error(f"❌ Email {email_id} permanently failed after {new_attempts} attempts")
        else:
            # Schedule retry with exponential backoff
            retry_delay = min(300 * (2 ** attempts), 3600)  # Max 1 hour delay
            next_retry = datetime.utcnow() + timedelta(seconds=retry_delay)
            
            db.execute(text("""
                UPDATE email_queue 
                SET status = 'pending', attempts = :attempts, 
                    last_error = :error, next_retry_at = :next_retry, updated_at = NOW()
                WHERE id = :email_id
            """), {
                'email_id': email_id, 
                'attempts': new_attempts, 
                'error': error[:500],
                'next_retry': next_retry
            })
            
            # Log retry failure (will retry)
            if retry_log_id:
                RetryLogService.log_retry_result(
                    db=db,
                    retry_log_id=retry_log_id,
                    success=False,
                    error_code="SEND_FAILED",
                    error_message=f"Email sending failed, will retry: {error}",
                    next_retry_at=next_retry
                )
            
            logger.warning(f"⏰ Email {email_id} scheduled for retry in {retry_delay}s (attempt {new_attempts}/{max_retries})")


# Global worker instance and shutdown flag
email_worker = None
shutdown_event = asyncio.Event()


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"📧 Received signal {signum}, initiating graceful shutdown...")
    if email_worker:
        email_worker.stop()
    shutdown_event.set()


async def start_email_worker():
    """Start the email worker with graceful shutdown support"""
    global email_worker
    
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    email_worker = EmailWorker(check_interval=30)
    
    try:
        # Start the worker
        worker_task = asyncio.create_task(email_worker.start())
        shutdown_task = asyncio.create_task(shutdown_event.wait())
        
        # Wait for either worker completion or shutdown signal
        done, pending = await asyncio.wait(
            [worker_task, shutdown_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        
        # Cancel any remaining tasks
        for task in pending:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
                
    except Exception as e:
        logger.error(f"📧 Email worker crashed: {str(e)}")
        raise
    finally:
        if email_worker:
            email_worker.stop()
        logger.info("📧 Email worker shutdown complete")


def stop_email_worker():
    """Stop the email worker"""
    if email_worker:
        email_worker.stop()


if __name__ == "__main__":
    # Run the worker directly with proper event loop management
    try:
        asyncio.run(start_email_worker())
    except KeyboardInterrupt:
        logger.info("📧 Email worker interrupted by user")
    except Exception as e:
        logger.error(f"📧 Email worker failed: {str(e)}")
        sys.exit(1)
