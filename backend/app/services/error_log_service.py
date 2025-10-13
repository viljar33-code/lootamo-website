import hashlib
import json
import traceback
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func

from app.models.error_log import ErrorLog
from app.schemas.error_log import ErrorLogCreate, ErrorLogUpdate, ErrorLogStats


class ErrorLogService:
    """Service for comprehensive error logging and recovery management"""
    
    @staticmethod
    def log_error(
        db: Session,
        error_type: str,
        error_message: str,
        severity: str = "error",
        source_system: Optional[str] = None,
        source_function: Optional[str] = None,
        batch_id: Optional[str] = None,
        error_code: Optional[str] = None,
        stack_trace: Optional[str] = None,
        error_context: Optional[Dict[str, Any]] = None,
        requires_manual_review: bool = False
    ) -> ErrorLog:
        """
        Log a new error with comprehensive context and duplicate detection
        
        Args:
            db: Database session
            error_type: Type of error (e.g., VALIDATION_WARN, DUPLICATE_SKU)
            error_message: Detailed error message
            severity: error, warning, critical
            source_system: System where error occurred (payment, email, g2a)
            source_function: Function/method where error occurred
            batch_id: Batch ID for batch operations
            error_code: Specific error code
            stack_trace: Stack trace if available
            error_context: Additional context data
            requires_manual_review: Whether error needs manual review
        """
        
        # Generate duplicate hash for detection
        duplicate_data = {
            "error_type": error_type,
            "error_message": error_message,
            "source_system": source_system,
            "source_function": source_function,
            "error_code": error_code
        }
        duplicate_hash = hashlib.sha256(
            json.dumps(duplicate_data, sort_keys=True).encode()
        ).hexdigest()
        
        # Check for existing duplicate
        existing_error = db.query(ErrorLog).filter(
            ErrorLog.duplicate_hash == duplicate_hash,
            ErrorLog.is_resolved == False
        ).first()
        
        if existing_error:
            # Update existing error with new occurrence
            existing_error.duplicate_count += 1
            existing_error.last_occurrence = func.now()
            existing_error.updated_at = func.now()
            
            # Update context if provided
            if error_context:
                if existing_error.error_context:
                    existing_error.error_context.update(error_context)
                else:
                    existing_error.error_context = error_context
            
            db.commit()
            db.refresh(existing_error)
            return existing_error
        
        # Create new error log
        error_log = ErrorLog(
            error_type=error_type,
            error_message=error_message,
            severity=severity,
            source_system=source_system,
            source_function=source_function,
            batch_id=batch_id,
            error_code=error_code,
            stack_trace=stack_trace,
            error_context=error_context or {},
            duplicate_hash=duplicate_hash,
            requires_manual_review=requires_manual_review,
            is_quarantined=severity == "critical"  # Auto-quarantine critical errors
        )
        
        db.add(error_log)
        db.commit()
        db.refresh(error_log)
        
        return error_log
    
    @staticmethod
    def log_exception(
        db: Session,
        exception: Exception,
        error_type: str,
        source_system: Optional[str] = None,
        source_function: Optional[str] = None,
        batch_id: Optional[str] = None,
        error_context: Optional[Dict[str, Any]] = None,
        severity: str = "error"
    ) -> ErrorLog:
        """
        Log an exception with automatic stack trace capture
        """
        return ErrorLogService.log_error(
            db=db,
            error_type=error_type,
            error_message=str(exception),
            severity=severity,
            source_system=source_system,
            source_function=source_function,
            batch_id=batch_id,
            stack_trace=traceback.format_exc(),
            error_context=error_context,
            requires_manual_review=severity in ["critical", "error"]
        )
    
    @staticmethod
    def update_recovery_status(
        db: Session,
        error_log_id: int,
        recovery_status: str,
        recovery_method: Optional[str] = None,
        recovery_notes: Optional[str] = None,
        is_resolved: bool = False
    ) -> Optional[ErrorLog]:
        """
        Update error recovery status
        
        Args:
            recovery_status: pending, recovered, quarantined, ignored
            recovery_method: manual, automatic, quarantine
        """
        error_log = db.query(ErrorLog).filter(ErrorLog.id == error_log_id).first()
        if not error_log:
            return None
        
        error_log.recovery_status = recovery_status
        error_log.recovery_attempts += 1
        error_log.updated_at = func.now()
        
        if recovery_method:
            error_log.recovery_method = recovery_method
        if recovery_notes:
            error_log.recovery_notes = recovery_notes
        if is_resolved:
            error_log.is_resolved = True
            error_log.resolved_at = func.now()
        
        db.commit()
        db.refresh(error_log)
        return error_log
    
    @staticmethod
    def quarantine_error(
        db: Session,
        error_log_id: int,
        quarantine_reason: str
    ) -> Optional[ErrorLog]:
        """
        Quarantine an error for manual review
        """
        return ErrorLogService.update_recovery_status(
            db=db,
            error_log_id=error_log_id,
            recovery_status="quarantined",
            recovery_method="quarantine",
            recovery_notes=quarantine_reason
        )
    
    @staticmethod
    def get_error_stats(db: Session) -> ErrorLogStats:
        """
        Get comprehensive error statistics
        """
        total_errors = db.query(ErrorLog).count()
        
        # Count by severity
        critical_errors = db.query(ErrorLog).filter(ErrorLog.severity == "critical").count()
        error_count = db.query(ErrorLog).filter(ErrorLog.severity == "error").count()
        warning_count = db.query(ErrorLog).filter(ErrorLog.severity == "warning").count()
        
        # Count by status
        pending_errors = db.query(ErrorLog).filter(ErrorLog.recovery_status == "pending").count()
        quarantined_errors = db.query(ErrorLog).filter(ErrorLog.is_quarantined == True).count()
        resolved_errors = db.query(ErrorLog).filter(ErrorLog.is_resolved == True).count()
        manual_review_needed = db.query(ErrorLog).filter(ErrorLog.requires_manual_review == True, ErrorLog.is_resolved == False).count()
        
        # Get error types distribution
        error_types = db.query(
            ErrorLog.error_type,
            func.count(ErrorLog.id).label('count')
        ).group_by(ErrorLog.error_type).all()
        
        error_types_dict = {error_type: count for error_type, count in error_types}
        
        # Get recent critical errors (last 24 hours)
        recent_critical = db.query(ErrorLog).filter(
            ErrorLog.severity == "critical",
            ErrorLog.created_at >= datetime.utcnow() - timedelta(hours=24)
        ).limit(10).all()
        
        return ErrorLogStats(
            total_errors=total_errors,
            critical_errors=critical_errors,
            error_count=error_count,
            warning_count=warning_count,
            pending_errors=pending_errors,
            quarantined_errors=quarantined_errors,
            resolved_errors=resolved_errors,
            manual_review_needed=manual_review_needed,
            error_types=error_types_dict,
            recent_critical_errors=[{
                "id": error.id,
                "error_type": error.error_type,
                "error_message": error.error_message[:100],
                "source_system": error.source_system,
                "created_at": error.created_at.isoformat()
            } for error in recent_critical]
        )
    
    @staticmethod
    def get_errors_for_recovery(
        db: Session,
        limit: int = 50,
        severity: Optional[str] = None,
        source_system: Optional[str] = None,
        requires_manual_review: Optional[bool] = None
    ) -> List[ErrorLog]:
        """
        Get errors that need recovery action
        """
        query = db.query(ErrorLog).filter(
            ErrorLog.is_resolved == False,
            ErrorLog.recovery_status.in_(["pending", "quarantined"])
        )
        
        if severity:
            query = query.filter(ErrorLog.severity == severity)
        if source_system:
            query = query.filter(ErrorLog.source_system == source_system)
        if requires_manual_review is not None:
            query = query.filter(ErrorLog.requires_manual_review == requires_manual_review)
        
        return query.order_by(desc(ErrorLog.created_at)).limit(limit).all()
    
    @staticmethod
    def bulk_resolve_errors(
        db: Session,
        error_ids: List[int],
        resolution_notes: str
    ) -> int:
        """
        Bulk resolve multiple errors
        """
        updated_count = db.query(ErrorLog).filter(
            ErrorLog.id.in_(error_ids)
        ).update({
            "is_resolved": True,
            "resolved_at": func.now(),
            "recovery_status": "recovered",
            "recovery_method": "bulk_manual",
            "recovery_notes": resolution_notes,
            "updated_at": func.now()
        }, synchronize_session=False)
        
        db.commit()
        return updated_count
