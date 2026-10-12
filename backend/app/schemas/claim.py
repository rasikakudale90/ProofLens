from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.answer import CitationItem


class ClaimStatus(str, Enum):
    SUPPORTED = "supported"
    PARTIALLY_SUPPORTED = "partially_supported"
    CONTRADICTED = "contradicted"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


class ClaimAssessRequest(BaseModel):
    claims: Optional[List[str]] = Field(None, description="Explicit list of factual claims to assess")
    question: Optional[str] = Field(None, description="Optional question context")
    answer: Optional[str] = Field(None, description="Optional generated answer from which to extract claims")
    document_ids: Optional[List[str]] = Field(None, description="Optional document IDs to scope evidence")


class ClaimAssessmentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    claim_id: str
    claim_text: str
    status: ClaimStatus
    rationale: str
    citations: List[CitationItem] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)


class ClaimAssessResponse(BaseModel):
    workspace_id: str
    total_claims: int
    claims: List[ClaimAssessmentItem]
