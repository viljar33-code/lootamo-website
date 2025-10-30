#!/usr/bin/env python3
"""
Lootamo E-commerce Management CLI
================================

Django-style management commands for Lootamo e-commerce platform.
Usage: python manage.py <command>

Available commands:
- createsuperuser: Create a superuser account
- runserver: Start the development server
- migrate: Run database migrations
- seed: Seed database with sample data
"""

import asyncio
import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

def create_superuser():
    """Create superuser command"""
    from create_superuser import main
    asyncio.run(main())

def run_server():
    """Run development server"""
    import uvicorn
    print(" Starting Lootamo Development Server...")
    print(" Server URL: http://localhost:8080")
    print(" API Docs: http://localhost:8080/docs")
    print("\n  Press CTRL+C to stop the server")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        reload_dirs=["app"],
        log_level="info"
    )

def migrate():
    """Run database migrations"""
    import subprocess
    import os
    
    print("🔄 Running database migrations...")
    try:
        # Run alembic upgrade
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("Migrations completed successfully")
            print(result.stdout)
        else:
            print(" Migration failed")
            print(result.stderr)
            sys.exit(1)
            
    except FileNotFoundError:
        print("Alembic not found. Install with: pip install alembic")
        sys.exit(1)

def seed_database():
    """Seed database with sample data"""
    print("Seeding database with sample data...")
    print("This feature will be implemented in future versions")

def show_help():
    """Show available commands"""
    print("""
Lootamo E-commerce Management CLI

Available commands:
  createsuperuser    Create a superuser account
  runserver         Start the development server  
  migrate           Run database migrations
  seed              Seed database with sample data
  help              Show this help message

Usage:
  python manage.py <command>

Examples:
  python manage.py createsuperuser
  python manage.py runserver
  python manage.py migrate
    """)

def main():
    """Main CLI function"""
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1].lower()
    
    commands = {
        'createsuperuser': create_superuser,
        'runserver': run_server,
        'migrate': migrate,
        'seed': seed_database,
        'help': show_help,
        '--help': show_help,
        '-h': show_help,
    }
    
    if command in commands:
        try:
            commands[command]()
        except KeyboardInterrupt:
            print("\n\n Operation cancelled by user")
        except Exception as e:
            print(f"\nError: {e}")
            sys.exit(1)
    else:
        print(f"Unknown command: {command}")
        show_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
