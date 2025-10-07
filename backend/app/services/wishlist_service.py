import logging
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, desc
from app.models.wishlist import Wishlist
from app.models.product import Product
from app.models.user import User

logger = logging.getLogger(__name__)


def add_to_wishlist(db: Session, user_id: int, product_id: str) -> dict:
    """
    Add product to user's wishlist with upsert logic.
    
    Args:
        db: Database session
        user_id: User ID
        product_id: Product ID
        
    Returns:
        dict: Result with success status and message
    """
    try:
        product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
        if not product:
            return {"success": False, "message": "Product not found or inactive"}
        
        # Check if already in wishlist
        existing = db.query(Wishlist).filter(
            Wishlist.user_id == user_id,
            Wishlist.product_id == product_id
        ).first()
        
        if existing:
            return {"success": True, "message": "Product already in wishlist", "already_exists": True}
        
        wishlist_item = Wishlist(user_id=user_id, product_id=product_id)
        db.add(wishlist_item)
        db.commit()
        db.refresh(wishlist_item)
        
        logger.info(f"Added product {product_id} to wishlist for user {user_id}")
        return {"success": True, "message": "Product added to wishlist", "wishlist_item": wishlist_item}
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error adding to wishlist: {e}")
        return {"success": False, "message": "Product already in wishlist"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding to wishlist: {e}")
        return {"success": False, "message": "Failed to add product to wishlist"}


def remove_from_wishlist(db: Session, user_id: int, product_id: str) -> dict:
    """
    Remove product from user's wishlist.
    
    Args:
        db: Database session
        user_id: User ID
        product_id: Product ID
        
    Returns:
        dict: Result with success status and message
    """
    try:
        wishlist_item = db.query(Wishlist).filter(
            Wishlist.user_id == user_id,
            Wishlist.product_id == product_id
        ).first()
        
        if not wishlist_item:
            return {"success": False, "message": "Product not found in wishlist"}
        
        db.delete(wishlist_item)
        db.commit()
        
        logger.info(f"Removed product {product_id} from wishlist for user {user_id}")
        return {"success": True, "message": "Product removed from wishlist"}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing from wishlist: {e}")
        return {"success": False, "message": "Failed to remove product from wishlist"}


def get_user_wishlist(db: Session, user_id: int, skip: int = 0, limit: int = 20, search: Optional[str] = None) -> Tuple[List[Wishlist], int]:
    """
    Get user's wishlist with pagination, product details, and optional name search.
    
    Args:
        db: Database session
        user_id: User ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        search: Optional product name search term
        
    Returns:
        Tuple[List[Wishlist], int]: Wishlist items and total count
    """
    try:
        base_query = db.query(Wishlist).filter(Wishlist.user_id == user_id).join(Product).filter(
            Product.is_active == True
        )
        
        if search:
            search_term = f"%{search.strip()}%"
            base_query = base_query.filter(Product.name.ilike(search_term))
        
        total = base_query.count()
        
        wishlist_items = base_query.options(
            joinedload(Wishlist.product).joinedload(Product.categories),
            joinedload(Wishlist.product).joinedload(Product.images)
        ).order_by(desc(Wishlist.created_at)).offset(skip).limit(limit).all()
        
        return wishlist_items, total
        
    except Exception as e:
        logger.error(f"Error getting user wishlist: {e}")
        return [], 0


def get_wishlist_stats(db: Session) -> List[dict]:
    """
    Get admin statistics - number of users per product in wishlists.
    
    Args:
        db: Database session
        
    Returns:
        List[dict]: Statistics with product_id and user_count
    """
    try:
        stats = db.query(
            Wishlist.product_id,
            func.count(Wishlist.user_id).label('user_count'),
            Product.name.label('product_name')
        ).join(Product).filter(
            Product.is_active == True
        ).group_by(
            Wishlist.product_id, Product.name
        ).order_by(
            desc(func.count(Wishlist.user_id))
        ).all()
        
        result = []
        for stat in stats:
            result.append({
                "product_id": stat.product_id,
                "product_name": stat.product_name,
                "user_count": stat.user_count
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting wishlist stats: {e}")
        return []


def check_product_in_wishlist(db: Session, user_id: int, product_id: str) -> bool:
    """
    Check if a product is in user's wishlist.
    
    Args:
        db: Database session
        user_id: User ID
        product_id: Product ID
        
    Returns:
        bool: True if product is in wishlist, False otherwise
    """
    try:
        exists = db.query(Wishlist).filter(
            Wishlist.user_id == user_id,
            Wishlist.product_id == product_id
        ).first() is not None
        
        return exists
        
    except Exception as e:
        logger.error(f"Error checking product in wishlist: {e}")
        return False


def get_wishlist_summary(db: Session, user_id: int) -> dict:
    """
    Get summary statistics for user's wishlist.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        dict: Summary with total items, total value, etc.
    """
    try:
        total_items = db.query(Wishlist).filter(Wishlist.user_id == user_id).count()
        
        total_value = db.query(func.sum(Product.min_price)).join(Wishlist).filter(
            Wishlist.user_id == user_id,
            Product.is_active == True,
            Product.min_price.isnot(None)
        ).scalar() or 0
        
        return {
            "total_items": total_items,
            "total_estimated_value": float(total_value),
            "currency": "USD"  # Assuming USD, can be made configurable
        }
        
    except Exception as e:
        logger.error(f"Error getting wishlist summary: {e}")
        return {"total_items": 0, "total_estimated_value": 0.0, "currency": "USD"}


def clear_user_wishlist(db: Session, user_id: int) -> dict:
    """
    Clear all items from user's wishlist.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        dict: Result with success status, message, and count of cleared items
    """
    try:
        items_count = db.query(Wishlist).filter(Wishlist.user_id == user_id).count()
        
        if items_count == 0:
            return {"success": True, "message": "Wishlist is already empty", "cleared_count": 0}
        
        # Delete all wishlist items for the user
        deleted_count = db.query(Wishlist).filter(Wishlist.user_id == user_id).delete()
        db.commit()
        
        logger.info(f"Cleared {deleted_count} items from wishlist for user {user_id}")
        return {
            "success": True, 
            "message": f"Successfully cleared {deleted_count} items from wishlist",
            "cleared_count": deleted_count
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error clearing wishlist for user {user_id}: {e}")
        return {"success": False, "message": "Failed to clear wishlist"}


def add_all_wishlist_to_cart(db: Session, user_id: int) -> dict:
    """
    Add all wishlist items to cart and optionally clear wishlist.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        dict: Result with success status, message, and details of added items
    """
    try:
        from app.services.cart_service import add_to_cart
        
        wishlist_items = db.query(Wishlist).join(Product).filter(
            Wishlist.user_id == user_id,
            Product.is_active == True
        ).all()
        
        if not wishlist_items:
            return {"success": True, "message": "Wishlist is empty", "added_count": 0, "failed_items": []}
        
        added_count = 0
        failed_items = []
        
        for wishlist_item in wishlist_items:
            try:
                result = add_to_cart(db, user_id, wishlist_item.product_id, quantity=1)
                if result["success"]:
                    added_count += 1
                else:
                    failed_items.append({
                        "product_id": wishlist_item.product_id,
                        "product_name": wishlist_item.product.name if wishlist_item.product else "Unknown",
                        "error": result["message"]
                    })
            except Exception as e:
                failed_items.append({
                    "product_id": wishlist_item.product_id,
                    "product_name": wishlist_item.product.name if wishlist_item.product else "Unknown",
                    "error": str(e)
                })
        
        if added_count > 0:
            try:
                # Remove successfully added items from wishlist
                for wishlist_item in wishlist_items:
                    if wishlist_item.product_id not in [item["product_id"] for item in failed_items]:
                        db.delete(wishlist_item)
                db.commit()
            except Exception as e:
                logger.warning(f"Failed to clear wishlist after adding to cart: {e}")
        
        total_items = len(wishlist_items)
        
        if added_count == total_items:
            message = f"Successfully added all {added_count} items to cart"
        elif added_count > 0:
            message = f"Added {added_count} of {total_items} items to cart"
        else:
            message = "Failed to add any items to cart"
        
        logger.info(f"Bulk add to cart for user {user_id}: {added_count}/{total_items} items added")
        
        return {
            "success": added_count > 0,
            "message": message,
            "added_count": added_count,
            "total_items": total_items,
            "failed_items": failed_items
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding all wishlist to cart for user {user_id}: {e}")
        return {"success": False, "message": "Failed to add wishlist items to cart"}
