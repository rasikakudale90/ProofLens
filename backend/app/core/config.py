from typing import List, Literal, Union, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import json


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
    SECRET_KEY: str = "prooflens_ai_jwt_secret_super_secure_key_2026"
    CORS_ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                try:
                    return json.loads(v_trimmed)
                except Exception:
                    pass
            return [origin.strip() for origin in v_trimmed.split(",") if origin.strip()]
        return v

    # Database
    DATABASE_URL: str = (
        "postgresql+psycopg://postgres.wevngldabokxspwnwkdb:r8ja1Da06laUWtDM@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Any) -> str:
        if isinstance(v, str):
            url = v.strip()
            # Intercept IPv6-only Supabase direct host and rewrite to IPv4 Session pooler
            import re
            m = re.search(
                r"postgresql(?:\+psycopg)?://([^:]+):([^@]+)@db\.([a-zA-Z0-9]+)\.supabase\.co(?::\d+)?/(.+)",
                url,
            )
            if m:
                user, password, project_ref, dbname = m.groups()
                pooler_user = f"postgres.{project_ref}" if not user.startswith("postgres.") else user
                url = f"postgresql+psycopg://{pooler_user}:{password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/{dbname}"
            elif url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg://", 1)
            elif url.startswith("postgresql://") and not url.startswith("postgresql+psycopg://"):
                url = url.replace("postgresql://", "postgresql+psycopg://", 1)
            return url
        return v

    USE_PGVECTOR: bool = True

    # Storage
    STORAGE_BACKEND: Literal["local", "supabase"] = "supabase"
    LOCAL_STORAGE_DIR: str = "storage/local"
    SUPABASE_URL: str = "https://wevngldabokxspwnwkdb.supabase.co"
    SUPABASE_KEY: str = (
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
        "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indldm5nbGRhYm9reHNwd253a2RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk2NzIzOCwiZXhwIjoyMTA3NTQzMjM4fQ."
        "CLo3boyaLekcLDoVE4Co0cfLcCLETy6CWO4bZGs5Eqk"
    )

    @field_validator("SUPABASE_KEY", mode="before")
    @classmethod
    def assemble_supabase_key(cls, v: Any) -> str:
        default_key = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
            "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indldm5nbGRhYm9reHNwd253a2RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk2NzIzOCwiZXhwIjoyMTA3NTQzMjM4fQ."
            "CLo3boyaLekcLDoVE4Co0cfLcCLETy6CWO4bZGs5Eqk"
        )
        if not v or not isinstance(v, str) or len(v.strip()) < 50:
            return default_key
        try:
            import jwt
            payload = jwt.decode(v.strip(), options={"verify_signature": False})
            if payload.get("role") != "service_role":
                return default_key
        except Exception:
            return default_key
        return v.strip()

    SUPABASE_BUCKET: str = "prooflens-documents"

    # AI Provider (Google Gemini)
    GEMINI_API_KEY: str = ""
    GEMINI_GENERATION_MODEL: str = "gemini-flash-lite-latest"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"
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
