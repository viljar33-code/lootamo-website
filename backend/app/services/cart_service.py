"""
Cart service layer for shopping cart functionality
"""
import logging
from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func

from app.models.cart import Cart
from app.models.product import Product

logger = logging.getLogger(__name__)


def add_to_cart(db: Session, user_id: int, product_id: str, quantity: int = 1) -> dict:
    """
    Add product to cart with upsert logic.
    If product exists, increment quantity. Otherwise, create new cart item.
    
    Args:
        db: Database session
        user_id: User ID
        product_id: Product ID
        quantity: Quantity to add (default: 1)
        
    Returns:
        dict: Result with success status and message
    """
    try:
        product = db.query(Product).filter(
            Product.id == product_id,
            Product.is_active == True
        ).first()

        if product:
            print(f"  - Name: {product.name}")
            print(f"  - Active: {product.is_active}")
        else:
            inactive_product = db.query(Product).filter(Product.id == product_id).first()
            if inactive_product:
                print(f"  - Product exists but is inactive: {inactive_product.name}")
            else:
                print(f"  - Product does not exist in database")
        print(f"Product lookup for ID {product_id}: {'Found' if product else 'Not found or inactive'}")
        
        if not product:
            return {"success": False, "message": "Product not found or inactive"}
        
        existing_cart_item = db.query(Cart).filter(
            Cart.user_id == user_id,
            Cart.product_id == product_id
        ).first()
        
        if existing_cart_item:
            existing_cart_item.quantity += quantity
            db.commit()
            
            logger.info(f"Updated cart item quantity for user {user_id}, product {product_id}: {existing_cart_item.quantity}")
            return {
                "success": True,
                "message": f"Updated quantity to {existing_cart_item.quantity}",
                "quantity": existing_cart_item.quantity,
                "updated": True
            }
        else:
            cart_item = Cart(
                user_id=user_id,
                product_id=product_id,
                quantity=quantity
            )
            db.add(cart_item)
            db.commit()
            
            logger.info(f"Added new item to cart for user {user_id}, product {product_id}, quantity {quantity}")
            return {
                "success": True,
                "message": "Product added to cart",
                "quantity": quantity,
                "updated": False
            }
            
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding to cart: {e}")
        return {"success": False, "message": "Failed to add product to cart"}


def remove_from_cart(db: Session, user_id: int, product_id: str, quantity: Optional[int] = None) -> dict:
    """
    Remove product from cart. If quantity specified, decrement by that amount.
    If no quantity or quantity >= current quantity, remove item completely.
    
    Args:
        db: Database session
        user_id: User ID
        product_id: Product ID
        quantity: Quantity to remove (optional, removes all if not specified)
        
    Returns:
        dict: Result with success status and message
    """
    try:
        cart_item = db.query(Cart).filter(
            Cart.user_id == user_id,
            Cart.product_id == product_id
        ).first()
        
        if not cart_item:
            return {"success": False, "message": "Product not found in cart"}
        
        if quantity is None or quantity >= cart_item.quantity:
            db.delete(cart_item)
            db.commit()
            
            logger.info(f"Removed product {product_id} from cart for user {user_id}")
            return {"success": True, "message": "Product removed from cart"}
        else:
            # Decrement quantity
            cart_item.quantity -= quantity
            db.commit()
            
            logger.info(f"Decremented cart item quantity for user {user_id}, product {product_id}: {cart_item.quantity}")
            return {
                "success": True,
                "message": f"Quantity updated to {cart_item.quantity}",
                "quantity": cart_item.quantity
            }
            
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing from cart: {e}")
        return {"success": False, "message": "Failed to remove product from cart"}


