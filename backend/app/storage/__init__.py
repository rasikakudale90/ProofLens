from app.core.config import settings
from app.storage.base import StorageService
from app.storage.local import LocalStorageService
from app.storage.supabase import SupabaseStorageService


def get_storage_service() -> StorageService:
    if settings.STORAGE_BACKEND == "supabase":
        try:
            return SupabaseStorageService()
        except Exception:
            # Fallback to local if credentials missing in dev
            return LocalStorageService()
    return LocalStorageService()
