"""
Google OAuth Service for Lootamo E-commerce
==========================================

Handles Google OAuth authentication flow and user data management.
"""

import httpx
import secrets
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from authlib.integrations.starlette_client import OAuth
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.user import User, UserRole
from app.models.social_auth import SocialAccount, SocialProvider
from app.services.auth_service import AuthService
from app.services.account_linking import AccountLinkingService
from app.core.security import get_password_hash


class GoogleOAuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.auth_service = AuthService(db)
        self.account_linking_service = AccountLinkingService(db)
        
    async def get_google_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from Google using access token"""
        print(f"Attempting to get Google user info with token: {access_token[:50]}...")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            print(f"Google API response status: {response.status_code}")
            print(f"Google API response headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                print(f"Google API response body: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to get user info from Google: {response.text}"
                )
            
            user_data = response.json()
            print(f"Google user data received: {user_data}")
            return user_data
    
    async def authenticate_or_create_user(self, google_user_data: Dict[str, Any], access_token: str) -> User:
        """Authenticate existing user or create new user from Google data with enhanced account linking"""
        google_id = google_user_data.get("id")
        email = google_user_data.get("email")
        name = google_user_data.get("name", "")
        picture = google_user_data.get("picture")
        
        if not google_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Google user data"
            )
        
        print(f"Processing Google authentication for email: {email}")
        
        # Prepare provider data for account linking service
        provider_data = {
            'email': email,
            'name': name,
            'first_name': name.split(' ')[0] if name else '',
            'last_name': ' '.join(name.split(' ')[1:]) if name and len(name.split(' ')) > 1 else '',
            'avatar_url': picture
        }
        
        # Try to link to existing account
        user, is_new_link = await self.account_linking_service.link_social_account_to_existing_user(
            email=email,
            provider=SocialProvider.GOOGLE,
            provider_id=google_id,
            provider_data=provider_data,
            access_token=access_token
        )
        
        if user:
            if is_new_link:
                print(f"Successfully linked Google account to existing user: {email}")
            else:
                print(f"Updated existing Google social account for user: {email}")
            return user
        
        # No existing user found, create new user
        print(f"Creating new user from Google data: {email}")
        new_user = await self.create_user_from_google(
            google_id=google_id,
            email=email,
            name=name,
            picture=picture,
            access_token=access_token
        )
        
        return new_user
    
    async def create_user_from_google(
        self, 
        google_id: str, 
        email: str, 
        name: str, 
        picture: Optional[str],
        access_token: str
    ) -> User:
        """Create new user from Google OAuth data"""
        name_parts = name.split(" ", 1) if name else ["", ""]
        first_name = name_parts[0] if len(name_parts) > 0 else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        
    
        username = email.split("@")[0]
        
        base_username = username
        counter = 1
        while await self.auth_service.get_user_by_username(username):
            username = f"{base_username}{counter}"
            counter += 1
        
        oauth_password = secrets.token_urlsafe(32)
        
        db_user = User(
            email=email,
            username=username,
            hashed_password=get_password_hash(oauth_password), 
            first_name=first_name,
            last_name=last_name,
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True,  
            avatar_url=picture
        )
        
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        
    
        await self.create_social_account(
            user=db_user,
            provider_id=google_id,
            email=email,
            name=name,
            avatar_url=picture,
            access_token=access_token
        )
        
        return db_user
    
    async def create_social_account(
        self,
        user: User,
        provider_id: str,
        email: str,
        name: str,
        avatar_url: Optional[str],
        access_token: str
    ) -> SocialAccount:
        """Create social account record"""
        social_account = SocialAccount(
            user_id=user.id,
            provider=SocialProvider.GOOGLE,
            provider_id=provider_id,
            email=email,
            name=name,
            avatar_url=avatar_url,
            access_token=access_token
        )
        
        self.db.add(social_account)
        await self.db.commit()
        await self.db.refresh(social_account)
        
        return social_account
    
    async def get_social_account_by_provider_id(self, provider_id: str) -> Optional[SocialAccount]:
        """Get social account by provider ID"""
        result = await self.db.execute(
            select(SocialAccount).where(
                SocialAccount.provider_id == provider_id,
                SocialAccount.provider == SocialProvider.GOOGLE
            )
        )
        return result.scalar_one_or_none()
    
    async def unlink_google_account(self, user: User) -> bool:
        """Unlink Google account from user"""
        result = await self.db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == user.id,
                SocialAccount.provider == SocialProvider.GOOGLE
            )
        )
        social_account = result.scalar_one_or_none()
        
        if social_account:
            await self.db.delete(social_account)
            await self.db.commit()
            return True
        
        return False
