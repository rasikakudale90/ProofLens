from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.schemas.claim import ClaimAssessRequest, ClaimAssessResponse
from app.services.claim_assessment import assess_claims

router = APIRouter(prefix="/workspaces/{workspace_id}/claims", tags=["Claim Evidence Ledger"])


@router.post("/assess", response_model=ClaimAssessResponse, status_code=status.HTTP_200_OK)
def assess_workspace_claims(
    workspace_id: str,
    payload: ClaimAssessRequest,
    db: Session = Depends(get_database),
):
    return assess_claims(db=db, workspace_id=workspace_id, payload=payload)
