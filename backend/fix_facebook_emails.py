#!/usr/bin/env python3
"""
Fix Facebook users with invalid placeholder emails
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select, update
from app.core.database import get_async_db
from app.models.user import User

async def fix_facebook_emails():
    """Fix users with invalid @facebook.local emails"""
    
    async for db in get_async_db():
        try:
            # Find users with @facebook.local emails
            result = await db.execute(
                select(User).where(User.email.like('%@facebook.local'))
            )
            users = result.scalars().all()
            
            print(f"Found {len(users)} users with @facebook.local emails")
            
            for user in users:
                old_email = user.email
                # Extract Facebook ID from email
                facebook_id = old_email.split('@')[0].replace('facebook_', '')
                new_email = f"facebook_{facebook_id}@example.com"
                
                # Update the email
                user.email = new_email
                print(f"Updated user {user.id}: {old_email} -> {new_email}")
            
            # Commit changes
            await db.commit()
            print("All Facebook emails updated successfully!")
            
        except Exception as e:
            print(f"Error: {e}")
            await db.rollback()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(fix_facebook_emails())
