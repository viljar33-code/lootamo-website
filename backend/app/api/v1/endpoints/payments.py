"""
Payment endpoints for Stripe integration
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.payment import PaymentIntentRequest, PaymentIntentResponse
from app.schemas.order_item import MultiItemLicenseKeysResponse
from app.services.payment_service import PaymentService
from app.core.stripe_config import STRIPE_WEBHOOK_SECRET
from app.models.order import Order
import stripe
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    request: PaymentIntentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a Stripe PaymentIntent for an order
    """
    try:
        payment_intent = await PaymentService.create_payment_intent(
            db=db,
            request=request,
            user_id=current_user.id
        )
        return payment_intent
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating payment intent: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/webhook-test", status_code=200)
async def webhook_test(request: Request):
    """
    Simple webhook test endpoint for debugging
    """
    try:
        payload = await request.body()
        headers = dict(request.headers)
        
        return {
            "payload_received": payload.decode('utf-8') if payload else "EMPTY",
            "payload_length": len(payload),
            "headers": headers,
            "content_type": headers.get('content-type', 'NOT_SET')
        }
    except Exception as e:
        return {"error": str(e), "type": str(type(e))}


@router.post("/webhook", status_code=200)
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle Stripe webhook events
    """
    try:
        
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        if not sig_header:
            logger.warning("Missing Stripe signature header - allowing for testing")
            # For testing purposes, skip signature verification if no header
            import json
            try:
                logger.info(f"Raw payload received: {payload}")
                logger.info(f"Payload type: {type(payload)}")
                logger.info(f"Payload length: {len(payload)}")
                
                if not payload or len(payload) == 0:
                    logger.error("Empty payload received from Swagger UI")
                    raise HTTPException(
                        status_code=400, 
                        detail="Empty payload. Make sure to fill the Request Body in Swagger UI with valid JSON."
                    )
                
                if isinstance(payload, bytes):
                    payload_str = payload.decode('utf-8')
                else:
                    payload_str = str(payload)
                    
                logger.info(f"Decoded payload: {payload_str}")
                event = json.loads(payload_str)
                logger.info("Webhook processed without signature verification (testing mode)")
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON payload: {e}")
                logger.error(f"Payload that failed: {payload}")
                raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {str(e)}")
            except Exception as e:
                logger.error(f"Unexpected error parsing payload: {e}")
                logger.error(f"Payload that failed: {payload}")
                raise HTTPException(status_code=400, detail=f"Payload parsing error: {str(e)}")
        else:
            # Verify webhook signature
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, STRIPE_WEBHOOK_SECRET
                )
            except ValueError as e:
                logger.error(f"Invalid payload: {e}")
                logger.error(f"Error type: {type(e)}")
                import traceback
                logger.error(f"Full traceback: {traceback.format_exc()}")
                raise HTTPException(status_code=400, detail="Invalid payload")
            except stripe.error.SignatureVerificationError as e:
                logger.error(f"Invalid signature: {e}")
                logger.error(f"Error type: {type(e)}")
                import traceback
                logger.error(f"Full traceback: {traceback.format_exc()}")
                raise HTTPException(status_code=400, detail="Invalid signature")
            except Exception as e:
                logger.error(f"Webhook signature verification failed: {e}")
                logger.error(f"Error type: {type(e)}")
                import traceback
                logger.error(f"Full traceback: {traceback.format_exc()}")
                raise HTTPException(status_code=400, detail="Webhook verification failed")
        
        logger.info(f"Received Stripe webhook event: {event['type']}")
        
        # Handle the event
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            payment_intent_id = payment_intent['id']
            
            logger.info(f"🔔 Processing payment_intent.succeeded for: {payment_intent_id}")
            logger.info(f"PaymentIntent status: {payment_intent.get('status', 'unknown')}")
            logger.info(f"PaymentIntent amount: {payment_intent.get('amount', 'unknown')}")
            
            # Check if order exists before processing
            from app.models.order import Order
            existing_order = db.query(Order).filter(
                Order.stripe_payment_intent_id == payment_intent_id
            ).first()
            
            if existing_order:
                logger.info(f"✅ Found order {existing_order.id} for PaymentIntent {payment_intent_id}")
                logger.info(f"Order current status: payment_status={existing_order.payment_status}, status={existing_order.status}")
                
                success = await PaymentService.handle_payment_success(db, existing_order.id)
                if not success:
                    logger.error(f"Failed to handle payment success for {payment_intent_id}")
                    raise HTTPException(status_code=500, detail="Failed to process payment")
            else:
                logger.warning(f"⚠️ Orphaned PaymentIntent received: {payment_intent_id}")
                logger.info("This PaymentIntent was likely created directly by frontend, not through backend API")
                logger.info("📊 Recent orders with PaymentIntent IDs:")
                recent_orders = db.query(Order).filter(
                    Order.stripe_payment_intent_id.isnot(None)
                ).order_by(Order.created_at.desc()).limit(5).all()
                
                for order in recent_orders:
                    logger.info(f"  Order {order.id}: {order.stripe_payment_intent_id}")
                
                # Check PaymentIntent metadata for order information
                try:
                    logger.info(f"Attempting to retrieve PaymentIntent metadata for: {payment_intent_id}")
                    pi = stripe.PaymentIntent.retrieve(payment_intent_id)
                    metadata = pi.get('metadata', {})
                    logger.info(f"Retrieved metadata: {metadata}")
                    
                    if metadata.get('order_id'):
                        logger.info(f"PaymentIntent has order_id metadata: {metadata['order_id']}")
                        # Try to find order by ID and link it
                        order_id = int(metadata['order_id'])
                        order = db.query(Order).filter(Order.id == order_id).first()
                        
                        if order and not order.stripe_payment_intent_id:
                            logger.info(f"🔗 Linking orphaned PaymentIntent to order {order_id}")
                            order.stripe_payment_intent_id = payment_intent_id
                            db.commit()
                            
                            # Now process the payment
                            success = await PaymentService.handle_payment_success(db, order.id)
                            if not success:
                                logger.error(f"Failed to handle payment success after linking: {payment_intent_id}")
                                raise HTTPException(status_code=500, detail="Failed to process payment")
                        else:
                            logger.warning(f"Order {order_id} not found or already has PaymentIntent")
                    else:
                        logger.warning("PaymentIntent has no order_id metadata - cannot link to order")
                        
                except Exception as e:
                    logger.error(f"Failed to retrieve PaymentIntent metadata: {e}")
                    logger.error(f"Error type: {type(e)}")
                    import traceback
                    logger.error(f"Full traceback: {traceback.format_exc()}")
                
                # Don't raise error for orphaned PaymentIntents - just log and continue
                logger.info("Ignoring orphaned PaymentIntent - no associated order found")
                
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            success = await PaymentService.handle_payment_failed(db, payment_intent['id'])
            if not success:
                logger.error(f"Failed to handle payment failure for {payment_intent['id']}")
                # Don't raise error for failed payments - just log
        else:
            logger.info(f"Unhandled event type: {event['type']}")
        
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# @router.get("/orders/{order_id}/license-key")
# async def get_order_license_key(
#     order_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Retrieve license key for a paid order with enhanced validation
#     """
#     try:
#         result = await PaymentService.get_license_key_with_validation(
#             db=db,
#             order_id=order_id,
#             user_id=current_user.id
#         )
        
