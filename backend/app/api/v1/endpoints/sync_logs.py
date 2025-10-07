from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from app.core.database import get_db
from app.models.product import ProductSyncLog
from app.models.user import User
from app.schemas.sync_log import ProductSyncLogResponse, ProductSyncLogListResponse, SyncLogFilters
from app.api.dependencies import get_current_user, require_manager_or_admin

router = APIRouter()


@router.get("/", response_model=ProductSyncLogListResponse)
async def list_sync_logs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    status: Optional[str] = Query(None, description="Filter by status: success, failed, partial"),
    start_date: Optional[datetime] = Query(None, description="Filter logs from this date"),
    end_date: Optional[datetime] = Query(None, description="Filter logs until this date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List product sync logs with pagination and filtering.
    Requires admin or manager role.
    """
    # Check user permissions
    require_manager_or_admin(current_user)
    
    # Build query with filters
    query = db.query(ProductSyncLog)
    
    # Apply filters
    filters = []
    if status:
        if status not in ["success", "failed", "partial"]:
            raise HTTPException(status_code=400, detail="Invalid status. Must be: success, failed, or partial")
        filters.append(ProductSyncLog.status == status)
    
    if start_date:
        filters.append(ProductSyncLog.run_at >= start_date)
    
    if end_date:
        filters.append(ProductSyncLog.run_at <= end_date)
    
    if filters:
        query = query.filter(and_(*filters))
    
    # Order by most recent first
    query = query.order_by(desc(ProductSyncLog.run_at))
    
    # Get total count for pagination
    total = query.count()
    
    # Apply pagination
    logs = query.offset(skip).limit(limit).all()
    
    return ProductSyncLogListResponse(
        logs=[ProductSyncLogResponse.from_orm(log) for log in logs],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{log_id}", response_model=ProductSyncLogResponse)
async def get_sync_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific sync log entry.
    Requires admin or manager role.
    """
    # Check user permissions
    require_manager_or_admin(current_user)
    
    log = db.query(ProductSyncLog).filter(ProductSyncLog.id == log_id).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Sync log not found")
    
    return ProductSyncLogResponse.from_orm(log)


@router.get("/stats/summary")
async def get_sync_stats_summary(
    days: int = Query(30, ge=1, le=365, description="Number of days to include in summary"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get summary statistics for sync operations over the specified period.
    Requires admin or manager role.
    """
    # Check user permissions
    require_manager_or_admin(current_user)
    
    from datetime import timedelta
    from sqlalchemy import func
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get summary statistics
    stats = db.query(
        func.count(ProductSyncLog.id).label('total_syncs'),
        func.sum(ProductSyncLog.total_synced).label('total_products_synced'),
        func.sum(ProductSyncLog.new_products).label('total_new_products'),
        func.sum(ProductSyncLog.updated_products).label('total_updated_products'),
        func.sum(ProductSyncLog.inactive_products).label('total_inactive_products'),
        func.count().filter(ProductSyncLog.status == 'success').label('successful_syncs'),
        func.count().filter(ProductSyncLog.status == 'failed').label('failed_syncs'),
        func.count().filter(ProductSyncLog.status == 'partial').label('partial_syncs')
    ).filter(
        ProductSyncLog.run_at >= start_date,
        ProductSyncLog.run_at <= end_date
    ).first()
    
    # Get latest sync info
    latest_sync = db.query(ProductSyncLog).order_by(desc(ProductSyncLog.run_at)).first()
    
    return {
        "period_days": days,
        "start_date": start_date,
        "end_date": end_date,
        "total_syncs": stats.total_syncs or 0,
        "total_products_synced": stats.total_products_synced or 0,
        "total_new_products": stats.total_new_products or 0,
        "total_updated_products": stats.total_updated_products or 0,
        "total_inactive_products": stats.total_inactive_products or 0,
        "successful_syncs": stats.successful_syncs or 0,
        "failed_syncs": stats.failed_syncs or 0,
        "partial_syncs": stats.partial_syncs or 0,
        "success_rate": round((stats.successful_syncs or 0) / max(stats.total_syncs or 1, 1) * 100, 2),
        "latest_sync": {
            "id": latest_sync.id if latest_sync else None,
            "run_at": latest_sync.run_at if latest_sync else None,
            "status": latest_sync.status if latest_sync else None,
            "total_synced": latest_sync.total_synced if latest_sync else 0
        } if latest_sync else None
    }
