import math
import re
from typing import List, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.errors import AppError
from app.db.models import Workspace, Document, DocumentChunk
from app.providers.base import AIProvider
from app.providers.gemini import get_ai_provider
from app.schemas.evidence import RetrievedEvidenceItem

STOPWORDS: Set[str] = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "up", "into", "over", "after", "is", "are", "was",
    "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "what", "who", "which", "where", "when", "why", "how", "can", "could", "should",
    "would", "will", "this", "that", "these", "those", "it", "its", "i", "you", "he", "she",
    "me", "my", "we", "our", "us", "they", "them", "their", "please"
}

GENERIC_QUERY_INDICATORS = [
    "what is this", "what is the document", "what is this pdf", "summarize",
    "summary", "overview", "who is", "about this", "tell me about",
    "main points", "key points", "what does this document say", "what does this file",
    "describe", "give me", "brief overview", "outline", "background", "what is this about",
    "explain this", "what's this", "whats this"
]


def is_generic_query(question: str) -> bool:
    q_norm = question.strip().lower()
    for ind in GENERIC_QUERY_INDICATORS:
        if ind in q_norm:
            return True
    return False


def extract_keywords(text_str: str) -> List[str]:
    words = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text_str.lower())
    return [w for w in words if w not in STOPWORDS]


def compute_lexical_score(query: str, chunk_text: str) -> float:
    chunk_lower = chunk_text.lower()
    q_lower = query.strip().lower()
    keywords = extract_keywords(query)
    if not keywords:
        return 0.5 if is_generic_query(query) else 0.0

    score = 0.0
    # Exact multi-word phrase boost
    if len(keywords) >= 2 and q_lower in chunk_lower:
        score += 0.5

    matched_keywords = 0
    for kw in keywords:
        stem = kw.rstrip("s") if len(kw) > 3 else kw
        if kw in chunk_lower or (len(stem) >= 3 and stem in chunk_lower):
            matched_keywords += 1
            count = chunk_lower.count(stem)
            score += min(0.25, 0.05 * count)

    keyword_coverage = matched_keywords / len(keywords)
    score += keyword_coverage * 0.5
    return min(1.0, score)


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)


def retrieve_evidence(
    db: Session,
    workspace_id: str,
    question: str,
    document_ids: Optional[List[str]] = None,
    top_k: int = settings.RETRIEVAL_TOP_K,
    similarity_threshold: Optional[float] = settings.SIMILARITY_THRESHOLD,
    ai_provider: Optional[AIProvider] = None,
) -> List[RetrievedEvidenceItem]:
    # 1. Validate Workspace
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Workspace {workspace_id} not found.", status_code=404)

    # 2. Scope Documents
    doc_query = db.query(Document).filter(
        Document.workspace_id == workspace_id,
        Document.status == "ready",
    )
    if document_ids:
        doc_query = doc_query.filter(Document.id.in_(document_ids))
    ready_docs = {d.id: d.filename for d in doc_query.all()}

    if not ready_docs:
        # No ready documents in scope
        return []

    is_generic = is_generic_query(question)

    # 3. Embed Query (if real provider is configured)
    query_vector = None
    try:
        provider = ai_provider or get_ai_provider()
        query_vector = provider.embed_text(question)
    except Exception as e:
        logger.warning(f"Vector embedding for query failed ({e}), falling back to lexical search.")
        query_vector = None

    # 4. Query Chunks
    # If using PostgreSQL with pgvector enabled AND Gemini API key configured
    if db.bind and db.bind.dialect.name == "postgresql" and settings.USE_PGVECTOR and settings.GEMINI_API_KEY and query_vector:
        stmt = text("""
            SELECT 
                c.id AS chunk_id,
                c.document_id,
                c.page_number,
                c.chunk_index,
                c.text,
                (1 - (c.embedding <=> :qvec)) AS similarity
            FROM document_chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.workspace_id = :ws_id
              AND d.status = 'ready'
              AND (:doc_ids IS NULL OR c.document_id = ANY(:doc_ids))
            ORDER BY c.embedding <=> :qvec ASC
            LIMIT :limit
        """)
        try:
            res = db.execute(
                stmt,
                {
                    "qvec": str(query_vector),
                    "ws_id": workspace_id,
                    "doc_ids": document_ids if document_ids else None,
                    "limit": top_k,
                },
            ).fetchall()
            items: List[RetrievedEvidenceItem] = []
            for row in res:
                sim = float(row.similarity)
                if not is_generic and similarity_threshold is not None and sim < similarity_threshold:
                    continue
                items.append(
                    RetrievedEvidenceItem(
                        document_id=row.document_id,
                        document_name=ready_docs.get(row.document_id, "unknown.pdf"),
                        page_number=row.page_number,
                        chunk_id=row.chunk_id,
                        chunk_index=row.chunk_index,
                        excerpt=row.text,
                        similarity=round(sim, 4),
                    )
                )
            if items:
                return items
        except Exception:
            db.rollback()

    # Universal Hybrid Retrieval: Retrieve scoped chunks and rank with hybrid lexical/semantic scoring
    chunk_query = db.query(DocumentChunk).filter(DocumentChunk.document_id.in_(ready_docs.keys()))
    all_chunks = chunk_query.all()

    scored_chunks = []
    has_real_embeddings = bool(settings.GEMINI_API_KEY)

    for chunk in all_chunks:
        lexical = compute_lexical_score(question, chunk.text)
        
        if is_generic:
            # For generic queries, prioritize introductory and early chunks of each document
            position_bias = max(0.1, 0.9 - (chunk.chunk_index * 0.05))
            score = max(0.65, position_bias)
        elif has_real_embeddings and chunk.embedding:
            emb_list = list(chunk.embedding) if hasattr(chunk.embedding, "__iter__") else []
            cosine_sim = cosine_similarity(query_vector, emb_list)
            score = (0.6 * cosine_sim) + (0.4 * lexical)
        else:
            score = lexical

        # Filtering threshold for specific queries
        if not is_generic and has_real_embeddings and similarity_threshold is not None:
            if score < similarity_threshold:
                continue
        elif not is_generic and not has_real_embeddings:
            # In offline mode, if there are no matching keywords at all, exclude it
            if score <= 0.05:
                continue

        scored_chunks.append((score, chunk))

    # Sort descending by score
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    top_chunks = scored_chunks[:top_k]

    return [
        RetrievedEvidenceItem(
            document_id=chunk.document_id,
            document_name=ready_docs.get(chunk.document_id, "unknown.pdf"),
            page_number=chunk.page_number,
            chunk_id=chunk.id,
            chunk_index=chunk.chunk_index,
            excerpt=chunk.text,
            similarity=round(score, 4),
        )
        for score, chunk in top_chunks
    ]

