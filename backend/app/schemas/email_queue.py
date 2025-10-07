"""
Pydantic models for Email Queue API responses
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class EmailQueueItemBase(BaseModel):
    id: int
    to_email: str
    subject: str
    status: str
    attempts: int
    max_retries: int
    last_error: Optional[str] = None
    next_retry_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime] = None
    email_type: Optional[str] = None
    order_id: Optional[str] = None
    email_metadata: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class EmailQueueItem(EmailQueueItemBase):
    """Full email queue item with all fields"""
    pass

class EmailQueueStats(BaseModel):
    """Email queue statistics"""
    pending: int = 0
    sending: int = 0
    sent: int = 0
    failed: int = 0
    overdue: int = 0
    total: int = 0
