from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session

from app.api.deps import get_database, get_storage
from app.core.errors import AppError
from app.db.models import Document, DocumentPage, DocumentChunk
from app.schemas.document import (
    DocumentResponse,
    DocumentStatusResponse,
    DocumentPageResponse,
    DocumentUploadResponse,
)
from app.storage.base import StorageService
from app.services.document_ingestion import ingest_document, delete_document

router = APIRouter(prefix="/workspaces/{workspace_id}/documents", tags=["Documents"])


@router.post("", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    workspace_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_database),
    storage: StorageService = Depends(get_storage),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise AppError(
            code="UNSUPPORTED_FILE_TYPE",
            message="Only PDF documents are supported (.pdf).",
            status_code=415,
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise AppError(code="EMPTY_DOCUMENT", message="Uploaded file is empty (0 bytes).", status_code=400)

    doc = ingest_document(
        db=db,
        storage=storage,
        workspace_id=workspace_id,
        filename=file.filename,
        file_bytes=file_bytes,
    )

    return DocumentUploadResponse(
        document_id=doc.id,
        workspace_id=doc.workspace_id,
        filename=doc.filename,
        status=doc.status,
        uploaded_at=doc.created_at,
    )


@router.get("", response_model=List[DocumentResponse])
def list_documents(workspace_id: str, db: Session = Depends(get_database)):
    return db.query(Document).filter(Document.workspace_id == workspace_id).order_by(Document.created_at.desc()).all()


@router.get("/{document_id}", response_model=DocumentStatusResponse)
def get_document_status(workspace_id: str, document_id: str, db: Session = Depends(get_database)):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.workspace_id == workspace_id,
    ).first()
    if not doc:
        raise AppError(code="RESOURCE_NOT_FOUND", message=f"Document {document_id} not found.", status_code=404)

    chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()

    return DocumentStatusResponse(
        document_id=doc.id,
        filename=doc.filename,
        status=doc.status,
        page_count=doc.page_count,
        chunk_count=chunk_count,
        error_code=doc.error_code,
        error_message=doc.error_message,
    )


@router.get("/{document_id}/pages/{page_number}", response_model=DocumentPageResponse)
def get_document_page(
    workspace_id: str,
    document_id: str,
    page_number: int,
    db: Session = Depends(get_database),
):
    page = db.query(DocumentPage).join(Document).filter(
        Document.id == document_id,
        Document.workspace_id == workspace_id,
        DocumentPage.page_number == page_number,
    ).first()
    if not page:
        raise AppError(
            code="RESOURCE_NOT_FOUND",
            message=f"Page {page_number} not found for document {document_id}.",
            status_code=404,
        )

    return DocumentPageResponse(page_number=page.page_number, text=page.text)


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def remove_document(
    workspace_id: str,
    document_id: str,
    db: Session = Depends(get_database),
    storage: StorageService = Depends(get_storage),
):
    delete_document(db=db, storage=storage, workspace_id=workspace_id, document_id=document_id)
    return {"message": "Document deleted successfully", "document_id": document_id}
