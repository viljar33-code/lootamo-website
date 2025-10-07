"""
Payment-related Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional


class PaymentIntentRequest(BaseModel):
    """Request schema for creating Stripe PaymentIntent"""
    order_id: int = Field(..., description="Local order ID to create payment for")


class PaymentIntentResponse(BaseModel):
    """Response schema for Stripe PaymentIntent creation"""
    client_secret: str = Field(..., description="Stripe client secret for frontend")
    payment_intent_id: str = Field(..., description="Stripe PaymentIntent ID")
    amount: int = Field(..., description="Payment amount in cents")
    currency: str = Field(..., description="Payment currency")


class StripeWebhookEvent(BaseModel):
    """Stripe webhook event data"""
    id: str
    type: str
    data: dict
