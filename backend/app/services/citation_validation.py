from typing import List, Dict
from app.schemas.evidence import RetrievedEvidenceItem
from app.schemas.answer import CitationItem


def validate_and_assemble_citations(
    suggested_chunk_ids: List[str],
    retrieved_evidence: List[RetrievedEvidenceItem],
) -> List[CitationItem]:
    """
    Validates model-suggested chunk IDs against the actual retrieved evidence items.
    Derives document_id, document_name, page_number, and excerpt strictly from server records.
    Discards any hallucinated or non-retrieved chunk IDs.
    """
    evidence_lookup: Dict[str, RetrievedEvidenceItem] = {
        item.chunk_id: item for item in retrieved_evidence
    }

    validated_citations: List[CitationItem] = []
    seen_chunk_ids = set()

    for idx, chunk_id in enumerate(suggested_chunk_ids):
        clean_id = chunk_id.strip()
        if clean_id in evidence_lookup and clean_id not in seen_chunk_ids:
            item = evidence_lookup[clean_id]
            validated_citations.append(
                CitationItem(
                    citation_id=f"cit-{len(validated_citations) + 1}",
                    document_id=item.document_id,
                    document_name=item.document_name,
                    page_number=item.page_number,
                    chunk_id=item.chunk_id,
                    excerpt=item.excerpt,
                )
            )
            seen_chunk_ids.add(clean_id)

    return validated_citations
