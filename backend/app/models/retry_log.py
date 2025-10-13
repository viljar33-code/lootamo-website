"""
Retry Log Model for tracking retry attempts and monitoring
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class RetryLog(Base):
    __tablename__ = "retry_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Reference information
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=True, index=True)
    g2a_order_id = Column(String(50), nullable=True, index=True)
    
    # Retry information
    retry_type = Column(String(50), nullable=False, index=True)  # 'license_key', 'payment', 'order_creation'
    attempt_number = Column(Integer, nullable=False, default=1)
    max_attempts = Column(Integer, nullable=False, default=5)
    
    # Status and results
    status = Column(String(20), nullable=False, index=True)  # 'pending', 'success', 'failed', 'in_progress'
    error_code = Column(String(20), nullable=True)  # G2A error codes like ORD03, ORD04, etc.
    error_message = Column(Text, nullable=True)
    
    # Timing information
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    next_retry_at = Column(DateTime, nullable=True)
    
    # Additional metadata
    retry_metadata = Column(Text, nullable=True)  # JSON string for additional context
    
    # Relationships
    order = relationship("Order", back_populates="retry_logs")
    order_item = relationship("OrderItem", back_populates="retry_logs")
    
    def __repr__(self):
        return f"<RetryLog(id={self.id}, type={self.retry_type}, status={self.status}, attempt={self.attempt_number})>"
