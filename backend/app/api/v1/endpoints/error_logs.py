from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_

from app.core.database import get_db
from app.models.error_log import ErrorLog
from app.services.error_log_service import ErrorLogService
from app.schemas.error_log import (
    ErrorLogResponse,
    ErrorLogCreate,
    ErrorLogUpdate,
    ErrorLogStats,
    ErrorLogListResponse,
    ErrorLogDisplayResponse,
    BulkResolveRequest,
    QuarantineRequest
)

router = APIRouter()


@router.get("/stats", response_model=ErrorLogStats)
def get_error_stats(db: Session = Depends(get_db)):
    """Get comprehensive error statistics for admin dashboard"""
    return ErrorLogService.get_error_stats(db)


@router.get("/", response_model=ErrorLogListResponse)
def get_error_logs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    severity: Optional[str] = Query(None, description="Filter by severity: error, warning, critical"),
    error_type: Optional[str] = Query(None, description="Filter by error type"),
    source_system: Optional[str] = Query(None, description="Filter by source system"),
    recovery_status: Optional[str] = Query(None, description="Filter by recovery status"),
    is_resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    is_quarantined: Optional[bool] = Query(None, description="Filter by quarantine status"),
    requires_manual_review: Optional[bool] = Query(None, description="Filter by manual review requirement"),
    batch_id: Optional[str] = Query(None, description="Filter by batch ID"),
    db: Session = Depends(get_db)
):
    """Get paginated list of error logs with filtering options"""
    
    query = db.query(ErrorLog)
    
    # Apply filters
    if severity:
        query = query.filter(ErrorLog.severity == severity)
    if error_type:
        query = query.filter(ErrorLog.error_type == error_type)
    if source_system:
        query = query.filter(ErrorLog.source_system == source_system)
    if recovery_status:
        query = query.filter(ErrorLog.recovery_status == recovery_status)
    if is_resolved is not None:
        query = query.filter(ErrorLog.is_resolved == is_resolved)
    if is_quarantined is not None:
        query = query.filter(ErrorLog.is_quarantined == is_quarantined)
    if requires_manual_review is not None:
        query = query.filter(ErrorLog.requires_manual_review == requires_manual_review)
    if batch_id:
        query = query.filter(ErrorLog.batch_id == batch_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    error_logs = query.order_by(desc(ErrorLog.created_at)).offset(skip).limit(limit).all()
    
    # Calculate pagination info
    total_pages = (total + limit - 1) // limit
    current_page = (skip // limit) + 1
    
    # Convert to display format with concise messages
    display_error_logs = []
    for error_log in error_logs:
        # Convert to ErrorLogResponse first
        error_response = ErrorLogResponse.model_validate(error_log)
        # Then convert to display format
        display_log = ErrorLogDisplayResponse.from_error_log(error_response)
        display_error_logs.append(display_log)
    
    return ErrorLogListResponse(
        error_logs=display_error_logs,
        total=total,
        page=current_page,
        per_page=limit,
        total_pages=total_pages
    )


@router.get("/{error_log_id}", response_model=ErrorLogResponse)
def get_error_log(error_log_id: int, db: Session = Depends(get_db)):
    """Get specific error log by ID"""
    error_log = db.query(ErrorLog).filter(ErrorLog.id == error_log_id).first()
    if not error_log:
        raise HTTPException(status_code=404, detail="Error log not found")
    return error_log


@router.post("/", response_model=ErrorLogResponse)
def create_error_log(error_log: ErrorLogCreate, db: Session = Depends(get_db)):
    """Create a new error log entry"""
    return ErrorLogService.log_error(
        db=db,
        error_type=error_log.error_type,
        error_message=error_log.error_message,
        severity=error_log.severity,
        source_system=error_log.source_system,
        source_function=error_log.source_function,
        batch_id=error_log.batch_id,
        error_code=error_log.error_code,
        stack_trace=error_log.stack_trace,
        error_context=error_log.error_context,
        requires_manual_review=error_log.requires_manual_review
    )


@router.put("/{error_log_id}", response_model=ErrorLogResponse)
def update_error_log(
    error_log_id: int,
    error_update: ErrorLogUpdate,
    db: Session = Depends(get_db)
):
    """Update error log recovery information"""
    error_log = db.query(ErrorLog).filter(ErrorLog.id == error_log_id).first()
    if not error_log:
        raise HTTPException(status_code=404, detail="Error log not found")
    
    # Update fields if provided
    if error_update.recovery_status:
        updated_error = ErrorLogService.update_recovery_status(
            db=db,
            error_log_id=error_log_id,
            recovery_status=error_update.recovery_status,
            recovery_method=error_update.recovery_method,
            recovery_notes=error_update.recovery_notes,
            is_resolved=error_update.is_resolved or False
        )
        if updated_error:
            return updated_error
    
    # Handle quarantine status
    if error_update.is_quarantined is not None:
        error_log.is_quarantined = error_update.is_quarantined
        db.commit()
        db.refresh(error_log)
    
    return error_log


@router.post("/{error_log_id}/quarantine", response_model=ErrorLogResponse)
def quarantine_error_log(
    error_log_id: int,
    quarantine_request: QuarantineRequest,
    db: Session = Depends(get_db)
):
    """Quarantine an error log for manual review"""
    updated_error = ErrorLogService.quarantine_error(
        db=db,
        error_log_id=error_log_id,
        quarantine_reason=quarantine_request.quarantine_reason
    )
    if not updated_error:
        raise HTTPException(status_code=404, detail="Error log not found")
    return updated_error


@router.post("/bulk-resolve")
def bulk_resolve_errors(
    bulk_request: BulkResolveRequest,
    db: Session = Depends(get_db)
):
    """Bulk resolve multiple error logs"""
    updated_count = ErrorLogService.bulk_resolve_errors(
        db=db,
        error_ids=bulk_request.error_ids,
        resolution_notes=bulk_request.resolution_notes
    )
    return {
        "message": f"Successfully resolved {updated_count} error logs",
        "updated_count": updated_count
    }


@router.get("/recovery/pending", response_model=List[ErrorLogResponse])
def get_pending_recovery_errors(
    limit: int = Query(50, ge=1, le=100),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    source_system: Optional[str] = Query(None, description="Filter by source system"),
    requires_manual_review: Optional[bool] = Query(None, description="Filter by manual review requirement"),
    db: Session = Depends(get_db)
):
    """Get errors that need recovery action"""
    return ErrorLogService.get_errors_for_recovery(
        db=db,
        limit=limit,
        severity=severity,
        source_system=source_system,
        requires_manual_review=requires_manual_review
    )


@router.delete("/{error_log_id}")
def delete_error_log(error_log_id: int, db: Session = Depends(get_db)):
    """Delete an error log (admin only)"""
    error_log = db.query(ErrorLog).filter(ErrorLog.id == error_log_id).first()
    if not error_log:
        raise HTTPException(status_code=404, detail="Error log not found")
    
    db.delete(error_log)
    db.commit()
    return {"message": "Error log deleted successfully"}


@router.get("/types/list")
def get_error_types(db: Session = Depends(get_db)):
    """Get list of all error types for filtering"""
    error_types = db.query(ErrorLog.error_type).distinct().all()
    return {"error_types": [error_type[0] for error_type in error_types if error_type[0]]}


@router.get("/systems/list")
def get_source_systems(db: Session = Depends(get_db)):
    """Get list of all source systems for filtering"""
    systems = db.query(ErrorLog.source_system).distinct().all()
    return {"source_systems": [system[0] for system in systems if system[0]]}
