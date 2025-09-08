"""
Facebook OAuth Authentication Endpoints
=======================================

Handles Facebook OAuth login flow for Lootamo e-commerce platform.
"""

import secrets
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from authlib.integrations.starlette_client import OAuth
from authlib.common.errors import AuthlibBaseError

from app.core.database import get_async_db
from app.core.config import settings
from app.services.facebook_oauth import FacebookOAuthService
from app.services.auth_service import AuthService
from app.schemas.user import UserResponse, Token
from app.api.dependencies import get_current_active_user
from app.models.social_auth import SocialAccount, SocialProvider
from pydantic import BaseModel

router = APIRouter()

# OAuth configuration
oauth = OAuth()
oauth.register(
    name='facebook',
    client_id=settings.FACEBOOK_CLIENT_ID,
    client_secret=settings.FACEBOOK_CLIENT_SECRET,
    authorize_url='https://www.facebook.com/dialog/oauth',
    access_token_url='https://graph.facebook.com/oauth/access_token',
    userinfo_endpoint='https://graph.facebook.com/me',
    client_kwargs={
        'scope': 'public_profile'
    }
)

class FacebookAuthRequest(BaseModel):
    access_token: str

@router.get("/facebook/login")
async def facebook_login(request: Request):
    """
    Initiate Facebook OAuth login
    
    **Note**: This endpoint redirects to Facebook's OAuth server.
    - In Swagger UI: Will show "Failed to fetch" (this is normal)
    - In browser: Navigate directly to this URL to start OAuth flow
    - Returns: HTTP 307 redirect to Facebook's consent screen
    """
    
    if not settings.FACEBOOK_CLIENT_ID or not settings.FACEBOOK_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Facebook OAuth not configured. Please add FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET to your .env file"
        )
    
    redirect_uri = settings.FACEBOOK_REDIRECT_URI
    print(f"Facebook redirect URI: {redirect_uri}")
    return await oauth.facebook.authorize_redirect(request, redirect_uri)

@router.get("/facebook/callback")
async def facebook_callback(
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Handle Facebook OAuth callback
    
    **Note**: This endpoint is called by Facebook after user consent.
    - Don't test directly in Swagger UI
    - Returns: JSON with access_token, refresh_token, facebook_access_token, and user data
    """
    try:
        
        code = request.query_params.get('code')
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization code not found"
            )
        
        import httpx
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                'https://graph.facebook.com/oauth/access_token',
                data={
                    'client_id': settings.FACEBOOK_CLIENT_ID,
                    'client_secret': settings.FACEBOOK_CLIENT_SECRET,
                    'code': code,
                    'redirect_uri': settings.FACEBOOK_REDIRECT_URI,
                }
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange code for token"
                )
            
            token = token_response.json()
        
        if not token or 'access_token' not in token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get access token from Facebook"
            )
        
        facebook_oauth_service = FacebookOAuthService(db)
        facebook_user_data = await facebook_oauth_service.get_facebook_user_info(token['access_token'])
        
        user = await facebook_oauth_service.authenticate_or_create_user(
            facebook_user_data, 
            token['access_token']
        )
        
        auth_service = AuthService(db)
        tokens = auth_service.create_tokens(user)
        

        request.session.pop('oauth_state', None)
        
        return {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "token_type": "bearer",
            "expires_in": tokens["expires_in"],
            "facebook_access_token": token['access_token'],  # Include Facebook's access token
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "avatar_url": user.avatar_url
            }
        }
        
    except AuthlibBaseError as e:
        print(f"OAuth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {str(e)}"
        )
    except Exception as e:
        print(f"Facebook callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.post("/facebook/token", response_model=Token)
async def facebook_token_auth(
    auth_request: FacebookAuthRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """Authenticate with Facebook access token (for mobile/SPA)"""
    try:
        
        if auth_request.access_token.startswith('eyJ'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token format. This endpoint expects a Facebook OAuth access token, not a JWT token. Use the /facebook/login endpoint for web-based OAuth flow."
            )
        
        if not settings.FACEBOOK_CLIENT_ID or not settings.FACEBOOK_CLIENT_SECRET:
            print("Facebook OAuth not configured")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Facebook OAuth not configured"
            )
        
        facebook_oauth_service = FacebookOAuthService(db)
        
        facebook_user_data = await facebook_oauth_service.get_facebook_user_info(auth_request.access_token)
        
        user = await facebook_oauth_service.authenticate_or_create_user(
            facebook_user_data,
            auth_request.access_token
        )
        
        auth_service = AuthService(db)
        tokens = auth_service.create_tokens(user)
        
        return {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "token_type": "bearer",
            "expires_in": tokens["expires_in"],
            "facebook_access_token": auth_request.access_token  # Include Facebook's access token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.delete("/facebook/unlink")
async def unlink_facebook_account(
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Unlink Facebook account from current user"""
    facebook_oauth_service = FacebookOAuthService(db)
    
    success = await facebook_oauth_service.unlink_facebook_account(current_user)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Facebook account linked to this user"
        )
    
    return {"message": "Facebook account unlinked successfully"}

@router.get("/facebook/status")
async def facebook_auth_status(
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Check if user has Facebook account linked"""
    facebook_oauth_service = FacebookOAuthService(db)
    
    
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.provider == SocialProvider.FACEBOOK
        )
    )
    social_account = result.scalar_one_or_none()
    
    return {
        "facebook_linked": social_account is not None,
        "facebook_email": social_account.email if social_account else None
    }
