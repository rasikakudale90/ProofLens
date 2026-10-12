from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.schemas.brief import BriefCreateRequest, BriefResponse
from app.services.brief_generation import generate_research_brief, get_brief_markdown

router = APIRouter(prefix="/workspaces/{workspace_id}/briefs", tags=["Research Briefs"])


@router.post("", response_model=BriefResponse, status_code=status.HTTP_201_CREATED)
def create_workspace_brief(
    workspace_id: str,
    payload: BriefCreateRequest,
    db: Session = Depends(get_database),
):
    return generate_research_brief(db=db, workspace_id=workspace_id, payload=payload)


@router.get("/{brief_id}/markdown", response_class=Response)
def export_brief_markdown(
    workspace_id: str,
    brief_id: str,
    db: Session = Depends(get_database),
):
    md_content = get_brief_markdown(db=db, workspace_id=workspace_id, brief_id=brief_id)
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=brief-{brief_id[:8]}.md"},
    )
