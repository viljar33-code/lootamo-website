"""
Pydantic schemas for cart functionality
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.schemas.product import ProductResponse


class CartItemRequest(BaseModel):
    """Request schema for cart operations"""
    product_id: str = Field(..., description="Product ID to add/remove/update")
    quantity: Optional[int] = Field(1, ge=1, description="Quantity (must be >= 1)")


class CartUpdateRequest(BaseModel):
    """Request schema for updating cart quantity"""
    product_id: str = Field(..., description="Product ID to update")
    quantity: int = Field(..., ge=1, description="New quantity (must be >= 1)")


class CartRemoveRequest(BaseModel):
    """Request schema for removing from cart"""
    product_id: str = Field(..., description="Product ID to remove")
    quantity: Optional[int] = Field(None, ge=1, description="Quantity to remove (optional, removes all if not specified)")


class CartItem(BaseModel):
    """Cart item response schema"""
    id: int
    user_id: int
    product_id: str
    quantity: int
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class CartListResponse(BaseModel):
    """Paginated cart response"""
    items: List[CartItem]
    total: int
    skip: int
    limit: int
    total_quantity: int = Field(..., description="Total quantity of all items in cart")


class CartSummary(BaseModel):
    """Cart summary response"""
    total_items: int
    total_estimated_value: float
    currency: str = "USD"


class CartActionResponse(BaseModel):
    """Response for cart add/remove/update actions"""
    success: bool
    message: str
    quantity: Optional[int] = None
    updated: Optional[bool] = None


class CartClearResponse(BaseModel):
    """Response for cart clear action"""
    success: bool
    message: str
    cleared_count: int


class CartStatsItem(BaseModel):
    """Admin cart statistics item"""
    product_id: str
    product_name: str
    user_count: int
    total_quantity: int


class CartStatsResponse(BaseModel):
    """Admin cart statistics response"""
    stats: List[CartStatsItem]
    total_products: int


class CartQuantityUpdateRequest(BaseModel):
    """Request schema for PATCH quantity update"""
    quantity: int = Field(..., ge=1, description="New quantity (must be >= 1)")


class CartBulkDeleteRequest(BaseModel):
    """Request schema for bulk delete from cart"""
    product_ids: List[str] = Field(..., description="List of product IDs to remove from cart")


class CartBulkDeleteResponse(BaseModel):
    """Response for bulk delete action"""
    success: bool
    message: str
    deleted_count: int
