import logging
import asyncio
import os
from datetime import datetime, time
from typing import Optional
from pathlib import Path
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor
from app.services.product_service import sync_all_products_paginated
from app.core.database import get_db
from app.core.config import settings

def setup_scheduler_logging():
    """Setup dedicated logging for scheduler operations"""
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    scheduler_logger = logging.getLogger("scheduler")
    scheduler_logger.setLevel(logging.INFO)
    
    scheduler_logger.handlers.clear()
    
    file_handler = logging.FileHandler("logs/product_sync_scheduler.log")
    file_handler.setLevel(logging.INFO)
    
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    scheduler_logger.addHandler(file_handler)
    scheduler_logger.addHandler(console_handler)
    
    return scheduler_logger

logger = setup_scheduler_logging()

class SchedulerService:
    """Service for managing scheduled tasks using APScheduler"""
    
    def __init__(self):
        # Configure job stores and executors
        jobstores = {
            'default': MemoryJobStore()
        }
        executors = {
            'default': AsyncIOExecutor()
        }
        
        job_defaults = {
            'coalesce': False,
            'max_instances': 1,
            'misfire_grace_time': 3600  # 1 hour grace period
        }
        
        self.scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone='UTC'
        )
        
        logging.getLogger('apscheduler').setLevel(logging.INFO)
        
    async def start(self):
        """Start the scheduler"""
        try:
            self.scheduler.start()
            logger.info("APScheduler started successfully")
            
            await self.schedule_interval_product_sync(hours=2)
            
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
            raise
    
    async def shutdown(self):
        """Shutdown the scheduler"""
        try:
            self.scheduler.shutdown(wait=True)
            logger.info("APScheduler shutdown successfully")
        except Exception as e:
            logger.error(f"Error shutting down scheduler: {e}")
    
    async def schedule_interval_product_sync(self, hours: int = None, minutes: int = None):
        """
        Schedule product sync job to run at regular intervals
        
        Args:
            hours: Interval in hours between sync runs (optional)
            minutes: Interval in minutes between sync runs (optional)
            
        Note: Either hours or minutes must be provided, not both
        """
        if not hours and not minutes:
            hours = 2  # Default to 2 hours
        
        if hours and minutes:
            raise ValueError("Cannot specify both hours and minutes. Choose one.")
            
        try:
            if self.scheduler.get_job('interval_product_sync'):
                self.scheduler.remove_job('interval_product_sync')
            
            if hours:
                trigger = IntervalTrigger(hours=hours)
                interval_text = f"{hours}h"
                log_text = f"{hours} hours"
            else:  # minutes
                trigger = IntervalTrigger(minutes=minutes)
                interval_text = f"{minutes}m"
                log_text = f"{minutes} minutes"
            
            self.scheduler.add_job(
                func=self._interval_product_sync_job,
                trigger=trigger,
                id='interval_product_sync',
                name=f'Product Sync (Every {interval_text})',
                replace_existing=True
            )
            
            logger.info(f"Product sync scheduled every {log_text}")
            
        except Exception as e:
            logger.error(f"Failed to schedule interval product sync: {e}")
            raise

    async def schedule_daily_product_sync(self, hour: int = 2, minute: int = 0):
        """
        Schedule daily product sync job (legacy method - kept for compatibility)
        
        Args:
            hour: Hour to run the sync (0-23, default: 2 AM)
            minute: Minute to run the sync (0-59, default: 0)
        """
        try:
            if self.scheduler.get_job('daily_product_sync'):
                self.scheduler.remove_job('daily_product_sync')
            
            self.scheduler.add_job(
                func=self._daily_product_sync_job,
                trigger=CronTrigger(hour=hour, minute=minute),
                id='daily_product_sync',
                name='Daily Product Sync',
                replace_existing=True
            )
            
            logger.info(f"Daily product sync scheduled at {hour:02d}:{minute:02d} UTC")
            
        except Exception as e:
            logger.error(f"Failed to schedule daily product sync: {e}")
            raise
    
    async def _interval_product_sync_job(self):
        """Internal job function for interval product sync"""
        job_start_time = datetime.utcnow()
        logger.info(f"=== INTERVAL PRODUCT SYNC STARTED at {job_start_time.isoformat()} ===")
        
        try:
            result = await sync_all_products_paginated()
            
            job_end_time = datetime.utcnow()
            duration = (job_end_time - job_start_time).total_seconds()
            
            if result["success"]:
                logger.info(
                    f"=== INTERVAL PRODUCT SYNC COMPLETED SUCCESSFULLY ===\n"
                    f"Duration: {duration:.2f} seconds\n"
                    f"Products Synced: {result['total_products']}\n"
                    f"Pages Processed: {result['pages_processed']}\n"
                    f"Errors: {len(result.get('errors', []))}\n"
                    f"End Time: {job_end_time.isoformat()}"
                )
            else:
                logger.error(
                    f"=== INTERVAL PRODUCT SYNC COMPLETED WITH ERRORS ===\n"
                    f"Duration: {duration:.2f} seconds\n"
                    f"Errors: {len(result.get('errors', []))}\n"
                    f"End Time: {job_end_time.isoformat()}\n"
                    f"Error Details: {result.get('errors', [])}"
                )
                
        except Exception as e:
            job_end_time = datetime.utcnow()
            duration = (job_end_time - job_start_time).total_seconds()
            
            logger.error(
                f"=== INTERVAL PRODUCT SYNC FAILED ===\n"
                f"Duration: {duration:.2f} seconds\n"
                f"Error: {str(e)}\n"
                f"End Time: {job_end_time.isoformat()}\n"
                f"Full traceback:",
                exc_info=True
            )

    async def _daily_product_sync_job(self):
        """Internal job function for daily product sync"""
        job_start_time = datetime.utcnow()
        logger.info(f"=== DAILY PRODUCT SYNC STARTED at {job_start_time.isoformat()} ===")
        
        try:
            result = await sync_all_products_paginated()
            
            job_end_time = datetime.utcnow()
            duration = (job_end_time - job_start_time).total_seconds()
            
            if result["success"]:
                logger.info(
                    f"=== DAILY PRODUCT SYNC COMPLETED SUCCESSFULLY ===\n"
                    f"Duration: {duration:.2f} seconds\n"
                    f"Products Synced: {result['total_products']}\n"
                    f"Pages Processed: {result['pages_processed']}\n"
                    f"Errors: {len(result.get('errors', []))}\n"
                    f"End Time: {job_end_time.isoformat()}"
                )
            else:
                logger.error(
                    f"=== DAILY PRODUCT SYNC COMPLETED WITH ERRORS ===\n"
                    f"Duration: {duration:.2f} seconds\n"
                    f"Products Synced: {result['total_products']}\n"
                    f"Pages Processed: {result['pages_processed']}\n"
                    f"Errors: {result['errors']}\n"
                    f"End Time: {job_end_time.isoformat()}"
                )
                
        except Exception as e:
            job_end_time = datetime.utcnow()
            duration = (job_end_time - job_start_time).total_seconds()
            logger.error(
                f"=== DAILY PRODUCT SYNC FAILED ===\n"
                f"Duration: {duration:.2f} seconds\n"
                f"Error: {str(e)}\n"
                f"End Time: {job_end_time.isoformat()}"
            )
            import traceback
            logger.error(f"Full traceback:\n{traceback.format_exc()}")
    
    async def trigger_manual_sync(self):
        """Trigger a manual product sync job"""
        try:
            job_id = f'manual_product_sync_{int(datetime.utcnow().timestamp())}'
            job = self.scheduler.add_job(
                func=self._manual_product_sync_job,
                trigger='date',  # Run immediately
                id=job_id,
                name='Manual Product Sync'
            )
            
            logger.info(f"Manual product sync job triggered: {job.id}")
            return job.id
            
        except Exception as e:
            logger.error(f"Failed to trigger manual sync: {e}")
            raise
    
    async def _manual_product_sync_job(self):
        """Internal job function for manual product sync"""
        job_start_time = datetime.utcnow()
        logger.info(f"=== MANUAL PRODUCT SYNC STARTED at {job_start_time.isoformat()} ===")
        
        try:
            result = await sync_all_products_paginated()
            
            job_end_time = datetime.utcnow()
            duration = (job_end_time - job_start_time).total_seconds()
            
            if result["success"]:
                logger.info(
                    f"=== MANUAL PRODUCT SYNC COMPLETED SUCCESSFULLY ===\n"
                    f"Duration: {duration:.2f} seconds\n"
                    f"Products Synced: {result['total_products']}\n"
                    f"Pages Processed: {result['pages_processed']}\n"
                    f"Errors: {len(result.get('errors', []))}\n"
                    f"End Time: {job_end_time.isoformat()}"
                )
            else:
                logger.error(
                    f"=== MANUAL PRODUCT SYNC COMPLETED WITH ERRORS ===\n"
                    f"Duration: {duration:.2f} seconds\n"
                    f"Products Synced: {result['total_products']}\n"
                    f"Pages Processed: {result['pages_processed']}\n"
                    f"Errors: {result['errors']}\n"
                    f"End Time: {job_end_time.isoformat()}"
                )
                
        except Exception as e:
            job_end_time = datetime.utcnow()
            duration = (job_end_time - job_start_time).total_seconds()
            logger.error(
                f"=== MANUAL PRODUCT SYNC FAILED ===\n"
                f"Duration: {duration:.2f} seconds\n"
                f"Error: {str(e)}\n"
                f"End Time: {job_end_time.isoformat()}"
            )
            import traceback
            logger.error(f"Full traceback:\n{traceback.format_exc()}")
    
    def get_scheduled_jobs(self):
        """Get list of all scheduled jobs"""
        jobs = []
        for job in self.scheduler.get_jobs():
            actual_job = self.scheduler.get_job(job.id)
            jobs.append({
                'id': job.id,
                'name': job.name,
                'next_run_time': actual_job.next_run_time.isoformat() if actual_job and actual_job.next_run_time else None,
                'trigger': str(job.trigger)
            })
        return jobs
    
    def get_job_status(self, job_id: str):
        """Get status of a specific job"""
        job = self.scheduler.get_job(job_id)
        if job:
            return {
                'id': job.id,
                'name': job.name,
                'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
                'trigger': str(job.trigger)
            }
        return None
    
    async def reschedule_daily_sync(self, hour: int, minute: int = 0):
        """Reschedule the daily product sync to a different time"""
        await self.schedule_daily_product_sync(hour, minute)
        logger.info(f"Daily sync rescheduled to {hour:02d}:{minute:02d} UTC")
        return f"Daily sync rescheduled to {hour:02d}:{minute:02d} UTC"
    
    async def reschedule_interval_sync(self, hours: int = None, minutes: int = None):
        """Reschedule the interval product sync to a different frequency"""
        await self.schedule_interval_product_sync(hours=hours, minutes=minutes)
        
        if hours:
            logger.info(f"Interval sync rescheduled to every {hours} hours")
            return f"Interval sync rescheduled to every {hours} hours"
        else:
            logger.info(f"Interval sync rescheduled to every {minutes} minutes")
            return f"Interval sync rescheduled to every {minutes} minutes"

# Global scheduler instance
scheduler_service = SchedulerService()
