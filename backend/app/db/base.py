from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import all models here to ensure they are registered with SQLAlchemy's metadata
# This must be done after Base is created but before any model imports
from app.models.user import User  # noqa
from app.models.social_auth import SocialAccount  # noqa

__all__ = ['Base', 'User', 'SocialAccount']
