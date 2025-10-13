from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey, Table, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

product_category = Table(
    'product_category',
    Base.metadata,
    Column('product_id', String, ForeignKey('products.id'), primary_key=True),
    Column('category_id', String, ForeignKey('categories.id'), primary_key=True)
)

product_image = Table(
    'product_image',
    Base.metadata,
    Column('product_id', String, ForeignKey('products.id'), primary_key=True),
    Column('image_id', Integer, ForeignKey('images.id'), primary_key=True)
)

product_video = Table(
    'product_video',
    Base.metadata,
    Column('product_id', String, ForeignKey('products.id'), primary_key=True),
    Column('video_id', Integer, ForeignKey('videos.id'), primary_key=True)
)


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    type = Column(String)
    qty = Column(Integer)
    min_price = Column(Float)
    retail_min_price = Column(Float)
    retail_min_base_price = Column(Float)
    available_to_buy = Column(Boolean, default=True)
    thumbnail = Column(String)
    small_image = Column(String)
    cover_image = Column(String)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    last_synced = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
    release_date = Column(DateTime, nullable=True)
    region = Column(String, nullable=True)
    developer = Column(String, nullable=True)
    publisher = Column(String, nullable=True)
    platform = Column(String, nullable=True)
    price_limit = Column(JSON)  

    categories = relationship("Category", secondary=product_category, back_populates="products")
    images = relationship("Image", secondary=product_image, back_populates="products")
    videos = relationship("Video", secondary=product_video, back_populates="products")
    restrictions = relationship("Restriction", uselist=False, back_populates="product")
    requirements = relationship("Requirement", uselist=False, back_populates="product")
    wishlist_items = relationship("Wishlist", back_populates="product", cascade="all, delete-orphan", lazy="dynamic")
    cart_items = relationship("Cart", back_populates="product", cascade="all, delete-orphan", lazy="dynamic")


class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

    products = relationship("Product", secondary=product_category, back_populates="categories")


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    url = Column(String, nullable=False)

    products = relationship("Product", secondary=product_image, back_populates="images")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    url = Column(String, nullable=False)
    video_type = Column(String, nullable=True)

    products = relationship("Product", secondary=product_video, back_populates="videos")


class Restriction(Base):
    __tablename__ = "restrictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String, ForeignKey("products.id"), unique=True, nullable=False)
    pegi_violence = Column(Boolean, default=False)
    pegi_profanity = Column(Boolean, default=False)
    pegi_discrimination = Column(Boolean, default=False)
    pegi_drugs = Column(Boolean, default=False)
    pegi_fear = Column(Boolean, default=False)
    pegi_gambling = Column(Boolean, default=False)
    pegi_online = Column(Boolean, default=False)
    pegi_sex = Column(Boolean, default=False)

    product = relationship("Product", back_populates="restrictions")


class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String, ForeignKey("products.id"), unique=True, nullable=False)
    minimal = Column(JSON)      
    recommended = Column(JSON)   

    product = relationship("Product", back_populates="requirements")


class ProductSyncLog(Base):
    __tablename__ = "product_sync_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    runtime_seconds = Column(Float, nullable=True)      
    total_synced = Column(Integer, nullable=False, default=0)
    new_products = Column(Integer, nullable=False, default=0)
    updated_products = Column(Integer, nullable=False, default=0)
    inactive_products = Column(Integer, nullable=False, default=0)
    pages_processed = Column(Integer, nullable=False, default=0)  
    batches_processed = Column(Integer, nullable=False, default=0)  # Track batch processing
    status = Column(String, nullable=False, index=True)  # success, failed, partial
    error_message = Column(Text, nullable=True)
    is_consecutive_failure = Column(Boolean, default=False, index=True)  # Warning flag for 3+ consecutive failures
    sync_trigger = Column(String, nullable=True)  # 'scheduled', 'manual', 'startup'
    
    def __repr__(self):
        return f"<ProductSyncLog(id={self.id}, status={self.status}, runtime={self.runtime_seconds}s, run_at={self.run_at})>"
