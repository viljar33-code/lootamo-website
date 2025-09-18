from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.core.config import settings
from app.db.base import Base  # Import Base from our new location

# Base DB URL from settings
DB_URL = settings.DATABASE_URL.strip()

# Normalize URL to use psycopg (v3) driver for both sync and async
# Supported forms after normalization:
#  - postgresql+psycopg://...
#  - postgresql://...  -> converted to postgresql+psycopg://...
if "+psycopg" in DB_URL:
    SYNC_DATABASE_URL = DB_URL
    ASYNC_DATABASE_URL = DB_URL
else:
    SYNC_DATABASE_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://")
    ASYNC_DATABASE_URL = SYNC_DATABASE_URL

# Async engine
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Async session maker
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Sync engine for migrations and blocking tasks
sync_engine = create_engine(
    SYNC_DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Base is now imported from app.db.base

# Dependency to get async database session
async def get_async_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def create_tables():
    """Create database tables"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
