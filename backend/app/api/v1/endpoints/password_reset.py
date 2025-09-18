from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_async_db
from app.services.auth_service import AuthService

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str


router = APIRouter()


@router.get("/verify")
async def verify_password_reset_token(
    token: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Verify password reset token and redirect to frontend with the token
    or an error message if the token is invalid.
    """
    auth_service = AuthService(db)
    user = await auth_service.verify_password_reset_token(token)
    
    if not user:
        # Redirect to frontend with error
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/reset-password?error=invalid_token",
            status_code=307
        )
    
    # Redirect to frontend with valid token
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/reset-password?token={token}",
        status_code=307
    )


@router.post("/confirm")
async def confirm_password_reset(
    data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_async_db)
):
    """Handle password reset confirmation"""
    try:
        # Check if passwords match
        if data.new_password != data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
            
        # Check password strength (example: at least 8 chars, one uppercase, one lowercase, one digit, one special char)
        # You can customize this based on your requirements
        if len(data.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
            
        auth_service = AuthService(db)
        success = await auth_service.reset_password(data.token, data.new_password)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired token"
            )
            
        return {"message": "Password has been reset successfully"}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            # raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting the password"
        )
        