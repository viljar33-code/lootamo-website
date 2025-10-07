"""
Email Queue Model for persistent email storage and retry mechanism
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class EmailQueue(Base):
    __tablename__ = "email_queue"

    id = Column(Integer, primary_key=True, index=True)
    to_email = Column(String(255), nullable=False, index=True)
    subject = Column(String(500), nullable=False)
    html_content = Column(Text, nullable=False)
    text_content = Column(Text, nullable=True)
    
    # Queue management
    status = Column(String(50), default="pending", index=True)  # pending, sending, sent, failed
    priority = Column(Integer, default=1, index=True)  # 1=high, 2=normal, 3=low
    
    # Retry logic
    attempts = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    next_retry_at = Column(DateTime, nullable=True, index=True)
    
    # Metadata
    email_type = Column(String(100), nullable=True, index=True)  # license_key, welcome, password_reset
    order_id = Column(String(100), nullable=True, index=True)
    email_metadata = Column("metadata", JSON, nullable=True)  # Additional context data
    
    # Error tracking
    last_error = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    sent_at = Column(DateTime, nullable=True)
