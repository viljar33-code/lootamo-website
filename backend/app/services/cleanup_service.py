"""
Cleanup service for periodic maintenance tasks.
"""
import logging
from sqlalchemy.orm import Session
from app.services.order_service import OrderService

logger = logging.getLogger(__name__)

class CleanupService:
    """Service for periodic database cleanup tasks"""
    
    @staticmethod
    def expire_all_pending_orders(db: Session) -> int:
        """
        Expire all pending orders older than 24 hours.
        Can be called periodically via scheduler or manually.
        
        Returns:
            Number of orders expired
        """
        logger.info("Starting periodic cleanup of pending orders")
        
        try:
            expired_count = OrderService.expire_pending_orders(db)
            logger.info(f"Expired {expired_count} pending orders during cleanup")
            return expired_count
            
        except Exception as e:
            logger.error(f"Error during pending orders cleanup: {e}")
            raise
    
    @staticmethod
    def cleanup_old_expired_orders(db: Session, days_old: int = 30) -> int:
        """
        Delete expired orders older than specified days.
        This helps keep database clean from very old abandoned orders.
        
        Args:
            db: Database session
            days_old: Delete expired orders older than this many days
            
        Returns:
            Number of orders deleted
        """
        from app.models.order import Order, OrderStatus
        from datetime import datetime, timedelta
        
        logger.info(f"Cleaning up expired orders older than {days_old} days")
        
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            
            old_expired_orders = db.query(Order).filter(
                Order.status == OrderStatus.EXPIRED.value,
                Order.created_at < cutoff_date
            ).all()
            
            deleted_count = len(old_expired_orders)
            
            for order in old_expired_orders:
                from app.models.order_item import OrderItem
                db.query(OrderItem).filter(OrderItem.order_id == order.id).delete()
                db.delete(order)
            
            db.commit()
            logger.info(f"Deleted {deleted_count} old expired orders")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error during old expired orders cleanup: {e}")
            db.rollback()
            raise
