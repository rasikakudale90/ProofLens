from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_database, get_optional_current_user
from app.core.errors import AppError
from app.db.models import Workspace, Conversation, ConversationMessage, User
from app.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationSummary,
    ConversationDetail,
    ConversationMessageResponse,
)

router = APIRouter(prefix="/workspaces/{workspace_id}/conversations", tags=["Conversations"])


@router.get("", response_model=List[ConversationSummary])
def list_conversations(
    workspace_id: str,
    user_id: Optional[str] = Query(None, description="Optional user filter"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_database),
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Workspace {workspace_id} not found.", status_code=404)

    query = db.query(Conversation).filter(Conversation.workspace_id == workspace_id)
    effective_user_id = user_id or (current_user.id if current_user else None)
    if effective_user_id:
        query = query.filter((Conversation.user_id == effective_user_id) | (Conversation.user_id.is_(None)))

    conversations = query.order_by(Conversation.updated_at.desc()).all()

    summaries = []
    for c in conversations:
        msgs = c.messages
        last_msg = msgs[-1].content if msgs else None
        if last_msg and len(last_msg) > 100:
            last_msg = last_msg[:100] + "..."
        summaries.append(
            ConversationSummary(
                id=c.id,
                workspace_id=c.workspace_id,
                user_id=c.user_id,
                title=c.title,
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=len(msgs),
                last_message_preview=last_msg,
            )
        )
    return summaries


@router.post("", response_model=ConversationDetail, status_code=status.HTTP_201_CREATED)
def create_conversation(
    workspace_id: str,
    payload: ConversationCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_database),
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Workspace {workspace_id} not found.", status_code=404)

    owner_id = payload.user_id or (current_user.id if current_user else ws.user_id)
    convo = Conversation(
        workspace_id=workspace_id,
        user_id=owner_id,
        title=payload.title or "New Conversation",
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)
    return ConversationDetail(
        id=convo.id,
        workspace_id=convo.workspace_id,
        user_id=convo.user_id,
        title=convo.title,
        created_at=convo.created_at,
        updated_at=convo.updated_at,
        messages=[],
    )


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    workspace_id: str,
    conversation_id: str,
    db: Session = Depends(get_database),
):
    convo = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.workspace_id == workspace_id)
        .first()
    )
    if not convo:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Conversation {conversation_id} not found.", status_code=404)

    messages = [
        ConversationMessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            status=m.status,
            citations=m.citations or [],
            limitations=m.limitations or [],
            model_metadata=m.model_metadata or {},
            created_at=m.created_at,
        )
        for m in convo.messages
    ]

    return ConversationDetail(
        id=convo.id,
        workspace_id=convo.workspace_id,
        user_id=convo.user_id,
        title=convo.title,
        created_at=convo.created_at,
        updated_at=convo.updated_at,
        messages=messages,
    )


@router.patch("/{conversation_id}", response_model=ConversationDetail)
def update_conversation(
    workspace_id: str,
    conversation_id: str,
    payload: ConversationUpdate,
    db: Session = Depends(get_database),
):
    convo = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.workspace_id == workspace_id)
        .first()
    )
    if not convo:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Conversation {conversation_id} not found.", status_code=404)

    convo.title = payload.title
    db.commit()
    db.refresh(convo)

    return get_conversation(workspace_id=workspace_id, conversation_id=conversation_id, db=db)


@router.delete("/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    workspace_id: str,
    conversation_id: str,
    db: Session = Depends(get_database),
):
    convo = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.workspace_id == workspace_id)
        .first()
    )
    if not convo:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Conversation {conversation_id} not found.", status_code=404)

    db.delete(convo)
    db.commit()
    return {"message": "Conversation deleted successfully", "conversation_id": conversation_id}
