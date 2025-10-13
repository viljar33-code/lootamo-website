"""Simple Email Queue Service using SQLAlchemy ORM"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.email_queue import EmailQueue
from app.services.email_service import EmailService
from app.services.retry_log_service import RetryLogService

logger = logging.getLogger(__name__)


class SimpleEmailQueueService:
    """Simple email queue service using SQLAlchemy ORM"""
    
    def __init__(self):
        self.email_service = EmailService()
    
    def queue_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        email_type: Optional[str] = None,
        order_id: Optional[str] = None,
        priority: int = 2,  
        max_retries: int = 3
    ) -> int:
        """
        Queue an email for sending with retry capability using ORM
        Includes deduplication for license key emails to prevent duplicates
        
        Returns:
            Email queue ID
        """
        db = SessionLocal()
        try:
            # Check for existing license key emails to prevent duplicates
            if email_type == "license_key" and order_id:
                existing_email = db.query(EmailQueue).filter(
                    EmailQueue.email_type == "license_key",
                    EmailQueue.order_id == order_id,
                    EmailQueue.to_email == to_email,
                    EmailQueue.status.in_(["pending", "sending", "sent"])
                ).first()
                
                if existing_email:
                    logger.info(f"License key email already exists for order {order_id} to {to_email} (ID: {existing_email.id})")
                    return existing_email.id
            
            # Create new email queue entry
            email_queue = EmailQueue(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                status="pending",
                priority=priority,
                attempts=0,
                max_retries=max_retries,
                email_type=email_type,
                order_id=order_id
            )
            
            db.add(email_queue)
            db.commit()
            db.refresh(email_queue)
            
            logger.info(f"Queued email {email_queue.id} for {to_email} (type: {email_type})")
            return email_queue.id
                
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to queue email for {to_email}: {str(e)}")
            raise
        finally:
            db.close()
    
    async def process_queue(self, batch_size: int = 10) -> Dict[str, int]:
        """
        Process pending emails in the queue using ORM
        
        Returns:
            Statistics about processed emails
        """
        stats = {"sent": 0, "failed": 0, "retried": 0, "skipped": 0}
        
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            
            # Get pending emails
            pending_emails = db.query(EmailQueue).filter(
                EmailQueue.status == "pending",
                (EmailQueue.next_retry_at.is_(None)) | (EmailQueue.next_retry_at <= now)
            ).order_by(
                EmailQueue.priority.asc(),
                EmailQueue.created_at.asc()
            ).limit(batch_size).all()
            
            for email in pending_emails:
                try:
                    # Update status to 'sending'
                    email.status = "sending"
                    email.attempts += 1
                    db.commit()
                    
                    # Send the email
                    success = await self.email_service.send_email(
                        to_email=email.to_email,
                        subject=email.subject,
                        html_content=email.html_content,
                        text_content=email.text_content,
                        max_retries=1,  # We handle retries at queue level
                        retry_delay=0.0,
                        order_id=email.order_id
                    )
                    
                    if success:
                        # Mark as sent
                        email.status = "sent"
                        email.sent_at = datetime.utcnow()
                        db.commit()
                        stats["sent"] += 1
                        logger.info(f"Successfully sent email {email.id} to {email.to_email}")
                    else:
                        # Handle failure
                        self._handle_email_failure(db, email, "Email sending failed")
                        stats["failed"] += 1
                        
                except Exception as e:
                    logger.error(f"Error processing email {email.id}: {str(e)}")
                    self._handle_email_failure(db, email, str(e))
                    stats["failed"] += 1
            
            logger.info(f"Processed {len(pending_emails)} emails: {stats}")
            return stats
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error processing email queue: {str(e)}")
            raise
        finally:
            db.close()
    
    def _handle_email_failure(self, db: Session, email: EmailQueue, error_message: str):
        """
        Handle email sending failure with retry logic using ORM
        """
        if email.attempts >= email.max_retries:
            # Mark as permanently failed
            email.status = "failed"
            email.last_error = error_message
            db.commit()
            logger.error(f"Email {email.id} permanently failed after {email.attempts} attempts: {error_message}")
        else:
            # Schedule retry with exponential backoff
            retry_delay = min(300, 30 * (2 ** (email.attempts - 1)))  # Cap at 5 minutes
            next_retry = datetime.utcnow() + timedelta(seconds=retry_delay)
            
            email.status = "pending"
            email.next_retry_at = next_retry
            email.last_error = error_message
            db.commit()
            logger.warning(f"Email {email.id} scheduled for retry in {retry_delay}s (attempt {email.attempts}/{email.max_retries}): {error_message}")
    
    def get_queue_stats(self) -> Dict[str, int]:
        """Get email queue statistics using ORM"""
        db = SessionLocal()
        try:
            # Get counts by status
            pending_count = db.query(EmailQueue).filter(EmailQueue.status == "pending").count()
            sending_count = db.query(EmailQueue).filter(EmailQueue.status == "sending").count()
            sent_count = db.query(EmailQueue).filter(EmailQueue.status == "sent").count()
            failed_count = db.query(EmailQueue).filter(EmailQueue.status == "failed").count()
            total_count = db.query(EmailQueue).count()
            
            # Get overdue count (pending emails that should be retried)
            now = datetime.utcnow()
            overdue_count = db.query(EmailQueue).filter(
                EmailQueue.status == "pending",
                EmailQueue.next_retry_at <= now,
                EmailQueue.attempts < EmailQueue.max_retries
            ).count()
            
            return {
                "pending": pending_count,
                "sending": sending_count,
                "sent": sent_count,
                "failed": failed_count,
                "total": total_count,
                "overdue": overdue_count
            }
                
        except Exception as e:
            logger.error(f"Error getting queue stats: {str(e)}")
            return {"error": str(e)}
        finally:
            db.close()


# Global instance
simple_email_queue_service = SimpleEmailQueueService()
