"""
CSRF Protection Middleware for Lootamo E-commerce
===============================================

Implements CSRF protection for state-changing operations.
Uses double-submit cookie pattern with JWT tokens.
"""

import secrets
import hmac
import hashlib
from typing import Optional
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """CSRF Protection using double-submit cookie pattern"""
    
    def __init__(self, app, secret_key: str = None):
        super().__init__(app)
        self.secret_key = secret_key or settings.SECRET_KEY
        self.csrf_cookie_name = "csrf_token"
        self.csrf_header_name = "X-CSRF-Token"
        
    async def dispatch(self, request: Request, call_next):
        if self._should_skip_csrf(request):
            return await call_next(request)
        
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            if not self._validate_csrf_token(request):
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "CSRF token missing or invalid"}
                )
        
        response = await call_next(request)
        
        if request.method == "GET" and not request.cookies.get(self.csrf_cookie_name):
            csrf_token = self._generate_csrf_token()
            response.set_cookie(
                key=self.csrf_cookie_name,
                value=csrf_token,
                httponly=False, 
                secure=settings.ENVIRONMENT == "production",
                samesite="strict"
            )
        
        return response
    
    def _should_skip_csrf(self, request: Request) -> bool:
        """Determine if CSRF check should be skipped"""
        if request.method in ["GET", "HEAD", "OPTIONS", "TRACE"]:
            return True
        
        if request.url.path.startswith("/api/"):
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                return True
        
        skip_paths = [
            "/docs", "/redoc", "/openapi.json", "/health",
            "/api/v1/auth/login", "/api/v1/auth/register"
        ]
        
        return any(request.url.path.startswith(path) for path in skip_paths)
    
    def _generate_csrf_token(self) -> str:
        """Generate a new CSRF token"""
        random_bytes = secrets.token_bytes(32)
        return secrets.token_urlsafe(32)
    
    def _validate_csrf_token(self, request: Request) -> bool:
        """Validate CSRF token using double-submit pattern"""
        cookie_token = request.cookies.get(self.csrf_cookie_name)
        if not cookie_token:
            return False
        
        header_token = request.headers.get(self.csrf_header_name)
        
        if not header_token and hasattr(request, '_form'):
            form_data = getattr(request, '_form', {})
            header_token = form_data.get('csrf_token')
        
        if not header_token:
            return False
        
        return hmac.compare_digest(cookie_token, header_token)


def generate_csrf_token() -> str:
    """Generate CSRF token for manual use"""
    return secrets.token_urlsafe(32)


async def get_csrf_token(request: Request) -> str:
    """FastAPI dependency to get CSRF token"""
    token = request.cookies.get("csrf_token")
    if not token:
        token = generate_csrf_token()
    return token
