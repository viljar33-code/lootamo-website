from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, password_reset, admin, google_auth, facebook_auth, account_linking, test_account_linking

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(google_auth.router, prefix="/auth", tags=["google-oauth"])
api_router.include_router(facebook_auth.router, prefix="/auth", tags=["facebook-oauth"])
api_router.include_router(account_linking.router, prefix="/account-linking", tags=["account-linking"])
api_router.include_router(test_account_linking.router, prefix="/test-account-linking", tags=["test-account-linking"])
api_router.include_router(password_reset.router, prefix="/password-reset", tags=["password-reset"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
