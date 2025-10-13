"""
Retry Log Service for tracking and managing retry attempts
"""
import json
import logging
from datetime import datetime, timedelta, timezone
import pytz
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.retry_log import RetryLog
from app.schemas.retry_log import RetryLogCreate, RetryLogUpdate, RetryStatsResponse
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

class RetryLogService:
    """Service for managing retry logs and monitoring"""
    
    @staticmethod
    def create_retry_log(
        db: Session,
        retry_type: str,
        order_id: Optional[int] = None,
        order_item_id: Optional[int] = None,
        g2a_order_id: Optional[str] = None,
        attempt_number: int = 1,
        max_attempts: int = 5,
        metadata: Optional[Dict[str, Any]] = None
    ) -> RetryLog:
        """Create a new retry log entry"""
        
        retry_log = RetryLog(
            retry_type=retry_type,
            order_id=order_id,
            order_item_id=order_item_id,
            g2a_order_id=g2a_order_id,
            attempt_number=attempt_number,
            max_attempts=max_attempts,
            status="pending",
            started_at=datetime.now(timezone.utc),
            retry_metadata=json.dumps(metadata) if metadata else None
        )
        
        db.add(retry_log)
        db.commit()
        db.refresh(retry_log)
        
        logger.info(f"Created retry log {retry_log.id} for {retry_type} (attempt {attempt_number}/{max_attempts})")
        return retry_log
    
    @staticmethod
    def update_retry_log(
        db: Session,
        retry_log_id: int,
        status: Optional[str] = None,
        error_code: Optional[str] = None,
        error_message: Optional[str] = None,
        next_retry_at: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[RetryLog]:
        """Update an existing retry log"""
        
        retry_log = db.query(RetryLog).filter(RetryLog.id == retry_log_id).first()
        if not retry_log:
            logger.error(f"Retry log {retry_log_id} not found")
            return None
        
        if status:
            retry_log.status = status
            if status in ["success", "failed"]:
                retry_log.completed_at = datetime.now(timezone.utc)
        
        if error_code:
            retry_log.error_code = error_code
        
        if error_message:
            retry_log.error_message = error_message
        
        if next_retry_at:
            retry_log.next_retry_at = next_retry_at
        
        if metadata:
            retry_log.retry_metadata = json.dumps(metadata)
        
        db.commit()
        db.refresh(retry_log)
        
        logger.info(f"Updated retry log {retry_log_id} with status: {status}")
        return retry_log
    
    @staticmethod
    def get_retry_logs(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        retry_type: Optional[str] = None,
        status: Optional[str] = None,
        order_id: Optional[int] = None
    ) -> List[RetryLog]:
        """Get retry logs with filtering and pagination"""
        
        query = db.query(RetryLog)
        
        if retry_type:
            query = query.filter(RetryLog.retry_type == retry_type)
        
        if status:
            query = query.filter(RetryLog.status == status)
        
        if order_id:
            query = query.filter(RetryLog.order_id == order_id)
        
        return query.order_by(desc(RetryLog.started_at)).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_retry_stats(db: Session) -> RetryStatsResponse:
        """Get retry statistics for monitoring dashboard"""
        
        # Total counts by status
        total_retries = db.query(RetryLog).count()
        pending_retries = db.query(RetryLog).filter(RetryLog.status == "pending").count()
        in_progress_retries = db.query(RetryLog).filter(RetryLog.status == "in_progress").count()
        successful_retries = db.query(RetryLog).filter(RetryLog.status == "success").count()
        failed_retries = db.query(RetryLog).filter(RetryLog.status == "failed").count()
        
        # Count by retry type
        retry_type_counts = db.query(
            RetryLog.retry_type,
            func.count(RetryLog.id).label('count')
        ).group_by(RetryLog.retry_type).all()
        
        retry_types = {row.retry_type: row.count for row in retry_type_counts}
        
        # Recent failures (last 24 hours)
        recent_failures = db.query(RetryLog).filter(
            RetryLog.status == "failed",
            RetryLog.started_at >= datetime.now(timezone.utc) - timedelta(hours=24)
        ).order_by(desc(RetryLog.started_at)).limit(10).all()
        
        return RetryStatsResponse(
            total_retries=total_retries,
            pending_retries=pending_retries,
            in_progress_retries=in_progress_retries,
            successful_retries=successful_retries,
            failed_retries=failed_retries,
            retry_types=retry_types,
            recent_failures=recent_failures
        )
    
    @staticmethod
    def log_retry_start(
        db: Session,
        retry_type: str,
        attempt_number: int,
        max_attempts: int,
        order_id: Optional[int] = None,
        order_item_id: Optional[int] = None,
        g2a_order_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[int]:
        """Log the start of a retry attempt"""
        try:
            retry_log = RetryLogService.create_retry_log(
                db=db,
                retry_type=retry_type,
                order_id=order_id,
                order_item_id=order_item_id,
                g2a_order_id=g2a_order_id,
                attempt_number=attempt_number,
                max_attempts=max_attempts,
                metadata=metadata
            )
            return retry_log.id if retry_log else None
        except Exception as e:
            logger.error(f"Failed to log retry start: {str(e)}")
            return None
    
    @staticmethod
    def log_retry_result(
        db: Session,
        retry_log_id: int,
        success: bool,
        error_code: Optional[str] = None,
        error_message: Optional[str] = None,
        next_retry_at: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log the result of a retry attempt"""
        try:
            status = "success" if success else "failed"
            
            # Update retry log with result
            RetryLogService.update_retry_log(
                db=db,
                retry_log_id=retry_log_id,
                status=status,
                error_code=error_code,
                error_message=error_message,
                next_retry_at=next_retry_at,
                metadata=metadata
            )
            
        except Exception as e:
            logger.error(f"Failed to log retry result: {str(e)}")
    
    @staticmethod
    def log_license_key_retry_start(
        order_item_id: int,
        g2a_order_id: str,
        attempt_number: int,
        max_attempts: int = 5
    ) -> Optional[RetryLog]:
        """Log the start of a license key retry attempt"""
        
        db = SessionLocal()
        try:
            return RetryLogService.create_retry_log(
                db=db,
                retry_type="license_key",
                order_item_id=order_item_id,
                g2a_order_id=g2a_order_id,
                attempt_number=attempt_number,
                max_attempts=max_attempts,
                metadata={
                    "retry_reason": "license_key_not_ready",
                    "g2a_order_id": g2a_order_id
                }
            )
        except Exception as e:
            logger.error(f"Error creating retry log: {e}")
            return None
        finally:
            db.close()
    
    @staticmethod
    def log_license_key_retry_result(
        retry_log_id: int,
        success: bool,
        error_code: Optional[str] = None,
        error_message: Optional[str] = None,
        license_key: Optional[str] = None
    ) -> None:
        """Log the result of a license key retry attempt"""
        
        db = SessionLocal()
        try:
            status = "success" if success else "failed"
            metadata = {}
            
            if license_key:
                metadata["license_key_retrieved"] = True
                metadata["license_key_length"] = len(license_key)
            
            if error_code:
                metadata["g2a_error_code"] = error_code
            
            RetryLogService.update_retry_log(
                db=db,
                retry_log_id=retry_log_id,
                status=status,
                error_code=error_code,
                error_message=error_message,
                metadata=metadata
            )
        except Exception as e:
            logger.error(f"Error updating retry log {retry_log_id}: {e}")
        finally:
            db.close()
    
    @staticmethod
    def delete_retry_log(db: Session, retry_log_id: int) -> int:
        """Delete a specific retry log by ID"""
        try:
            deleted_count = db.query(RetryLog).filter(RetryLog.id == retry_log_id).delete()
            db.commit()
            
            if deleted_count > 0:
                logger.info(f"Deleted retry log {retry_log_id}")
            else:
                logger.warning(f"Retry log {retry_log_id} not found for deletion")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error deleting retry log {retry_log_id}: {e}")
            db.rollback()
            raise e

    @staticmethod
    def cleanup_old_retry_logs(hours_to_keep: int = 30) -> int:
        """Clean up old retry logs to prevent database bloat"""
        
        db = SessionLocal()
        try:
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_to_keep)
            
            deleted_count = db.query(RetryLog).filter(
                RetryLog.started_at < cutoff_time
            ).delete()
            
            db.commit()
            logger.info(f"Cleaned up {deleted_count} old retry logs")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up retry logs: {e}")
            db.rollback()
            return 0
        finally:
            db.close()