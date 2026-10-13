from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.core.errors import AppError
from app.core.security import hash_password
from app.db.models import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_database)):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        return existing

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password or "password123"),
        role=payload.role,
        avatar_color=payload.avatar_color,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_database)):
    return db.query(User).order_by(User.created_at.asc()).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_database)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"User {user_id} not found.", status_code=404)
    return user
