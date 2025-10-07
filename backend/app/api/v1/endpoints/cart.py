"""
Cart API endpoints
"""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_sync, get_db
from app.models.user import User, UserRole
from app.schemas.cart import (
    CartItemRequest,
    CartUpdateRequest,
    CartRemoveRequest,
    CartQuantityUpdateRequest,
    CartBulkDeleteRequest,
    CartListResponse,
    CartSummary,
    CartActionResponse,
    CartClearResponse,
    CartBulkDeleteResponse,
    CartStatsResponse,
    CartItem
)
from app.services.cart_service import (
    add_to_cart,
    remove_from_cart,
    bulk_remove_from_cart,
    update_cart_quantity,
    get_user_cart,
    get_cart_summary,
    clear_cart,
    get_cart_stats,
    get_cart_item_count
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/add", response_model=CartActionResponse)
async def add_product_to_cart(
    request: CartItemRequest,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Add product to user's cart"""
    try:
        result = add_to_cart(db, current_user.id, request.product_id, request.quantity)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return CartActionResponse(
            success=result["success"],
            message=result["message"],
            quantity=result.get("quantity"),
            updated=result.get("updated", False)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding to cart for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/clear", response_model=CartClearResponse)
async def clear_user_cart(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Clear all items from user's cart"""
    try:
        result = clear_cart(db, current_user.id)
        
        return CartClearResponse(
            success=result["success"],
            message=result["message"],
            cleared_count=result["cleared_count"]
        )
        
    except Exception as e:
        logger.error(f"Error clearing cart for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/bulk-delete")
async def bulk_delete_cart_items(
    request: CartBulkDeleteRequest,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Bulk delete multiple cart items in a single operation"""
    try:
        result = bulk_remove_from_cart(db, current_user.id, request.product_ids)
        
        # Return the result even if no items were found (success=False case)
        return CartBulkDeleteResponse(
            success=result["success"],
            message=result["message"],
            deleted_count=result.get("deleted_count", 0)
        )
        
    except Exception as e:
        logger.error(f"Error bulk deleting cart items for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{product_id}", response_model=CartActionResponse)
async def remove_product_from_cart(
    product_id: str,
    quantity: int = Query(None, ge=1, description="Quantity to remove (optional)"),
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Remove product from cart"""
    try:
        result = remove_from_cart(db, current_user.id, product_id, quantity)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        
        return CartActionResponse(
            success=result["success"],
            message=result["message"],
            quantity=result.get("quantity")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing from cart for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/update", response_model=CartActionResponse)
async def update_cart_item_quantity(
    request: CartUpdateRequest,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Update cart item quantity"""
    try:
        result = update_cart_quantity(db, current_user.id, request.product_id, request.quantity)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        
        return CartActionResponse(
            success=result["success"],
            message=result["message"],
            quantity=result.get("quantity")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating cart for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/quantity", response_model=CartActionResponse)
async def patch_cart_item_quantity(
    product_id: str = Query(..., description="Product ID to update quantity for"),
    request: CartQuantityUpdateRequest = ...,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Update cart item quantity using PATCH with product_id query parameter"""
    try:
        result = update_cart_quantity(db, current_user.id, product_id, request.quantity)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        
        return CartActionResponse(
            success=result["success"],
            message=result["message"],
            quantity=result.get("quantity")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating cart quantity for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=CartListResponse)
async def get_user_cart_items(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Get user's cart with pagination"""
    try:
        logger.info(f"Cart request: user_id={current_user.id}, skip={skip}, limit={limit}")
        
        # Step 1: Get cart items
        logger.info("Fetching cart items...")
        cart_items, total = get_user_cart(db, current_user.id, skip, limit)
        logger.info(f"Retrieved {len(cart_items)} cart items, total: {total}")
        
        # Step 2: Get total quantity
        logger.info("Fetching cart item count...")
        total_quantity = get_cart_item_count(db, current_user.id)
        logger.info(f"Total quantity: {total_quantity}")
        
        # Step 3: Validate cart items
        logger.info("Validating cart items...")
        validated_items = []
        for i, item in enumerate(cart_items):
            try:
                logger.info(f"Validating item {i+1}: id={item.id}, product_id={item.product_id}")
                validated_item = CartItem.model_validate(item)
                validated_items.append(validated_item)
                logger.info(f"Item {i+1} validated successfully")
            except Exception as validation_error:
                logger.error(f"Validation error for item {i+1}: {validation_error}")
                logger.error(f"Item data: {item}")
                raise validation_error
        
        # Step 4: Create response
        logger.info("Creating response...")
        response = CartListResponse(
            items=validated_items,
            total=total,
            skip=skip,
            limit=limit,
            total_quantity=total_quantity
        )
        logger.info(f"Response created successfully with {len(response.items)} items")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in cart endpoint for user {current_user.id}: {e}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/summary", response_model=CartSummary)
async def get_user_cart_summary(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Get user's cart summary statistics"""
    try:
        summary = get_cart_summary(db, current_user.id)
        return CartSummary(**summary)
        
    except Exception as e:
        logger.error(f"Error getting cart summary for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/stats", response_model=CartStatsResponse)
async def get_admin_cart_stats(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Get admin statistics - most added products and quantities"""
    # Check admin permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        stats = get_cart_stats(db)
        
        return CartStatsResponse(
            stats=stats,
            total_products=len(stats)
        )
        
    except Exception as e:
        logger.error(f"Error getting cart stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/bulk-delete")
async def bulk_delete_cart_items(
    request: CartBulkDeleteRequest,
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Bulk delete multiple cart items in a single operation"""
    try:
        result = bulk_remove_from_cart(db, current_user.id, request.product_ids)
        
        # Return the result even if no items were found (success=False case)
        return CartBulkDeleteResponse(
            success=result["success"],
            message=result["message"],
            deleted_count=result.get("deleted_count", 0)
        )
        
    except Exception as e:
        logger.error(f"Error bulk deleting cart items for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/count")
async def get_cart_item_count_endpoint(
    current_user: User = Depends(get_current_user_sync),
    db: Session = Depends(get_db)
):
    """Get total number of items in user's cart"""
    try:
        count = get_cart_item_count(db, current_user.id)
        return {"count": count}
        
    except Exception as e:
        logger.error(f"Error getting cart count for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
