from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.api.dependencies import get_current_user_sync, require_admin
from app.models.user import User
from app.schemas.order import OrderCreateRequest, OrderResponse, OrderListResponse, OrderSummaryResponse, OrderSummaryListResponse, G2AOrderStatusResponse, AdminOrderResponse, AdminOrderListResponse, OrderCancelRequest, OrderStatusUpdateRequest
from app.schemas.order_item import CartCheckoutRequest, MultiItemOrderResponse
from app.services.order_service import OrderService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=OrderResponse)
async def create_order(
    order_request: OrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """
    Create a new order using G2A sandbox API.
    
    This endpoint:
    1. Authenticates user using JWT → get current_user.id
    2. Validates product exists and is active
    3. Creates a local order with pending status
    4. Calls G2A sandbox API to create the order
    5. Updates local order with G2A order ID
    6. Returns the order details
    """
    try:
        logger.info(f"Creating order for user {current_user.id}, product {order_request.product_id}")
        
        order_response = await OrderService.create_order(db, order_request, current_user.id)
        
        logger.info(f"Order created successfully: {order_response.order_id}")
        return order_response
        
    except ValueError as e:
        logger.error(f"Validation error creating order: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to create order. Please try again later."
        )


@router.post("/checkout-cart", response_model=MultiItemOrderResponse)
async def checkout_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """
    Create a multi-item order from user's cart.
    
    This endpoint:
    1. Authenticates user using JWT
    2. Gets all items from user's cart
    3. Validates all products exist and are active
    4. Calculates total price
    5. Creates a multi-item order with order_items
    6. Clears the user's cart
    7. Returns the order details with all items
    """
    try:
        logger.info(f"Creating multi-item order from cart for user {current_user.id}")
        
        order_response = await OrderService.create_multi_item_order_from_cart(db, current_user.id)
        
        logger.info(f"Multi-item order created successfully: {order_response.id}")
        return order_response
        
    except ValueError as e:
        logger.error(f"Validation error creating multi-item order: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating multi-item order: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to create order from cart. Please try again later."
        )


@router.get("/", response_model=OrderListResponse)
async def get_user_orders(
    skip: int = Query(0, ge=0, description="Number of orders to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of orders to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """
    Get orders for the current user with pagination, including order items.
    """
    try:
        orders, total = OrderService.get_orders_by_user(
            db=db,
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )
        
        return OrderListResponse(
            orders=[OrderResponse.model_validate(order) for order in orders],
            total=total,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        logger.error(f"Error fetching user orders: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch orders"
        )


@router.post("/admin/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    cancel_request: OrderCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Cancel an order (admin only).
    Only pending orders can be cancelled.
    """
    try:
        order = OrderService.cancel_order(
            db=db,
            order_id=order_id,
            reason=cancel_request.reason
        )
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return OrderResponse.model_validate(order)
        
    except ValueError as e:
        logger.error(f"Validation error cancelling order {order_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error cancelling order {order_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to cancel order"
        )


@router.put("/admin/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_request: OrderStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update order status (admin only).
    """
    try:
        order = OrderService.update_order_status(
            db=db,
            order_id=order_id,
            status=status_request.status
        )
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return OrderResponse.model_validate(order)
        
    except ValueError as e:
        logger.error(f"Validation error updating order {order_id} status: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating order {order_id} status: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update order status"
        )


@router.get("/summary", response_model=OrderSummaryListResponse)
async def get_user_orders_summary(
    skip: int = Query(0, ge=0, description="Number of orders to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of orders to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """
    Get order summaries for the current user with pagination (orders table only, no order items).
    """
    try:
        orders, total = OrderService.get_orders_summary_by_user(
            db=db,
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )
        
        return OrderSummaryListResponse(
            orders=[OrderSummaryResponse.model_validate(order) for order in orders],
            total=total,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        logger.error(f"Error fetching user order summaries: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch order summaries"
        )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """
    Get a specific order by ID.
    Users can only access their own orders.
    """
    try:
        order = OrderService.get_order_by_id(db, order_id)
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Security check: users can only access their own orders
        if order.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own orders"
            )
        
        return OrderResponse.model_validate(order)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching order {order_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch order"
        )


@router.get("/g2a/{g2a_order_id}", response_model=G2AOrderStatusResponse)
async def get_order_by_g2a_id(
    g2a_order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_sync)
):
    """
    Get order details by G2A order ID.
    Returns order status, price, and currency.
    """
    try:
        order = OrderService.get_order_by_g2a_id(db, g2a_order_id)
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Security check: users can only access their own orders
        if order.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own orders"
            )
        
        return G2AOrderStatusResponse(
            status=order.status,
            price=order.price,
            currency=order.currency
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching order by G2A ID {g2a_order_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch order"
        )


@router.get("/admin/all", response_model=AdminOrderListResponse)
async def get_all_orders_admin(
    skip: int = Query(0, ge=0, description="Number of orders to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of orders to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get all orders with user and product details (Admin only).
    
    Returns comprehensive order information including:
    - Order details (ID, status, price, currency)
    - User information (email, name)
    - Product information (name)
    - Timestamps
    """
    try:
        orders_with_details, total = OrderService.get_all_orders_admin(db, skip, limit)
        
        # Convert to AdminOrderResponse objects
        admin_orders = []
        for order_data in orders_with_details:
            admin_orders.append(AdminOrderResponse(**order_data))
        
        return AdminOrderListResponse(
            orders=admin_orders,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        logger.error(f"Error fetching all orders for admin: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch orders"
        )
