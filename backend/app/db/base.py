from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Note: Model imports are handled in alembic/env.py for migration detection
# and in individual modules where needed to avoid circular imports

__all__ = ['Base']
