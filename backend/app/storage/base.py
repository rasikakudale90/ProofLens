from abc import ABC, abstractmethod
from typing import BinaryIO, Union


class StorageService(ABC):
    @abstractmethod
    def upload_file(self, storage_key: str, file_data: Union[bytes, BinaryIO], content_type: str = "application/pdf") -> str:
        """Uploads a file and returns its storage key / path."""
        pass

    @abstractmethod
    def download_file(self, storage_key: str) -> bytes:
        """Downloads file content as bytes."""
        pass

    @abstractmethod
    def delete_file(self, storage_key: str) -> bool:
        """Deletes a file by its storage key."""
        pass

    @abstractmethod
    def file_exists(self, storage_key: str) -> bool:
        """Checks if a file exists."""
        pass
