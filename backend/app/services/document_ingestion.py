import uuid
import logging
from typing import Optional, Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.db.models import Workspace, Document, DocumentPage, DocumentChunk
from app.storage.base import StorageService
from app.services.pdf_extraction import extract_pdf_pages, calculate_sha256
from app.services.chunking import chunk_extracted_pages

logger = logging.getLogger(__name__)


def ingest_document(
    db: Session,
    storage: StorageService,
    workspace_id: str,
    filename: str,
    file_bytes: bytes,
    ai_provider: Optional[Any] = None,
) -> Document:
    # 1. Validate Workspace
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Workspace {workspace_id} not found.", status_code=404)

    # 2. Check Document Limit
    existing_count = db.query(Document).filter(Document.workspace_id == workspace_id).count()
    if existing_count >= settings.MAX_DOCUMENTS_PER_WORKSPACE:
        raise AppError(
            code="FILE_LIMIT_EXCEEDED",
            message=f"Workspace document limit reached (maximum {settings.MAX_DOCUMENTS_PER_WORKSPACE} documents).",
            status_code=413,
        )

    # 3. Check File Size Limit
    file_size = len(file_bytes)
    if file_size > settings.MAX_UPLOAD_BYTES:
        max_mb = settings.MAX_UPLOAD_BYTES / (1024 * 1024)
        raise AppError(
            code="FILE_LIMIT_EXCEEDED",
            message=f"Uploaded file exceeds limit of {max_mb:.1f} MB.",
            status_code=413,
        )

    # 4. Generate Storage Key & Store File
    checksum = calculate_sha256(file_bytes)
    unique_prefix = uuid.uuid4().hex[:8]
    storage_key = f"{workspace_id}/{unique_prefix}_{filename}"

    try:
        storage.upload_file(storage_key, file_bytes, content_type="application/pdf")
    except Exception as e:
        logger.warning(f"Primary storage upload failed for {filename} ({e}). Falling back to local storage...")
        try:
            from app.storage.local import LocalStorageService
            fallback = LocalStorageService()
            fallback.upload_file(storage_key, file_bytes, content_type="application/pdf")
            logger.info(f"Fallback storage upload succeeded for {filename}")
        except Exception as fb_err:
            logger.error(f"Both storage backends failed for {filename}: {fb_err}")
            raise AppError(
                code="STORAGE_ERROR",
                message=f"Failed to save uploaded document to storage: {e}",
                status_code=500,
                details={"primary_error": str(e), "fallback_error": str(fb_err)},
            )

    # 5. Create initial Document DB record
    doc = Document(
        workspace_id=workspace_id,
        filename=filename,
        storage_key=storage_key,
        size_bytes=file_size,
        status="processing",
        checksum=checksum,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 6. Extract Text & Chunking
    try:
        pages, page_count = extract_pdf_pages(file_bytes)
        doc.page_count = page_count

        # Persist extracted pages
        for p in pages:
            db_page = DocumentPage(
                document_id=doc.id,
                page_number=p.page_number,
                text=p.text,
                text_hash=p.text_hash,
            )
            db.add(db_page)

        # Generate chunks and embeddings
        chunks = chunk_extracted_pages(pages)
        chunk_texts = [c.text for c in chunks]

        # Generate embeddings if provider is available
        from app.providers.gemini import get_ai_provider
        provider = ai_provider or get_ai_provider()
        embeddings = provider.embed_batch(chunk_texts) if chunk_texts else []

        for idx, c in enumerate(chunks):
            chunk_embedding = embeddings[idx] if idx < len(embeddings) else None
            db_chunk = DocumentChunk(
                document_id=doc.id,
                page_number=c.page_number,
                chunk_index=c.chunk_index,
                text=c.text,
                start_char=c.start_char,
                end_char=c.end_char,
                embedding_model=settings.GEMINI_EMBEDDING_MODEL,
                embedding=chunk_embedding,
            )
            db.add(db_chunk)

        doc.status = "ready"
        db.commit()
        db.refresh(doc)
        logger.info(f"Successfully processed document {doc.id} ({filename}) with {page_count} pages and {len(chunks)} chunks.")
        return doc

    except AppError as e:
        doc.status = "failed"
        doc.error_code = e.code
        doc.error_message = e.message
        db.commit()
        db.refresh(doc)
        raise e
    except Exception as e:
        logger.exception(f"Unexpected processing error for document {doc.id}: {e}")
        doc.status = "failed"
        doc.error_code = "PROCESSING_ERROR"
        doc.error_message = str(e)
        db.commit()
        db.refresh(doc)
        raise AppError(
            code="PROCESSING_ERROR",
            message=f"Failed to process document {filename}: {str(e)}",
            status_code=500,
        )


def delete_document(db: Session, storage: StorageService, workspace_id: str, document_id: str) -> bool:
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.workspace_id == workspace_id,
    ).first()
    if not doc:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Document {document_id} not found.", status_code=404)

    # Remove from storage
    try:
        storage.delete_file(doc.storage_key)
    except Exception as e:
        logger.warning(f"Error removing storage file {doc.storage_key}: {e}")

    # Delete database record (cascades to pages, chunks, citations)
    db.delete(doc)
    db.commit()
    return True
