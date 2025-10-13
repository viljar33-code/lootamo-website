"""
Global error logging middleware for automatic error capture
"""
import traceback
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import SQLAlchemyError
from app.services.error_log_service import ErrorLogService
from app.core.database import SessionLocal
import logging

logger = logging.getLogger(__name__)


class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to automatically log all unhandled errors"""
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except HTTPException as http_exc:
            # Don't log expected HTTP exceptions (4xx client errors)
            if http_exc.status_code >= 500:
                await self._log_error(
                    exception=http_exc,
                    error_type="HTTP_SERVER_ERROR",
                    request=request,
                    severity="error"
                )
            raise http_exc
        except SQLAlchemyError as db_exc:
            # Log database errors as critical
            await self._log_error(
                exception=db_exc,
                error_type="DATABASE_ERROR",
                request=request,
                severity="critical"
            )
            return JSONResponse(
                status_code=500,
                content={"detail": "Database error occurred"}
            )
        except Exception as exc:
            # Log all other unhandled exceptions
            await self._log_error(
                exception=exc,
                error_type="UNHANDLED_EXCEPTION",
                request=request,
                severity="critical"
            )
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
    
    async def _log_error(self, exception: Exception, error_type: str, request: Request, severity: str):
        """Log error to the error logging system"""
        try:
            db = SessionLocal()
            try:
                # Extract request context
                error_context = {
                    "method": request.method,
                    "url": str(request.url),
                    "path": request.url.path,
                    "query_params": dict(request.query_params),
                    "client_host": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent"),
                    "content_type": request.headers.get("content-type")
                }
                
                # Add user ID if available
                if hasattr(request.state, 'user_id'):
                    error_context["user_id"] = request.state.user_id
                
                ErrorLogService.log_exception(
                    db=db,
                    exception=exception,
                    error_type=error_type,
                    source_system="api",
                    source_function=f"{request.method} {request.url.path}",
                    error_context=error_context,
                    severity=severity
                )
            finally:
                db.close()
        except Exception as log_error:
            # Don't let logging errors break the application
            logger.error(f"Failed to log error to database: {log_error}")
