from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, Dict, Any, List
import logging

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.user import User
from app.models.product import Product
from app.models.cart import Cart
from app.schemas.order import OrderCreateRequest, OrderResponse
from app.schemas.order_item import CartCheckoutRequest, MultiItemOrderResponse, OrderItemResponse
from app.services.g2a_service import create_g2a_order

logger = logging.getLogger(__name__)


class OrderService:
    """Service class for handling order operations"""

    @staticmethod
    async def create_order(
        db: Session,
        order_request: OrderCreateRequest,
        user_id: int
    ) -> OrderResponse:
        """
        Create a new order with G2A integration.
        
        Args:
            db: Database session
            order_request: Order creation request data
            user_id: ID of the authenticated user
            
        Returns:
            OrderResponse with created order details
            
        Raises:
            ValueError: If user or product validation fails
            Exception: If G2A API call fails
        """
        logger.info(f"Creating order for user {user_id}, product {order_request.product_id}")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User not found: {user_id}")
            raise ValueError(f"User with ID {user_id} not found")
        
        product = db.query(Product).filter(
            Product.id == order_request.product_id
            # TODO: Re-enable is_active validation when needed
            # and_(
            #     Product.id == order_request.product_id,
            #     Product.is_active == True
            # )
        ).first()
        if not product:
            logger.error(f"Product not found: {order_request.product_id}")
            raise ValueError(f"Product with ID {order_request.product_id} not found")
        
        if not product.min_price:
            logger.error(f"Product has no min_price set: {order_request.product_id}")
            raise ValueError(f"Product with ID {order_request.product_id} has no price configured")
        
        order_price = product.min_price
        logger.info(f"Using product price from database: {order_price}")
        
        local_order = Order(
            user_id=user_id,
            product_id=order_request.product_id,  
            price=order_price,  
            total_price=order_price,  
            currency="EUR",
            status="pending",
            g2a_order_id=None
        )
        
        db.add(local_order)
        db.flush()  
        
        try:
            logger.info(f"Calling G2A API for order creation")
            try:
                g2a_response = await create_g2a_order(
                    product_id=order_request.product_id,
                    max_price=order_price
                )
                
                if g2a_response:
                    g2a_order_id = g2a_response.get("order_id")
                    if g2a_order_id:
                        local_order.g2a_order_id = g2a_order_id
                        logger.info(f"G2A order created with ID: {g2a_order_id}")
                    else:
                        logger.warning("G2A response did not contain order_id")
                else:
                    logger.info("G2A order creation failed - order will be created without G2A order ID")
                    
            except Exception as g2a_error:
                logger.warning(f"G2A API call failed, creating order without G2A integration: {g2a_error}")
            
            # Create order item for consistency with multi-item orders
            order_item = OrderItem(
                order_id=local_order.id,
                product_id=order_request.product_id,
                price=order_price,
                quantity=1,
                status="pending"
            )
            db.add(order_item)
            
            db.commit()
            logger.info(f"Order committed to database with ID: {local_order.id}")
            
            # Refresh to get the order_items relationship
            db.refresh(local_order)
            
            return OrderResponse(
                id=local_order.id,
                g2a_order_id=local_order.g2a_order_id,
                product_id=local_order.product_id,
                price=local_order.price,
                total_price=local_order.total_price,
                currency=local_order.currency,
                status=local_order.status,
                payment_status=local_order.payment_status,
                stripe_payment_intent_id=local_order.stripe_payment_intent_id,
                delivered_key=local_order.delivered_key,
                created_at=local_order.created_at,
                updated_at=local_order.updated_at,
                order_items=[OrderItemResponse.model_validate(item) for item in local_order.order_items]
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating order: {e}")
            raise

    @staticmethod
    def get_order_by_id(db: Session, order_id: str) -> Optional[Order]:
        """Get order by ID (accepts string to handle large IDs)"""
        try:
            order_id_int = int(order_id)
            
            if order_id_int > 2147483647:
                logger.warning(f"Order ID {order_id} exceeds PostgreSQL INTEGER limit. This appears to be a G2A product ID, not a local order ID.")
                return None
                
            return db.query(Order).filter(Order.id == order_id_int).first()
        except (ValueError, OverflowError) as e:
            logger.warning(f"Invalid order ID format: {order_id}. Error: {e}")
            return None

    @staticmethod
    def get_order_by_g2a_id(db: Session, g2a_order_id: str) -> Optional[Order]:
        """Get order by G2A order ID"""
        return db.query(Order).filter(Order.g2a_order_id == g2a_order_id).first()

    @staticmethod
    def get_orders_by_user(
        db: Session, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100,
        include_pending: bool = False
    ) -> tuple[list[Order], int]:
        """
        Get orders for a specific user with pagination, including order items.
        By default, only shows paid/complete orders to customers.
        """
        from sqlalchemy.orm import joinedload
        from app.models.order import OrderStatus
        
        OrderService.expire_pending_orders(db, user_id)
        
        query = db.query(Order).options(joinedload(Order.order_items)).filter(Order.user_id == user_id)
        
        if not include_pending:
            visible_statuses = [OrderStatus.PAID.value, OrderStatus.COMPLETE.value]
            query = query.filter(Order.status.in_(visible_statuses))
        
        count_query = db.query(Order).filter(Order.user_id == user_id)
        if not include_pending:
            count_query = count_query.filter(Order.status.in_(visible_statuses))
        
        total = count_query.count()
        orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        return orders, total

    @staticmethod
    def expire_pending_orders(db: Session, user_id: int = None) -> int:
        """
        Expire pending orders that are older than 24 hours.
        Returns count of expired orders.
        """
        from app.models.order import OrderStatus
        from datetime import datetime, timedelta
        
        expiry_cutoff = datetime.now() - timedelta(hours=24)
        
        query = db.query(Order).filter(
            Order.status == OrderStatus.PENDING.value,
            Order.created_at < expiry_cutoff
        )
        
        if user_id:
            query = query.filter(Order.user_id == user_id)
        
        orders_to_expire = query.all()
        
        for order in orders_to_expire:
            order.status = OrderStatus.EXPIRED.value
        
        db.commit()
        return len(orders_to_expire)

    @staticmethod
    def get_orders_summary_by_user(
        db: Session, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> tuple[list[Order], int]:
        """Get order summaries for a specific user with pagination (orders table only)"""
        OrderService.expire_pending_orders(db, user_id)
        
        from app.models.order import OrderStatus
        visible_statuses = [OrderStatus.PAID.value, OrderStatus.COMPLETE.value]
        
        query = db.query(Order).filter(
            Order.user_id == user_id,
            Order.status.in_(visible_statuses)
        )
        total = query.count()
        orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        return orders, total

    @staticmethod
    def get_all_orders_admin(
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[list, int]:
        """Get clean admin-friendly order data with user and product details"""
        from app.models.user import User
        from app.models.product import Product
        from app.models.order_item import OrderItem
        from sqlalchemy import func, case
        
        OrderService.expire_pending_orders(db)
        

        base_query = db.query(
            Order.id.label('order_id'),
            Order.user_id,
            User.email.label('user_email'),
            User.first_name.label('user_first_name'),
            User.last_name.label('user_last_name'),
            Order.product_id,
            Order.total_price,
            Order.currency,
            Order.status.label('order_status'),
            Order.payment_status,
            Order.created_at.label('order_date')
        ).join(
            User, Order.user_id == User.id
        ).order_by(Order.created_at.desc())
        
        total = base_query.count()
        
        base_results = base_query.offset(skip).limit(limit).all()
        
        admin_orders = []
        for order_data in base_results:
            product_name = None
            if order_data.product_id:
                product = db.query(Product).filter(Product.id == order_data.product_id).first()
                product_name = product.name if product else f"Product {order_data.product_id}"
            else:
                first_item_query = db.query(OrderItem, Product.name).join(
                    Product, OrderItem.product_id == Product.id
                ).filter(
                    OrderItem.order_id == order_data.order_id
                ).first()
                
                if first_item_query:
                    first_item, first_product_name = first_item_query
                    item_count = db.query(OrderItem).filter(OrderItem.order_id == order_data.order_id).count()
                    if item_count > 1:
                        product_name = f"{first_product_name} (+{item_count-1} more)"
                    else:
                        product_name = first_product_name
                else:
                    product_name = "Unknown Product"
            
            if order_data.product_id:
                order_items_count = 1
            else:
                order_items_count = db.query(OrderItem).filter(OrderItem.order_id == order_data.order_id).count()
                if order_items_count == 0:
                    order_items_count = 1
            
            user_name = f"{order_data.user_first_name or ''} {order_data.user_last_name or ''}".strip() or None
            
            admin_order = {
                'user_id': order_data.user_id,
                'user_name': user_name,
                'user_email': order_data.user_email,
                'product_name': product_name,
                'total_price': order_data.total_price,
                'currency': order_data.currency,
                'order_items': order_items_count,
                'order_status': order_data.order_status,
                'payment_status': order_data.payment_status,
                'order_date': order_data.order_date
            }
            admin_orders.append(admin_order)
        
        return admin_orders, total

    @staticmethod
    async def _build_multi_item_order_response(db: Session, order: Order) -> MultiItemOrderResponse:
        """Helper method to build MultiItemOrderResponse from existing order"""
        from app.schemas.order import MultiItemOrderResponse, OrderItemResponse
        
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        
        order_item_responses = []
        for item in order_items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            order_item_responses.append(OrderItemResponse(
                id=item.id,
                order_id=item.order_id,
                product_id=item.product_id,
                price=item.price,
                quantity=item.quantity,
                g2a_order_id=item.g2a_order_id,
                g2a_transaction_id=item.g2a_transaction_id,
                delivered_key=item.delivered_key,
                status=item.status,
                created_at=item.created_at,
                updated_at=item.updated_at
            ))
        
        return MultiItemOrderResponse(
            id=order.id,
            user_id=order.user_id,
            total_price=order.total_price,
            currency=order.currency,
            status=order.status,
            payment_status=order.payment_status,
            created_at=order.created_at,
            updated_at=order.updated_at,
            order_items=order_item_responses
        )

    @staticmethod
    def update_order_status(
        db: Session, 
        order_id: int, 
        status: str
    ) -> Optional[Order]:
        """Update order status with race condition protection"""
        from app.models.order import OrderStatus
        from sqlalchemy.exc import IntegrityError
        
        valid_statuses = [s.value for s in OrderStatus]
        if status not in valid_statuses:
            raise ValueError(f"Invalid status: {status}. Valid statuses: {valid_statuses}")
        
        try:
            order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
            if not order:
                return None
            
            original_status = order.status
            
            if original_status == OrderStatus.COMPLETE.value and status == OrderStatus.PENDING.value:
                raise ValueError("Cannot change completed order back to pending")
            
            order.status = status
            db.commit()
            db.refresh(order)
            return order
            
        except IntegrityError as e:
            db.rollback()
            logger.error(f"Race condition detected in order status update: {e}")
            raise ValueError("Order was modified by another process. Please try again.")
        except Exception as e:
            db.rollback()
            raise

    @staticmethod
    def cancel_order(
        db: Session,
        order_id: int,
        reason: str = "Admin cancelled"
    ) -> Optional[Order]:
        """
        Cancel an order (admin only) with race condition protection.
        Only pending orders can be cancelled.
        """
        from app.models.order import OrderStatus
        from sqlalchemy.exc import IntegrityError
        
        try:
            order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
            if not order:
                return None
            
            if order.status != OrderStatus.PENDING.value:
                raise ValueError(f"Cannot cancel order with status '{order.status}'. Only pending orders can be cancelled.")
            
            order.status = OrderStatus.CANCELLED.value
            db.commit()
            db.refresh(order)
            
            return order
            
        except IntegrityError as e:
            db.rollback()
            logger.error(f"Race condition detected in order cancellation: {e}")
            raise ValueError("Order was modified by another process. Please try again.")
        except Exception as e:
            db.rollback()
            raise

    @staticmethod
    async def create_multi_item_order_from_cart(
        db: Session,
        user_id: int
    ) -> MultiItemOrderResponse:
        """
        Create a multi-item order from user's cart.
        
        Args:
            db: Database session
            user_id: ID of the authenticated user
            
        Returns:
            MultiItemOrderResponse with created order and items
            
        Raises:
            ValueError: If user validation fails or cart is empty
        """
        logger.info(f"Creating multi-item order from cart for user {user_id}")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User not found: {user_id}")
            raise ValueError(f"User with ID {user_id} not found")
        
        OrderService.expire_pending_orders(db, user_id)
        from app.models.order import OrderStatus
        OrderService.expire_pending_orders(db, user_id)
        
        from datetime import datetime, timedelta
        recent_cutoff = datetime.now() - timedelta(minutes=5)
        existing_pending = db.query(Order).filter(
            Order.user_id == user_id,
            Order.status == OrderStatus.PENDING.value,
            Order.created_at > recent_cutoff
        ).first()
        
        if existing_pending:
            logger.warning(f"User {user_id} has recent pending order {existing_pending.id}")
            return await OrderService._build_multi_item_order_response(db, existing_pending)
        
        cart_items = db.query(Cart).join(Product).filter(
            Cart.user_id == user_id,
            Product.is_active == True
        ).all()
        
        if not cart_items:
            logger.error(f"Cart is empty for user {user_id}")
            raise ValueError("Cart is empty")
        
        total_price = 0.0
        for cart_item in cart_items:
            if not cart_item.product.min_price:
                logger.error(f"Product {cart_item.product_id} has no min_price set")
                raise ValueError(f"Product {cart_item.product_id} has no price configured")
            total_price += cart_item.product.min_price * cart_item.quantity
        
        logger.info(f"Total order price calculated: {total_price}")
        
        from app.models.order import OrderStatus
        order = Order(
            user_id=user_id,
            total_price=total_price,
            currency="EUR",
            status=OrderStatus.PENDING.value
        )
        
        db.add(order)
        db.flush()  
        
        try:
            order_items = []
            for cart_item in cart_items:
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=cart_item.product_id,
                    price=cart_item.product.min_price,
                    quantity=cart_item.quantity,
                    status="pending"
                )
                db.add(order_item)
                order_items.append(order_item)
            
            db.flush() 
            
            db.commit()
            logger.info(f"Multi-item order {order.id} created with {len(order_items)} items")
            
            order_item_responses = [
                OrderItemResponse(
                    id=item.id,
                    order_id=item.order_id,
                    product_id=item.product_id,
                    price=item.price,
                    quantity=item.quantity,
                    g2a_order_id=item.g2a_order_id,
                    g2a_transaction_id=item.g2a_transaction_id,
                    delivered_key=item.delivered_key,
                    status=item.status,
                    created_at=item.created_at,
                    updated_at=item.updated_at
                )
                for item in order_items
            ]
            
            return MultiItemOrderResponse(
                id=order.id,
                user_id=order.user_id,
                total_price=order.total_price,
                currency=order.currency,
                status=order.status,
                payment_status=order.payment_status,
                created_at=order.created_at,
                updated_at=order.updated_at,
                order_items=order_item_responses
            )
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating multi-item order: {e}")
            raise

    @staticmethod
    def get_order_with_items(db: Session, order_id: int, user_id: int) -> Optional[Order]:
        """
        Get order with order items, ensuring user owns the order.
        
        Args:
            db: Database session
            order_id: Order ID
            user_id: User ID for authorization
            
        Returns:
            Order with order_items relationship loaded, or None
        """
        from sqlalchemy.orm import joinedload
        
        return db.query(Order).options(
            joinedload(Order.order_items)
        ).filter(
            Order.id == order_id,
            Order.user_id == user_id
        ).first()

    @staticmethod
    def get_user_order_statistics(db: Session, user_id: int) -> Dict[str, Any]:
        """
        Get order statistics for a specific user (admin use).
        
        Args:
            db: Database session
            user_id: User ID to get statistics for
            
        Returns:
            Dictionary with total_orders, total_spent, and currency
        """
        from app.models.order import OrderStatus
        from sqlalchemy import func
        
        # Only count paid and completed orders for statistics
        valid_statuses = [OrderStatus.PAID.value, OrderStatus.COMPLETE.value]
        
        # Get total orders and total spent
        result = db.query(
            func.count(Order.id).label('total_orders'),
            func.coalesce(func.sum(Order.total_price), 0.0).label('total_spent')
        ).filter(
            Order.user_id == user_id,
            Order.status.in_(valid_statuses)
        ).first()
        
        return {
            'user_id': user_id,
            'total_orders': result.total_orders if result else 0,
            'total_spent': float(result.total_spent) if result else 0.0,
            'currency': 'EUR'
        }
