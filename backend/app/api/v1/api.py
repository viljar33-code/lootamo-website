from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, users, password_reset, admin, google_auth, facebook_auth, 
    account_linking, test_account_linking, providers, products, scheduler, 
    sync_logs, wishlist, cart, orders, payments, email_queue, retry_logs, error_logs
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(google_auth.router, prefix="/auth", tags=["google-oauth"])
api_router.include_router(facebook_auth.router, prefix="/auth", tags=["facebook-oauth"])
api_router.include_router(account_linking.router, prefix="/account-linking", tags=["account-linking"])
api_router.include_router(test_account_linking.router, prefix="/test-account-linking", tags=["test-account-linking"])
api_router.include_router(password_reset.router, prefix="/password-reset", tags=["password-reset"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(wishlist.router, prefix="/wishlist", tags=["wishlist"])
api_router.include_router(cart.router, prefix="/cart", tags=["cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(scheduler.router, prefix="/scheduler", tags=["scheduler"])
api_router.include_router(sync_logs.router, prefix="/sync-logs", tags=["sync-logs"])
api_router.include_router(email_queue.router, prefix="/email-queue", tags=["email-queue"])
api_router.include_router(retry_logs.router, prefix="/retry-logs", tags=["retry-logs"])
api_router.include_router(error_logs.router, prefix="/error-logs", tags=["error-logs"])
# api_router.include_router(admin_products.router, prefix="/admin/products", tags=["admin-products"])
# api_router.include_router(celery_products.router, prefix="/products", tags=["celery-products"])
# api_router.include_router(providers.router, prefix="/providers", tags=["providers"])
