"""Application configuration settings."""
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./database/bank_reviews.db"
    
    # Application
    APP_NAME: str = "Actionable Sentiment Backend"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Cache
    CACHE_TTL_CONFIG: int = 3600  # 1 час для /config
    CACHE_TTL_METRICS: int = 300  # 5 минут для метрик
    
    class Config:
        """Pydantic config."""
        
        env_file = ".env"
        case_sensitive = True


settings = Settings()

