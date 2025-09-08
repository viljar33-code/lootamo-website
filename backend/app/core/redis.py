import redis.asyncio as redis
from typing import Optional
from app.core.config import settings

redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> Optional[redis.Redis]:
    """Get Redis client instance"""
    global redis_client
    
    if redis_client is None:
        try:
            redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            await redis_client.ping()
        except Exception as e:
            print(f"Redis connection failed: {e}")
            redis_client = None
    
    return redis_client


async def close_redis_client():
    """Close Redis client connection"""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None
