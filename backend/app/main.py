from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_tables
from app.core.redis import get_redis_client, close_redis_client
from app.api.v1.api import api_router
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.error_logging import ErrorLoggingMiddleware
from app.services.scheduler_service import scheduler_service


@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    try:
        import asyncio
        await asyncio.wait_for(create_tables(), timeout=5.0)
        print("Database tables created/verified")
    except Exception as e:
        print(f"Database setup failed (continuing without DB): {e}")
    
    try:
        await get_redis_client()
        print("Redis connection established")
    except Exception as e:
        print(f"Redis connection failed: {e}")
    
    try:
        await scheduler_service.start()
        print("Scheduler started")
    except Exception as e:
        print(f"Scheduler failed: {e}")
    
    yield
    
    try:
        await scheduler_service.shutdown()
        await close_redis_client()
        print("Cleanup completed")
    except Exception as e:
        print(f"Cleanup failed: {e}")


security = HTTPBearer()

app = FastAPI(
    title="Lootamo E-commerce API",
    description="Production-ready e-commerce backend with authentication, catalog sync, and payment processing",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,

    }
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    from fastapi.openapi.utils import get_openapi
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT token from /api/v1/auth/login"
        }
    }
    
    openapi_schema["security"] = [{"HTTPBearer": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# CORS middleware
print(f"Allowed CORS origins: {settings.allowed_origins_list}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware)

app.add_middleware(ErrorLoggingMiddleware)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    )
