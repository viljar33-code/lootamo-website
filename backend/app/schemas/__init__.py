# Import all schemas to ensure they're available
from .order import *
from .order_item import *

# Rebuild schemas to resolve forward references
def rebuild_all_schemas():
    """Rebuild all schemas to resolve forward references after imports"""
    try:
        from .order import rebuild_schemas
        from .order_item import rebuild_order_item_schemas
        
        rebuild_schemas()
        rebuild_order_item_schemas()
    except Exception as e:
        # Log but don't fail if rebuild fails
        print(f"Warning: Schema rebuild failed: {e}")

# Call rebuild after imports
rebuild_all_schemas()