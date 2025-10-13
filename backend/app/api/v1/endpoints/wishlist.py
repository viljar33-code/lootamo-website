import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_sync
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.product import ProductResponse
from app.schemas.wishlist import (
    WishlistActionResponse,
    WishlistAnalytics,
    WishlistBulkAddToCartResponse,
    WishlistClearResponse,
    WishlistItem,
    WishlistListResponse,
    WishlistRequest,
    WishlistStatsItem,
    WishlistStatsResponse,
    WishlistSummary,
)
from app.services.wishlist_service import (
    add_all_wishlist_to_cart,
    add_to_wishlist,
    clear_user_wishlist,
    get_user_wishlist,
    get_wishlist_analytics,
    get_wishlist_stats,
    get_wishlist_summary,
    remove_from_wishlist,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/add", response_model=WishlistActionResponse)
async def add_product_to_wishlist(
    request: WishlistRequest,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Add product to user's wishlist"""
    try:
        result = add_to_wishlist(db, current_user.id, request.product_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return WishlistActionResponse(
            success=result["success"],
            message=result["message"],
            already_exists=result.get("already_exists", False)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding to wishlist for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/clear", response_model=WishlistClearResponse)
async def clear_user_wishlist_endpoint(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Clear all items from user's wishlist"""
    try:
        result = clear_user_wishlist(db, current_user.id)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["message"])
        
        return WishlistClearResponse(
            success=result["success"],
            message=result["message"],
            cleared_count=result["cleared_count"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing wishlist for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{product_id}", response_model=WishlistActionResponse)
async def remove_product_from_wishlist(
    product_id: str,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Remove product from user's wishlist"""
    try:
        result = remove_from_wishlist(db, current_user.id, product_id)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        
        return WishlistActionResponse(
            success=result["success"],
            message=result["message"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing from wishlist for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=WishlistListResponse)
async def get_user_wishlist_items(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    search: str = Query(None, description="Search products by name (case-insensitive)"),
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Get user's wishlist with pagination and optional product name search"""
    try:
        wishlist_items, total = get_user_wishlist(db, current_user.id, skip, limit, search)
        
        # Convert to response format
        items = []
        for item in wishlist_items:
            # Use ProductResponse.from_orm for proper conversion of related objects
            product_response = None
            if item.product:
                product_response = ProductResponse.from_orm(item.product)
            
            wishlist_item = WishlistItem(
                id=item.id,
                product_id=item.product_id,
                created_at=item.created_at,
                product=product_response
            )
            items.append(wishlist_item)
        
        return WishlistListResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        logger.error(f"Error getting wishlist for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/summary", response_model=WishlistSummary)
async def get_user_wishlist_summary(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Get user's wishlist summary statistics"""
    try:
        summary = get_wishlist_summary(db, current_user.id)
        return WishlistSummary(**summary)
        
    except Exception as e:
        logger.error(f"Error getting wishlist summary for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/stats", response_model=WishlistStatsResponse)
async def get_admin_wishlist_stats(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Get admin statistics - number of users per product in wishlists"""
    # Check admin permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=403, 
            detail="Insufficient permissions. Admin or Manager role required."
        )
    
    try:
        stats_data = get_wishlist_stats(db)
        
        stats = [
            WishlistStatsItem(
                product_id=stat["product_id"],
                product_name=stat["product_name"],
                user_count=stat["user_count"]
            )
            for stat in stats_data
        ]
        
        return WishlistStatsResponse(
            stats=stats,
            total_products=len(stats)
        )
        
    except Exception as e:
        logger.error(f"Error getting wishlist stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/analytics", response_model=WishlistAnalytics)
async def get_admin_wishlist_analytics(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Get overall wishlist analytics for admin dashboard"""
    # Check admin permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=403, 
            detail="Insufficient permissions. Admin or Manager role required."
        )
    
    try:
        analytics_data = get_wishlist_analytics(db)
        
        return WishlistAnalytics(
            total_wishlists=analytics_data["total_wishlists"],
            total_items=analytics_data["total_items"],
            avg_items_per_user=analytics_data["avg_items_per_user"]
        )
        
    except Exception as e:
        logger.error(f"Error getting wishlist analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/add-all-to-cart", response_model=WishlistBulkAddToCartResponse)
async def add_all_wishlist_to_cart_endpoint(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Add all wishlist items to cart"""
    try:
        result = add_all_wishlist_to_cart(db, current_user.id)
        
        return WishlistBulkAddToCartResponse(
            success=result["success"],
            message=result["message"],
            added_count=result["added_count"],
            total_items=result["total_items"],
            failed_items=result["failed_items"]
        )
        
    except Exception as e:
        logger.error(f"Error adding all wishlist to cart for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
