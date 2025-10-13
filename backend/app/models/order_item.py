"""
Order Item model for multi-item cart checkout functionality
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class OrderItemStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    
    g2a_order_id = Column(String, nullable=True, index=True)
    g2a_transaction_id = Column(String, nullable=True)
    delivered_key = Column(String, nullable=True)
    status = Column(String, nullable=False, default=OrderItemStatus.PENDING.value, index=True)
        
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    order = relationship("Order", back_populates="order_items")
    retry_logs = relationship("RetryLog", back_populates="order_item", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_order_item_order_id', 'order_id'),
        Index('idx_order_item_product_id', 'product_id'),
        Index('idx_order_item_g2a_order_id', 'g2a_order_id'),
        Index('idx_order_item_status', 'status'),
    )

    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id}, quantity={self.quantity}, status={self.status})>"