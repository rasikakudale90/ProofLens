from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class CitationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    citation_id: str
    document_id: str
    document_name: str
    page_number: int
    chunk_id: str
    excerpt: str


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question to answer grounded in workspace documents")
    document_ids: Optional[List[str]] = Field(None, description="Optional document IDs to scope the answer")
    top_k: int = Field(5, ge=1, le=15, description="Number of evidence chunks to retrieve")
    conversation_id: Optional[str] = Field(None, description="Optional conversation thread ID to append to")
    user_id: Optional[str] = Field(None, description="Optional user ID asking the question")


class StructuredLLMAnswer(BaseModel):
    answer: str = Field(..., description="Evidence-grounded answer text")
    status: str = Field(..., description="'answered' or 'insufficient_evidence'")
    cited_chunk_ids: List[str] = Field(default_factory=list, description="List of chunk IDs supporting the answer")
    limitations: List[str] = Field(default_factory=list, description="Known evidence gaps, conflicts or limitations")


class AskResponse(BaseModel):
    query_id: str
    status: str  # answered, insufficient_evidence
    answer: str
    citations: List[CitationItem]
    limitations: List[str] = Field(default_factory=list)
    model_metadata: Dict[str, Any] = Field(default_factory=dict)
    conversation_id: Optional[str] = None
