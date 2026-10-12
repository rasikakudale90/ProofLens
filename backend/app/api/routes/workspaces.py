from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.core.errors import AppError
from app.db.models import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(payload: WorkspaceCreate, db: Session = Depends(get_database)):
    ws = Workspace(name=payload.name)
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws


@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(db: Session = Depends(get_database)):
    return db.query(Workspace).order_by(Workspace.created_at.desc()).all()


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: str, db: Session = Depends(get_database)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Workspace {workspace_id} not found.", status_code=404)
    return ws
