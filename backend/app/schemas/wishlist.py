from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from app.schemas.product import ProductResponse


class WishlistRequest(BaseModel):
    """Request schema for adding/removing products from wishlist"""
    product_id: str = Field(..., description="Product ID to add/remove from wishlist")


class WishlistItem(BaseModel):
    """Individual wishlist item response"""
    id: int
    product_id: str
    created_at: datetime
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class WishlistListResponse(BaseModel):
    """Paginated wishlist response"""
    items: List[WishlistItem]
    total: int
    skip: int
    limit: int


class WishlistStatsItem(BaseModel):
    """Admin statistics item"""
    product_id: str
    product_name: str
    user_count: int


class WishlistStatsResponse(BaseModel):
    """Admin statistics response"""
    stats: List[WishlistStatsItem]
    total_products: int


class WishlistSummary(BaseModel):
    """User wishlist summary"""
    total_items: int
    total_estimated_value: float    
    currency: str = "USD"


class WishlistActionResponse(BaseModel):
    """Response for add/remove actions"""
    success: bool
    message: str
    already_exists: Optional[bool] = None


class WishlistBulkAddFailedItem(BaseModel):
    """Failed item in bulk add to cart operation"""
    product_id: str
    product_name: str
    error: str


class WishlistBulkAddToCartResponse(BaseModel):
    """Response for adding all wishlist items to cart"""
    success: bool
    message: str
    added_count: int
    total_items: int
    failed_items: List[WishlistBulkAddFailedItem]


class WishlistClearResponse(BaseModel):
    """Response for clear wishlist action"""
    success: bool
    message: str
    cleared_count: int
