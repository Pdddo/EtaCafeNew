from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "RestoFlow API - Sistem Manajemen Restoran/Kafe v1.2"
    VERSION: str = "1.2.0"
    DATABASE_URL: str = "sqlite:///./etacafe.db"
    SECRET_KEY: str = "supersecretjwtkey_restoflow_unhas_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 jam
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5500",
        "http://localhost:3001",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
