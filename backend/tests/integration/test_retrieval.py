import io
import fitz
import pytest


def make_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    b = doc.tobytes()
    doc.close()
    return b


def test_semantic_retrieval_flow(client):
    # 1. Create Workspace
    ws_res = client.post("/api/v1/workspaces", json={"name": "Retrieval Workspace"})
    assert ws_res.status_code == 201
    ws_id = ws_res.json()["id"]

    # 2. Upload Document A (Database performance)
    pdf_a = make_pdf("PostgreSQL with pgvector enables high throughput vector similarity search.")
    files_a = {"file": ("database_report.pdf", io.BytesIO(pdf_a), "application/pdf")}
    res_a = client.post(f"/api/v1/workspaces/{ws_id}/documents", files=files_a)
    assert res_a.status_code == 201
    doc_a_id = res_a.json()["document_id"]

    # 3. Upload Document B (Frontend architecture)
    pdf_b = make_pdf("Next.js provides server side rendering and dynamic routing for modern web applications.")
    files_b = {"file": ("frontend_report.pdf", io.BytesIO(pdf_b), "application/pdf")}
    res_b = client.post(f"/api/v1/workspaces/{ws_id}/documents", files=files_b)
    assert res_b.status_code == 201
    doc_b_id = res_b.json()["document_id"]

    # 4. Search across all documents in workspace
    ret_res = client.post(
        f"/api/v1/workspaces/{ws_id}/retrieve",
        json={"question": "What database technology is used for vectors?", "top_k": 3},
    )
    assert ret_res.status_code == 200
    ret_data = ret_res.json()
    assert ret_data["retrieved_count"] >= 1
    assert len(ret_data["results"]) >= 1

    # Check evidence item structure
    first_hit = ret_data["results"][0]
    assert "document_id" in first_hit
    assert "document_name" in first_hit
    assert "page_number" in first_hit
    assert "chunk_id" in first_hit
    assert "excerpt" in first_hit
    assert "similarity" in first_hit

    # 5. Scoped search specifically to Document B
    scoped_res = client.post(
        f"/api/v1/workspaces/{ws_id}/retrieve",
        json={
            "question": "What technology is used for vectors?",
            "document_ids": [doc_b_id],
            "top_k": 3,
        },
    )
    assert scoped_res.status_code == 200
    scoped_data = scoped_res.json()
    for item in scoped_data["results"]:
        assert item["document_id"] == doc_b_id
