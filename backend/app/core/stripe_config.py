"""
Stripe configuration and utilities
"""
import stripe
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

STRIPE_SECRET_KEY = settings.STRIPE_SECRET_KEY or "sk_test_51SArZdHUJcZKVIXc4l2vKTsNIWPUOERZTbMdctv4UGOGb3zGtqZSlXGexHXLtBcez22izeFDymvRgCmihkU1oOA200mFQ6cZmf"
STRIPE_PUBLISHABLE_KEY = settings.STRIPE_PUBLISHABLE_KEY or "pk_test_51SArZdHUJcZKVIXcVGHJKLMNOPQRSTUVWXYZ"
STRIPE_WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET or "whsec_ba44e744d3401ff84018200e2b6e40db366f06eb0701be526235502be3a1bda5"

if not STRIPE_SECRET_KEY or STRIPE_SECRET_KEY == "":
    logger.error("STRIPE_SECRET_KEY is not configured!")
    raise ValueError("Stripe secret key is required")

stripe.api_key = STRIPE_SECRET_KEY
logger.info(f"Stripe configured with key: {STRIPE_SECRET_KEY[:7]}...")

def get_stripe_publishable_key() -> str:
    """
    Get Stripe publishable key for frontend
    """
    return STRIPE_PUBLISHABLE_KEY
