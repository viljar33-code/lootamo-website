from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class ErrorLog(Base):
    __tablename__ = "error_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Error identification
    error_code = Column(String(50), nullable=True, index=True)
    error_type = Column(String(100), nullable=False, index=True)  # VALIDATION_WARN, DUPLICATE_SKU, etc.
    severity = Column(String(20), nullable=False, default="error", index=True)  # error, warning, critical
    
    # Error context
    source_system = Column(String(100), nullable=True, index=True)  # payment, email, g2a, etc.
    source_function = Column(String(200), nullable=True)  # function/method where error occurred
    batch_id = Column(String(100), nullable=True, index=True)  # for batch operations
    
    # Error details
    error_message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)
    error_context = Column(JSON, nullable=True)  # Additional context data
    
    # Recovery information
    recovery_status = Column(String(50), nullable=False, default="pending", index=True)  # pending, recovered, quarantined, ignored
    recovery_attempts = Column(Integer, default=0)
    recovery_method = Column(String(100), nullable=True)  # manual, automatic, quarantine
    recovery_notes = Column(Text, nullable=True)
    
    # Duplicate detection
    duplicate_hash = Column(String(64), nullable=True, index=True)  # Hash for duplicate detection
    duplicate_count = Column(Integer, default=1)
    first_occurrence = Column(DateTime, nullable=False, default=func.now())
    last_occurrence = Column(DateTime, nullable=False, default=func.now())
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime, nullable=True)
    
    # Flags
    is_quarantined = Column(Boolean, default=False, index=True)
    requires_manual_review = Column(Boolean, default=False, index=True)
    is_resolved = Column(Boolean, default=False, index=True)
    
    def __repr__(self):
        return f"<ErrorLog(id={self.id}, type={self.error_type}, severity={self.severity}, status={self.recovery_status})>"
