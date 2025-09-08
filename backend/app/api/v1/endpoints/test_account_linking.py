"""
Test Account Linking Endpoints
=============================

Test endpoints to verify account linking functionality without real OAuth tokens.
These endpoints should only be used in development/testing environments.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_async_db
from app.services.account_linking import AccountLinkingService
from app.services.google_oauth import GoogleOAuthService
from app.services.facebook_oauth import FacebookOAuthService
from app.models.social_auth import SocialProvider
from app.core.config import settings

router = APIRouter()


class TestGoogleLinkRequest(BaseModel):
    email: str
    google_id: str = "test_google_123"
    name: str = "Test Google User"
    picture: str = "https://example.com/avatar.jpg"


class TestFacebookLinkRequest(BaseModel):
    email: str
    facebook_id: str = "test_facebook_456"
    name: str = "Test Facebook User"
    first_name: str = "Test"
    last_name: str = "Facebook"


@router.post("/test-google-linking")
async def test_google_account_linking(
    request: TestGoogleLinkRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Test Google account linking with mock data.
    Use this to test if account linking works without real Google OAuth.
    """
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Test endpoints only available in DEBUG mode"
        )
    
    # Simulate Google user data
    google_user_data = {
        "id": request.google_id,
        "email": request.email,
        "name": request.name,
        "picture": request.picture
    }
    
    google_service = GoogleOAuthService(db)
    
    try:
        user = await google_service.authenticate_or_create_user(
            google_user_data, 
            "test_access_token"
        )
        
        # Get linking info
        account_linking_service = AccountLinkingService(db)
        linking_info = await account_linking_service.get_account_linking_info(user)
        
        return {
            "message": "Google account linking test completed",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name
            },
            "linking_info": linking_info,
            "test_scenario": "google_linking"
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "message": "Account linking test failed",
            "test_scenario": "google_linking"
        }


@router.post("/test-facebook-linking")
async def test_facebook_account_linking(
    request: TestFacebookLinkRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Test Facebook account linking with mock data.
    Use this to test if account linking works without real Facebook OAuth.
    """
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Test endpoints only available in DEBUG mode"
        )
    
    # Simulate Facebook user data
    facebook_user_data = {
        "id": request.facebook_id,
        "email": request.email,
        "name": request.name,
        "first_name": request.first_name,
        "last_name": request.last_name,
        "picture": {
            "data": {
                "url": "https://example.com/facebook_avatar.jpg"
            }
        }
    }
    
    facebook_service = FacebookOAuthService(db)
    
    try:
        user = await facebook_service.authenticate_or_create_user(
            facebook_user_data, 
            "test_access_token"
        )
        
        # Get linking info
        account_linking_service = AccountLinkingService(db)
        linking_info = await account_linking_service.get_account_linking_info(user)
        
        return {
            "message": "Facebook account linking test completed",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name
            },
            "linking_info": linking_info,
            "test_scenario": "facebook_linking"
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "message": "Account linking test failed",
            "test_scenario": "facebook_linking"
        }


@router.get("/test-scenarios")
async def get_test_scenarios():
    """Get available test scenarios for account linking"""
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Test endpoints only available in DEBUG mode"
        )
    
    return {
        "available_scenarios": [
            {
                "name": "Basic Account Linking Test",
                "steps": [
                    "1. Create a user with /auth/register using email: test@example.com",
                    "2. Use /test-account-linking/test-google-linking with same email",
                    "3. Check /account-linking/linked-accounts to see if accounts are linked",
                    "4. Use /test-account-linking/test-facebook-linking with same email",
                    "5. Check /account-linking/linking-status for complete status"
                ]
            },
            {
                "name": "Duplicate Prevention Test",
                "steps": [
                    "1. Use /test-account-linking/test-google-linking with new email",
                    "2. Use /test-account-linking/test-google-linking again with same email",
                    "3. Verify no duplicate users are created"
                ]
            }
        ],
        "test_endpoints": [
            "/test-account-linking/test-google-linking",
            "/test-account-linking/test-facebook-linking",
            "/account-linking/linked-accounts",
            "/account-linking/linking-status"
        ]
    }
