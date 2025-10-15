"""
Email Queue Service for persistent email handling with retry mechanism
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.core.database import SessionLocal
from app.models.email_queue import EmailQueue
from app.services.email_service import EmailService
from app.services.retry_log_service import RetryLogService

logger = logging.getLogger(__name__)


class EmailQueueService:
    """Service for managing persistent email queue with retry logic"""
    
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
        priority: int = 2,  # 1=high, 2=normal, 3=low
        max_retries: int = 3,
        email_metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Queue an email for sending with retry capability
        
        Returns:
            Email queue ID
        """
        db = SessionLocal()
        try:
            email_queue = EmailQueue(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                email_type=email_type,
                order_id=order_id,
                priority=priority,
                max_retries=max_retries,
                email_metadata=email_metadata,
                status="pending"
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
        Process pending emails in the queue
        
        Returns:
            Statistics about processed emails
        """
        stats = {"sent": 0, "failed": 0, "retried": 0, "skipped": 0}
        
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            pending_emails = db.query(EmailQueue).filter(
                and_(
                    EmailQueue.status.in_(["pending", "failed"]),
                    or_(
                        EmailQueue.next_retry_at.is_(None),
                        EmailQueue.next_retry_at <= now
                    ),
                    EmailQueue.attempts < EmailQueue.max_retries
                )
            ).order_by(
                EmailQueue.priority.asc(),
                EmailQueue.created_at.asc()
            ).limit(batch_size).all()
            
            for email in pending_emails:
                retry_log_id = None
                try:
                    retry_log_id = RetryLogService.log_retry_start(
                        db=db,
                        retry_type="email_sending",
                        attempt_number=email.attempts + 1,
                        max_attempts=email.max_retries,
                        order_id=None,  # Skip order_id to avoid foreign key constraint issues
                        metadata={
                            "email_id": email.id,
                            "to_email": email.to_email,
                            "subject": email.subject,
                            "email_type": email.email_type,
                            "original_order_id": email.order_id  # Store as metadata instead
                        }
                    )
                    
                    # Mark as sending
                    email.status = "sending"
                    email.attempts += 1
                    db.commit()
                    
                    success = await self.email_service.send_email(
                        to_email=email.to_email,
                        subject=email.subject,
                        html_content=email.html_content,
                        text_content=email.text_content,
                        max_retries=1  
                    )
                    
                    if success:
                        email.status = "sent"
                        email.sent_at = datetime.utcnow()
                        email.last_error = None
                        stats["sent"] += 1
                        
                        # Log retry success
                        if retry_log_id:
                            RetryLogService.log_retry_result(
                                db=db,
                                retry_log_id=retry_log_id,
                                success=True
                            )
                        
                        logger.info(f"Email {email.id} sent successfully to {email.to_email}")
                    else:
                        if email.attempts >= email.max_retries:
                            email.status = "failed"
                            stats["failed"] += 1
                            
                            # Log final failure
                            if retry_log_id:
                                RetryLogService.log_retry_result(
                                    db=db,
                                    retry_log_id=retry_log_id,
                                    success=False,
                                    error_code="MAX_RETRIES_EXCEEDED",
                                    error_message=f"Email sending failed after {email.attempts} attempts"
                                )
                            
                            logger.error(f"Email {email.id} failed permanently after {email.attempts} attempts")
                        else:
                            email.status = "pending"
                            retry_delay = 5 * (3 ** (email.attempts - 1))
                            email.next_retry_at = datetime.utcnow() + timedelta(minutes=retry_delay)
                            stats["retried"] += 1
                            
                            # Log retry failure (will retry)
                            if retry_log_id:
                                RetryLogService.log_retry_result(
                                    db=db,
                                    retry_log_id=retry_log_id,
                                    success=False,
                                    error_code="SEND_FAILED",
                                    error_message="Email sending failed, will retry",
                                    next_retry_at=email.next_retry_at
                                )
                            
                            logger.warning(f"⚠️ Email {email.id} failed, retry #{email.attempts} scheduled for {email.next_retry_at}")
                    
                    db.commit()
                    
                except Exception as e:
                    db.rollback()
                    email.status = "failed"
                    email.last_error = str(e)
                    
                    # Log exception failure
                    if retry_log_id:
                        RetryLogService.log_retry_result(
                            db=db,
                            retry_log_id=retry_log_id,
                            success=False,
                            error_code="EXCEPTION",
                            error_message=str(e)
                        )
                    
                    db.commit()
                    stats["failed"] += 1
                    logger.error(f"❌ Error processing email {email.id}: {str(e)}")
            
            return stats
            
        except Exception as e:
            logger.error(f"Error processing email queue: {str(e)}")
            return stats
        finally:
            db.close()
    
    def get_queue_stats(self) -> Dict[str, int]:
        """Get email queue statistics"""
        db = SessionLocal()
        try:
            stats = {}
            stats["pending"] = db.query(EmailQueue).filter(EmailQueue.status == "pending").count()
            stats["sending"] = db.query(EmailQueue).filter(EmailQueue.status == "sending").count()
            stats["sent"] = db.query(EmailQueue).filter(EmailQueue.status == "sent").count()
            stats["failed"] = db.query(EmailQueue).filter(EmailQueue.status == "failed").count()
            stats["total"] = db.query(EmailQueue).count()
            
            # Overdue retries
            now = datetime.utcnow()
            stats["overdue"] = db.query(EmailQueue).filter(
                and_(
                    EmailQueue.status == "pending",
                    EmailQueue.next_retry_at <= now,
                    EmailQueue.attempts < EmailQueue.max_retries
                )
            ).count()
            
            return stats
        finally:
            db.close()
    
    def cleanup_old_emails(self, days_old: int = 30) -> int:
        """Clean up old sent/failed emails"""
        db = SessionLocal()
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            deleted = db.query(EmailQueue).filter(
                and_(
                    EmailQueue.status.in_(["sent", "failed"]),
                    EmailQueue.created_at < cutoff_date
                )
            ).delete()
            
            db.commit()
            logger.info(f"Cleaned up {deleted} old email records")
            return deleted
        finally:
            db.close()


email_queue_service = EmailQueueService()
