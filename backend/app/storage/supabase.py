from typing import BinaryIO, Union
from app.storage.base import StorageService
from app.core.config import settings

try:
    from supabase import create_client, Client
except ImportError:
    create_client = None  # type: ignore
    Client = None  # type: ignore


class SupabaseStorageService(StorageService):
    def __init__(
        self,
        supabase_url: str = settings.SUPABASE_URL,
        supabase_key: str = settings.SUPABASE_KEY,
        bucket_name: str = settings.SUPABASE_BUCKET,
    ):
        if not create_client or not supabase_url or not supabase_key:
            raise ValueError("Supabase client is not configured or supabase package not installed.")
        self.client: Client = create_client(supabase_url, supabase_key)
        self.bucket = bucket_name

    def upload_file(self, storage_key: str, file_data: Union[bytes, BinaryIO], content_type: str = "application/pdf") -> str:
        data = file_data if isinstance(file_data, bytes) else file_data.read()
        res = self.client.storage.from_(self.bucket).upload(
            path=storage_key,
            file=data,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return storage_key

    def download_file(self, storage_key: str) -> bytes:
        res = self.client.storage.from_(self.bucket).download(storage_key)
        return res

    def delete_file(self, storage_key: str) -> bool:
        res = self.client.storage.from_(self.bucket).remove([storage_key])
        return bool(res)

    def file_exists(self, storage_key: str) -> bool:
        try:
            files = self.client.storage.from_(self.bucket).list(search=storage_key)
            return any(f.get("name") == storage_key for f in files)
        except Exception:
            return False
