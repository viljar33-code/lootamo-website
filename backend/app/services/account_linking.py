"""
Account Linking Service for Lootamo E-commerce
=============================================

Handles account linking when users authenticate with the same email
through different providers (email/password, Google, Facebook).
"""

import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.models.social_auth import SocialAccount, SocialProvider
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)


class AccountLinkingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.auth_service = AuthService(db)

    async def link_social_account_to_existing_user(
        self,
        email: str,
        provider: SocialProvider,
        provider_id: str,
        provider_data: Dict[str, Any],
        access_token: str
    ) -> tuple[User, bool]:
        """
        Link a social account to an existing user account.
        
        Returns:
            tuple: (User object, is_new_link: bool)
            - User: The linked user account
            - is_new_link: True if this is a new link, False if updating existing link
        """
        logger.info(f"Attempting to link {provider.value} account for email: {email}")
        
        existing_social_account = await self.get_social_account_by_provider_id(provider_id, provider)
        
        if existing_social_account:
            logger.info(f"Updating existing {provider.value} social account for user_id: {existing_social_account.user_id}")
            # Update existing social account
            existing_social_account.access_token = access_token
            existing_social_account.email = email
            existing_social_account.name = provider_data.get('name', '')
            existing_social_account.avatar_url = provider_data.get('avatar_url')
            
            await self.db.commit()
            await self.db.refresh(existing_social_account)
            
            user = await self.auth_service.get_user_by_id(existing_social_account.user_id)
            return user, False
        
        existing_user = await self.auth_service.get_user_by_email(email)
        
        if not existing_user:
            logger.info(f"No existing user found for email: {email}")
            return None, False
        
        existing_provider_link = await self.get_social_account_by_user_and_provider(
            existing_user.id, provider
        )
        
        if existing_provider_link:
            logger.warning(f"User {existing_user.id} already has {provider.value} account linked")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This user already has a {provider.value} account linked"
            )
        
        logger.info(f"Linking {provider.value} account to existing user_id: {existing_user.id}")
        social_account = await self.create_social_account_link(
            user=existing_user,
            provider=provider,
            provider_id=provider_id,
            provider_data=provider_data,
            access_token=access_token
        )
        
        await self.update_user_profile_from_social_data(existing_user, provider_data)
        
        logger.info(f"Successfully linked {provider.value} account to user {existing_user.email}")
        return existing_user, True

    async def create_social_account_link(
        self,
        user: User,
        provider: SocialProvider,
        provider_id: str,
        provider_data: Dict[str, Any],
        access_token: str
    ) -> SocialAccount:
        """Create a new social account link for an existing user"""
        social_account = SocialAccount(
            user_id=user.id,
            provider=provider,
            provider_id=provider_id,
            email=provider_data.get('email'),
            name=provider_data.get('name', ''),
            avatar_url=provider_data.get('avatar_url'),
            access_token=access_token
        )
        
        self.db.add(social_account)
        await self.db.commit()
        await self.db.refresh(social_account)
        
        return social_account

    async def update_user_profile_from_social_data(
        self,
        user: User,
        provider_data: Dict[str, Any]
    ) -> None:
        """Update user profile with data from social provider if fields are missing"""
        updated = False
        
        if not user.avatar_url and provider_data.get('avatar_url'):
            user.avatar_url = provider_data['avatar_url']
            updated = True
            logger.info(f"Updated avatar for user {user.id}")
        
        if not user.first_name and provider_data.get('first_name'):
            user.first_name = provider_data['first_name']
            updated = True
            logger.info(f"Updated first_name for user {user.id}")
        
        if not user.last_name and provider_data.get('last_name'):
            user.last_name = provider_data['last_name']
            updated = True
            logger.info(f"Updated last_name for user {user.id}")
        
        if updated:
            await self.db.commit()
            await self.db.refresh(user)

    async def get_social_account_by_provider_id(
        self,
        provider_id: str,
        provider: SocialProvider
    ) -> Optional[SocialAccount]:
        """Get social account by provider ID and provider type"""
        result = await self.db.execute(
            select(SocialAccount).where(
                SocialAccount.provider_id == provider_id,
                SocialAccount.provider == provider
            )
        )
        return result.scalar_one_or_none()

    async def get_social_account_by_user_and_provider(
        self,
        user_id: int,
        provider: SocialProvider
    ) -> Optional[SocialAccount]:
        """Get social account by user ID and provider type"""
        result = await self.db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == user_id,
                SocialAccount.provider == provider
            )
        )
        return result.scalar_one_or_none()

    async def get_user_social_accounts(self, user_id: int) -> List[SocialAccount]:
        """Get all social accounts for a user"""
        result = await self.db.execute(
            select(SocialAccount).where(SocialAccount.user_id == user_id)
        )
        return result.scalars().all()

    async def unlink_social_account(
        self,
        user: User,
        provider: SocialProvider
    ) -> bool:
        """Unlink a social account from user"""
        social_account = await self.get_social_account_by_user_and_provider(
            user.id, provider
        )
        
        if not social_account:
            return False
        
        await self.db.delete(social_account)
        await self.db.commit()
        
        logger.info(f"Unlinked {provider.value} account from user {user.id}")
        return True

    async def can_unlink_social_account(self, user: User, provider: SocialProvider) -> bool:
        """
        Check if a social account can be safely unlinked.
        User must have either a password or at least one other social account.
        """
        if user.hashed_password:
            return True
        
        social_accounts = await self.get_user_social_accounts(user.id)
        other_accounts = [acc for acc in social_accounts if acc.provider != provider]
        
        return len(other_accounts) > 0

    async def get_account_linking_info(self, user: User) -> Dict[str, Any]:
        """Get information about user's linked accounts"""
        social_accounts = await self.get_user_social_accounts(user.id)
        
        linked_providers = {}
        for account in social_accounts:
            linked_providers[account.provider.value] = {
                'email': account.email,
                'name': account.name,
                'linked_at': account.created_at.isoformat() if account.created_at else None
            }
        
        return {
            'has_password': bool(user.hashed_password),
            'linked_providers': linked_providers,
            'total_auth_methods': len(social_accounts) + (1 if user.hashed_password else 0)
        }
