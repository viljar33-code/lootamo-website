from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from datetime import datetime, timedelta

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from app.core.config import settings


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, user_data: UserCreate, role: UserRole = UserRole.CUSTOMER) -> User:
        """Create a new user"""
        existing_user = await self.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        existing_username = await self.get_user_by_username(user_data.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            role=role,
        )
        
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user

    async def get_all_users(self) -> List[User]:
        """Get all users (admin only)"""
        from sqlalchemy import select
        result = await self.db.execute(select(User))
        return result.scalars().all()

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        from sqlalchemy import select
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def update_user_role(self, user_id: int, new_role: UserRole) -> Optional[User]:
        """Update user role"""
        user = await self.get_user_by_id(user_id)
        if user:
            user.role = new_role
            await self.db.commit()
            await self.db.refresh(user)
        return user

    async def delete_user(self, user_id: int) -> bool:
        """Delete user"""
        user = await self.get_user_by_id(user_id)
        if user:
            await self.db.delete(user)
            await self.db.commit()
            return True
        return False

    async def authenticate_user(self, login_data: UserLogin) -> Optional[User]:
        """Authenticate user with email/username and password"""
        user = await self.get_user_by_email(login_data.email_or_username)
        if not user:
            user = await self.get_user_by_username(login_data.email_or_username)
        
        if not user:
            return None
        
        if not verify_password(login_data.password, user.hashed_password):
            return None
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is deactivated"
            )
        
        user.last_login = datetime.utcnow()
        await self.db.commit()
        
        return user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_uuid(self, uuid: str) -> Optional[User]:
        """Get user by UUID"""
        result = await self.db.execute(select(User).where(User.uuid == uuid))
        return result.scalar_one_or_none()

    def create_tokens(self, user: User) -> dict:
        """Create access and refresh tokens for user"""
        access_token = create_access_token(subject=user.uuid)
        refresh_token = create_refresh_token(subject=user.uuid)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    async def refresh_access_token(self, refresh_token: str) -> dict:
        """Create new access token from refresh token"""
        user_uuid = verify_token(refresh_token, token_type="refresh")
        if not user_uuid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user = await self.get_user_by_uuid(user_uuid)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        return self.create_tokens(user)

    def create_password_reset_token(self, user_uuid: str) -> str:
        """Create password reset token (valid for 1 hour)"""
        expires_delta = timedelta(hours=1)
        return create_access_token(subject=user_uuid, expires_delta=expires_delta)

    async def verify_password_reset_token(self, token: str) -> Optional[User]:
        """Verify password reset token and return user"""
        user_uuid = verify_token(token, token_type="access")
        if not user_uuid:
            return None
        
        user = await self.get_user_by_uuid(user_uuid)
        return user if user and user.is_active else None

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset user password with token"""
        user = await self.verify_password_reset_token(token)
        if not user:
            return False
        
        user.hashed_password = get_password_hash(new_password)
        await self.db.commit()
        return True
