import os
from typing import BinaryIO, Union
from app.storage.base import StorageService
from app.core.config import settings


class LocalStorageService(StorageService):
    def __init__(self, base_dir: str = settings.LOCAL_STORAGE_DIR):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def _get_full_path(self, storage_key: str) -> str:
        # Prevent directory traversal attacks
        safe_key = os.path.basename(storage_key)
        return os.path.join(self.base_dir, safe_key)

    def upload_file(self, storage_key: str, file_data: Union[bytes, BinaryIO], content_type: str = "application/pdf") -> str:
        full_path = self._get_full_path(storage_key)
        if isinstance(file_data, bytes):
            with open(full_path, "wb") as f:
                f.write(file_data)
        else:
            with open(full_path, "wb") as f:
                f.write(file_data.read())
        return storage_key

    def download_file(self, storage_key: str) -> bytes:
        full_path = self._get_full_path(storage_key)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Storage key {storage_key} not found at {full_path}")
        with open(full_path, "rb") as f:
            return f.read()

    def delete_file(self, storage_key: str) -> bool:
        full_path = self._get_full_path(storage_key)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False

    def file_exists(self, storage_key: str) -> bool:
        full_path = self._get_full_path(storage_key)
        return os.path.exists(full_path)
