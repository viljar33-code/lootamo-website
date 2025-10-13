from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timedelta
import enum
from app.db.base import Base


class OrderStatus(enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    COMPLETE = "complete"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    total_price = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="EUR")
    status = Column(String, nullable=False, default=OrderStatus.PENDING.value, index=True)
    
    stripe_payment_intent_id = Column(String, nullable=True, index=True)
    payment_status = Column(String, nullable=False, default=PaymentStatus.PENDING.value, index=True)
    
    product_id = Column(String, nullable=True, index=True)  # Made nullable for multi-item orders
    price = Column(Float, nullable=True)  # Made nullable for multi-item orders
    g2a_order_id = Column(String, nullable=True, index=True)  # Legacy field
    g2a_transaction_id = Column(String, nullable=True)  # Legacy field
    delivered_key = Column(String, nullable=True)  # Legacy field
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    retry_logs = relationship("RetryLog", back_populates="order", cascade="all, delete-orphan")
    
    PENDING_ORDER_EXPIRY_HOURS = 24
    
    @property
    def is_expired(self) -> bool:
        """Check if pending order has expired (24 hours old)"""
        if self.status != OrderStatus.PENDING.value:
            return False
        
        expiry_time = self.created_at + timedelta(hours=self.PENDING_ORDER_EXPIRY_HOURS)
        return datetime.now(self.created_at.tzinfo) > expiry_time
    
    @property
    def is_customer_visible(self) -> bool:
        """Check if order should be visible to customer (paid/complete only)"""
        return self.status in [OrderStatus.PAID.value, OrderStatus.COMPLETE.value]
    
    def expire_if_pending(self) -> bool:
        """Mark order as expired if it's pending and past expiry time"""
        if self.is_expired:
            self.status = OrderStatus.EXPIRED.value
            return True
        return False