def update_cart_quantity(db: Session, user_id: int, product_id: str, quantity: int) -> dict:
    """
    Update cart item quantity directly.
    
    Args:
        db: Database session
        user_id: User ID
        product_id: Product ID
        quantity: New quantity (must be > 0)
        
    Returns:
        dict: Result with success status and message
    """
    try:
        if quantity <= 0:
            return {"success": False, "message": "Quantity must be greater than 0"}
        
        cart_item = db.query(Cart).filter(
            Cart.user_id == user_id,
            Cart.product_id == product_id
        ).first()
        
        if not cart_item:
            return {"success": False, "message": "Product not found in cart"}
        
        cart_item.quantity = quantity
        db.commit()
        
        logger.info(f"Updated cart item quantity for user {user_id}, product {product_id}: {quantity}")
        return {
            "success": True,
            "message": f"Quantity updated to {quantity}",
            "quantity": quantity
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating cart quantity: {e}")
        return {"success": False, "message": "Failed to update quantity"}


def get_user_cart(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> Tuple[List[Cart], int]:
    """
    Get user's cart with pagination and product details.
    
    Args:
        db: Database session
        user_id: User ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        Tuple[List[Cart], int]: Cart items and total count
    """
    try:
        total = db.query(Cart).filter(Cart.user_id == user_id).count()
        
        cart_items = db.query(Cart).options(
            joinedload(Cart.product).joinedload(Product.categories),
            joinedload(Cart.product).joinedload(Product.images)
        ).filter(
            Cart.user_id == user_id
        ).join(Product).filter(
            Product.is_active == True  
        ).order_by(desc(Cart.created_at)).offset(skip).limit(limit).all()
        
        return cart_items, total
        
    except Exception as e:
        logger.error(f"Error getting user cart: {e}")
        return [], 0


def get_cart_summary(db: Session, user_id: int) -> dict:
    """
    Get cart summary with total items and estimated value.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        dict: Summary with total items and estimated value
    """
    try:
        cart_items = db.query(Cart).join(Product).filter(
            Cart.user_id == user_id,
            Product.is_active == True
        ).all()
        
        total_items = sum(item.quantity for item in cart_items)
        total_value = sum(
            item.quantity * (item.product.min_price or 0) 
            for item in cart_items 
            if item.product.min_price
        )
        
        return {
            "total_items": total_items,
            "total_estimated_value": float(total_value),
            "currency": "USD"  # Assuming USD, can be made configurable
        }
        
    except Exception as e:
        logger.error(f"Error getting cart summary: {e}")
        return {"total_items": 0, "total_estimated_value": 0.0, "currency": "USD"}


def clear_cart(db: Session, user_id: int) -> dict:
    """
    Clear all items from user's cart.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        dict: Result with success status, message, and count of cleared items
    """
    try:
        items_count = db.query(Cart).filter(Cart.user_id == user_id).count()
        
        if items_count == 0:
            return {"success": True, "message": "Cart is already empty", "cleared_count": 0}
        
        deleted_count = db.query(Cart).filter(Cart.user_id == user_id).delete()
        db.commit()
        
        logger.info(f"Cleared {deleted_count} items from cart for user {user_id}")
        return {
            "success": True, 
            "message": f"Successfully cleared {deleted_count} items from cart",
            "cleared_count": deleted_count
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error clearing cart for user {user_id}: {e}")
        return {"success": False, "message": "Failed to clear cart"}


def get_cart_stats(db: Session) -> List[dict]:
    """
    Get admin statistics - most added products and total quantities.
    
    Args:
        db: Database session
        
    Returns:
        List[dict]: Statistics with product info and quantities
    """
    try:
        # Query to get product stats from cart
        stats = db.query(
            Cart.product_id,
            Product.name.label('product_name'),
            func.count(Cart.user_id).label('user_count'),
            func.sum(Cart.quantity).label('total_quantity')
        ).join(Product).filter(
            Product.is_active == True
        ).group_by(
            Cart.product_id, Product.name
        ).order_by(
            desc(func.sum(Cart.quantity))
        ).limit(50).all()  
        
        return [
            {
                "product_id": stat.product_id,
                "product_name": stat.product_name,
                "user_count": stat.user_count,
                "total_quantity": stat.total_quantity
            }
            for stat in stats
        ]
        
    except Exception as e:
        logger.error(f"Error getting cart stats: {e}")
        return []


def get_cart_item_count(db: Session, user_id: int) -> int:
    """
    Get total number of items in user's cart.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        int: Total quantity of items in cart
    """
    try:
        result = db.query(func.sum(Cart.quantity)).filter(
            Cart.user_id == user_id
        ).join(Product).filter(
            Product.is_active == True
        ).scalar()
        
        return result or 0
        
    except Exception as e:
        logger.error(f"Error getting cart item count: {e}")
        return 0


def bulk_remove_from_cart(db: Session, user_id: int, product_ids: List[str]) -> dict:
    """
    Remove multiple products from cart in a single operation.
    
    Args:
        db: Database session
        user_id: User ID
        product_ids: List of product IDs to remove
        
    Returns:
        dict: Result with success status, message, and count of deleted items
    """
    try:
        if not product_ids:
            return {"success": False, "message": "No product IDs provided"}
        
        
        items_to_delete = db.query(Cart).filter(
            Cart.user_id == user_id,
            Cart.product_id.in_(product_ids)
        ).all()
        
        if not items_to_delete:
            return {"success": False, "message": "No matching items found in cart", "deleted_count": 0}
        
        deleted_count = db.query(Cart).filter(
            Cart.user_id == user_id,
            Cart.product_id.in_(product_ids)
        ).delete(synchronize_session=False)
        
        db.commit()
        
        logger.info(f"Bulk removed {deleted_count} items from cart for user {user_id}")
        return {
            "success": True,
            "message": f"Successfully removed {deleted_count} item{'s' if deleted_count != 1 else ''} from cart",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error bulk removing from cart for user {user_id}: {e}")
        return {"success": False, "message": "Failed to remove items from cart"}
