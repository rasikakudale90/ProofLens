from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.schemas.evidence import RetrievalRequest, RetrievalResponse
from app.services.retrieval import retrieve_evidence

router = APIRouter(prefix="/workspaces/{workspace_id}/retrieve", tags=["Retrieval"])


@router.post("", response_model=RetrievalResponse, status_code=status.HTTP_200_OK)
def retrieve_workspace_evidence(
    workspace_id: str,
    payload: RetrievalRequest,
    db: Session = Depends(get_database),
):
    results = retrieve_evidence(
        db=db,
        workspace_id=workspace_id,
        question=payload.question,
        document_ids=payload.document_ids,
        top_k=payload.top_k,
        similarity_threshold=payload.similarity_threshold,
    )
    return RetrievalResponse(
        query=payload.question,
        workspace_id=workspace_id,
        retrieved_count=len(results),
        results=results,
    )
