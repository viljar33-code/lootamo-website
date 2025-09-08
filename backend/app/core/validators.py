import re
from typing import Any
from pydantic import validator


def validate_password(password: str) -> str:
    """
    Validate password strength:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter  
    - At least 1 digit
    - At least 1 special character
    """
    if len(password) < 8:
        raise ValueError('Password must be at least 8 characters long')
    
    if not re.search(r'[A-Z]', password):
        raise ValueError('Password must contain at least one uppercase letter')
    
    if not re.search(r'[a-z]', password):
        raise ValueError('Password must contain at least one lowercase letter')
    
    if not re.search(r'\d', password):
        raise ValueError('Password must contain at least one digit')
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValueError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)')
    
    return password


def password_validator(field_name: str = 'password'):
    """Create a password validator for Pydantic models"""
    return validator(field_name, allow_reuse=True)(validate_password)
