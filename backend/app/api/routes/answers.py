from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_database, get_optional_current_user
from app.db.models import User
from app.schemas.answer import AskRequest, AskResponse
from app.services.answer_generation import generate_grounded_answer

router = APIRouter(prefix="/workspaces/{workspace_id}/ask", tags=["Question Answering"])


@router.post("", response_model=AskResponse, status_code=status.HTTP_200_OK)
def ask_workspace_question(
    workspace_id: str,
    payload: AskRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_database),
):
    if not payload.user_id and current_user:
        payload.user_id = current_user.id
    return generate_grounded_answer(db=db, workspace_id=workspace_id, payload=payload)
