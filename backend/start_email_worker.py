#!/usr/bin/env python3
"""
Standalone script to start the email worker
"""
import asyncio
import logging
import signal
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.workers.email_worker import EmailWorker

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

worker = None

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"Received signal {signum}, shutting down email worker...")
    if worker:
        worker.stop()
    sys.exit(0)

async def main():
    """Main function to run the email worker"""
    global worker
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    logger.info("Starting Email Worker Service")
    
    try:
        worker = EmailWorker(check_interval=30)  
        await worker.start()
    except KeyboardInterrupt:
        logger.info("Email worker interrupted by user")
    except Exception as e:
        logger.error(f"Email worker crashed: {str(e)}")
        raise
    finally:
        if worker:
            worker.stop()
        logger.info("Email worker stopped")

if __name__ == "__main__":
    asyncio.run(main())
