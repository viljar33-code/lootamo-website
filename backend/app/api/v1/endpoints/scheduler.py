from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.services.scheduler_service import scheduler_service
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole
import logging
import re

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/jobs")
async def get_scheduled_jobs(
    current_user: User = Depends(get_current_user)
):
    """
    Get list of all scheduled jobs.
    Requires authentication.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can view scheduled jobs"
        )
    
    try:
        jobs = scheduler_service.get_scheduled_jobs()
        return {
            "message": "Scheduled jobs retrieved successfully",
            "jobs": jobs,
            "total_jobs": len(jobs)
        }
    except Exception as e:
        logger.error(f"Error retrieving scheduled jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving scheduled jobs: {str(e)}")

@router.get("/jobs/{job_id}")
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get status of a specific job.
    Requires authentication.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can view job status"
        )
    
    try:
        job_status = scheduler_service.get_job_status(job_id)
        if job_status:
            return {
                "message": "Job status retrieved successfully",
                "job": job_status
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job with ID '{job_id}' not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving job status for {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving job status: {str(e)}")

@router.post("/sync/manual")
async def trigger_manual_sync(
    current_user: User = Depends(get_current_user)
):
    """
    Trigger a manual product sync job.
    Requires admin or manager role.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can trigger manual sync"
        )
    
    try:
        job_id = await scheduler_service.trigger_manual_sync()
        logger.info(f"Manual sync triggered by user {current_user.username} (ID: {current_user.id})")
        return {
            "message": "Manual product sync triggered successfully",
            "job_id": job_id,
            "triggered_by": current_user.username,
            "status": "scheduled"
        }
    except Exception as e:
        logger.error(f"Error triggering manual sync: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error triggering manual sync: {str(e)}")

@router.put("/schedule/daily")
async def reschedule_daily_sync(
    hour: int,
    minute: int = 0,
    current_user: User = Depends(get_current_user)
):
    """
    Reschedule the daily product sync to a different time.
    Requires admin role.
    
    Args:
        hour: Hour to run the sync (0-23)
        minute: Minute to run the sync (0-59, default: 0)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can reschedule daily sync"
        )
    
    # Validate input
    if not (0 <= hour <= 23):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hour must be between 0 and 23"
        )
    
    if not (0 <= minute <= 59):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minute must be between 0 and 59"
        )
    
    try:
        result = await scheduler_service.reschedule_daily_sync(hour, minute)
        logger.info(f"Daily sync rescheduled by user {current_user.username} to {hour:02d}:{minute:02d} UTC")
        return {
            "message": result,
            "new_schedule": f"{hour:02d}:{minute:02d} UTC",
            "rescheduled_by": current_user.username
        }
    except Exception as e:
        logger.error(f"Error rescheduling daily sync: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error rescheduling daily sync: {str(e)}")

@router.put("/schedule/interval")
async def reschedule_interval_sync(
    hours: int = None,
    minutes: int = None,
    current_user: User = Depends(get_current_user)
):
    """
    Reschedule the interval product sync to a different frequency.
    Only admins can modify the sync interval.
    
    Args:
        hours: New interval in hours between syncs (1-24, optional)
        minutes: New interval in minutes between syncs (1-1440, optional)
        
    Note: Either hours or minutes must be provided, not both
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can reschedule interval sync"
        )
    
    # Validate that exactly one parameter is provided
    if not hours and not minutes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either hours or minutes must be provided"
        )
    
    if hours and minutes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot specify both hours and minutes. Choose one."
        )
    
    # Validate input ranges
    if hours and not (1 <= hours <= 24):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hours must be between 1 and 24"
        )
    
    if minutes and not (1 <= minutes <= 1440):  # 1440 minutes = 24 hours
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minutes must be between 1 and 1440 (24 hours)"
        )
    
    try:
        result = await scheduler_service.reschedule_interval_sync(hours=hours, minutes=minutes)
        
        if hours:
            logger.info(f"Interval sync rescheduled by user {current_user.username} to every {hours} hours")
        else:
            logger.info(f"Interval sync rescheduled by user {current_user.username} to every {minutes} minutes")
        return {
            "message": result,
            "new_interval": f"every {hours} hours" if hours else f"every {minutes} minutes",
            "rescheduled_by": current_user.username
        }
    except Exception as e:
        logger.error(f"Error rescheduling interval sync: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error rescheduling interval sync: {str(e)}")

@router.get("/status")
async def get_scheduler_status():
    """
    Get the current scheduler status.
    No authentication required for basic status.
    """
    try:
        jobs = scheduler_service.get_scheduled_jobs()
        interval_sync_job = next((job for job in jobs if job['id'] == 'interval_product_sync'), None)
        
        # Extract interval from job trigger if available
        sync_frequency = None
        if interval_sync_job:
            trigger_str = interval_sync_job.get('trigger', '')
            
            # Match patterns for different interval formats:
            # Days: interval[1 day, 0:00:00]
            # Hours only: interval[2:00:00] 
            # Minutes only: interval[0:30:00]
            # Hours + minutes: interval[1:30:00] (90 minutes)
            
            day_match = re.search(r'interval\[(\d+) day', trigger_str)
            hours_minutes_match = re.search(r'interval\[(\d+):(\d+):00\]', trigger_str)
            
            if day_match:
                days = int(day_match.group(1))
                hours = days * 24
                sync_frequency = f"every {hours} hours"
            elif hours_minutes_match:
                hours = int(hours_minutes_match.group(1))
                minutes = int(hours_minutes_match.group(2))
                
                if hours == 0:
                    # Pure minutes (e.g., 0:30:00 = 30 minutes)
                    sync_frequency = f"every {minutes} minutes"
                elif minutes == 0:
                    # Pure hours (e.g., 2:00:00 = 2 hours)
                    sync_frequency = f"every {hours} hours"
                else:
                    # Hours + minutes (e.g., 1:30:00 = 90 minutes)
                    total_minutes = hours * 60 + minutes
                    sync_frequency = f"every {total_minutes} minutes"
            else:
                sync_frequency = "every 2 hours"  # fallback
        
        return {
            "scheduler_running": scheduler_service.scheduler.running,
            "total_jobs": len(jobs),
            "interval_sync_scheduled": interval_sync_job is not None,
            "interval_sync_next_run": interval_sync_job['next_run_time'] if interval_sync_job else None,
            "sync_frequency": sync_frequency,
            "status": "healthy" if scheduler_service.scheduler.running else "stopped"
        }
    except Exception as e:
        logger.error(f"Error getting scheduler status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting scheduler status: {str(e)}")
