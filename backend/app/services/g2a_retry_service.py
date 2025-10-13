"""
G2A Retry Service for handling license key retrieval with retry mechanism
"""
import asyncio
import logging
from sqlalchemy.orm import Session
from app.models.order import Order
from app.models.order_item import OrderItem
from app.services.g2a_service import get_g2a_order_key
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

class G2ARetryService:
    """Service for handling G2A license key retrieval with retry mechanism"""
    
    @staticmethod
    async def retry_license_key_retrieval(
        order_id: int, 
        max_retries: int = 12, 
        retry_delay_seconds: int = 10
    ) -> bool:
        """
        Retry license key retrieval for orders with ORD03 (not ready) status
        
        Args:
            order_id: Local order ID
            max_retries: Maximum number of retry attempts (default: 12 = 2 minutes)
            retry_delay_seconds: Delay between retries in seconds (default: 10 seconds)
            
        Returns:
            True if license key retrieved successfully, False otherwise
        """
        
        for attempt in range(max_retries):
            logger.info(f"License key retrieval attempt {attempt + 1}/{max_retries} for order {order_id}")
            
            db = SessionLocal()
            try:
                order = db.query(Order).filter(Order.id == order_id).first()
                
                if not order:
                    logger.error(f"Order {order_id} not found")
                    return False
                
                if order.delivered_key:
                    logger.info(f"License key already available for order {order_id}")
                    return True
                
                if not order.g2a_order_id:
                    logger.error(f"No G2A order ID for order {order_id}")
                    return False
                
                try:
                    key_response = await get_g2a_order_key(order.g2a_order_id)
                    
                    license_key = None
                    
                    if key_response and "keys" in key_response and key_response["keys"]:
                        license_key = key_response["keys"][0]["key"]
                    elif key_response and "key" in key_response and "keys" not in key_response:
                        license_key = key_response["key"]
                    
                    if license_key:
                        order.delivered_key = license_key
                        db.commit()
                        
                        logger.info(f"License key retrieved successfully for order {order_id}: {license_key}")
                        
                        await G2ARetryService._send_license_key_email(order, db)
                        
                        return True
                        
                    elif key_response and "error" in key_response:
                        error_code = key_response["error"]
                        
                        if error_code == "ORD01":
                            logger.error(f"Invalid G2A order ID (ORD01) for order {order_id}")
                            return False
                        elif error_code == "ORD03":
                            logger.warning(f"License key not ready yet (ORD03) for order {order_id}, attempt {attempt + 1}")
                            # Continue to retry
                        elif error_code == "ORD04":
                            logger.warning(f"License key already delivered (ORD04) for order {order_id}")
                            return False
                        else:
                            logger.error(f"Unknown G2A error for order {order_id}: {error_code}")
                            return False
                    else:
                        logger.warning(f"Unexpected G2A response for order {order_id}: {key_response}")
                        
                except Exception as e:
                    logger.error(f"Error retrieving license key for order {order_id}: {e}")
                
            except Exception as e:
                logger.error(f"Database error for order {order_id}: {e}")
                db.rollback()
            finally:
                db.close()
            
            if attempt < max_retries - 1:
                logger.info(f"Waiting {retry_delay_seconds} seconds before next retry...")
                await asyncio.sleep(retry_delay_seconds)
        
        db = SessionLocal()
        try:
            order = db.query(Order).filter(Order.id == order_id).first()
            if order:
                order.status = "pending_delivery"
                db.commit()
                logger.info(f"Order {order_id} marked as pending_delivery after {max_retries} attempts")
        except Exception as e:
            logger.error(f"Error updating order status: {e}")
            db.rollback()
        finally:
            db.close()
            
        logger.error(f"Failed to retrieve license key for order {order_id} after {max_retries} attempts")
        return False
    
    @staticmethod
    async def _send_license_key_email(order: Order, db: Session) -> None:
        """Send license key email notification for legacy single-item orders"""
        try:
            from app.services.email_service import email_service
            from app.models.user import User
            
            user = db.query(User).filter(User.id == order.user_id).first()
            if user and user.email and order.delivered_key:
                email_sent = await email_service.send_license_key_email(
                    to_email=user.email,
                    username=user.username or user.email,
                    product_name=order.product_id,  
                    license_key=order.delivered_key,
                    order_id=str(order.id)
                )
                if email_sent:
                    logger.info(f"License key email sent successfully for order {order.id}")
                else:
                    logger.error(f"Failed to send license key email for order {order.id}")
            else:
                logger.warning(f"Cannot send email - user not found or no email/key for order {order.id}")
                
        except Exception as e:
            logger.error(f"Error sending license key email for order {order.id}: {e}")
    
    @staticmethod
    async def _send_license_key_email_for_item(order_item: OrderItem, db: Session) -> None:
        """Send license key email notification for a specific order item"""
        try:
            from app.services.email_service import email_service
            from app.models.user import User
            
            order = db.query(Order).filter(Order.id == order_item.order_id).first()
            if not order:
                logger.error(f"Order not found for order item {order_item.id}")
                return
            
            user = db.query(User).filter(User.id == order.user_id).first()
            if not user or not user.email:
                logger.warning(f"Cannot send email - user or email missing for order item {order_item.id}")
                return
            
            if not order_item.delivered_key:
                logger.warning(f"No license key available for order item {order_item.id}")
                return
            
            total_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).count()
            items_with_keys = db.query(OrderItem).filter(
                OrderItem.order_id == order.id,
                OrderItem.delivered_key.isnot(None)
            ).count()
            
            if total_items > 1:
                all_items_with_keys = db.query(OrderItem).filter(
                    OrderItem.order_id == order.id,
                    OrderItem.delivered_key.isnot(None)
                ).all()
                
                license_keys = []
                for item in all_items_with_keys:
                    license_keys.append({
                        "product_id": item.product_id,
                        "product_name": item.product_id,  
                        "license_key": item.delivered_key,
                        "quantity": item.quantity
                    })
                
                email_sent = await email_service.send_multi_license_key_email(
                    to_email=user.email,
                    username=user.username or user.email,
                    license_keys=license_keys,
                    order_id=str(order.id),
                    partial_delivery=(items_with_keys < total_items)
                )
                
                if email_sent:
                    logger.info(f"Multi-item license key email sent for order {order.id} ({items_with_keys}/{total_items} keys)")
                else:
                    logger.error(f"Failed to send multi-item license key email for order {order.id}")
            else:
                email_sent = await email_service.send_license_key_email(
                    to_email=user.email,
                    username=user.username or user.email,
                    product_name=order_item.product_id,  
                    license_key=order_item.delivered_key,
                    order_id=str(order.id)
                )
                
                if email_sent:
                    logger.info(f"Single license key email sent for order item {order_item.id}")
                else:
                    logger.error(f"Failed to send single license key email for order item {order_item.id}")
                
        except Exception as e:
            logger.error(f"Error sending license key email for order item {order_item.id}: {e}")

    @staticmethod
    async def schedule_retry_for_order(order_id: int) -> None:
        """
        Schedule a background retry task for license key retrieval (legacy single-item orders)
        """
        logger.info(f"Scheduling license key retry for order {order_id}")
        
        asyncio.create_task(
            G2ARetryService.retry_license_key_retrieval(order_id)
        )
    
    @staticmethod
    async def schedule_retry_for_order_item(order_item_id: int) -> None:
        """
        Schedule a background retry task for license key retrieval for a specific order item
        """
        logger.info(f"Scheduling license key retry for order item {order_item_id}")
        
        asyncio.create_task(
            G2ARetryService.retry_license_key_retrieval_for_item(order_item_id)
        )
    
    @staticmethod
    async def retry_license_key_retrieval_for_item(
        order_item_id: int,
        max_retries: int = 5,
        retry_delay_seconds: int = 30
    ) -> bool:
        """
        Retry license key retrieval for a specific order item with exponential backoff.
        
        Args:
            order_item_id: Order item ID to retry
            max_retries: Maximum number of retry attempts
            retry_delay_seconds: Base delay between retries
            
        Returns:
            bool: True if license key retrieved successfully, False otherwise
        """
        logger.info(f"Starting license key retry for order item {order_item_id} (max {max_retries} attempts)")
        
        # Create initial retry log
        from app.services.retry_log_service import RetryLogService
        retry_log = None
        
        for attempt in range(max_retries):
            logger.info(f"Retry attempt {attempt + 1}/{max_retries} for order item {order_item_id}")
            
            db = SessionLocal()
            try:
                order_item = db.query(OrderItem).filter(OrderItem.id == order_item_id).first()
                if not order_item:
                    logger.error(f"Order item not found: {order_item_id}")
                    return False
                
                if not order_item.g2a_order_id:
                    logger.error(f"No G2A order ID for order item {order_item_id}")
                    return False
                
                # Log retry attempt start
                if not retry_log:
                    retry_log = RetryLogService.log_license_key_retry_start(
                        order_item_id=order_item_id,
                        g2a_order_id=order_item.g2a_order_id,
                        attempt_number=attempt + 1,
                        max_attempts=max_retries
                    )
                
                try:
                    key_response = await get_g2a_order_key(order_item.g2a_order_id)
                    
                    license_key = None
                    
                    if key_response and "keys" in key_response and key_response["keys"]:
                        license_key = key_response["keys"][0]["key"]
                    elif key_response and "key" in key_response and "keys" not in key_response:
                        license_key = key_response["key"]
                    
                    if license_key:
                        order_item.delivered_key = license_key
                        order_item.status = "complete"
                        db.commit()
                        
                        logger.info(f"License key retrieved successfully for order item {order_item_id}: {license_key}")
                        
                        # Log successful retry
                        if retry_log:
                            RetryLogService.log_license_key_retry_result(
                                retry_log_id=retry_log.id,
                                success=True,
                                license_key=license_key
                            )
                        
                        order = db.query(Order).filter(Order.id == order_item.order_id).first()
                        if order:
                            from app.services.payment_service import PaymentService
                            await PaymentService._update_order_status_if_all_items_complete(db, order)
                        
                        await G2ARetryService._send_license_key_email_for_item(order_item, db)
                        
                    else:
                        logger.error(f"Unknown G2A error for order item {order_item_id}: {error_code}")
                        order_item.status = "failed"
                        db.commit()
                        
                        # Log failed retry
                        if retry_log:
                            RetryLogService.log_license_key_retry_result(
                                retry_log_id=retry_log.id,
                                success=False,
                                error_code=error_code,
                                error_message=f"Unknown G2A error: {error_code}"
                            )
                        return False
                else:
                    logger.warning(f"Unexpected G2A response for order item {order_item_id}: {key_response}")
                    
                
            except Exception as e:
                logger.error(f"Database error for order item {order_item_id}: {e}")
                db.rollback()
            finally:
                db.close()
            
            if attempt < max_retries - 1:
                delay = retry_delay_seconds * (2 ** attempt)
                logger.info(f"Waiting {delay} seconds before next retry...")
                await asyncio.sleep(delay)
        
        # Log final failure after all retries exhausted
        if retry_log:
            RetryLogService.log_license_key_retry_result(
                retry_log_id=retry_log.id,
                success=False,
                error_code="MAX_RETRIES_EXCEEDED",
                error_message=f"Failed after {max_retries} retry attempts"
            )
        
        db = SessionLocal()
        try:
            order_item = db.query(OrderItem).filter(OrderItem.id == order_item_id).first()
            if order_item:
                order_item.status = "failed"
                db.commit()
                logger.info(f"Order item {order_item_id} marked as failed after {max_retries} attempts")
        except Exception as e:
            logger.error(f"Error updating order item status: {e}")
            db.rollback()
        finally:
            db.close()
            
        logger.error(f"Failed to retrieve license key for order item {order_item_id} after {max_retries} attempts")
        return False
