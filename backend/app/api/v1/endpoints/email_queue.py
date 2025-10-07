"""
Email Queue API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.email_queue import EmailQueue
from app.schemas.email_queue import EmailQueueItem, EmailQueueStats
from app.services.email_queue_service import email_queue_service
from app.api.dependencies import get_current_active_user, require_admin

router = APIRouter()

@router.get("/email-queue/stats", response_model=EmailQueueStats)
async def get_email_queue_stats(
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get email queue statistics
    """
    stats = email_queue_service.get_queue_stats()
    return stats

@router.get("/email-queue/retries", response_model=List[EmailQueueItem])
async def get_email_retries(
    status: Optional[str] = None,
    limit: int = 10,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get emails with retry information
    """
    query = db.query(EmailQueue)
    
    if status:
        query = query.filter(EmailQueue.status == status)
    
    # Get emails that have been retried at least once
    query = query.filter(EmailQueue.attempts > 0)
    
    # Order by most recent first
    emails = query.order_by(EmailQueue.updated_at.desc()).limit(limit).all()
    
    return emails
