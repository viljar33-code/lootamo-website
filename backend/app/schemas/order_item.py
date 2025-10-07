"""
Pydantic schemas for order items
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class OrderItemBase(BaseModel): 
    """Base schema for order items"""
    product_id: str = Field(..., description="Product ID")
    price: float = Field(..., ge=0, description="Price per item")
    quantity: int = Field(..., ge=1, description="Quantity")


class OrderItemCreate(OrderItemBase):
    """Schema for creating order items"""
    pass


class OrderItemResponse(OrderItemBase):
    """Schema for order item responses"""
    id: int
    order_id: int
    g2a_order_id: Optional[str] = None
    g2a_transaction_id: Optional[str] = None
    delivered_key: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderItemWithKey(BaseModel):
    """Schema for order item with license key details"""
    id: int
    product_id: str
    price: float
    quantity: int
    status: str
    delivered_key: Optional[str] = None
    g2a_order_id: Optional[str] = None
    g2a_transaction_id: Optional[str] = None
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


class CartCheckoutRequest(BaseModel):
    """Schema for cart checkout request"""
    pass


class MultiItemOrderCreate(BaseModel):
    """Schema for creating multi-item orders"""
    items: List[OrderItemCreate] = Field(..., min_items=1, description="List of order items")


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

    class Config:
        from_attributes = True


class LicenseKeyResponse(BaseModel):
    """Schema for license key responses"""
    order_id: int
    total_items: int
    items: List[OrderItemWithKey]
    all_keys_delivered: bool
    pending_keys_count: int

    class Config:
        from_attributes = True


class LicenseKeyItem(BaseModel):
    """Schema for individual license key item"""
    product_id: str
    product_name: str
    license_key: str
    quantity: int
    status: str


class PendingKeyItem(BaseModel):
    """Schema for pending license key item"""
    product_id: str
    product_name: str
    quantity: int
    status: str


class MultiItemLicenseKeysResponse(BaseModel):
    """Schema for multi-item license keys response"""
    order_id: int
    license_keys: List[LicenseKeyItem] = []
    pending_keys: List[PendingKeyItem] = []
    total_items: int
    ready_items: int
    pending_items: int

    model_config = {"from_attributes": True}


# Rebuild schemas to resolve forward references
def rebuild_order_item_schemas():
    """Rebuild order item schemas after all models are defined"""
    try:
        # Import here to avoid circular imports
        from app.schemas.order import OrderResponse
        # Rebuild any schemas that reference OrderResponse if needed
        pass
    except ImportError:
        pass
