import math
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.errors import AppError
from app.db.models import Workspace, Document, DocumentChunk
from app.providers.base import AIProvider
from app.providers.gemini import get_ai_provider
from app.schemas.evidence import RetrievedEvidenceItem


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

    # 3. Embed Query
    provider = ai_provider or get_ai_provider()
    query_vector = provider.embed_text(question)

    # 4. Query Chunks
    # If using PostgreSQL with pgvector
    if db.bind and db.bind.dialect.name == "postgresql":
        # Using pgvector cosine distance: <=> operator
        # similarity = 1 - (embedding <=> query_vector)
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
        # We can run pgvector query or fallback
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
                if similarity_threshold is not None and sim < similarity_threshold:
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
            return items
        except Exception:
            pass  # Fallback to in-python similarity if pgvector extension or query fails

    # Universal / SQLite Fallback: Retrieve scoped chunks and rank in memory
    chunk_query = db.query(DocumentChunk).filter(DocumentChunk.document_id.in_(ready_docs.keys()))
    all_chunks = chunk_query.all()

    scored_chunks = []
    for chunk in all_chunks:
        if not chunk.embedding:
            continue
        # chunk.embedding can be a list or vector
        emb_list = list(chunk.embedding) if hasattr(chunk.embedding, "__iter__") else []
        sim = cosine_similarity(query_vector, emb_list)
        if similarity_threshold is not None and sim < similarity_threshold:
            continue
        scored_chunks.append((sim, chunk))

    # Sort descending by similarity
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
