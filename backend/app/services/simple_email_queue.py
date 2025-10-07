"""
Simple Email Queue Service without SQLAlchemy model dependencies
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy import text
from app.core.config import settings
from app.core.database import sync_engine
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


class SimpleEmailQueueService:
    """Simple email queue service using direct SQL to avoid model relationship issues"""
    
    def __init__(self):
        self.email_service = EmailService()
        self.engine = sync_engine
    
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
        Queue an email for sending with retry capability using direct SQL
        
        Returns:
            Email queue ID
        """
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    INSERT INTO email_queue (
                        to_email, subject, html_content, text_content, 
                        status, priority, attempts, max_retries, 
                        email_type, order_id, created_at, updated_at
                    ) VALUES (
                        :to_email, :subject, :html_content, :text_content,
                        'pending', :priority, 0, :max_retries,
                        :email_type, :order_id, NOW(), NOW()
                    ) RETURNING id;
                """), {
                    'to_email': to_email,
                    'subject': subject,
                    'html_content': html_content,
                    'text_content': text_content,
                    'priority': priority,
                    'max_retries': max_retries,
                    'email_type': email_type,
                    'order_id': order_id
                })
                
                email_id = result.scalar()
                conn.commit()
                
                logger.info(f"Queued email {email_id} for {to_email} (type: {email_type})")
                return email_id
                
        except Exception as e:
            logger.error(f"Failed to queue email for {to_email}: {str(e)}")
            raise
    
    async def process_queue(self, batch_size: int = 10) -> Dict[str, int]:
        """
        Process pending emails in the queue using direct SQL
        
        Returns:
            Statistics about processed emails
        """
        stats = {"sent": 0, "failed": 0, "retried": 0, "skipped": 0}
        
        try:
            with self.engine.connect() as conn:
                now = datetime.utcnow()
                result = conn.execute(text("""
                    SELECT id, to_email, subject, html_content, text_content, 
                           attempts, max_retries, email_type, order_id
                    FROM email_queue 
                    WHERE status IN ('pending', 'failed')
                    AND (next_retry_at IS NULL OR next_retry_at <= :now)
                    AND attempts < max_retries
                    ORDER BY priority ASC, created_at ASC
                    LIMIT :batch_size;
                """), {'now': now, 'batch_size': batch_size})
                
                pending_emails = result.fetchall()
                
                for email in pending_emails:
                    email_id, to_email, subject, html_content, text_content, attempts, max_retries, email_type, order_id = email
                    
                    try:
                        conn.execute(text("""
                            UPDATE email_queue 
                            SET status = 'sending', attempts = attempts + 1, updated_at = NOW()
                            WHERE id = :email_id;
                        """), {'email_id': email_id})
                        conn.commit()
                        
                        success = await self.email_service.send_email(
                            to_email=to_email,
                            subject=subject,
                            html_content=html_content,
                            text_content=text_content,
                            max_retries=1  # Queue handles retries
                        )
                        
                        if success:
                            conn.execute(text("""
                                UPDATE email_queue 
                                SET status = 'sent', sent_at = NOW(), last_error = NULL, updated_at = NOW()
                                WHERE id = :email_id;
                            """), {'email_id': email_id})
                            stats["sent"] += 1
                            logger.info(f"Email {email_id} sent successfully to {to_email}")
                        else:
                            new_attempts = attempts + 1
                            if new_attempts >= max_retries:
                                conn.execute(text("""
                                    UPDATE email_queue 
                                    SET status = 'failed', updated_at = NOW()
                                    WHERE id = :email_id;
                                """), {'email_id': email_id})
                                stats["failed"] += 1
                                logger.error(f"Email {email_id} failed permanently after {new_attempts} attempts")
                            else:
                                # Schedule retry with exponential backoff
                                retry_delay = 5 * (3 ** (new_attempts - 1))  # 5min, 15min, 45min
                                next_retry = datetime.utcnow() + timedelta(minutes=retry_delay)
                                
                                conn.execute(text("""
                                    UPDATE email_queue 
                                    SET status = 'pending', next_retry_at = :next_retry, updated_at = NOW()
                                    WHERE id = :email_id;
                                """), {'email_id': email_id, 'next_retry': next_retry})
                                stats["retried"] += 1
                                logger.warning(f"Email {email_id} failed, retry scheduled for {next_retry}")
                        
                        conn.commit()
                        
                    except Exception as e:
                        conn.execute(text("""
                            UPDATE email_queue 
                            SET status = 'failed', last_error = :error, updated_at = NOW()
                            WHERE id = :email_id;
                        """), {'email_id': email_id, 'error': str(e)})
                        conn.commit()
                        stats["failed"] += 1
                        logger.error(f"Error processing email {email_id}: {str(e)}")
            
            return stats
            
        except Exception as e:
            logger.error(f"Error processing email queue: {str(e)}")
            return stats
    
    def get_queue_stats(self) -> Dict[str, int]:
        """Get email queue statistics using direct SQL"""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT 
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                        COUNT(CASE WHEN status = 'sending' THEN 1 END) as sending,
                        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
                        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'pending' AND next_retry_at <= NOW() AND attempts < max_retries THEN 1 END) as overdue
                    FROM email_queue;
                """))
                
                row = result.fetchone()
                return {
                    "pending": row[0] or 0,
                    "sending": row[1] or 0,
                    "sent": row[2] or 0,
                    "failed": row[3] or 0,
                    "total": row[4] or 0,
                    "overdue": row[5] or 0
                }
        except Exception as e:
            logger.error(f"Error getting queue stats: {str(e)}")
            return {"pending": 0, "sending": 0, "sent": 0, "failed": 0, "total": 0, "overdue": 0}


# Global instance
simple_email_queue_service = SimpleEmailQueueService()
