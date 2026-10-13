from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name")
    email: str = Field(..., max_length=255, description="Email address")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")
    role: Optional[str] = Field("Forensic Analyst", max_length=100, description="Role title")
    avatar_color: Optional[str] = Field("#6366f1", max_length=50, description="Avatar accent color")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
