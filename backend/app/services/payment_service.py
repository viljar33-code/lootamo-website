"""
Payment service for handling Stripe payments and webhooks
"""
import stripe
import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.payment import PaymentIntentRequest, PaymentIntentResponse
from app.schemas.order_item import LicenseKeyResponse, OrderItemWithKey
from app.services.g2a_service import pay_g2a_order, get_g2a_order_key, create_g2a_order, get_g2a_order_details, confirm_g2a_order_payment
from app.services.order_service import OrderService
from app.services.error_log_service import ErrorLogService
from app.models.order import PaymentStatus
from app.core.stripe_config import STRIPE_WEBHOOK_SECRET

logger = logging.getLogger(__name__)


class PaymentService:
    """Service for handling Stripe payments"""
    
    @staticmethod
    async def create_payment_intent(
        db: Session, 
        request: PaymentIntentRequest, 
        user_id: int
    ) -> PaymentIntentResponse:
        """
        Create a Stripe PaymentIntent for an order
        """
        try:
                      
            order = OrderService.get_order_by_id(db, str(request.order_id))
            if not order:
                if len(str(request.order_id)) > 10:
                    raise ValueError(f"Order not found. Note: {request.order_id} appears to be a G2A product ID, not a local order ID. Please create an order first using the /api/v1/orders/ endpoint.")
                else:
                    raise ValueError(f"Order not found with ID: {request.order_id}")
            
            if order.user_id != user_id:
                raise ValueError("Unauthorized access to order")
            
            if order.payment_status != PaymentStatus.PENDING.value:
                raise ValueError("Order payment already processed")
            
            price_to_use = order.total_price if order.total_price is not None else order.price
            if price_to_use is None:
                raise ValueError("Order has no price information")
            amount_cents = int(price_to_use * 100)
            
            try:
                logger.info(f"Creating PaymentIntent for amount: {amount_cents} cents")
                logger.info(f"Stripe API key status: {bool(stripe.api_key)}")
                
                currency_code = 'usd'
                
                if order.currency.lower() != 'usd':
                    logger.info(f"Converting payment from database currency {order.currency} to USD for Stripe processing")
                
                payment_intent = stripe.PaymentIntent.create(
                    amount=amount_cents,
                    currency=currency_code,
                    metadata={
                        'order_id': str(order.id),
                        'user_id': str(user_id),
                        'g2a_order_id': order.g2a_order_id or ''
                    },
                    automatic_payment_methods={
                        'enabled': True,
                    }
                )
                logger.info(f"PaymentIntent created successfully: {payment_intent.id}")
                
                if not payment_intent or not hasattr(payment_intent, 'client_secret') or not payment_intent.client_secret:
                    logger.error(f"PaymentIntent creation failed - missing client_secret: {payment_intent}")
                    logger.error(f"PaymentIntent attributes: {dir(payment_intent) if payment_intent else 'None'}")
                    raise ValueError("PaymentIntent creation failed - no client secret returned")
                    
            except Exception as stripe_error:
                logger.error(f"Stripe PaymentIntent creation failed: {stripe_error}")
                logger.error(f"Error type: {type(stripe_error)}")
                logger.error(f"Stripe API key configured: {bool(stripe.api_key)}")
                
                # Log error for payment processing failure
                ErrorLogService.log_exception(
                    db=db,
                    exception=stripe_error,
                    error_type="PAYMENT_INTENT_CREATION_FAILED",
                    source_system="payment",
                    source_function="PaymentService.create_payment_intent",
                    error_context={
                        "order_id": order.id,
                        "user_id": user_id,
                        "amount": order.total_amount,
                        "currency": order.currency,
                        "stripe_api_configured": bool(stripe.api_key)
                    },
                    severity="critical"
                )
                
                raise ValueError(f"Payment processing error: {stripe_error}")
            
            order.stripe_payment_intent_id = payment_intent.id
            logger.info(f"Updating order {order.id} with PaymentIntent ID: {payment_intent.id}")
            
            try:
                db.commit()
                logger.info(f"Database committed - Order {order.id} linked to PaymentIntent {payment_intent.id}")
                
                db.refresh(order)
                if order.stripe_payment_intent_id == payment_intent.id:
                    logger.info(f"Verification successful - PaymentIntent ID stored correctly")
                else:
                    logger.error(f"Verification failed - Expected: {payment_intent.id}, Got: {order.stripe_payment_intent_id}")
                    raise ValueError("PaymentIntent ID verification failed after commit")
                    
            except Exception as commit_error:
                logger.error(f"Database commit failed for order {order.id}: {commit_error}")
                db.rollback()
                try:
                    stripe.PaymentIntent.cancel(payment_intent.id)
                    logger.info(f"Cancelled PaymentIntent {payment_intent.id} due to database failure")
                except Exception as cancel_error:
                    logger.error(f"Failed to cancel PaymentIntent: {cancel_error}")
                raise ValueError(f"Failed to save PaymentIntent ID: {commit_error}")
            
            logger.info(f"Created PaymentIntent {payment_intent.id} for order {order.id}")
            
            return PaymentIntentResponse(
                client_secret=payment_intent.client_secret,
                payment_intent_id=payment_intent.id,
                amount=amount_cents,
                currency=order.currency
            )
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating PaymentIntent: {str(e)}")
            raise ValueError(f"Payment processing error: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating PaymentIntent: {str(e)}")
            raise
    
    @staticmethod
    async def handle_payment_success(db: Session, order_id: int) -> bool:
        """
        Handle successful payment webhook from Stripe or manual order processing
        """
        try:
           
            skip_g2a_processing = False
            
            order = db.query(Order).filter(Order.id == order_id).first()
            
            if not order:
                logger.error(f"Order not found for Order ID {order_id}")
                return False
            
            if order.payment_status == PaymentStatus.PAID.value:
                logger.info(f"Order {order.id} already marked as paid - checking if G2A processing needed")
                
                needs_g2a_processing = False
                if order.order_items:
                    for item in order.order_items:
                        if (not item.g2a_order_id and item.status != "complete") or \
                           (item.g2a_order_id and not item.delivered_key and item.status != "complete"):
                            needs_g2a_processing = True
                            if not item.g2a_order_id:
                                logger.info(f"Item {item.id} needs G2A processing - no G2A order created yet")
                            else:
                                logger.info(f"Item {item.id} needs G2A processing - has G2A order but no key")
                            break
                elif order.g2a_order_id and not order.delivered_key:
                    needs_g2a_processing = True
                    logger.info(f"Legacy order {order.id} needs G2A processing")
                
                if not needs_g2a_processing:
                    logger.info(f"Order {order.id} already fully processed - but still need to send emails")
                    skip_g2a_processing = True
                else:
                    logger.info(f"Order {order.id} needs G2A processing - continuing with webhook flow")
                    skip_g2a_processing = False
            
            from app.models.order import OrderStatus
            order.payment_status = PaymentStatus.PAID.value
            order.status = OrderStatus.PAID.value
            logger.info(f"Order {order.id} payment_status updated to 'paid' and status to 'paid'")
            
            db.commit()
            logger.info(f"Database committed - Order {order.id} marked as paid")
            
            if not skip_g2a_processing:
                logger.info(f"Payment confirmed successful - now processing G2A flow and storing license keys")
                
                if order.order_items:
                    await PaymentService._process_multi_item_g2a_flow(db, order)
                else:
                    await PaymentService._process_g2a_payment_flow(db, order)
            else:
                logger.info(f"Skipping G2A processing for already processed order {order.id}")
        
            # Always send emails for completed orders regardless of G2A processing status
            logger.info(f"Sending license keys via email for order {order.id}")
            
            from app.models import EmailQueue
            email_check = db.query(EmailQueue).filter(EmailQueue.order_id == str(order.id)).count()
            
            if email_check == 0:
                await PaymentService._send_order_email_notification(db, order)
            else:
                logger.info(f"Emails already queued for order {order.id} - skipping duplicate sending")
            
            from app.models.order import OrderStatus
            if order.payment_status == PaymentStatus.PAID.value and order.status == OrderStatus.COMPLETE.value:
                logger.info(f"Clearing cart for user {order.user_id} after successful payment")
                try:
                    from app.services.cart_service import clear_cart
                    clear_result = clear_cart(db, order.user_id)
                    if clear_result.get("success"):
                        logger.info(f"Cart cleared successfully for user {order.user_id}: {clear_result.get('message')}")
                    else:
                        logger.warning(f"Cart clearing failed for user {order.user_id}: {clear_result.get('message')}")
                except Exception as e:
                    logger.error(f"Error clearing cart for user {order.user_id}: {e}")
                    # Don't fail the entire payment process if cart clearing fails
            else:
                logger.info(f"Skipping cart clearing - order status: {order.status}, payment status: {order.payment_status}")
            
            logger.info(f"Order {order.id} payment processed successfully")
            
            return True
            
        except Exception as e:
            logger.error(f"Error handling payment success: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    async def _process_g2a_payment_flow(db: Session, order: Order) -> None:
        """
        Process G2A payment flow following the correct sequence:
        1. Call G2A Payment Endpoint to get transaction ID
        2. Call G2A License Key Endpoint to get license key
        3. Implement retry mechanism for ORD03 responses
        """
        if not order.g2a_order_id:
            logger.info(f"Order {order.id} has no G2A order ID - creating G2A order first")
            try:
                g2a_create_response = await create_g2a_order(product_id=order.product_id)
                if g2a_create_response and "order_id" in g2a_create_response:
                    order.g2a_order_id = g2a_create_response["order_id"]
                    logger.info(f"G2A order created for legacy order {order.id}: {order.g2a_order_id}")
                else:
                    logger.warning(f"Failed to create G2A order for legacy order {order.id}")
                    return
            except Exception as e:
                logger.error(f"Error creating G2A order for legacy order {order.id}: {e}")
                return
        
        try:
            logger.info(f"Processing G2A payment for order {order.g2a_order_id}")
            g2a_response = await pay_g2a_order(order.g2a_order_id)
            
            if g2a_response and "transaction_id" in g2a_response:
                order.g2a_transaction_id = g2a_response["transaction_id"]
                order.status = "complete"
                logger.info(f"G2A payment successful - Transaction ID: {g2a_response['transaction_id']}")
                
                logger.info(f"Retrieving license key for order {order.g2a_order_id}")
                key_response = await get_g2a_order_key(order.g2a_order_id)
                
                license_key = None
                
                if key_response and "keys" in key_response and key_response["keys"]:
                    license_key = key_response["keys"][0]["key"]
                elif key_response and "key" in key_response and "keys" not in key_response:
                    license_key = key_response["key"]
                
                if license_key:
                    order.delivered_key = license_key
                    order.status = "complete"
                    logger.info(f"G2A transaction_id and license key stored together: {license_key}")
                    
                elif key_response and "error" in key_response:
                    error_code = key_response["error"]
                    
                    if error_code == "ORD03":
                        logger.warning(f"License key not ready (ORD03) - scheduling retry for order {order.id}")
                        from app.services.g2a_retry_service import G2ARetryService
                        await G2ARetryService.schedule_retry_for_order(order.id)
                        
                    elif error_code == "ORD04":
                        logger.warning(f"License key already delivered (ORD04) - no key available")
                        
                    elif error_code == "ORD05":
                        logger.warning(f"G2A payment in progress (ORD05) - scheduling retry for order {order.id}")
                        from app.services.g2a_retry_service import G2ARetryService
                        await G2ARetryService.schedule_retry_for_order(order.id)
                        
                    else:
                        logger.error(f"Unknown G2A key error: {error_code} - {key_response}")
                else:
                    logger.warning(f"Unexpected G2A key response: {key_response}")
                    
            else:
                logger.warning(f"G2A payment failed or missing transaction ID: {g2a_response}")
                
        except Exception as e:
            logger.error(f"❌ Error in G2A payment flow for order {order.id}: {e}")
    
    @staticmethod
    async def _process_multi_item_g2a_flow(db: Session, order: Order) -> None:
        """
        Process G2A payment flow for multi-item orders.
        For each order item:
        1. Create G2A order
        2. Pay G2A order
        3. Retrieve license key
        """
        logger.info(f"Processing multi-item G2A flow for order {order.id} with {len(order.order_items)} items")
        
        for order_item in order.order_items:
            try:
                logger.info(f"Processing G2A flow for order item {order_item.id} (product: {order_item.product_id})")
                
                if not order_item.g2a_order_id:
                    logger.info(f"Creating G2A order for item {order_item.id}")
                    g2a_create_response = await create_g2a_order(
                        product_id=order_item.product_id
                    )
                    
                    if g2a_create_response and "order_id" in g2a_create_response:
                        order_item.g2a_order_id = g2a_create_response["order_id"]
                        order_item.status = "processing"
                        db.commit()  # Commit G2A order ID immediately
                        logger.info(f"G2A order created for item {order_item.id}: {order_item.g2a_order_id}")
                    else:
                        logger.warning(f"Failed to create G2A order for item {order_item.id}")
                        order_item.status = "failed"
                        db.commit()
                        continue
                
                if order_item.g2a_order_id and not order_item.g2a_transaction_id:
                    logger.info(f"Paying G2A order {order_item.g2a_order_id} for item {order_item.id}")
                    g2a_pay_response = await pay_g2a_order(order_item.g2a_order_id)
                    
                    if g2a_pay_response and "transaction_id" in g2a_pay_response:
                        order_item.g2a_transaction_id = g2a_pay_response["transaction_id"]
                        db.commit()  # Commit transaction ID immediately
                        logger.info(f"G2A payment successful for item {order_item.id}: {order_item.g2a_transaction_id}")
                
                # Always try to retrieve license key if we don't have one yet (regardless of payment status)
                if order_item.g2a_order_id and not order_item.delivered_key and order_item.status != "complete":
                    logger.info(f"Retrieving license key for item {order_item.id} (G2A order: {order_item.g2a_order_id})")
                    
                    # Add delay for G2A payment processing
                    import asyncio
                    await asyncio.sleep(5)  # Wait 5 seconds for G2A to process payment
                    
                    key_response = await get_g2a_order_key(order_item.g2a_order_id)
                    
                    license_key = None
                    if key_response and isinstance(key_response, dict):
                        if "keys" in key_response and key_response["keys"]:
                            license_key = key_response["keys"][0]["key"]
                        elif "key" in key_response and key_response["key"]:
                            license_key = key_response["key"]
                    
                    if license_key:
                        order_item.delivered_key = license_key
                        order_item.status = "complete"
                        db.commit()  # Commit immediately after updating
                        logger.info(f"License key retrieved and stored for item {order_item.id}: {license_key}")
                        
                        await PaymentService._update_order_status_if_all_items_complete(db, order)
                    elif key_response and "error" in key_response:
                        error_code = key_response["error"]
                        if error_code == "ORD03":
                            logger.warning(f"License key not ready (ORD03) for item {order_item.id} - will retry later")
                            order_item.status = "pending_key"
                            db.commit()
                        elif error_code == "ORD01":
                            logger.error(f"Invalid G2A order ID (ORD01) for item {order_item.id}")
                            order_item.status = "failed"
                            db.commit()
                        elif error_code == "ORD04":
                            logger.warning(f"License key already delivered (ORD04) for item {order_item.id} - but we need the actual key")
                            # ORD04 means key was already delivered, but the response should still contain the key
                            # Let's check if the key_response itself contains the key despite the error
                            actual_key = None
                            if "key" in key_response and key_response["key"]:
                                actual_key = key_response["key"]
                                logger.info(f"Found actual license key in ORD04 response for item {order_item.id}: {actual_key}")
                            
                            if actual_key:
                                order_item.delivered_key = actual_key
                                logger.info(f"Stored actual license key for ORD04 item {order_item.id}: {actual_key}")
                            else:
                                # If no key in response, make another API call to get it
                                logger.info(f"No key in ORD04 response, making fresh API call for item {order_item.id}")
                                fresh_response = await get_g2a_order_key(order_item.g2a_order_id)
                                if fresh_response and isinstance(fresh_response, dict) and "key" in fresh_response:
                                    order_item.delivered_key = fresh_response["key"]
                                    logger.info(f"Retrieved fresh license key for ORD04 item {order_item.id}: {fresh_response['key']}")
                                else:
                                    order_item.delivered_key = "KEY_ALREADY_DELIVERED_ORD04"
                                    logger.warning(f"Could not retrieve actual key for ORD04 item {order_item.id}, using placeholder")
                            
                            order_item.status = "complete"
                            db.commit()
                            await PaymentService._update_order_status_if_all_items_complete(db, order)
                        elif error_code in ["API_UNAVAILABLE", "API_ERROR", "UNKNOWN_RESPONSE"]:
                            logger.warning(f"G2A API issue ({error_code}) for item {order_item.id} - will retry later")
                            order_item.status = "pending_key"
                            db.commit()
                        else:
                            logger.warning(f"License key error {error_code} for item {order_item.id}")
                            order_item.status = "key_error"
                            db.commit()
                    else:
                        logger.warning(f"Unexpected key response for item {order_item.id}: {key_response}")
                        order_item.status = "key_error"
                        db.commit()
                else:
                    logger.warning(f"G2A payment failed for item {order_item.id}")
                    order_item.status = "failed"
                    db.commit()
                        
            except Exception as e:
                logger.error(f"Error processing G2A flow for item {order_item.id}: {e}")
                order_item.status = "failed"
                db.commit()
    
    @staticmethod
    async def _retrieve_license_key_for_item(db: Session, order_item: OrderItem) -> None:
        """
        Retrieve license key for a specific order item.
        """
        try:
            logger.info(f"Retrieving license key for item {order_item.id} (G2A order: {order_item.g2a_order_id})")
            key_response = await get_g2a_order_key(order_item.g2a_order_id)
            
            license_key = None
            
            if key_response and "keys" in key_response and key_response["keys"]:
                license_key = key_response["keys"][0]["key"]
            elif key_response and "key" in key_response and "keys" not in key_response:
                license_key = key_response["key"]
            
            if license_key:
                order_item.delivered_key = license_key
                order_item.status = "complete"
                logger.info(f"License key retrieved for item {order_item.id}: {license_key}")
                
                order = db.query(Order).filter(Order.id == order_item.order_id).first()
                if order:
                    await PaymentService._update_order_status_if_all_items_complete(db, order)
                
            elif key_response and "error" in key_response:
                error_code = key_response["error"]
                
                if error_code == "ORD03":
                    logger.warning(f"License key not ready (ORD03) for item {order_item.id} - will retry later")
                    order_item.status = "processing"
                    from app.services.g2a_retry_service import G2ARetryService
                    await G2ARetryService.schedule_retry_for_order_item(order_item.id)
                    
                elif error_code == "ORD04":
                    logger.warning(f"License key already delivered (ORD04) for item {order_item.id}")
                    order_item.status = "complete"
                    
                    order = db.query(Order).filter(Order.id == order_item.order_id).first()
                    if order:
                        await PaymentService._update_order_status_if_all_items_complete(db, order)
                    
                else:
                    logger.error(f"Unknown G2A key error for item {order_item.id}: {error_code}")
                    order_item.status = "failed"
            else:
                logger.warning(f"Unexpected G2A key response for item {order_item.id}: {key_response}")
                order_item.status = "processing"
                
        except Exception as e:
            logger.error(f"Error retrieving license key for item {order_item.id}: {e}")
            order_item.status = "failed"
    
    @staticmethod
    async def _send_order_email_notification(db: Session, order: Order) -> None:
        """
        Send email notification for order (handles both single and multi-item orders).
        """
        try:
            from app.services.email_service import email_service
            from app.models.user import User
            
            user = db.query(User).filter(User.id == order.user_id).first()
            if not user or not user.email:
                logger.warning(f"Cannot send email - user or email missing for order {order.id}")
                return
            
            items_with_keys = []
            if order.order_items:
                items_with_keys = [item for item in order.order_items if item.delivered_key]
            
            if items_with_keys:
                license_keys = []
                for item in items_with_keys:
                    license_keys.append({
                        "product_id": item.product_id,
                        "product_name": item.product_id,  # TODO: Get actual product name
                        "license_key": item.delivered_key,
                        "quantity": getattr(item, 'quantity', 1)
                    })
                
                if len(license_keys) == 1:
                    logger.info(f"Sending single license key email for order {order.id}")
                    email_sent = await email_service.send_license_key_email(
                        to_email=user.email,
                        username=user.username or user.email,
                        product_name=license_keys[0]["product_name"],
                        license_key=license_keys[0]["license_key"],
                        order_id=str(order.id)
                    )
                else:
                    logger.info(f"Sending consolidated email for order {order.id} with {len(license_keys)} license keys")
                    email_sent = await email_service.send_multi_license_key_email(
                        to_email=user.email,
                        username=user.username or user.email,
                        license_keys=license_keys,
                        order_id=str(order.id)
                    )
                
                if email_sent:
                    logger.info(f"License key email sent successfully for order {order.id}")
                else:
                    logger.error(f"Failed to send license key email for order {order.id}")
            else:
                logger.info(f"No license keys available yet for order {order.id} - email will be sent when keys are retrieved")
                
        except Exception as e:
            logger.error(f"Error sending license key email for order {order.id}: {e}")
    
    @staticmethod
    async def _send_order_item_email_notification(db: Session, order_item: OrderItem) -> None:
        """
        Send email notification for a single order item when its license key is available.
        """
        try:
            from app.services.email_service import email_service
            from app.models.user import User
            from app.models.product import Product

            order = db.query(Order).filter(Order.id == order_item.order_id).first()
            if not order:
                logger.warning(f"Cannot send item email - order not found for item {order_item.id}")
                return

            user = db.query(User).filter(User.id == order.user_id).first()
            if not user or not user.email:
                logger.warning(f"Cannot send item email - user or email missing for order {order.id}")
                return

            product = db.query(Product).filter(Product.id == str(order_item.product_id)).first()
            product_name = product.name if product else str(order_item.product_id)

            if not order_item.delivered_key:
                logger.info(f"No license key yet for item {order_item.id} - skipping email")
                return

            sent = await email_service.send_license_key_email(
                to_email=user.email,
                username=user.username or user.email,
                product_name=product_name,
                license_key=order_item.delivered_key,
                order_id=str(order.id),
            )
            if sent:
                logger.info(f"Item email sent for order {order.id}, item {order_item.id}")
            else:
                logger.error(f"Failed to send item email for order {order.id}, item {order_item.id}")
        except Exception as e:
            logger.error(f"Error sending item email for order item {order_item.id}: {e}")

    @staticmethod
    async def handle_payment_failed(
        db: Session, 
        payment_intent_id: str
    ) -> bool:
        """
        Handle failed payment from Stripe webhook
        """
        try:
            order = db.query(Order).filter(
                Order.stripe_payment_intent_id == payment_intent_id
            ).first()
            
            if not order:
                logger.error(f"Order not found for PaymentIntent {payment_intent_id}")
                return False
            
            order.payment_status = PaymentStatus.FAILED.value
            db.commit()
            
            logger.info(f"Order {order.id} payment marked as failed")
            return True
            
        except Exception as e:
            logger.error(f"Error handling payment failure: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def verify_webhook_signature(payload: bytes, sig_header: str, endpoint_secret: str) -> bool:
        """
        Verify Stripe webhook signature
        """
        try:
            stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
            return True
        except ValueError:
            logger.error("Invalid payload in webhook")
            return False
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid signature in webhook")
            return False
    
    @staticmethod
    async def get_order_details_with_g2a_confirmation(
        db: Session, 
        order_id: int, 
        user_id: int
    ) -> Optional[dict]:
        """
        Get order details with G2A confirmation status
        """
        try:
            # Get local order
            order = db.query(Order).filter(
                Order.id == order_id,
                Order.user_id == user_id
            ).first()
            
            if not order:
                logger.error(f"Order {order_id} not found for user {user_id}")
                return None
            
            order_data = {
                "id": order.id,
                "g2a_order_id": order.g2a_order_id,
                "product_id": order.product_id,
                "price": order.price,
                "currency": order.currency,
                "status": order.status,
                "payment_status": order.payment_status,
                "stripe_payment_intent_id": order.stripe_payment_intent_id,
                "g2a_transaction_id": order.g2a_transaction_id,
                "delivered_key": order.delivered_key,
                "created_at": order.created_at,
                "updated_at": order.updated_at
            }
            
            if order.payment_status == PaymentStatus.PAID.value and order.g2a_order_id:
                try:
                    g2a_details = await get_g2a_order_details(order.g2a_order_id)
                    if g2a_details and "error" not in g2a_details:
                        order_data["g2a_details"] = g2a_details
                        
                    g2a_confirmation = await confirm_g2a_order_payment(order.g2a_order_id)
                    if g2a_confirmation and "error" not in g2a_confirmation:
                        order_data["g2a_confirmation"] = g2a_confirmation
                        
                except Exception as e:
                    logger.warning(f"Failed to get G2A details for order {order_id}: {e}")
            
            return order_data
            
        except Exception as e:
            logger.error(f"Error getting order details with G2A confirmation: {str(e)}")
            return None
    
    @staticmethod
    async def get_license_key_with_validation(
        db: Session,
        order_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Get license key with proper validation and G2A confirmation
        """
        try:
            order = db.query(Order).filter(
                Order.id == order_id,
                Order.user_id == user_id
            ).first()
            
            if not order:
                logger.error(f"Order {order_id} not found for user {user_id}")
                return {"error": "ORDER_NOT_FOUND", "message": "Order not found"}
            
            if order.payment_status != PaymentStatus.PAID.value:
                logger.warning(f"Attempt to access license key for unpaid order {order_id}")
                return {"error": "ORDER_NOT_PAID", "message": "Order not paid yet"}
            
            if order.delivered_key:
                return {
                    "order_id": order.id,
                    "product_id": order.product_id,
                    "license_key": order.delivered_key,
                    "retrieved_at": order.updated_at.isoformat(),
                    "g2a_order_id": order.g2a_order_id,
                    "g2a_transaction_id": order.g2a_transaction_id
                }
            
            if order.g2a_order_id:
                try:
                    key_response = await get_g2a_order_key(order.g2a_order_id)
                    if key_response and "keys" in key_response and key_response["keys"]:
                        license_key = key_response["keys"][0]["key"]
                        order.delivered_key = license_key
                        db.commit()
                        
                        logger.info(f"License key retrieved and stored for order {order.id}")
                        
                        return {
                            "order_id": order.id,
                            "product_id": order.product_id,
                            "license_key": license_key,
                            "retrieved_at": order.updated_at.isoformat(),
                            "g2a_order_id": order.g2a_order_id,
                            "g2a_transaction_id": order.g2a_transaction_id
                        }
                    elif key_response and "error" in key_response:
                        error_code = key_response["error"]
                        if error_code == "ORD03":
                            return {"error": "KEY_NOT_READY", "message": "License key not ready yet, please try again later"}
                        elif error_code == "ORD04":
                            return {"error": "KEY_ALREADY_DELIVERED", "message": "License key already delivered"}
                        else:
                            return {"error": "G2A_ERROR", "message": f"G2A API error: {key_response.get('message', 'Unknown error')}"}
                    else:
                        return {"error": "NO_KEY_FOUND", "message": "No license key found in G2A response"}
                        
                except Exception as e:
                    logger.error(f"Failed to retrieve license key for order {order_id}: {e}")
                    return {"error": "KEY_RETRIEVAL_FAILED", "message": "Failed to retrieve license key from G2A"}
            
            return {"error": "NO_G2A_ORDER", "message": "No G2A order ID associated with this order"}
            
        except Exception as e:
            logger.error(f"Error getting license key with validation: {str(e)}")
            return {"error": "INTERNAL_ERROR", "message": "Internal server error"}
    
    @staticmethod
    async def get_multi_item_license_keys(
        db: Session,
        order_id: int,
        user_id: int
    ) -> dict:
        """
        Retrieve all license keys for a multi-item order
        """
        try:
            order = db.query(Order).options(
                joinedload(Order.order_items)
            ).filter(
                Order.id == order_id,
                Order.user_id == user_id
            ).first()
            
            if not order:
                return {"error": "ORDER_NOT_FOUND", "message": "Order not found"}
            
            if order.payment_status != "paid":
                return {"error": "ORDER_NOT_PAID", "message": "Order not paid yet"}
            
            from app.models.product import Product
            product_ids = [item.product_id for item in order.order_items]
            products = db.query(Product).filter(Product.id.in_(product_ids)).all()
            product_dict = {p.id: p for p in products}
            
            license_keys = []
            keys_not_ready = []
            
            for order_item in order.order_items:
                product = product_dict.get(order_item.product_id)
                product_name = product.name if product else f"Product {order_item.product_id}"
                
                if order_item.delivered_key:
                    license_keys.append({
                        "product_id": order_item.product_id,
                        "product_name": product_name,
                        "license_key": order_item.delivered_key,
                        "quantity": order_item.quantity,
                        "status": order_item.status
                    })
                elif order_item.g2a_order_id:
                    license_key = None
                    max_retries = 3
                    retry_delay = 2  
                    
                    for attempt in range(max_retries):
                        try:
                            logger.info(f"Attempting to retrieve key for item {order_item.id}, attempt {attempt + 1}/{max_retries}")
                            key_response = await get_g2a_order_key(order_item.g2a_order_id)
                            
                            if key_response and "keys" in key_response and key_response["keys"]:
                                license_key = key_response["keys"][0]["key"]
                                break
                            elif key_response and "key" in key_response and "keys" not in key_response:
                                license_key = key_response["key"]
                                break
                            elif key_response and "error" in key_response:
                                error_code = key_response["error"]
                                if error_code == "ORD03" and attempt < max_retries - 1:
                                    logger.info(f"Key not ready (ORD03) for item {order_item.id}, waiting {retry_delay}s before retry {attempt + 2}")
                                    import asyncio
                                    await asyncio.sleep(retry_delay)
                                    continue
                                else:
                                    logger.warning(f"G2A error {error_code} for item {order_item.id} after {attempt + 1} attempts")
                                    break
                            else:
                                logger.warning(f"Unexpected G2A response for item {order_item.id}: {key_response}")
                                if attempt < max_retries - 1:
                                    await asyncio.sleep(retry_delay)
                                    continue
                                break
                        except Exception as e:
                            logger.error(f"Error retrieving key for item {order_item.id}, attempt {attempt + 1}: {e}")
                            if attempt < max_retries - 1:
                                await asyncio.sleep(retry_delay)
                                continue
                            break
                    
                    if license_key:
                        order_item.delivered_key = license_key
                        order_item.status = "complete"
                        db.commit()
                        
                        logger.info(f"License key stored for order item {order_item.id} - email will be sent by webhook")
                        
                        license_keys.append({
                            "product_id": order_item.product_id,
                            "product_name": product_name,
                            "license_key": license_key,
                            "quantity": order_item.quantity,
                            "status": "complete"
                        })
                    else:
                        if key_response and "error" in key_response and key_response["error"] == "ORD04":
                            order_item.delivered_key = "KEY_ALREADY_DELIVERED_ORD04"
                            order_item.status = "complete"
                            db.commit()
                            logger.info(f"Item {order_item.id} marked complete - key was already delivered (ORD04)")
                            
                            license_keys.append({
                                "product_id": order_item.product_id,
                                "product_name": product_name,
                                "license_key": "Already delivered to customer",
                                "quantity": order_item.quantity,
                                "status": "complete"
                            })
                        elif key_response and "error" in key_response and key_response["error"] == "HTTP_402":
                            order_item.status = "key_error"
                            db.commit()
                            logger.warning(f"⚠️ Item {order_item.id} marked key_error - payment required or in progress (ORD05)")
                            
                            keys_not_ready.append({
                                "product_id": order_item.product_id,
                                "product_name": product_name,
                                "quantity": order_item.quantity,
                                "status": "key_error",
                                "error": "ORD05 - Payment required or in progress"
                            })
                        else:
                            keys_not_ready.append({
                                "product_id": order_item.product_id,
                                "product_name": product_name,
                                "quantity": order_item.quantity,
                                "status": "pending_key"
                            })
                else:
                    keys_not_ready.append({
                        "product_id": order_item.product_id,
                        "product_name": product_name,
                        "quantity": order_item.quantity,
                        "status": "pending"
                    })
            
            if keys_not_ready and not license_keys:
                return {"error": "KEYS_NOT_READY", "message": "License keys are not ready yet"}
            
            if license_keys:
                logger.info(f"Sending comprehensive license key email for order {order_id} with {len(license_keys)} keys")
                await PaymentService._send_order_email_notification(db, order)
            
            return {
                "order_id": order_id,
                "license_keys": license_keys,
                "pending_keys": keys_not_ready,
                "total_items": len(order.order_items),
                "ready_items": len(license_keys),
                "pending_items": len(keys_not_ready)
            }
            
        except Exception as e:
            logger.error(f"Error getting multi-item license keys: {str(e)}")
            return {"error": "INTERNAL_ERROR", "message": "Internal server error"}
    
    @staticmethod
    async def get_multi_item_order_details(
        db: Session,
        order_id: int,
        user_id: int
    ) -> dict:
        """
        Get detailed multi-item order information with all order items
        """
        try:
            order = db.query(Order).options(
                joinedload(Order.order_items),
                joinedload(Order.user)
            ).filter(
                Order.id == order_id,
                Order.user_id == user_id
            ).first()
            
            if not order:
                return None
            
            from app.models.product import Product
            product_ids = [item.product_id for item in order.order_items]
            products = db.query(Product).filter(Product.id.in_(product_ids)).all()
            product_dict = {p.id: p for p in products}
            
            order_items = []
            for item in order.order_items:
                product = product_dict.get(item.product_id)
                order_items.append({
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": product.name if product else f"Product {item.product_id}",
                    "price": item.price,
                    "quantity": item.quantity,
                    "status": item.status,
                    "g2a_order_id": item.g2a_order_id,
                    "g2a_transaction_id": item.g2a_transaction_id,
                    "has_license_key": bool(item.delivered_key),
                    "created_at": item.created_at.isoformat() if item.created_at else None,
                    "updated_at": item.updated_at.isoformat() if item.updated_at else None
                })
            
            return {
                "id": order.id,
                "user_id": order.user_id,
                "total_price": order.total_price,
                "currency": order.currency,
                "status": order.status,
                "payment_status": order.payment_status,
                "stripe_payment_intent_id": order.stripe_payment_intent_id,
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "updated_at": order.updated_at.isoformat() if order.updated_at else None,
                "order_items": order_items,
                "total_items": len(order_items),
                "completed_items": len([item for item in order.order_items if item.status == "complete"]),
                "pending_items": len([item for item in order.order_items if item.status in ["pending", "processing"]])
            }
            
        except Exception as e:
            logger.error(f"Error getting multi-item order details: {str(e)}")
            return None
    
    @staticmethod
    async def _update_order_status_if_all_items_complete(db: Session, order: Order) -> None:
        """
        Check if all order items are complete and update parent order status accordingly
        """
        try:
            db.refresh(order)
            
            if not order.order_items:
                return
            
            all_complete = all(item.status == "complete" for item in order.order_items)
            
            from app.models.order import OrderStatus
            if all_complete and order.status != OrderStatus.COMPLETE.value:
                order.status = OrderStatus.COMPLETE.value
                db.commit()
                logger.info(f"Order {order.id} status updated to 'complete' - all {len(order.order_items)} items are complete")
            elif not all_complete and order.status == OrderStatus.COMPLETE.value:
                order.status = OrderStatus.PAID.value
                db.commit()
                logger.info(f"Order {order.id} status reverted to 'paid' - not all items are complete")
                
        except Exception as e:
            logger.error(f"Error updating order status for order {order.id}: {e}")
            db.rollback()
    
    @staticmethod
    async def fix_existing_order_statuses(db: Session) -> dict:
        """
        Fix existing orders where all items are complete but order status is still pending
        """
        try:
            orders = db.query(Order).filter(
                Order.payment_status == "paid",
                Order.status != "complete"
            ).all()
            
            fixed_count = 0
            for order in orders:
                if order.order_items:
                    all_complete = all(item.status == "complete" for item in order.order_items)
                    if all_complete:
                        order.status = "complete"
                        fixed_count += 1
                        logger.info(f"Fixed order {order.id} status to 'complete'")
            
            db.commit()
            return {"fixed_orders": fixed_count, "message": f"Fixed {fixed_count} order statuses"}
            
        except Exception as e:
            logger.error(f"Error fixing order statuses: {e}")
            db.rollback()
            return {"error": str(e)}
