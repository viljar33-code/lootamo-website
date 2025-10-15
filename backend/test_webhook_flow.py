#!/usr/bin/env python3
"""
Test script to simulate webhook flow and debug why g2a_transaction_id and delivered_key are not stored
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.payment_service import PaymentService
from app.models.order import Order
from app.models.order_item import OrderItem
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_webhook_flow():
    """Test the complete webhook flow for a specific order"""
    
    db = SessionLocal()
    try:
        # Find a paid order with order items
        order = db.query(Order).filter(
            Order.payment_status == "paid",
            Order.id.in_([487, 488])  # From the screenshot
        ).first()
        
        if not order:
            logger.error("No paid order found to test")
            return
        
        logger.info(f"🧪 Testing webhook flow for Order {order.id}")
        logger.info(f"Order status: {order.status}, payment_status: {order.payment_status}")
        ``
        # Check order items
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        logger.info(f"Order has {len(order_items)} items")
        
        for item in order_items:
            logger.info(f"  Item {item.id}: product={item.product_id}, status={item.status}")
            logger.info(f"    G2A Order ID: {item.g2a_order_id}")
            logger.info(f"    G2A Transaction ID: {item.g2a_transaction_id}")
            logger.info(f"    Delivered Key: {item.delivered_key}")
        
        # Simulate webhook call
        logger.info("🔄 Simulating webhook call...")
        success = await PaymentService.handle_payment_success(db, order.id)
        
        if success:
            logger.info("✅ Webhook processing completed successfully")
        else:
            logger.error("❌ Webhook processing failed")
        
        # Check results after webhook
        db.refresh(order)
        updated_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        
        logger.info("📊 Results after webhook processing:")
        for item in updated_items:
            logger.info(f"  Item {item.id}: status={item.status}")
            logger.info(f"    G2A Order ID: {item.g2a_order_id}")
            logger.info(f"    G2A Transaction ID: {item.g2a_transaction_id}")
            logger.info(f"    Delivered Key: {item.delivered_key}")
            
            if item.g2a_transaction_id and item.delivered_key:
                logger.info(f"    ✅ BOTH STORED for item {item.id}")
            elif item.g2a_transaction_id:
                logger.info(f"    ⚠️  ONLY TRANSACTION ID stored for item {item.id}")
            elif item.delivered_key:
                logger.info(f"    ⚠️  ONLY LICENSE KEY stored for item {item.id}")
            else:
                logger.info(f"    ❌ NOTHING STORED for item {item.id}")
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
    finally:
        db.close()

async def test_g2a_services():
    """Test G2A service calls directly"""
    from app.services.g2a_service import pay_g2a_order, get_g2a_order_key, create_g2a_order
    
    logger.info("🧪 Testing G2A services directly...")
    
    # Test G2A order creation
    try:
        logger.info("Testing G2A order creation...")
        g2a_response = await create_g2a_order("10000000737012")  # Sample product ID
        logger.info(f"G2A order creation response: {g2a_response}")
        
        if g2a_response and "order_id" in g2a_response:
            g2a_order_id = g2a_response["order_id"]
            
            # Test G2A payment
            logger.info(f"Testing G2A payment for order {g2a_order_id}...")
            pay_response = await pay_g2a_order(g2a_order_id)
            logger.info(f"G2A payment response: {pay_response}")
            
            # Test G2A key retrieval
            logger.info(f"Testing G2A key retrieval for order {g2a_order_id}...")
            key_response = await get_g2a_order_key(g2a_order_id)
            logger.info(f"G2A key response: {key_response}")
            
        else:
            logger.error("G2A order creation failed")
            
    except Exception as e:
        logger.error(f"G2A service test failed: {e}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    print("🚀 Starting webhook flow test...")
    asyncio.run(test_webhook_flow())
    print("\n🚀 Starting G2A services test...")
    asyncio.run(test_g2a_services())
