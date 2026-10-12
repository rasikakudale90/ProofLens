from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.schemas.answer import AskRequest, AskResponse
from app.services.answer_generation import generate_grounded_answer

router = APIRouter(prefix="/workspaces/{workspace_id}/ask", tags=["Question Answering"])


@router.post("", response_model=AskResponse, status_code=status.HTTP_200_OK)
def ask_workspace_question(
    workspace_id: str,
    payload: AskRequest,
    db: Session = Depends(get_database),
):
    return generate_grounded_answer(db=db, workspace_id=workspace_id, payload=payload)
