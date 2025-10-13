"""
Retry Log Schemas for API responses and requests
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class RetryType(str, Enum):
    LICENSE_KEY = "license_key"
    PAYMENT = "payment"
    ORDER_CREATION = "order_creation"
    EMAIL_SENDING = "email_sending"

class RetryStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"

class RetryLogBase(BaseModel):
    retry_type: RetryType
    attempt_number: int = Field(ge=1)
    max_attempts: int = Field(ge=1)
    status: RetryStatus
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    retry_metadata: Optional[str] = None

class RetryLogCreate(RetryLogBase):
    order_id: Optional[int] = None
    order_item_id: Optional[int] = None
    g2a_order_id: Optional[str] = None
    next_retry_at: Optional[datetime] = None

class RetryLogUpdate(BaseModel):
    status: Optional[RetryStatus] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    next_retry_at: Optional[datetime] = None
    retry_metadata: Optional[str] = None

class RetryLogResponse(RetryLogBase):
    id: int
    order_id: Optional[int] = None
    order_item_id: Optional[int] = None
    g2a_order_id: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    next_retry_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RetryLogListResponse(BaseModel):
    retry_logs: List[RetryLogResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class RetryStatsResponse(BaseModel):
    total_retries: int
    pending_retries: int
    in_progress_retries: int
    successful_retries: int
    failed_retries: int
    retry_types: dict  # Count by retry type
    recent_failures: List[RetryLogResponse]