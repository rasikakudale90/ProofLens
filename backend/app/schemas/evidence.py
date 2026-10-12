from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class RetrievedEvidenceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: str
    document_name: str
    page_number: int
    chunk_id: str
    chunk_index: int
    excerpt: str
    similarity: float


class RetrievalRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The query to search relevant passages for")
    document_ids: Optional[List[str]] = Field(None, description="Optional list of document IDs to scope search")
    top_k: int = Field(5, ge=1, le=20, description="Maximum number of chunks to return")
    similarity_threshold: Optional[float] = Field(None, ge=0.0, le=1.0, description="Minimum similarity score")


class RetrievalResponse(BaseModel):
    query: str
    workspace_id: str
    retrieved_count: int
    results: List[RetrievedEvidenceItem]
