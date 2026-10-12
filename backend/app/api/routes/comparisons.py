from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.schemas.comparison import CompareRequest, CompareResponse
from app.services.comparison import compare_documents

router = APIRouter(prefix="/workspaces/{workspace_id}/compare", tags=["Contradiction Radar"])


@router.post("", response_model=CompareResponse, status_code=status.HTTP_200_OK)
def compare_workspace_documents(
    workspace_id: str,
    payload: CompareRequest,
    db: Session = Depends(get_database),
):
    return compare_documents(db=db, workspace_id=workspace_id, payload=payload)
