#!/usr/bin/env python3
"""
Lootamo E-commerce Superuser Creation Script
===========================================

This script creates a superuser/admin account for the Lootamo e-commerce platform.
Usage: python create_superuser.py

Features:
- Interactive prompts for user details
- Password validation
- Email validation
- Duplicate user checking
- Database connection handling
"""

import asyncio
import sys
import getpass
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_db
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserRole
from app.core.validators import validate_password
import uuid

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def get_user_input():
    """Get user input for superuser creation"""
    print("🔐 Creating Lootamo Superuser Account")
    print("=" * 50)
    
    while True:
        email = input("📧 Email address: ").strip()
        if not email:
            print("❌ Email is required")
            continue
        if not validate_email(email):
            print("❌ Invalid email format")
            continue
        break
    
    while True:
        username = input("👤 Username: ").strip()
        if not username:
            print("❌ Username is required")
            continue
        if len(username) < 3:
            print("❌ Username must be at least 3 characters")
            continue
        break
    
    first_name = input("📝 First Name (optional): ").strip() or None
    
    last_name = input("📝 Last Name (optional): ").strip() or None
    
    while True:
        password = getpass.getpass("🔒 Password: ")
        if not password:
            print("❌ Password is required")
            continue
        
        try:
            validate_password(password)
            break
        except ValueError as e:
            print(f"❌ {e}")
            continue
    
    while True:
        confirm_password = getpass.getpass("🔒 Confirm Password: ")
        if password != confirm_password:
            print("❌ Passwords do not match")
            continue
        break
    
    return {
        'email': email,
        'username': username,
        'first_name': first_name,
        'last_name': last_name,
        'password': password
    }

async def check_existing_user(db: AsyncSession, email: str, username: str) -> bool:
    """Check if user already exists"""
    from sqlalchemy import select
    
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        print(f"❌ User with email '{email}' already exists")
        return True
    
    result = await db.execute(select(User).where(User.username == username))
    result = await db.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none():
        print(f"❌ User with username '{username}' already exists")
        return True
    
    return False

async def create_superuser_account(user_data: dict) -> bool:
    """Create superuser account in database"""
    try:
        async for db in get_async_db():
            if await check_existing_user(db, user_data['email'], user_data['username']):
                return False
            
            hashed_password = get_password_hash(user_data['password'])
            
            new_user = User(
                uuid=str(uuid.uuid4()),
                email=user_data['email'],
                username=user_data['username'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                hashed_password=hashed_password,
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                is_superuser=True
            )
            
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            
            print("\n✅ Superuser created successfully!")
            print(f"📧 Email: {new_user.email}")
            print(f"👤 Username: {new_user.username}")
            print(f"🔑 Role: {new_user.role}")
            print(f"🆔 UUID: {new_user.uuid}")
            print("\n🚀 You can now login to the admin panel!")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Error creating superuser: {e}")
        return False

async def check_database_connection():
    """Check if database is accessible"""
    try:
        async for db in get_async_db():
            from sqlalchemy import text
            await db.execute(text("SELECT 1"))
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("💡 Make sure PostgreSQL is running and DATABASE_URL is correct in .env")
        return False

async def main():
    """Main function"""
    try:
        print("🔍 Checking database connection...")
        if not await check_database_connection():
            sys.exit(1)
        print("✅ Database connection successful\n")
        
        user_data = get_user_input()
        
        print("\n🔄 Creating superuser account...")
        
        success = await create_superuser_account(user_data)
        
        if success:
            print("\n🎉 Superuser creation completed!")
            print("You can now start the server and login with these credentials.")
        else:
            print("\n❌ Superuser creation failed!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
