from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.services.auth_service import AuthService
from app.services.email_service import email_service
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, Token, TokenRefresh, 
    PasswordReset, PasswordResetConfirm, ChangePassword, PasswordResetResponse, PasswordResetConfirmResponse
)
from app.api.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_async_db)
):
    """Register a new customer account (public registration)"""
    
    from app.models.user import UserRole
    
    auth_service = AuthService(db)

    user = await auth_service.create_user(user_data, role=UserRole.CUSTOMER)
    
    try:
        await email_service.send_welcome_email(user.email, user.username)
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
    
    return user


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_async_db)
):
    """Login user and return JWT tokens"""
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(login_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    tokens = auth_service.create_tokens(user)
    return tokens


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: TokenRefresh,
    db: AsyncSession = Depends(get_async_db)
):
    """Refresh access token using refresh token"""
    auth_service = AuthService(db)
    tokens = await auth_service.refresh_access_token(token_data.refresh_token)
    return tokens


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return current_user


@router.post("/change-password")
async def change_password(
    payload: ChangePassword,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Change password for the authenticated user"""
    auth_service = AuthService(db)

    # Validate that new password is not same as current
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )

    await auth_service.change_password(
        current_user,
        payload.current_password,
        payload.new_password
    )

    return {"message": "Password changed successfully"}


@router.post("/logout")
async def logout():
    """Logout user (client should discard tokens)"""
    return {"message": "Successfully logged out"}


@router.post("/password-reset", response_model=PasswordResetResponse)
async def request_password_reset(
    reset_data: PasswordReset,
    db: AsyncSession = Depends(get_async_db)
):
    """Request password reset"""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_email(reset_data.email)
    
    user_role = None
    if user:
        user_role = user.role
        # Generate reset token (valid for 1 hour)
        reset_token = auth_service.create_password_reset_token(user.uuid)
        
        # Send password reset email
        try:
            await email_service.send_password_reset_email(
                user.email, 
                user.username, 
                reset_token
            )
        except Exception as e:
            print(f"Failed to send password reset email: {e}")
    
    # Always return success message for security (don't reveal if email exists)
    # But include role if user exists for frontend routing purposes
    return PasswordResetResponse(
        message="If the email exists, a password reset link has been sent",
        role=user_role
    )


@router.post("/password-reset/confirm", response_model=PasswordResetConfirmResponse)
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_async_db)
):
    """Confirm password reset with token"""
    auth_service = AuthService(db)
    
    # First verify the token to get user info
    user = await auth_service.verify_password_reset_token(reset_data.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    success = await auth_service.reset_password(
        reset_data.token, 
        reset_data.new_password
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return PasswordResetConfirmResponse(
        message="Password reset successful",
        role=user.role
    )
