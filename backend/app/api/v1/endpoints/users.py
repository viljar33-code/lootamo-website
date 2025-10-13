from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_async_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserOrderStatistics
from app.api.dependencies import get_current_active_user, require_admin, require_manager_or_admin
from app.services.order_service import OrderService

router = APIRouter()


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user profile"""
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update current user profile"""
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/profile")
async def delete_own_account(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete the currently authenticated user's account"""
    try:
        await db.delete(current_user)
        await db.commit()
        return {"message": "Account deleted successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        ) from e


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_manager_or_admin),
    db: AsyncSession = Depends(get_async_db)
):
    """List all users (manager/admin only)"""
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(require_manager_or_admin),
    db: AsyncSession = Depends(get_async_db)
):
    """Get user by ID (manager/admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_db)
):
    """Deactivate user (admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    await db.commit()
    
    return {"message": f"User {user.email} deactivated successfully"}


@router.put("/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_async_db)
):
    """Activate user (admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    await db.commit()
    
    return {"message": f"User {user.email} activated successfully"}


@router.get("/{user_id}/order-statistics", response_model=UserOrderStatistics)
async def get_user_order_statistics(
    user_id: int,
    current_user: User = Depends(require_manager_or_admin),
    db: AsyncSession = Depends(get_async_db)
):
    """Get user order statistics (manager/admin only)"""
    # First verify the user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get order statistics using synchronous session
    # Note: We need to use a synchronous session for the OrderService
    from app.core.database import get_db
    from sqlalchemy.orm import Session
    
    # Create a synchronous session for the OrderService
    sync_db = next(get_db())
    try:
        stats = OrderService.get_user_order_statistics(sync_db, user_id)
        return UserOrderStatistics(**stats)
    finally:
        sync_db.close()
