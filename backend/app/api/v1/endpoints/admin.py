from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_async_db
from app.services.auth_service import AuthService
from app.schemas.user import UserResponse
from app.api.dependencies import get_current_active_user
from app.models.user import User, UserRole
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from app.core.validators import validate_password

router = APIRouter()


class AdminUserCreate(BaseModel):
    """Schema for admin-only user creation"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = Field(..., description="User role (admin, manager, supplier)")
    
    @validator('password')
    def validate_password_strength(cls, v):
        return validate_password(v)
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username must contain only letters, numbers, hyphens, and underscores')
        return v


class AdminChangePassword(BaseModel):
    """Schema for admin password change"""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        return validate_password(v)
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


def require_admin_role(current_user: User = Depends(get_current_active_user)):
    """Dependency to ensure only admins can access certain endpoints"""
    if current_user.role != UserRole.ADMIN and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_admin_or_manager_role(current_user: User = Depends(get_current_active_user)):
    """Dependency for admin or manager access"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER] and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Manager access required"
        )
    return current_user

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(
    user_data: AdminUserCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_admin_role)
):
    """Create user with specific role (Admin only)"""
    if user_data.role == UserRole.ADMIN and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superuser can create admin accounts"
        )
    
    from app.schemas.user import UserCreate
    user_create_data = UserCreate(
        email=user_data.email,
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        password=user_data.password,
        confirm_password=user_data.password  
    )
    
    auth_service = AuthService(db)
    user = await auth_service.create_user(user_create_data, role=user_data.role)
    
    return user

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_admin_or_manager_role)
):
    """Get all users (Admin/Manager only)"""
    auth_service = AuthService(db)
    users = await auth_service.get_all_users()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_admin_or_manager_role)
):
    """Get user by ID (Admin/Manager only)"""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    new_role: UserRole,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_admin_role)
):
    """Update user role (Admin only)"""
    if new_role == UserRole.ADMIN and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superuser can assign admin role"
        )
    
    auth_service = AuthService(db)
    user = await auth_service.update_user_role(user_id, new_role)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": f"User role updated to {new_role}", "user_id": user_id}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_admin_role)
):
    """Delete user (Admin only)"""
    auth_service = AuthService(db)
    target_user = await auth_service.get_user_by_id(user_id)
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if target_user.role == UserRole.ADMIN and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superuser can delete admin accounts"
        )
    
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    success = await auth_service.delete_user(user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete user"
        )
    
    return {"message": "User deleted successfully", "user_id": user_id}


@router.post("/change-password")
async def admin_change_password(
    payload: AdminChangePassword,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Change password for authenticated admin user"""
    # Validate that new password is different from current
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )

    auth_service = AuthService(db)
    
    try:
        await auth_service.change_password(
            current_user,
            payload.current_password,
            payload.new_password
        )
        
        return {"message": "Password changed successfully"}
    
    except HTTPException as e:
        # Re-raise HTTP exceptions from auth service
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )
