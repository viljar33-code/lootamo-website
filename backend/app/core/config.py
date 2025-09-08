from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    
    # JWT Configuration
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Redis Configuration
    REDIS_URL: str = Field(..., env="REDIS_URL")
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # CORS
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080,http://localhost:8000,http://127.0.0.1:8000",
        env="ALLOWED_ORIGINS"
    )
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = Field(default="", env="GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="", env="GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = Field(default="http://localhost:8000/api/v1/auth/google/callback", env="GOOGLE_REDIRECT_URI")
    
    # Facebook OAuth
    FACEBOOK_CLIENT_ID: str = Field(default="", env="FACEBOOK_CLIENT_ID")
    FACEBOOK_CLIENT_SECRET: str = Field(default="", env="FACEBOOK_CLIENT_SECRET")
    FACEBOOK_REDIRECT_URI: str = Field(default="http://localhost:8000/api/v1/auth/facebook/callback", env="FACEBOOK_REDIRECT_URI")
    
    # SMTP Configuration
    SMTP_HOST: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USERNAME: str = Field(default="", env="SMTP_USERNAME")
    SMTP_PASSWORD: str = Field(default="", env="SMTP_PASSWORD")
    SMTP_FROM_EMAIL: str = Field(default="", env="SMTP_FROM_EMAIL")
    SMTP_FROM_NAME: str = Field(default="Lootamo E-commerce", env="SMTP_FROM_NAME")
    SMTP_USE_TLS: bool = Field(default=True, env="SMTP_USE_TLS")
    
    # Application URLs
    BACKEND_URL: str = Field(default="http://localhost:8000", env="BACKEND_URL")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
