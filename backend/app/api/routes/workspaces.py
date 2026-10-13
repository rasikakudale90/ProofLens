from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_database, get_optional_current_user
from app.core.errors import AppError
from app.db.models import Workspace, User
from app.schemas.workspace import WorkspaceCreate, WorkspaceResponse

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    payload: WorkspaceCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_database),
):
    owner_id = payload.user_id or (current_user.id if current_user else None)
    ws = Workspace(name=payload.name, user_id=owner_id)
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws


@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(
    user_id: Optional[str] = Query(None, description="Optional filter by user ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_database),
):
    query = db.query(Workspace)
    effective_user_id = user_id or (current_user.id if current_user else None)
    if effective_user_id:
        query = query.filter((Workspace.user_id == effective_user_id) | (Workspace.user_id.is_(None)))
    return query.order_by(Workspace.created_at.desc()).all()


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: str, db: Session = Depends(get_database)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Workspace {workspace_id} not found.", status_code=404)
    return ws


@router.delete("/{workspace_id}", status_code=status.HTTP_200_OK)
def delete_workspace(workspace_id: str, db: Session = Depends(get_database)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Workspace {workspace_id} not found.", status_code=404)
    db.delete(ws)
    db.commit()
    return {"message": "Workspace deleted successfully", "workspace_id": workspace_id}
