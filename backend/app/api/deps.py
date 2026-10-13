from typing import Generator, Optional
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.storage.base import StorageService
from app.storage import get_storage_service
from app.core.security import decode_access_token
from app.core.errors import AppError
from app.db.models import User

security_scheme = HTTPBearer(auto_error=False)


def get_database() -> Generator[Session, None, None]:
    yield from get_db()


def get_storage() -> StorageService:
    return get_storage_service()


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_database),
) -> User:
    if not auth or not auth.credentials:
        raise AppError(
            code="UNAUTHORIZED",
            message="Authentication required. Please provide a valid Bearer token.",
            status_code=401,
        )

    payload = decode_access_token(auth.credentials)
    if not payload or "sub" not in payload:
        raise AppError(
            code="UNAUTHORIZED",
            message="Invalid or expired access token.",
            status_code=401,
        )

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise AppError(
            code="USER_NOT_FOUND",
            message="User associated with this token no longer exists.",
            status_code=401,
        )
    return user


def get_optional_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_database),
) -> Optional[User]:
    if not auth or not auth.credentials:
        return None

    payload = decode_access_token(auth.credentials)
    if not payload or "sub" not in payload:
        return None

    return db.query(User).filter(User.id == payload["sub"]).first()
