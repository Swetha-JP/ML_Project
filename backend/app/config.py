from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "AthleteSafe"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    SECRET_KEY: str = "athletesafe-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "sqlite:///./athletesafe.db"

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    MAX_UPLOAD_SIZE_MB: int = 15
    UPLOAD_DIR: str = "./uploads"
    MODEL_DIR: str = "./ml/models"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
