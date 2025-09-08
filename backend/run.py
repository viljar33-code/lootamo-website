#!/usr/bin/env python3
"""
Lootamo E-commerce Backend Server Runner
========================================

This script provides an easy way to start the Lootamo backend server.
Simply run: python run.py

Features:
- Automatic environment detection
- Database connection validation
- Redis connection validation
- Server startup with optimal settings
- Graceful error handling
"""

import os
import sys
import subprocess
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

def check_environment():
    """Check if virtual environment is activated"""
    return hasattr(sys, 'real_prefix') or (
        hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix
    )

def install_dependencies():
    """Install required dependencies if needed"""
    try:
        import uvicorn
        import fastapi
        import sqlalchemy
        import redis
        print("✅ All dependencies are installed")
        return True
    except ImportError as e:
        print(f" Missing dependency: {e}")
        print("Installing dependencies...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print(" Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError:
            print(" Failed to install dependencies")
            return False

async def check_database_connection():
    """Check database connection"""
    try:
        from app.core.database import get_async_db
        from app.core.config import settings
        from sqlalchemy import text
        
        print(f"🔍 Checking database connection: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'localhost'}")
        
        async for db in get_async_db():
            await db.execute(text("SELECT 1"))
            print(" Database connection successful")
            break
        return True
    except Exception as e:
        print(f" Database connection failed: {e}")
        print(" Make sure PostgreSQL is running and DATABASE_URL is correct in .env")
        return False

async def check_redis_connection():
    """Check Redis connection"""
    try:
        from app.core.redis import get_redis_client
        from app.core.config import settings
        
        print(f" Checking Redis connection: {settings.REDIS_URL}")
        
        redis_client = await get_redis_client()
        if redis_client:
            await redis_client.ping()
            print("Redis connection successful")
            return True
        else:
            print("Redis connection failed: Could not create Redis client")
            return False
    except Exception as e:
        print(f" Redis connection failed: {e}")
        print("Make sure Redis is running and REDIS_URL is correct in .env")
        return False

def check_env_file():
    """Check if .env file exists"""
    env_file = Path(".env")
    if not env_file.exists():
        print(".env file not found")
        print(" Copy .env.example to .env and configure your settings")
        return False
    print(".env file found")
    return True

async def run_startup_checks():
    """Run all startup checks"""
    print(" Starting Lootamo E-commerce Backend")
    print("=" * 50)
    
    # Check for --skip-redis flag
    skip_redis = "--skip-redis" in sys.argv
    
    if not check_environment():
        print(" Virtual environment not detected")
        print(" Consider activating virtual environment: source env/bin/activate")
    else:
        print(" Virtual environment active")
    
    if not check_env_file():
        return False
    
    if not install_dependencies():
        return False
    
    if not await check_database_connection():
        return False
    
    if skip_redis:
        print(" Skipping Redis connection check (--skip-redis flag)")
    else:
        if not await check_redis_connection():
            print(" Redis connection failed, but continuing anyway...")
            print(" Some features may not work without Redis")
    
    print("=" * 50)
    print(" All checks passed! Starting server...")
    return True

def start_server():
    """Start the FastAPI server"""
    try:
        import uvicorn
        
        print("\n🌟 Lootamo Backend Server Starting...")
        print("📍 Server URL: http://localhost:8000")
        print("📖 API Docs: http://localhost:8000/docs")
        print("🔧 Admin Panel: http://localhost:8000/redoc")
        print("\n⏹️  Press CTRL+C to stop the server")
        print("=" * 50)
        
        # Start the server
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=["app"],
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server failed to start: {e}")
        sys.exit(1)

async def main():
    """Main function"""
    try:
        # Run startup checks
        if await run_startup_checks():
            # Start the server
            start_server()
        else:
            print("\n❌ Startup checks failed. Please fix the issues above.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Change to script directory
    os.chdir(Path(__file__).parent)
    
    # Run the main function
    asyncio.run(main())
