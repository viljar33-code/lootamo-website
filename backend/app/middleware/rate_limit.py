import time
from typing import Dict, Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import redis.asyncio as redis

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_client: Optional[redis.Redis] = None):
        super().__init__(app)
        self.redis_client = redis_client
        self.memory_store: Dict[str, Dict[str, float]] = {}
        self.rate_limit = settings.RATE_LIMIT_PER_MINUTE
        self.window_size = 60  

    async def dispatch(self, request: Request, call_next):
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        current_time = time.time()

        if await self._is_rate_limited(client_ip, current_time):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )

        response = await call_next(request)
        return response

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def _is_rate_limited(self, client_ip: str, current_time: float) -> bool:
        """Check if client is rate limited"""
        if self.redis_client:
            return await self._redis_rate_limit(client_ip, current_time)
        else:
            return self._memory_rate_limit(client_ip, current_time)

    async def _redis_rate_limit(self, client_ip: str, current_time: float) -> bool:
        """Redis-based rate limiting"""
        key = f"rate_limit:{client_ip}"
        window_start = int(current_time // self.window_size) * self.window_size
        
        try:
            pipe = self.redis_client.pipeline()
            pipe.zremrangebyscore(key, 0, current_time - self.window_size)
            pipe.zcard(key)
            pipe.zadd(key, {str(current_time): current_time})
            pipe.expire(key, self.window_size)
            results = await pipe.execute()
            
            request_count = results[1]
            return request_count >= self.rate_limit
        except Exception:
            return self._memory_rate_limit(client_ip, current_time)

    def _memory_rate_limit(self, client_ip: str, current_time: float) -> bool:
        """Memory-based rate limiting (fallback)"""
        if client_ip not in self.memory_store:
            self.memory_store[client_ip] = {}

        client_requests = self.memory_store[client_ip]
        
        cutoff_time = current_time - self.window_size
        client_requests = {
            timestamp: req_time 
            for timestamp, req_time in client_requests.items() 
            if req_time > cutoff_time
        }
        self.memory_store[client_ip] = client_requests

        if len(client_requests) >= self.rate_limit:
            return True

        client_requests[str(current_time)] = current_time
        return False
