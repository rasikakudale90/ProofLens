import pytest
from app.db.models import Workspace, Document, DocumentPage, DocumentChunk


def test_workspace_and_document_creation(db_session):
    ws = Workspace(name="Test Workspace")
    db_session.add(ws)
    db_session.commit()

    assert ws.id is not None
    assert ws.name == "Test Workspace"

    doc = Document(
        workspace_id=ws.id,
        filename="sample.pdf",
        storage_key="sample_123.pdf",
        size_bytes=1024,
        status="uploaded",
        page_count=1,
    )
    db_session.add(doc)
    db_session.commit()

    assert doc.id is not None
    assert doc.status == "uploaded"
    assert len(ws.documents) == 1
    assert ws.documents[0].filename == "sample.pdf"


def test_cascade_delete_workspace(db_session):
    ws = Workspace(name="Ephemeral Workspace")
    db_session.add(ws)
    db_session.commit()

    doc = Document(
        workspace_id=ws.id,
        filename="ephemeral.pdf",
        storage_key="ephemeral.pdf",
        size_bytes=2048,
        status="ready",
    )
    db_session.add(doc)
    db_session.commit()

    page = DocumentPage(
        document_id=doc.id,
        page_number=1,
        text="Sample page text",
    )
    db_session.add(page)
    db_session.commit()

    # Deleting workspace should cascade to documents and pages
    db_session.delete(ws)
    db_session.commit()

    assert db_session.query(Document).filter_by(id=doc.id).first() is None
    assert db_session.query(DocumentPage).filter_by(id=page.id).first() is None
