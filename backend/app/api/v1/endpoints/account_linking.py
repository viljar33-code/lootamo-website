"""
Account Linking API Endpoints
============================

Provides endpoints for users to manage their linked social accounts.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.services.account_linking import AccountLinkingService
from app.models.social_auth import SocialProvider
from app.api.dependencies import get_current_active_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()


class UnlinkAccountRequest(BaseModel):
    provider: str


@router.get("/linked-accounts")
async def get_linked_accounts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get information about user's linked accounts"""
    account_linking_service = AccountLinkingService(db)
    
    account_info = await account_linking_service.get_account_linking_info(current_user)
    
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "has_password": account_info["has_password"],
        "linked_providers": account_info["linked_providers"],
        "total_auth_methods": account_info["total_auth_methods"]
    }


@router.delete("/unlink/{provider}")
async def unlink_social_account(
    provider: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Unlink a social account from the current user"""
    account_linking_service = AccountLinkingService(db)
    
    # Validate provider
    try:
        social_provider = SocialProvider(provider.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider: {provider}. Supported providers: google, facebook"
        )
    
    # Check if account can be safely unlinked
    can_unlink = await account_linking_service.can_unlink_social_account(
        current_user, social_provider
    )
    
    if not can_unlink:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot unlink this account. You must have at least one authentication method (password or another social account)."
        )
    
    # Attempt to unlink
    success = await account_linking_service.unlink_social_account(
        current_user, social_provider
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No {provider} account linked to this user"
        )
    
    return {
        "message": f"{provider.title()} account unlinked successfully",
        "provider": provider
    }


@router.get("/linking-status")
async def get_account_linking_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get detailed account linking status for the current user"""
    account_linking_service = AccountLinkingService(db)
    
    # Get all social accounts
    social_accounts = await account_linking_service.get_user_social_accounts(current_user.id)
    
    # Build provider status
    provider_status = {}
    for provider in SocialProvider:
        linked_account = next(
            (acc for acc in social_accounts if acc.provider == provider), 
            None
        )
        
        if linked_account:
            provider_status[provider.value] = {
                "linked": True,
                "email": linked_account.email,
                "name": linked_account.name,
                "linked_at": linked_account.created_at.isoformat() if linked_account.created_at else None,
                "can_unlink": await account_linking_service.can_unlink_social_account(
                    current_user, provider
                )
            }
        else:
            provider_status[provider.value] = {
                "linked": False,
                "can_unlink": False
            }
    
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "has_password": bool(current_user.hashed_password),
        "providers": provider_status,
        "total_linked_accounts": len(social_accounts),
        "total_auth_methods": len(social_accounts) + (1 if current_user.hashed_password else 0)
    }
