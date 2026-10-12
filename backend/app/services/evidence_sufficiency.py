from typing import List, Tuple
from app.schemas.evidence import RetrievedEvidenceItem
from app.core.config import settings


def check_evidence_sufficiency(
    evidence_items: List[RetrievedEvidenceItem],
    min_threshold: float = settings.SIMILARITY_THRESHOLD,
) -> Tuple[bool, str]:
    """
    Evaluates whether the retrieved evidence items provide a sufficient baseline
    to answer the user's question without guessing.
    Returns (is_sufficient, reason).
    """
    if not evidence_items:
        return False, "No relevant passages were found in the selected documents."

    # When running offline without GEMINI_API_KEY, pseudo-embeddings do not have semantic calibration
    if not settings.GEMINI_API_KEY:
        return True, "Sufficient evidence retrieved (mock mode)."

    top_score = max(item.similarity for item in evidence_items)
    if top_score < min_threshold:
        return False, f"Retrieved passages have low similarity score ({top_score:.2f} < {min_threshold:.2f})."

    return True, "Sufficient evidence retrieved."
