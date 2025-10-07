"""
Background Email Worker for processing email queue
"""
import asyncio
import logging
from datetime import datetime
from app.services.email_queue_service import email_queue_service

logger = logging.getLogger(__name__)


class EmailWorker:
    """Background worker for processing email queue"""
    
    def __init__(self, process_interval: int = 30):
        self.process_interval = process_interval
        self.running = False
    
    async def start(self):
        """Start the email worker"""
        self.running = True
        logger.info("Email worker started")
        
        while self.running:
            try:
                stats = await email_queue_service.process_queue(batch_size=20)
                
                if any(stats.values()):
                    logger.info(f"Email batch processed: {stats}")
                
                if datetime.now().hour == 3 and datetime.now().minute < 5:
                    cleaned = email_queue_service.cleanup_old_emails(days_old=30)
                    if cleaned > 0:
                        logger.info(f"Cleaned up {cleaned} old email records")
                
            except Exception as e:
                logger.error(f"Error in email worker: {str(e)}")
            
            await asyncio.sleep(self.process_interval)
    
    def stop(self):
        """Stop the email worker"""
        self.running = False
        logger.info("Email worker stopped")


email_worker = EmailWorker()
