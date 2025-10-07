"""
Cart model for shopping cart functionality
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Cart(Base):
    __tablename__ = "cart"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")

    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='unique_user_product_cart'),
    )

    def __repr__(self):
        return f"<Cart(id={self.id}, user_id={self.user_id}, product_id={self.product_id}, quantity={self.quantity})>"
