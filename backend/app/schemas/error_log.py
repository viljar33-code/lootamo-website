from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ErrorLogBase(BaseModel):
    error_type: str = Field(..., description="Type of error (e.g., VALIDATION_WARN, DUPLICATE_SKU)")
    error_message: str = Field(..., description="Detailed error message")
    severity: str = Field(default="error", description="Severity level: error, warning, critical")
    source_system: Optional[str] = Field(None, description="System where error occurred")
    source_function: Optional[str] = Field(None, description="Function/method where error occurred")
    batch_id: Optional[str] = Field(None, description="Batch ID for batch operations")
    error_code: Optional[str] = Field(None, description="Specific error code")
    error_context: Optional[Dict[str, Any]] = Field(None, description="Additional context data")
    requires_manual_review: bool = Field(default=False, description="Whether error needs manual review")


class ErrorLogCreate(ErrorLogBase):
    stack_trace: Optional[str] = Field(None, description="Stack trace if available")


class ErrorLogUpdate(BaseModel):
    recovery_status: Optional[str] = Field(None, description="Recovery status: pending, recovered, quarantined, ignored")
    recovery_method: Optional[str] = Field(None, description="Recovery method: manual, automatic, quarantine")
    recovery_notes: Optional[str] = Field(None, description="Recovery notes")
    is_resolved: Optional[bool] = Field(None, description="Whether error is resolved")
    is_quarantined: Optional[bool] = Field(None, description="Whether error is quarantined")


class ErrorLogResponse(ErrorLogBase):
    id: int
    error_code: Optional[str]
    stack_trace: Optional[str]
    
    # Recovery information
    recovery_status: str
    recovery_attempts: int
    recovery_method: Optional[str]
    recovery_notes: Optional[str]
    
    # Duplicate detection
    duplicate_hash: Optional[str]
    duplicate_count: int
    first_occurrence: datetime
    last_occurrence: datetime
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    
    # Flags
    is_quarantined: bool
    requires_manual_review: bool
    is_resolved: bool

    model_config = {"from_attributes": True}


class ErrorLogDisplayResponse(BaseModel):
    """Simplified response for UI display with concise messages"""
    id: int
    display_message: str
    severity: str
    error_type: str
    created_at: datetime
    is_resolved: bool
    
    @classmethod
    def from_error_log(cls, error_log: ErrorLogResponse) -> "ErrorLogDisplayResponse":
        """Create display response from full error log"""
        timestamp = error_log.created_at.strftime("%Y-%m-%d %H:%M:%S")
        
        # Generate concise display message based on error type
        if error_log.error_type == "DUPLICATE_SKU":
            if "SKU=" in error_log.error_message:
                sku_part = error_log.error_message.split("SKU=")[1].split()[0].replace(",", "")
                display_msg = f"[{timestamp}]{error_log.error_type}- SKU={sku_part} detected, skipping row"
            else:
                display_msg = f"[{timestamp}]{error_log.error_type}- duplicate SKU detected, skipping row"
        
        elif error_log.error_type == "IMPORT_COMPLETE":
            words = error_log.error_message.split()
            numbers = [w for w in words if w.isdigit()]
            if len(numbers) >= 2:
                display_msg = f"[{timestamp}]{error_log.error_type}- batch processed: {numbers[0]} rows inserted, {numbers[1]} failed"
            else:
                display_msg = f"[{timestamp}]{error_log.error_type}- batch processing completed"
        
        elif error_log.error_type == "VALIDATION_WARN":
            display_msg = f"[{timestamp}]{error_log.error_type}- validation warning occurred"
        
        elif error_log.error_type == "EMAIL_SEND_FAILURE":
            display_msg = f"[{timestamp}]{error_log.error_type}- email delivery failed"
        
        elif error_log.error_type == "PAYMENT_ERROR":
            display_msg = f"[{timestamp}]{error_log.error_type}- payment processing error"
        
        elif error_log.error_type == "API_ERROR":
            display_msg = f"[{timestamp}]{error_log.error_type}- external API call failed"
        
        else:
            # Generic fallback - truncate message to fit
            short_msg = " ".join(error_log.error_message.split()[:6])
            if len(error_log.error_message.split()) > 6:
                short_msg += "..."
            display_msg = f"[{timestamp}]{error_log.error_type}- {short_msg}"
        
        return cls(
            id=error_log.id,
            display_message=display_msg,
            severity=error_log.severity,
            error_type=error_log.error_type,
            created_at=error_log.created_at,
            is_resolved=error_log.is_resolved
        )


class ErrorLogStats(BaseModel):
    total_errors: int
    critical_errors: int
    error_count: int
    warning_count: int
    pending_errors: int
    quarantined_errors: int
    resolved_errors: int
    manual_review_needed: int
    error_types: Dict[str, int]
    recent_critical_errors: List[Dict[str, Any]]


class ErrorLogListResponse(BaseModel):
    error_logs: List[ErrorLogDisplayResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class BulkResolveRequest(BaseModel):
    error_ids: List[int] = Field(..., description="List of error log IDs to resolve")
    resolution_notes: str = Field(..., description="Notes about the resolution")


class QuarantineRequest(BaseModel):
    quarantine_reason: str = Field(..., description="Reason for quarantining the error")
