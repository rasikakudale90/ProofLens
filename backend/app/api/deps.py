from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.storage.base import StorageService
from app.storage import get_storage_service


def get_database() -> Generator[Session, None, None]:
    yield from get_db()


def get_storage() -> StorageService:
    return get_storage_service()
