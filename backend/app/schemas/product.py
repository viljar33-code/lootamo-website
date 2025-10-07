from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class ImageResponse(BaseModel):
    url: str

    class Config:
        from_attributes = True


class VideoResponse(BaseModel):
    url: str
    video_type: Optional[str] = None

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True


class RestrictionResponse(BaseModel):
    pegi_violence: bool = False
    pegi_profanity: bool = False
    pegi_discrimination: bool = False
    pegi_drugs: bool = False
    pegi_fear: bool = False
    pegi_gambling: bool = False
    pegi_online: bool = False
    pegi_sex: bool = False

    class Config:
        from_attributes = True


class RequirementResponse(BaseModel):
    minimal: Optional[Dict[str, Any]] = None
    recommended: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: str
    name: str
    slug: str
    type: Optional[str] = None
    qty: Optional[int] = None
    min_price: Optional[float] = None
    retail_min_price: Optional[float] = None
    retail_min_base_price: Optional[float] = None
    available_to_buy: bool = True
    is_active: bool = True
    thumbnail: Optional[str] = None
    small_image: Optional[str] = None
    cover_image: Optional[str] = None
    updated_at: Optional[datetime] = None
    release_date: Optional[datetime] = None
    region: Optional[str] = None
    developer: Optional[str] = None
    publisher: Optional[str] = None
    platform: Optional[str] = None
    price_limit: Optional[Dict[str, Any]] = None
    
    # Related data - use proper response models
    categories: List[CategoryResponse] = []
    images: List[ImageResponse] = []
    videos: List[VideoResponse] = []
    restrictions: Optional[RestrictionResponse] = None
    requirements: Optional[RequirementResponse] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    skip: int
    limit: int
