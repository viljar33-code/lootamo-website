#!/usr/bin/env python3
"""
Comprehensive test script for automatic error logging integration
Tests all error logging integrations across services and middleware
"""

import asyncio
import sys
import os
import traceback
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from app.core.database import SessionLocal
from app.services.error_log_service import ErrorLogService
from app.services.email_service import EmailService
from app.services.payment_service import PaymentService
from app.services.g2a_service import create_g2a_order, get_g2a_order_key
from app.services.product_service import sync_all_products_paginated
from app.models.error_log import ErrorLog


async def test_email_service_error_logging():
    """Test error logging in EmailService"""
    print("\n=== Testing EmailService Error Logging ===")
    
    email_service = EmailService()
    
    # Test with invalid SMTP configuration to trigger error
    try:
        result = await email_service.send_email(
            to_email="invalid@nonexistent-domain-12345.com",
            subject="Test Error Logging",
            html_content="<p>This should fail and be logged</p>",
            max_retries=1  # Reduce retries for faster testing
        )
        print(f"Email send result: {result}")
    except Exception as e:
        print(f"Expected email error caught: {e}")
    
    # Check if error was logged
    db = SessionLocal()
    try:
        recent_errors = db.query(ErrorLog).filter(
            ErrorLog.error_type == "EMAIL_SEND_FAILURE"
        ).order_by(ErrorLog.created_at.desc()).limit(1).all()
        
        if recent_errors:
            error = recent_errors[0]
            print(f"✅ Email error logged: ID={error.id}, Type={error.error_type}")
            print(f"   Context: {error.error_context}")
        else:
            print("❌ No email errors found in log")
    finally:
        db.close()


async def test_payment_service_error_logging():
    """Test error logging in PaymentService"""
    print("\n=== Testing PaymentService Error Logging ===")
    
    payment_service = PaymentService()
    
    # Test with invalid order ID to trigger error
    try:
        result = await payment_service.create_payment_intent(
            order_id=999999999,  # Non-existent order
            user_id=1
        )
        print(f"Payment intent result: {result}")
    except Exception as e:
        print(f"Expected payment error caught: {e}")
    
    # Check if error was logged
    db = SessionLocal()
    try:
        recent_errors = db.query(ErrorLog).filter(
            ErrorLog.source_system == "payment"
        ).order_by(ErrorLog.created_at.desc()).limit(1).all()
        
        if recent_errors:
            error = recent_errors[0]
            print(f"✅ Payment error logged: ID={error.id}, Type={error.error_type}")
            print(f"   Context: {error.error_context}")
        else:
            print("❌ No payment errors found in log")
    finally:
        db.close()


async def test_g2a_service_error_logging():
    """Test error logging in G2A service"""
    print("\n=== Testing G2A Service Error Logging ===")
    
    # Test G2A order creation with invalid product ID
    try:
        result = await create_g2a_order("invalid_product_id_12345")
        print(f"G2A order creation result: {result}")
    except Exception as e:
        print(f"Expected G2A error caught: {e}")
    
    # Test G2A key retrieval with invalid order ID
    try:
        result = await get_g2a_order_key("invalid_order_id_12345")
        print(f"G2A key retrieval result: {result}")
    except Exception as e:
        print(f"Expected G2A key error caught: {e}")
    
    # Check if errors were logged
    db = SessionLocal()
    try:
        recent_errors = db.query(ErrorLog).filter(
            ErrorLog.source_system == "g2a"
        ).order_by(ErrorLog.created_at.desc()).limit(2).all()
        
        if recent_errors:
            for error in recent_errors:
                print(f"✅ G2A error logged: ID={error.id}, Type={error.error_type}")
                print(f"   Function: {error.source_function}")
        else:
            print("❌ No G2A errors found in log")
    finally:
        db.close()


async def test_product_sync_error_logging():
    """Test error logging in ProductSyncService"""
    print("\n=== Testing ProductSyncService Error Logging ===")
    
    # This will likely fail due to G2A API issues, which should be logged
    try:
        result = await sync_all_products_paginated(batch_size=10)
        print(f"Product sync result: {result}")
    except Exception as e:
        print(f"Expected product sync error caught: {e}")
    
    # Check if errors were logged
    db = SessionLocal()
    try:
        recent_errors = db.query(ErrorLog).filter(
            ErrorLog.source_system == "product_sync"
        ).order_by(ErrorLog.created_at.desc()).limit(1).all()
        
        if recent_errors:
            error = recent_errors[0]
            print(f"✅ Product sync error logged: ID={error.id}, Type={error.error_type}")
            print(f"   Context: {error.error_context}")
        else:
            print("❌ No product sync errors found in log")
    finally:
        db.close()


async def test_direct_error_logging():
    """Test direct error logging functionality"""
    print("\n=== Testing Direct Error Logging ===")
    
    db = SessionLocal()
    try:
        # Test logging a custom exception
        try:
            raise ValueError("Test exception for error logging")
        except Exception as e:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="TEST_ERROR",
                source_system="test",
                source_function="test_direct_error_logging",
                error_context={"test_key": "test_value"},
                severity="warning"
            )
        
        # Verify the error was logged
        recent_errors = db.query(ErrorLog).filter(
            ErrorLog.error_type == "TEST_ERROR"
        ).order_by(ErrorLog.created_at.desc()).limit(1).all()
        
        if recent_errors:
            error = recent_errors[0]
            print(f"✅ Direct error logged: ID={error.id}, Type={error.error_type}")
            print(f"   Message: {error.error_message}")
            print(f"   Severity: {error.severity}")
        else:
            print("❌ Direct error logging failed")
            
    finally:
        db.close()


async def display_error_statistics():
    """Display current error logging statistics"""
    print("\n=== Error Logging Statistics ===")
    
    db = SessionLocal()
    try:
        stats = ErrorLogService.get_error_statistics(db)
        
        print(f"Total errors: {stats.total_errors}")
        print(f"Pending recovery: {stats.pending_recovery}")
        print(f"Quarantined: {stats.quarantined}")
        print(f"Resolved: {stats.resolved}")
        print(f"Critical errors: {stats.critical_errors}")
        print(f"Errors today: {stats.errors_today}")
        
        # Show recent errors by type
        print("\nRecent errors by type:")
        recent_errors = db.query(ErrorLog).order_by(ErrorLog.created_at.desc()).limit(10).all()
        
        for error in recent_errors:
            print(f"  - {error.error_type} ({error.severity}) - {error.created_at.strftime('%H:%M:%S')}")
            
    finally:
        db.close()


async def main():
    """Run all error logging integration tests"""
    print("🚀 Starting Error Logging Integration Tests")
    print("=" * 50)
    
    try:
        # Test direct error logging first
        await test_direct_error_logging()
        
        # Test service integrations
        await test_email_service_error_logging()
        await test_payment_service_error_logging()
        await test_g2a_service_error_logging()
        await test_product_sync_error_logging()
        
        # Display final statistics
        await display_error_statistics()
        
        print("\n" + "=" * 50)
        print("✅ Error logging integration tests completed!")
        print("Check the error logs in the admin panel for detailed error information.")
        
    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
