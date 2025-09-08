"""
Google OAuth Authentication Endpoints
====================================

Handles Google OAuth login flow for Lootamo e-commerce platform.
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
from app.services.google_oauth import GoogleOAuthService
from app.services.auth_service import AuthService
from app.schemas.user import UserResponse, Token
from app.api.dependencies import get_current_active_user
from app.models.social_auth import SocialAccount, SocialProvider
from pydantic import BaseModel

router = APIRouter()


oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    access_token_url='https://oauth2.googleapis.com/token',
    userinfo_endpoint='https://www.googleapis.com/oauth2/v2/userinfo',
    client_kwargs={
        'scope': 'email profile'
    }
)

class GoogleAuthRequest(BaseModel):
    access_token: str

@router.get("/google/login")
async def google_login(request: Request):
    """
    Initiate Google OAuth login
    
    **Note**: This endpoint redirects to Google's OAuth server.
    - In Swagger UI: Will show "Failed to fetch" (this is normal)
    - In browser: Navigate directly to this URL to start OAuth flow
    - Returns: HTTP 307 redirect to Google's consent screen
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )

    state = secrets.token_urlsafe(32)
    request.session['oauth_state'] = state
    
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(
        request, 
        redirect_uri,
        state=state
    )

@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Handle Google OAuth callback
    
    **Note**: This endpoint is called by Google after user consent.
    - Don't test directly in Swagger UI
    - Returns: JSON with access_token, refresh_token, and user data
    """
    try:
        received_state = request.query_params.get('state')
        stored_state = request.session.get('oauth_state')
        
        if not received_state:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="State parameter missing from callback"
            )
        
        if not stored_state:
            print("Warning: No stored state found in session, proceeding without state validation")
        elif received_state != stored_state:
            print(f"State mismatch - received: {received_state}, stored: {stored_state}")
            if settings.DEBUG:
                print("DEBUG mode: Proceeding despite state mismatch")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid state parameter - possible CSRF attack"
                )
        
        code = request.query_params.get('code')
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization code not found"
            )
        
        import httpx
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'client_id': settings.GOOGLE_CLIENT_ID,
                    'client_secret': settings.GOOGLE_CLIENT_SECRET,
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': settings.GOOGLE_REDIRECT_URI,
                }
            )
            
            print(f"Token response status: {token_response.status_code}")
            print(f"Token response: {token_response.text}")
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to exchange code for token: {token_response.text}"
                )
            
            token = token_response.json()
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get access token from Google"
            )
        
        print(f"Token received: {token.get('access_token', 'No access token')[:50]}...")
        

        google_oauth_service = GoogleOAuthService(db)
        google_user_data = await google_oauth_service.get_google_user_info(token['access_token'])
        
        user = await google_oauth_service.authenticate_or_create_user(
            google_user_data, 
            token['access_token']
        )
        
        auth_service = AuthService(db)
        tokens = auth_service.create_tokens(user)
        
        request.session.pop('oauth_state', None)
        
        return {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "token_type": "bearer",
            "google_access_token": token['access_token'],  # Include Google's access token
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"Google callback error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.post("/google/token", response_model=Token)
async def google_token_auth(
    auth_request: GoogleAuthRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """Authenticate with Google access token (for mobile/SPA)"""
    try:
        
        if auth_request.access_token.startswith('eyJ'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token format. This endpoint expects a Google OAuth access token, not a JWT token. Use the /google/login endpoint for web-based OAuth flow."
            )
        
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            print("Google OAuth not configured")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth not configured"
            )
        
        google_oauth_service = GoogleOAuthService(db)
        
        print("Getting Google user info...")
        google_user_data = await google_oauth_service.get_google_user_info(auth_request.access_token)
        print(f"Google user data: {google_user_data}")
        
        user = await google_oauth_service.authenticate_or_create_user(
            google_user_data,
            auth_request.access_token
        )
        
        auth_service = AuthService(db)
        tokens = auth_service.create_tokens(user)
        
        return {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "token_type": "bearer",
            "expires_in": tokens["expires_in"],
            # "google_access_token": auth_request.access_token  # Include Google's access token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Google token auth error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.delete("/google/unlink")
async def unlink_google_account(
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Unlink Google account from current user"""
    google_oauth_service = GoogleOAuthService(db)
    
    success = await google_oauth_service.unlink_google_account(current_user)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Google account linked to this user"
        )
    
    return {"message": "Google account unlinked successfully"}

@router.get("/google/status")
async def google_auth_status(
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Check if user has Google account linked"""
    google_oauth_service = GoogleOAuthService(db)
    
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.provider == SocialProvider.GOOGLE
        )
    )
    social_account = result.scalar_one_or_none()
    
    return {
        "google_linked": social_account is not None,
        "google_email": social_account.email if social_account else None
    }
