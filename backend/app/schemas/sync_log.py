from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ProductSyncLogBase(BaseModel):
    total_synced: int = Field(..., description="Total products processed during sync")
    new_products: int = Field(..., description="Number of new products added")
    updated_products: int = Field(..., description="Number of existing products updated")
    inactive_products: int = Field(..., description="Number of products marked as inactive/discontinued")
    status: str = Field(..., description="Sync status: success, failed, or partial")
    error_message: Optional[str] = Field(None, description="Error message if sync failed")


class ProductSyncLogCreate(ProductSyncLogBase):
    pass


class ProductSyncLogResponse(ProductSyncLogBase):
    id: int
    run_at: datetime
    
    class Config:
        from_attributes = True


class ProductSyncLogListResponse(BaseModel):
    logs: List[ProductSyncLogResponse]
    total: int
    skip: int
    limit: int
    
    class Config:
        from_attributes = True


class SyncLogFilters(BaseModel):
    status: Optional[str] = Field(None, description="Filter by status: success, failed, partial")
    start_date: Optional[datetime] = Field(None, description="Filter logs from this date")
    end_date: Optional[datetime] = Field(None, description="Filter logs until this date")
