import io
import fitz
import pytest

from app.services.citation_validation import validate_and_assemble_citations
from app.schemas.evidence import RetrievedEvidenceItem


def make_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    b = doc.tobytes()
    doc.close()
    return b


def test_citation_validation_strips_hallucinations():
    real_evidence = [
        RetrievedEvidenceItem(
            document_id="doc-123",
            document_name="spec.pdf",
            page_number=3,
            chunk_id="chunk-real-1",
            chunk_index=0,
            excerpt="Real excerpt text from page 3.",
            similarity=0.92,
        )
    ]

    # Model suggests real chunk AND a completely invented chunk ID
    suggested = ["chunk-real-1", "hallucinated-chunk-999"]
    validated = validate_and_assemble_citations(suggested, real_evidence)

    assert len(validated) == 1
    assert validated[0].chunk_id == "chunk-real-1"
    assert validated[0].document_id == "doc-123"
    assert validated[0].document_name == "spec.pdf"
    assert validated[0].page_number == 3
    assert validated[0].citation_id == "cit-1"


def test_grounded_qa_flow(client):
    # 1. Create Workspace
    ws_res = client.post("/api/v1/workspaces", json={"name": "QA Workspace"})
    assert ws_res.status_code == 201
    ws_id = ws_res.json()["id"]

    # 2. Upload Document
    pdf_bytes = make_pdf("Lead times increased by 40 percent due to global supplier shortages.")
    files = {"file": ("supply_chain.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    up_res = client.post(f"/api/v1/workspaces/{ws_id}/documents", files=files)
    assert up_res.status_code == 201
    doc_id = up_res.json()["document_id"]

    # 3. Ask Answerable Question
    ask_res = client.post(
        f"/api/v1/workspaces/{ws_id}/ask",
        json={"question": "Why did lead times increase?", "top_k": 3},
    )
    assert ask_res.status_code == 200
    ans_data = ask_res.json()
    assert ans_data["status"] == "answered"
    assert len(ans_data["answer"]) > 0
    assert len(ans_data["citations"]) >= 1

    first_cit = ans_data["citations"][0]
    assert first_cit["document_id"] == doc_id
    assert first_cit["document_name"] == "supply_chain.pdf"
    assert first_cit["page_number"] == 1
    assert "lead times" in first_cit["excerpt"].lower()


def test_unsupported_question_abstains(client):
    # Empty workspace
    ws_res = client.post("/api/v1/workspaces", json={"name": "Empty Workspace"})
    ws_id = ws_res.json()["id"]

    ask_res = client.post(
        f"/api/v1/workspaces/{ws_id}/ask",
        json={"question": "What is the capital of Mars?", "top_k": 3},
    )
    assert ask_res.status_code == 200
    ans_data = ask_res.json()
    assert ans_data["status"] == "insufficient_evidence"
    assert len(ans_data["citations"]) == 0
    assert "insufficient" in ans_data["answer"].lower()
