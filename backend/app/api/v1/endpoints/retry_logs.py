"""
Retry Logs API endpoints for admin panel monitoring
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import math

from app.core.database import get_db
from app.services.retry_log_service import RetryLogService
from app.schemas.retry_log import RetryLogResponse, RetryLogListResponse, RetryStatsResponse
from app.api.dependencies import get_current_user_sync
from app.models.user import User

router = APIRouter()

@router.get("/stats", response_model=RetryStatsResponse)
async def get_retry_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """Get retry statistics for admin dashboard"""
    try:
        return RetryLogService.get_retry_stats(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching retry stats: {str(e)}")

@router.get("/", response_model=RetryLogListResponse)
def get_retry_logs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    retry_type: Optional[str] = Query(None, description="Filter by retry type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    order_id: Optional[int] = Query(None, description="Filter by order ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """Get paginated list of retry logs with filtering"""
    try:
        # Get retry logs using the service method
        retry_logs = RetryLogService.get_retry_logs(
            db=db,
            skip=skip,
            limit=limit,
            retry_type=retry_type,
            status=status,
            order_id=order_id
        )
        
        # Get total count for pagination using the same filters
        from app.models.retry_log import RetryLog
        total_query = db.query(RetryLog)
        if retry_type:
            total_query = total_query.filter(RetryLog.retry_type == retry_type)
        if status:
            total_query = total_query.filter(RetryLog.status == status)
        if order_id:
            total_query = total_query.filter(RetryLog.order_id == order_id)
        
        total = total_query.count()
        
        total_pages = math.ceil(total / limit) if total > 0 else 0
        
        return RetryLogListResponse(
            retry_logs=retry_logs,
            total=total,
            page=skip // limit + 1,
            per_page=limit,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching retry logs: {str(e)}")

@router.get("/{retry_log_id}", response_model=RetryLogResponse)
def get_retry_log(
    retry_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """Get specific retry log by ID"""
    try:
        from app.models.retry_log import RetryLog
        retry_log = db.query(RetryLog).filter(RetryLog.id == retry_log_id).first()
        
        if not retry_log:
            raise HTTPException(status_code=404, detail="Retry log not found")
        
        return retry_log
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching retry log: {str(e)}")

@router.delete("/cleanup")
def cleanup_old_retry_logs(
    days_to_keep: int = Query(30, ge=1, le=365, description="Number of days to keep"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """Clean up old retry logs (admin only)"""
    try:
        deleted_count = RetryLogService.cleanup_old_retry_logs(days_to_keep)
        return {
            "message": f"Successfully cleaned up {deleted_count} old retry logs",
            "deleted_count": deleted_count,
            "days_kept": days_to_keep
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cleaning up retry logs: {str(e)}")

@router.get("/order/{order_id}", response_model=List[RetryLogResponse])
def get_retry_logs_for_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """Get all retry logs for a specific order"""
    try:
        retry_logs = RetryLogService.get_retry_logs(
            db=db,
            order_id=order_id,
            limit=1000  # Get all for this order
        )
        
        return retry_logs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching retry logs for order: {str(e)}")

@router.delete("/{retry_log_id}")
def delete_retry_log(
    retry_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """Delete a specific retry log by ID"""
    try:
        deleted_count = RetryLogService.delete_retry_log(db, retry_log_id)
        
        if deleted_count == 0:
            raise HTTPException(status_code=404, detail="Retry log not found")
        
        return {
            "message": f"Successfully deleted retry log {retry_log_id}",
            "deleted_count": deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting retry log: {str(e)}")

@router.get("/recent/failures", response_model=List[RetryLogResponse])
def get_recent_failures(
    hours: int = Query(24, ge=1, le=168, description="Hours to look back"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of failures to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """Get recent failed retry attempts for monitoring"""
    try:
        from datetime import datetime, timedelta
        from app.models.retry_log import RetryLog
        
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        recent_failures = db.query(RetryLog).filter(
            RetryLog.status == "failed",
            RetryLog.started_at >= cutoff_time
        ).order_by(RetryLog.started_at.desc()).limit(limit).all()
        
        return recent_failures
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recent failures: {str(e)}")