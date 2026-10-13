from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the workspace")
    user_id: Optional[str] = Field(None, description="Owner user ID of the workspace")


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceResponse(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    user_id: Optional[str] = None
