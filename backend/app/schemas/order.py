from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Literal


class OrderCreateRequest(BaseModel):
    """Request schema for creating an order"""
    product_id: str = Field(..., description="Product ID from G2A")
    max_price: Optional[float] = Field(None, gt=0, description="Maximum price willing to pay (optional)")


class OrderSummaryResponse(BaseModel):
    """Response schema for order summary (orders table only)"""
    order_id: int = Field(..., description="Local order ID", alias="id")
    g2a_order_id: Optional[str] = Field(None, description="G2A order ID")
    product_id: Optional[str] = Field(None, description="Product ID (nullable for multi-item orders)")
    price: Optional[float] = Field(None, description="Order price (nullable for multi-item orders)")
    total_price: float = Field(..., description="Total order price")
    currency: str = Field(default="EUR", description="Currency")
    status: Literal["pending", "paid", "complete", "cancelled", "expired"] = Field(..., description="Order status")
    payment_status: Literal["pending", "paid", "failed"] = Field(default="pending", description="Payment status")
    stripe_payment_intent_id: Optional[str] = Field(None, description="Stripe PaymentIntent ID")
    delivered_key: Optional[str] = Field(None, description="License key if delivered")
    created_at: datetime = Field(..., description="Order creation timestamp")
    updated_at: datetime = Field(..., description="Order last update timestamp")

    model_config = {"from_attributes": True, "populate_by_name": True}


class OrderResponse(BaseModel):
    """Response schema for order operations with order items"""
    order_id: int = Field(..., description="Local order ID", alias="id")
    g2a_order_id: Optional[str] = Field(None, description="G2A order ID")
    product_id: Optional[str] = Field(None, description="Product ID (nullable for multi-item orders)")
    price: Optional[float] = Field(None, description="Order price (nullable for multi-item orders)")
    total_price: float = Field(..., description="Total order price")
    currency: str = Field(default="EUR", description="Currency")
    status: Literal["pending", "paid", "complete", "cancelled", "expired"] = Field(..., description="Order status")
    payment_status: Literal["pending", "paid", "failed"] = Field(default="pending", description="Payment status")
    stripe_payment_intent_id: Optional[str] = Field(None, description="Stripe PaymentIntent ID")
    delivered_key: Optional[str] = Field(None, description="License key if delivered")
    created_at: datetime = Field(..., description="Order creation timestamp")
    updated_at: datetime = Field(..., description="Order last update timestamp")
    
    # Include order items
    order_items: List["OrderItemResponse"] = Field(default=[], description="Order items")

    model_config = {"from_attributes": True, "populate_by_name": True}


class OrderListResponse(BaseModel):
    """Response schema for listing orders with order items"""
    orders: list[OrderResponse]
    total: int
    skip: int
    limit: int


class OrderSummaryListResponse(BaseModel):
    """Response schema for listing order summaries (orders table only)"""
    orders: list[OrderSummaryResponse]
    total: int
    skip: int
    limit: int


class G2AOrderRequest(BaseModel):
    """Request schema for G2A API order creation"""
    product_id: str
    max_price: float


class G2AOrderResponse(BaseModel):
    """Response schema from G2A API"""
    order_id: str
    status: str
    product_id: str
    price: float
    currency: str


class G2AOrderStatusResponse(BaseModel):
    """Response schema for G2A order status"""
    order_id: str
    status: str
    product_id: str
    price: float
    currency: str


# Resolve forward references after all models are defined
def rebuild_schemas():
    """Rebuild schemas to resolve forward references"""
    try:
        from app.schemas.order_item import OrderItemResponse
        OrderResponse.model_rebuild()
        OrderListResponse.model_rebuild()
    except ImportError:
        # OrderItemResponse not available yet, will be rebuilt later
        pass


class AdminOrderResponse(BaseModel):
    """Clean admin-friendly response schema for order view"""
    user_id: int = Field(..., description="User ID")
    user_name: Optional[str] = Field(None, description="User full name")
    user_email: Optional[str] = Field(None, description="User email")
    product_name: Optional[str] = Field(None, description="Product name")
    total_price: float = Field(..., description="Total order price")
    currency: str = Field(default="EUR", description="Currency")
    order_items: int = Field(..., description="Count of items in the order")
    order_status: Literal["pending", "paid", "complete", "cancelled", "expired"] = Field(..., description="Order status")
    payment_status: Literal["pending", "paid", "failed"] = Field(default="pending", description="Payment status")
    order_date: datetime = Field(..., description="Order creation date")

    model_config = {"from_attributes": True, "populate_by_name": True}


class AdminOrderListResponse(BaseModel):
    """Response schema for admin order listing"""
    orders: list[AdminOrderResponse]
    total: int
    skip: int
    limit: int


class OrderCancelRequest(BaseModel):
    """Request schema for cancelling an order"""
    reason: Optional[str] = Field(default="Admin cancelled", description="Reason for cancellation")


class OrderStatusUpdateRequest(BaseModel):
    """Request schema for updating order status"""
    status: Literal["pending", "paid", "complete", "cancelled", "expired"] = Field(..., description="New order status")
    reason: Optional[str] = Field(None, description="Reason for status change")


class OrderItemResponse(BaseModel):
    """Schema for order item responses"""
    id: int
    order_id: Optional[int] = None
    product_id: str
    price: float
    quantity: int
    g2a_order_id: Optional[str] = None
    g2a_transaction_id: Optional[str] = None
    delivered_key: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MultiItemOrderResponse(BaseModel):
    """Schema for multi-item order responses"""
    id: int
    user_id: int
    total_price: float
    currency: str
    status: str
    stripe_payment_intent_id: Optional[str] = None
    payment_status: str
    created_at: datetime
    updated_at: datetime
    order_items: List[OrderItemResponse] = []

    model_config = {"from_attributes": True}