#         if not result:
#             raise HTTPException(status_code=500, detail="Internal server error")
        
#         if "error" in result:
#             error_code = result["error"]
#             if error_code == "ORDER_NOT_FOUND":
#                 raise HTTPException(status_code=404, detail=result["message"])
#             elif error_code == "ORDER_NOT_PAID":
#                 raise HTTPException(status_code=400, detail=result["message"])
#             elif error_code in ["KEY_NOT_READY", "KEY_ALREADY_DELIVERED"]:
#                 raise HTTPException(status_code=202, detail=result["message"])
#             elif error_code == "G2A_ERROR":
#                 raise HTTPException(status_code=502, detail=result["message"])
#             else:
#                 raise HTTPException(status_code=500, detail=result["message"])
        
#         return result
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error retrieving license key: {str(e)}")
#         raise HTTPException(status_code=500, detail="Internal server error")


# @router.get("/orders/{order_id}/details")
# async def get_order_details_with_confirmation(
#     order_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get order details with G2A confirmation status
#     """
#     try:
#         result = await PaymentService.get_order_details_with_g2a_confirmation(
#             db=db,
#             order_id=order_id,
#             user_id=current_user.id
#         )
        
#         if not result:
#             raise HTTPException(status_code=404, detail="Order not found")
        
#         return result
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error retrieving order details: {str(e)}")
#         raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/orders/{order_id}/license-keys", response_model=MultiItemLicenseKeysResponse)
async def get_multi_item_license_keys(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all license keys for a multi-item order
    """
    try:
        result = await PaymentService.get_multi_item_license_keys(
            db=db,
            order_id=order_id,
            user_id=current_user.id
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Internal server error")
        
        if "error" in result:
            error_code = result["error"]
            if error_code == "ORDER_NOT_FOUND":
                raise HTTPException(status_code=404, detail=result["message"])
            elif error_code == "ORDER_NOT_PAID":
                raise HTTPException(status_code=400, detail=result["message"])
            elif error_code == "KEYS_NOT_READY":
                raise HTTPException(status_code=202, detail=result["message"])
            elif error_code == "G2A_ERROR":
                raise HTTPException(status_code=502, detail=result["message"])
            else:
                raise HTTPException(status_code=500, detail=result["message"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving multi-item license keys: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/orders/{order_id}/multi-item-details")
async def get_multi_item_order_details(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get multi-item order details with all order items and their statuses
    """
    try:
        result = await PaymentService.get_multi_item_order_details(
            db=db,
            order_id=order_id,
            user_id=current_user.id
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving multi-item order details: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/orders/{order_id}/invoice")
async def download_invoice(
    order_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download invoice PDF for a paid order
    """
    try:
        # Get order details using the existing service method
        order_details = await PaymentService.get_multi_item_order_details(
            db=db,
            order_id=order_id,
            user_id=current_user.id
        )
        
        if not order_details:
            raise HTTPException(status_code=404, detail="Order not found")

        if order_details["payment_status"] != "paid":
            raise HTTPException(status_code=400, detail="Invoice available only after successful payment")

        # Generate PDF invoice
        pdf_bytes = generate_invoice_pdf(order_details, current_user)

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice_{order_id}.pdf"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating invoice: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


def generate_invoice_pdf(order_details: dict, user: User) -> bytes:
    """
    Generate a modern, professional PDF invoice with enhanced design
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=60
    )
    elements = []
    
    # Custom styles
    styles = getSampleStyleSheet()
    
    # Define custom colors for Lootamo branding
    primary_color = colors.HexColor("#2563eb")  # Blue
    secondary_color = colors.HexColor("#64748b")  # Slate gray
    accent_color = colors.HexColor("#f8fafc")  # Light gray background
    success_color = colors.HexColor("#059669")  # Green
    
    # Header with logo area and company info
    header_table_data = [
        [
            # Left side - Logo placeholder and company info
            Paragraph("""
                <font size=32 color="#2563eb"><b>LOOTAMO</b></font><br/>
                <font size=10 color="#64748b">Digital Game Store</font><br/>
                <font size=9 color="#64748b">support@lootamo.com</font><br/>
                <font size=9 color="#64748b">www.lootamo.com</font>
            """, styles["Normal"]),
            
            # Right side - Invoice title and number
            Paragraph(f"""
                <font size=24><b>INVOICE</b></font><br/>
                <font size=12 color="#64748b"># {order_details['id']:06d}</font><br/>
                <font size=10 color="#64748b">Date: {datetime.now().strftime('%B %d, %Y')}</font>
            """, ParagraphStyle("right_align", parent=styles["Normal"], alignment=2))
        ]
    ]
    
    header_table = Table(header_table_data, colWidths=[300, 250])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
    ]))
    
    elements.append(header_table)
    elements.append(Spacer(1, 30))
    
    # Customer and payment info section with modern layout
    customer_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email
    
    # Create a two-column layout for customer info and payment status
    info_table_data = [
        [
            # Left column - Bill To
            Paragraph(f"""
                <font size=12 color="#1f2937"><b>BILL TO</b></font><br/>
                <font size=11><b>{customer_name}</b></font><br/>
                <font size=10 color="#64748b">{user.email}</font><br/>
                <font size=9 color="#64748b">Customer ID: {user.id}</font>
            """, styles["Normal"]),
            
            # Right column - Payment Status and Details
            Paragraph(f"""
                <font size=12 color="#1f2937"><b>PAYMENT STATUS</b></font><br/>
                <font size=11 color="#059669"><b>✓ PAID</b></font><br/>
                <font size=10 color="#64748b">Payment Date: {datetime.now().strftime('%B %d, %Y')}</font><br/>
                <font size=9 color="#64748b">Method: Credit Card</font>
            """, styles["Normal"])
        ]
    ]
    
    info_table = Table(info_table_data, colWidths=[275, 275])
    info_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 20),
        ("RIGHTPADDING", (0, 0), (-1, -1), 20),
        ("TOPPADDING", (0, 0), (-1, -1), 15),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
        ("BACKGROUND", (0, 0), (-1, -1), accent_color),
        ("ROUNDEDCORNERS", (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(info_table)
    elements.append(Spacer(1, 30))
    
    # Items section header
    elements.append(Paragraph(
        '<font size=14 color="#1f2937"><b>ORDER ITEMS</b></font>',
        styles["Normal"]
    ))
    elements.append(Spacer(1, 15))
    
    # Modern products table with enhanced styling
    table_data = [
        [
            Paragraph('<font size=11 color="white"><b>PRODUCT</b></font>', styles["Normal"]),
            Paragraph('<font size=11 color="white"><b>QTY</b></font>', styles["Normal"]),
            Paragraph('<font size=11 color="white"><b>PRICE</b></font>', styles["Normal"]),
            Paragraph('<font size=11 color="white"><b>TOTAL</b></font>', styles["Normal"])
        ]
    ]
    
    # Add order items with enhanced formatting
    subtotal = 0
    for item in order_details["order_items"]:
        product_name = item["product_name"]
        if len(product_name) > 45:
            product_name = product_name[:42] + "..."
        
        amount = item["price"] * item["quantity"]
        subtotal += amount
        
        table_data.append([
            Paragraph(f'<font size=10><b>{product_name}</b><br/><font size=8 color="#64748b">Digital Game License</font></font>', styles["Normal"]),
            Paragraph(f'<font size=10>{item["quantity"]}</font>', styles["Normal"]),
            Paragraph(f'<font size=10>${item["price"]:.2f}</font>', styles["Normal"]),
            Paragraph(f'<font size=10><b>${amount:.2f}</b></font>', styles["Normal"])
        ])
    
    # Create modern table with enhanced styling
    items_table = Table(table_data, colWidths=[280, 60, 80, 80])
    items_table.setStyle(TableStyle([
        # Header row styling
        ("BACKGROUND", (0, 0), (-1, 0), primary_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
        ("ALIGN", (1, 0), (-1, 0), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 15),
        ("TOPPADDING", (0, 0), (-1, 0), 15),
        ("LEFTPADDING", (0, 0), (-1, 0), 15),
        ("RIGHTPADDING", (0, 0), (-1, 0), 15),
        
        # Data rows styling
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
        ("ALIGN", (0, 1), (0, -1), "LEFT"),
        ("VALIGN", (0, 1), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 12),
        ("TOPPADDING", (0, 1), (-1, -1), 12),
        ("LEFTPADDING", (0, 1), (-1, -1), 15),
        ("RIGHTPADDING", (0, 1), (-1, -1), 15),
        
        # Alternating row colors
        ("BACKGROUND", (0, 1), (-1, 1), colors.white),
        ("BACKGROUND", (0, 2), (-1, 2), accent_color),
        
        # Grid lines
        ("LINEBELOW", (0, 0), (-1, 0), 2, colors.white),
        ("GRID", (0, 1), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        
        # Border
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#d1d5db")),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 25))
    
    # Modern summary section with enhanced styling
    total = subtotal
    
    # Create summary box with modern design
    summary_data = [
        [
            "",
            "",
            Paragraph('<font size=11 color="#64748b">Subtotal:</font>', styles["Normal"]),
            Paragraph(f'<font size=11>${subtotal:.2f}</font>', ParagraphStyle("right", parent=styles["Normal"], alignment=2))
        ],
        [
            "",
            "",
            Paragraph('<font size=11 color="#64748b">Tax:</font>', styles["Normal"]),
            Paragraph('<font size=11 color="#64748b">$0.00</font>', ParagraphStyle("right", parent=styles["Normal"], alignment=2))
        ],
        [
            "",
            "",
            Paragraph('<font size=11 color="#64748b">Discount:</font>', styles["Normal"]),
            Paragraph('<font size=11 color="#64748b">$0.00</font>', ParagraphStyle("right", parent=styles["Normal"], alignment=2))
        ],
        [
            "",
            "",
            "",
            ""
        ],  # Spacer row
        [
            "",
            "",
            Paragraph('<font size=14 color="#1f2937"><b>TOTAL:</b></font>', styles["Normal"]),
            Paragraph(f'<font size=16 color="#059669"><b>${total:.2f}</b></font>', ParagraphStyle("right", parent=styles["Normal"], alignment=2))
        ]
    ]
    
    summary_table = Table(summary_data, colWidths=[200, 100, 120, 80])
    summary_table.setStyle(TableStyle([
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, 0), (-1, -3), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, -2), 8),
        ("TOPPADDING", (0, 0), (-1, -2), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 15),
        ("RIGHTPADDING", (0, 0), (-1, -1), 15),
        
        # Total row styling
        ("LINEABOVE", (2, -1), (-1, -1), 2, primary_color),
        ("BACKGROUND", (2, -1), (-1, -1), accent_color),
        ("BOTTOMPADDING", (2, -1), (-1, -1), 12),
        ("TOPPADDING", (2, -1), (-1, -1), 12),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 40))
    
    # Modern footer with branding
    footer_table_data = [
        [
            Paragraph("""
                <font size=10 color="#64748b">
                <b>Thank you for choosing Lootamo!</b><br/>
                Your digital game license will be delivered via email.<br/>
                For support, contact us at support@lootamo.com
                </font>
            """, ParagraphStyle("center", parent=styles["Normal"], alignment=1))
        ]
    ]
    
    footer_table = Table(footer_table_data, colWidths=[500])
    footer_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 20),
        ("RIGHTPADDING", (0, 0), (-1, -1), 20),
        ("TOPPADDING", (0, 0), (-1, -1), 15),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
        ("BACKGROUND", (0, 0), (-1, -1), accent_color),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#d1d5db")),
    ]))
    elements.append(footer_table)
    
    # Add website link at bottom
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        '<font size=9 color="#64748b">Visit <font color="#2563eb"><b>www.lootamo.com</b></font> for more amazing games!</font>',
        ParagraphStyle("center", parent=styles["Normal"], alignment=1)
    ))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

