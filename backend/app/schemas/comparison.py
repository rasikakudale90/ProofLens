from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.answer import CitationItem


class ComparisonRelationship(str, Enum):
    AGREEMENT = "agreement"
    DIFFERENCE = "difference"
    APPARENT_CONTRADICTION = "apparent_contradiction"
    INCONCLUSIVE = "inconclusive"


class CompareRequest(BaseModel):
    topic: str = Field(..., min_length=2, description="Topic, question or proposition to compare across documents")
    document_ids: List[str] = Field(..., min_length=2, description="At least two distinct ready document IDs")


class DocumentFinding(BaseModel):
    document_id: str
    document_name: str
    finding: str
    citations: List[CitationItem] = Field(default_factory=list)


class CompareResponse(BaseModel):
    comparison_id: str
    workspace_id: str
    topic: str
    relationship: ComparisonRelationship
    summary: str
    document_findings: List[DocumentFinding]
    limitations: List[str] = Field(default_factory=list)
