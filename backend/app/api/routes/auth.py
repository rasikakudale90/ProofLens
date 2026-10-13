from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_database, get_current_user
from app.core.errors import AppError
from app.core.security import hash_password, verify_password, create_access_token
from app.db.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_database)):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise AppError(
            code="USER_ALREADY_EXISTS",
            message=f"A user with email {payload.email} is already registered.",
            status_code=400,
        )

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password),
        role=payload.role or "Forensic Analyst",
        avatar_color=payload.avatar_color or "#6366f1",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(payload: LoginRequest, db: Session = Depends(get_database)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not user.hashed_password:
        raise AppError(
            code="INVALID_CREDENTIALS",
            message="Invalid email or password.",
            status_code=401,
        )

    if not verify_password(payload.password, user.hashed_password):
        raise AppError(
            code="INVALID_CREDENTIALS",
            message="Invalid email or password.",
            status_code=401,
        )

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: User = Depends(get_current_user)):
    return user


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout():
    return {"message": "Logged out successfully"}
