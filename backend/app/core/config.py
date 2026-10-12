from typing import List, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "ProofLens AI Backend"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    CORS_ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"

    # Storage
    STORAGE_BACKEND: Literal["local", "supabase"] = "local"
    LOCAL_STORAGE_DIR: str = "storage/local"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "prooflens-documents"

    # AI Provider (Google Gemini)
    GEMINI_API_KEY: str = ""
    GEMINI_GENERATION_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "text-embedding-004"
    EMBEDDING_DIMENSIONS: int = 768

    # Constraints and Pipeline Defaults
    MAX_UPLOAD_BYTES: int = 15 * 1024 * 1024  # 15 MB
    MAX_PDF_PAGES: int = 50
    MAX_DOCUMENTS_PER_WORKSPACE: int = 10
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    RETRIEVAL_TOP_K: int = 5
    SIMILARITY_THRESHOLD: float = 0.3
    PROVIDER_TIMEOUT_SECONDS: int = 30
    PROVIDER_MAX_RETRIES: int = 3


settings = Settings()
