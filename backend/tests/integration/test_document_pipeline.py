import io
import fitz
import pytest


def make_pdf_bytes(text: str = "ProofLens AI provides evidence-first document intelligence.") -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    b = doc.tobytes()
    doc.close()
    return b


def test_full_document_pipeline(client):
    # 1. Create Workspace
    ws_res = client.post("/api/v1/workspaces", json={"name": "Integration Workspace"})
    assert ws_res.status_code == 201
    ws = ws_res.json()
    ws_id = ws["id"]
    assert ws["name"] == "Integration Workspace"

    # 2. Upload Document
    pdf_bytes = make_pdf_bytes("Section 1: The model establishes citations with high precision.")
    files = {"file": ("report.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    upload_res = client.post(f"/api/v1/workspaces/{ws_id}/documents", files=files)
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    doc_id = doc_data["document_id"]
    assert doc_data["status"] == "ready"
    assert doc_data["filename"] == "report.pdf"

    # 3. List Documents
    list_res = client.get(f"/api/v1/workspaces/{ws_id}/documents")
    assert list_res.status_code == 200
    docs = list_res.json()
    assert len(docs) == 1
    assert docs[0]["id"] == doc_id
    assert docs[0]["page_count"] == 1

    # 4. Get Document Status
    status_res = client.get(f"/api/v1/workspaces/{ws_id}/documents/{doc_id}")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["status"] == "ready"
    assert status_data["chunk_count"] >= 1

    # 5. Get Extracted Page 1 Text
    page_res = client.get(f"/api/v1/workspaces/{ws_id}/documents/{doc_id}/pages/1")
    assert page_res.status_code == 200
    page_data = page_res.json()
    assert page_data["page_number"] == 1
    assert "The model establishes citations" in page_data["text"]

    # 6. Delete Document
    del_res = client.delete(f"/api/v1/workspaces/{ws_id}/documents/{doc_id}")
    assert del_res.status_code == 200

    # 7. Verify Document is gone
    get_res = client.get(f"/api/v1/workspaces/{ws_id}/documents/{doc_id}")
    assert get_res.status_code == 404


def test_upload_non_pdf_rejected(client):
    ws_res = client.post("/api/v1/workspaces", json={"name": "Type Test Workspace"})
    ws_id = ws_res.json()["id"]

    files = {"file": ("notes.txt", io.BytesIO(b"Hello world text file"), "text/plain")}
    res = client.post(f"/api/v1/workspaces/{ws_id}/documents", files=files)
    assert res.status_code == 415
    assert res.json()["error"]["code"] == "UNSUPPORTED_FILE_TYPE"
