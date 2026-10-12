from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.answer import CitationItem


class BriefFinding(BaseModel):
    statement: str
    citations: List[CitationItem] = Field(default_factory=list)


class BriefCreateRequest(BaseModel):
    topic: str = Field(..., min_length=2, description="Research topic or question to synthesize")
    document_ids: Optional[List[str]] = Field(None, description="Optional scoped documents")


class BriefResponse(BaseModel):
    brief_id: str
    workspace_id: str
    topic: str
    executive_summary: str
    key_findings: List[BriefFinding]
    disagreements: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    markdown_content: str
