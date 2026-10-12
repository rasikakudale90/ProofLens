import uuid
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.db.models import Workspace, AnalysisRun
from app.schemas.claim import (
    ClaimAssessRequest,
    ClaimAssessResponse,
    ClaimAssessmentItem,
    ClaimStatus,
)
from app.providers.base import AIProvider
from app.providers.gemini import get_ai_provider
from app.services.retrieval import retrieve_evidence
from app.services.citation_validation import validate_and_assemble_citations

logger = logging.getLogger(__name__)


class RawLLMClaimEval(BaseModel):
    claim_text: str
    status: str = Field(..., description="supported, partially_supported, contradicted, or insufficient_evidence")
    rationale: str
    cited_chunk_ids: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)


class RawLLMClaimBatch(BaseModel):
    assessments: List[RawLLMClaimEval]


SYSTEM_CLAIM_PROMPT = """You are ProofLens AI's Claim Evidence Ledger engine.
Your task is to assess factual claims strictly against provided evidence passages.

For each claim, assign exactly ONE status:
1. 'supported' — passage(s) explicitly confirm the claim. Must cite chunk IDs.
2. 'partially_supported' — passage(s) confirm part of the claim while other parts lack evidence.
3. 'contradicted' — passage(s) directly and explicitly refute the claim.
4. 'insufficient_evidence' — passage(s) do not contain enough facts to prove or refute the claim.

NEVER guess. If support is weak or absent, choose 'insufficient_evidence'.
"""


def assess_claims(
    db: Session,
    workspace_id: str,
    payload: ClaimAssessRequest,
    ai_provider: Optional[AIProvider] = None,
) -> ClaimAssessResponse:
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Workspace {workspace_id} not found.", status_code=404)

    # Determine list of claims
    claims_to_assess: List[str] = []
    if payload.claims:
        claims_to_assess = [c.strip() for c in payload.claims if c.strip()]
    elif payload.answer:
        # Split sentences from answer as candidate claims
        raw_sentences = payload.answer.replace("\n", " ").split(". ")
        claims_to_assess = [s.strip() for s in raw_sentences if len(s.strip()) > 10]
    elif payload.question:
        claims_to_assess = [payload.question.strip()]

    if not claims_to_assess:
        raise AppError(code="INVALID_REQUEST", message="No claims or source text provided for assessment.", status_code=400)

    provider = ai_provider or get_ai_provider()
    assessed_items: List[ClaimAssessmentItem] = []

    for idx, claim_text in enumerate(claims_to_assess):
        # 1. Retrieve evidence specific to this claim
        evidence = retrieve_evidence(
            db=db,
            workspace_id=workspace_id,
            question=claim_text,
            document_ids=payload.document_ids,
            top_k=4,
            similarity_threshold=0.1,
            ai_provider=provider,
        )

        if not evidence:
            assessed_items.append(
                ClaimAssessmentItem(
                    claim_id=f"claim-{idx + 1}",
                    claim_text=claim_text,
                    status=ClaimStatus.INSUFFICIENT_EVIDENCE,
                    rationale="No relevant documents or evidence passages found.",
                    citations=[],
                    limitations=["No passages retrieved."],
                )
            )
            continue

        if not settings.GEMINI_API_KEY:
            # Deterministic mock fallback for offline tests
            first_chunk = evidence[0]
            val_cit = validate_and_assemble_citations([first_chunk.chunk_id], evidence)
            assessed_items.append(
                ClaimAssessmentItem(
                    claim_id=f"claim-{idx + 1}",
                    claim_text=claim_text,
                    status=ClaimStatus.SUPPORTED,
                    rationale=f"Supported by excerpt in {first_chunk.document_name}.",
                    citations=val_cit,
                    limitations=[],
                )
            )
            continue

        # Format prompt
        context_str = "\n".join([f"[{e.chunk_id}] {e.document_name} p.{e.page_number}: {e.excerpt}" for e in evidence])
        user_prompt = f"CLAIM TO ASSESS:\n{claim_text}\n\nEVIDENCE PASSAGES:\n{context_str}"

        try:
            eval_res = provider.generate_structured(
                system_instruction=SYSTEM_CLAIM_PROMPT,
                user_prompt=user_prompt,
                response_schema=RawLLMClaimEval,
            )
            val_cit = validate_and_assemble_citations(eval_res.cited_chunk_ids, evidence)
            
            # Guardrail: If marked supported but 0 citations verified, downgrade to insufficient_evidence
            st = eval_res.status.lower()
            if st == "supported" and not val_cit:
                st = "insufficient_evidence"

            status_enum = ClaimStatus.INSUFFICIENT_EVIDENCE
            for cs in ClaimStatus:
                if cs.value == st:
                    status_enum = cs
                    break

            assessed_items.append(
                ClaimAssessmentItem(
                    claim_id=f"claim-{idx + 1}",
                    claim_text=claim_text,
                    status=status_enum,
                    rationale=eval_res.rationale,
                    citations=val_cit,
                    limitations=eval_res.limitations,
                )
            )
        except Exception as e:
            logger.error(f"Error evaluating claim '{claim_text}': {e}")
            assessed_items.append(
                ClaimAssessmentItem(
                    claim_id=f"claim-{idx + 1}",
                    claim_text=claim_text,
                    status=ClaimStatus.INSUFFICIENT_EVIDENCE,
                    rationale="Model evaluation failed or timed out.",
                    citations=[],
                    limitations=[str(e)],
                )
            )

    # Persist AnalysisRun
    try:
        run = AnalysisRun(
            workspace_id=workspace_id,
            analysis_type="claim_ledger",
            input_data={"claims": claims_to_assess},
            result_data={"claims": [c.model_dump() for c in assessed_items]},
            status="completed",
        )
        db.add(run)
        db.commit()
    except Exception as e:
        logger.warning(f"Could not persist AnalysisRun: {e}")
        db.rollback()

    return ClaimAssessResponse(
        workspace_id=workspace_id,
        total_claims=len(assessed_items),
        claims=assessed_items,
    )
