from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of user")
    email: str = Field(..., max_length=255, description="Email address of user")
    role: str = Field("Forensic Analyst", max_length=100, description="Role title")
    avatar_color: str = Field("#6366f1", max_length=50, description="Accent color for user avatar")


class UserCreate(UserBase):
    password: Optional[str] = Field("password123", min_length=6, description="User password")


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
