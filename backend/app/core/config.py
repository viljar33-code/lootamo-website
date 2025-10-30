from pydantic_settings import BaseSettings, SettingsConfigDict
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
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Scheduler Configuration
    SYNC_SCHEDULE_HOUR: int = 2  
    SYNC_SCHEDULE_MINUTE: int = 0
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # CORS
    ALLOWED_ORIGINS: str = Field(
    default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080,http://localhost:8000,http://127.0.0.1:8000,https://seal-app-gltln.ondigitalocean.app,http://seal-app-gltln.ondigitalocean.app",
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
    
    # G2A API (ENV-based configuration for Option A)
    G2A_CLIENT_ID: str = Field(default="", env="G2A_CLIENT_ID")
    G2A_CLIENT_SECRET: str = Field(default="", env="G2A_CLIENT_SECRET")
    G2A_BASE_URL: str = Field(default="https://api.g2a.com", env="G2A_BASE_URL")
    G2A_TOKEN_URL: str = Field(default="https://api.g2a.com/oauth/token", env="G2A_TOKEN_URL")
    G2A_PRODUCTS_URL: str = Field(default="https://api.g2a.com/v1/products", env="G2A_PRODUCTS_URL")
    
    # Frontend URL
    FRONTEND_URL: str = Field(default="http://localhost:3000", env="FRONTEND_URL")
    
    # SMTP Configuration (COMMENTED OUT - USING SENDGRID)
    # SMTP_HOST: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    # SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    # SMTP_USERNAME: str = Field(default="", env="SMTP_USERNAME")
    # SMTP_PASSWORD: str = Field(default="", env="SMTP_PASSWORD")
    # SMTP_FROM_EMAIL: str = Field(default="", env="SMTP_FROM_EMAIL")
    # SMTP_FROM_NAME: str = Field(default="Lootamo E-commerce", env="SMTP_FROM_NAME")
    # SMTP_USE_TLS: bool = Field(default=True, env="SMTP_USE_TLS")
    
    # SendGrid Configuration
    SENDGRID_API_KEY: str = Field(default="", env="SENDGRID_API_KEY")
    EMAIL_FROM: str = Field(default="no-reply@lootamo.com", env="EMAIL_FROM")
    EMAIL_FROM_NAME: str = Field(default="Lootamo", env="EMAIL_FROM_NAME")
    EMAIL_REPLY_TO: str = Field(default="info@lootamo.com", env="EMAIL_REPLY_TO")
    
    # Application URLs
    BACKEND_URL: str = Field(default="http://localhost:8000", env="BACKEND_URL")
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: str = Field(default="sk_test_51SArZdHUJcZKVIXc4l2vKTsNIWPUOERZTbMdctv4UGOGb3zGtqZSlXGexHXLtBcez22izeFDymvRgCmihkU1oOA200mFQ6cZmf", env="STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: str = Field(default="pk_test_51SArZdHUJcZKVIXckx5N1KvMxqPeYpLCdnJu5T8VRSAiDNsbW6SHSf3Cx6lbMLJVDA1HYKozoODqaykbFlmBIkKm00AmHyvydg", env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field(default="whsec_ba44e744d3401ff84018200e2b6e40db366f06eb0701be526235502be3a1bda5", env="STRIPE_WEBHOOK_SECRET")
    
    # G2A Sandbox Configuration
    G2A_SANDBOX_AUTH: str = Field(default="qdaiciDiyMaTjxMt, 74026b3dc2c6db6a30a73e71cdb138b1e1b5eb7a97ced46689e2d28db1050875", env="G2A_SANDBOX_AUTH")
    G2A_SANDBOX_BASE_URL: str = Field(default="https://sandboxapi.g2a.com", env="G2A_SANDBOX_BASE_URL")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()