"""
Facebook OAuth Service for Lootamo E-commerce
============================================

Handles Facebook OAuth authentication flow and user data management.
"""

import httpx
import secrets
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.user import User, UserRole
from app.models.social_auth import SocialAccount, SocialProvider
from app.services.auth_service import AuthService
from app.services.account_linking import AccountLinkingService
from app.core.security import get_password_hash


class FacebookOAuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.auth_service = AuthService(db)
        self.account_linking_service = AccountLinkingService(db)
        
    async def get_facebook_user_info(self, access_token: str) -> Dict[str, Any]:
        print(f"Attempting to get Facebook user info with token: {access_token[:50]}...")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://graph.facebook.com/me",
                params={
                    "fields": "id,name,first_name,last_name,picture",
                    "access_token": access_token
                }
            )
            
            print(f"Facebook API response status: {response.status_code}")
            print(f"Facebook API response headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                print(f"Facebook API response body: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to get user info from Facebook: {response.text}"
                )
            
            user_data = response.json()
            print(f"Facebook user data received: {user_data}")
            return user_data
    
    async def authenticate_or_create_user(self, facebook_user_data: Dict[str, Any], access_token: str) -> User:
        """Authenticate existing user or create new user from Facebook data with enhanced account linking"""
        facebook_id = facebook_user_data.get("id")
        email = facebook_user_data.get("email")  
        name = facebook_user_data.get("name", "")
        first_name = facebook_user_data.get("first_name", "")
        last_name = facebook_user_data.get("last_name", "")
        picture_data = facebook_user_data.get("picture", {})
        picture_url = picture_data.get("data", {}).get("url") if isinstance(picture_data, dict) else None
        
        if not facebook_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Facebook user data - missing ID"
            )
        
        print(f"Processing Facebook authentication for ID: {facebook_id}, email: {email}")
        
        # Prepare provider data for account linking service
        provider_data = {
            'email': email,
            'name': name,
            'first_name': first_name,
            'last_name': last_name,
            'avatar_url': picture_url
        }
        
        # Only attempt account linking if we have a valid email (not placeholder)
        if email and not email.endswith('@example.com'):
            # Try to link to existing account
            user, is_new_link = await self.account_linking_service.link_social_account_to_existing_user(
                email=email,
                provider=SocialProvider.FACEBOOK,
                provider_id=facebook_id,
                provider_data=provider_data,
                access_token=access_token
            )
            
            if user:
                if is_new_link:
                    print(f"Successfully linked Facebook account to existing user: {email}")
                else:
                    print(f"Updated existing Facebook social account for user: {email}")
                return user
        
        # No existing user found or no valid email, create new user
        print(f"Creating new user from Facebook data: {facebook_id}")
        new_user = await self.create_user_from_facebook(
            facebook_id=facebook_id,
            email=email,
            name=name,
            first_name=first_name,
            last_name=last_name,
            picture_url=picture_url,
            access_token=access_token
        )
        
        return new_user
    
    async def create_user_from_facebook(
        self, 
        facebook_id: str, 
        email: Optional[str], 
        name: str,
        first_name: str,
        last_name: str,
        picture_url: Optional[str],
        access_token: str
    ) -> User:
        if not first_name and not last_name and name:
            name_parts = name.split(" ", 1) if name else ["", ""]
            first_name = name_parts[0] if len(name_parts) > 0 else ""
            last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        if email:
            username = email.split("@")[0]
        else:
            username = f"facebook_user_{facebook_id[:8]}"
        
        base_username = username
        counter = 1
        while await self.auth_service.get_user_by_username(username):
            username = f"{base_username}{counter}"
            counter += 1
        
        user_email = email if email else f"facebook_{facebook_id}@example.com"
        
        oauth_password = secrets.token_urlsafe(32)
        
        db_user = User(
            email=user_email,
            username=username,
            hashed_password=get_password_hash(oauth_password), 
            first_name=first_name,
            last_name=last_name,
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True, 
            avatar_url=picture_url
        )
        
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        
        await self.create_social_account(
            user=db_user,
            provider_id=facebook_id,
            email=email,
            name=name,
            avatar_url=picture_url,
            access_token=access_token
        )
        
        return db_user
    
    async def create_social_account(
        self,
        user: User,
        provider_id: str,
        email: Optional[str],
        name: str,
        avatar_url: Optional[str],
        access_token: str
    ) -> SocialAccount:
        """Create social account record"""
        social_account = SocialAccount(
            user_id=user.id,
            provider=SocialProvider.FACEBOOK,
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
                SocialAccount.provider == SocialProvider.FACEBOOK
            )
        )
        return result.scalar_one_or_none()
    
    async def unlink_facebook_account(self, user: User) -> bool:
        """Unlink Facebook account from user"""
        result = await self.db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == user.id,
                SocialAccount.provider == SocialProvider.FACEBOOK
            )
        )
        social_account = result.scalar_one_or_none()
        
        if social_account:
            await self.db.delete(social_account)
            await self.db.commit()
            return True
        
        return False
