import uuid
import logging
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.db.models import Workspace, Document, AnalysisRun
from app.schemas.comparison import (
    CompareRequest,
    CompareResponse,
    ComparisonRelationship,
    DocumentFinding,
)
from app.providers.base import AIProvider
from app.providers.gemini import get_ai_provider
from app.services.retrieval import retrieve_evidence
from app.services.citation_validation import validate_and_assemble_citations

logger = logging.getLogger(__name__)


class RawLLMDocFinding(BaseModel):
    document_id: str
    finding: str
    cited_chunk_ids: List[str] = Field(default_factory=list)


class RawLLMComparison(BaseModel):
    relationship: str = Field(..., description="agreement, difference, apparent_contradiction, or inconclusive")
    summary: str
    findings: List[RawLLMDocFinding]
    limitations: List[str] = Field(default_factory=list)


SYSTEM_COMPARE_PROMPT = """You are ProofLens AI's Contradiction Radar engine.
Compare what the provided documents say on a given topic based ONLY on the evidence excerpts provided.

CRITICAL RULES:
1. Examine evidence from each document independently.
2. Assign exactly ONE relationship:
   - 'agreement': Both documents make matching factual assertions.
   - 'difference': Documents discuss different aspects or have different focal points without directly conflicting.
   - 'apparent_contradiction': Documents make mutually exclusive claims on the same scope, time, and definitions.
   - 'inconclusive': Evidence from one or both documents is insufficient or incomparable.
3. If documents differ because of timeline dates, sample populations, or methodology definitions, state that limitation rather than forcing a contradiction!
"""


def compare_documents(
    db: Session,
    workspace_id: str,
    payload: CompareRequest,
    ai_provider: Optional[AIProvider] = None,
) -> CompareResponse:
    # 1. Validate Workspace
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Workspace {workspace_id} not found.", status_code=404)

    # 2. Validate Selected Documents (minimum 2 distinct ready documents)
    unique_doc_ids = list(set(payload.document_ids))
    if len(unique_doc_ids) < 2:
        raise AppError(
            code="INVALID_REQUEST",
            message="Contradiction Radar requires at least two distinct document IDs.",
            status_code=400,
        )

    docs = db.query(Document).filter(
        Document.id.in_(unique_doc_ids),
        Document.workspace_id == workspace_id,
        Document.status == "ready",
    ).all()

    if len(docs) < 2:
        raise AppError(
            code="DOCUMENT_NOT_READY",
            message=f"At least two ready documents are required. Found {len(docs)} ready documents in scope.",
            status_code=400,
        )

    doc_map = {d.id: d.filename for d in docs}
    provider = ai_provider or get_ai_provider()

    # 3. Retrieve Evidence Independently per Document
    doc_evidence_map = {}
    all_evidence = []
    limitations = []

    for doc_id in unique_doc_ids:
        ev = retrieve_evidence(
            db=db,
            workspace_id=workspace_id,
            question=payload.topic,
            document_ids=[doc_id],
            top_k=3,
            similarity_threshold=0.1,
            ai_provider=provider,
        )
        doc_evidence_map[doc_id] = ev
        all_evidence.extend(ev)
        if not ev:
            limitations.append(f"Document '{doc_map.get(doc_id)}' had no relevant passages on topic '{payload.topic}'.")

    # 4. Generate Comparison
    comparison_id = str(uuid.uuid4())
    findings: List[DocumentFinding] = []

    if not settings.GEMINI_API_KEY:
        # Mock mode for offline testing
        rel = ComparisonRelationship.DIFFERENCE if not limitations else ComparisonRelationship.INCONCLUSIVE
        for d_id in unique_doc_ids:
            ev_list = doc_evidence_map.get(d_id, [])
            cits = validate_and_assemble_citations([ev_list[0].chunk_id], ev_list) if ev_list else []
            findings.append(
                DocumentFinding(
                    document_id=d_id,
                    document_name=doc_map.get(d_id, "unknown.pdf"),
                    finding=f"Discusses aspects of {payload.topic} with focus on source observations.",
                    citations=cits,
                )
            )
        summary_text = f"Comparison of {len(unique_doc_ids)} documents regarding '{payload.topic}'."
    else:
        # Format Evidence Context grouped by Document
        doc_sections = []
        for d_id, ev_list in doc_evidence_map.items():
            ev_text = "\n".join([f"[{e.chunk_id}] p.{e.page_number}: {e.excerpt}" for e in ev_list]) if ev_list else "No evidence retrieved."
            doc_sections.append(f"=== DOCUMENT: {doc_map.get(d_id)} (ID: {d_id}) ===\n{ev_text}\n")

        user_prompt = f"TOPIC TO COMPARE:\n{payload.topic}\n\n" + "\n".join(doc_sections)

        try:
            raw_comp = provider.generate_structured(
                system_instruction=SYSTEM_COMPARE_PROMPT,
                user_prompt=user_prompt,
                response_schema=RawLLMComparison,
            )
            rel_str = raw_comp.relationship.lower()
            rel = ComparisonRelationship.INCONCLUSIVE
            for r in ComparisonRelationship:
                if r.value == rel_str:
                    rel = r
                    break

            summary_text = raw_comp.summary
            limitations.extend(raw_comp.limitations)

            for rf in raw_comp.findings:
                ev_list = doc_evidence_map.get(rf.document_id, [])
                cits = validate_and_assemble_citations(rf.cited_chunk_ids, ev_list)
                findings.append(
                    DocumentFinding(
                        document_id=rf.document_id,
                        document_name=doc_map.get(rf.document_id, "unknown.pdf"),
                        finding=rf.finding,
                        citations=cits,
                    )
                )
        except Exception as e:
            logger.error(f"Error in comparison generation: {e}")
            raise AppError(code="PROVIDER_ERROR", message=f"Comparison failed: {str(e)}", status_code=502)

    # Persist AnalysisRun
    try:
        run = AnalysisRun(
            workspace_id=workspace_id,
            analysis_type="contradiction_radar",
            input_data={"topic": payload.topic, "document_ids": payload.document_ids},
            result_data={
                "relationship": rel.value,
                "summary": summary_text,
                "findings": [f.model_dump() for f in findings],
            },
            status="completed",
        )
        db.add(run)
        db.commit()
    except Exception as e:
        logger.warning(f"Could not persist comparison run: {e}")
        db.rollback()

    return CompareResponse(
        comparison_id=comparison_id,
        workspace_id=workspace_id,
        topic=payload.topic,
        relationship=rel,
        summary=summary_text,
        document_findings=findings,
        limitations=limitations,
    )
