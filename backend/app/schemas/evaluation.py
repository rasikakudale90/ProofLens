from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class EvaluationResultItem(BaseModel):
    case_id: str
    question: str
    expected_behaviour: str
    actual_status: str
    passed: bool
    latency_ms: float
    notes: str


class EvaluationSummaryResponse(BaseModel):
    run_id: str
    sample_count: int
    retrieval_hit_rate: float = Field(..., description="Hit rate on curated questions (%)")
    citation_validity_rate: float = Field(..., description="Proportion of citations resolving to stored chunks (%)")
    abstention_success_rate: float = Field(..., description="Proportion of unsupported questions correctly abstaining (%)")
    average_latency_ms: float
    provider_error_count: int = 0
    results: List[EvaluationResultItem]
