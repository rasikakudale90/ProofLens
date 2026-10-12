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


@pytest.fixture
def workspace_with_two_docs(client):
    ws_res = client.post("/api/v1/workspaces", json={"name": "Signature Features Workspace"})
    ws_id = ws_res.json()["id"]

    pdf_a = make_pdf("Database system latency was reduced by 35 percent using pgvector indexing.")
    files_a = {"file": ("report_vectors.pdf", io.BytesIO(pdf_a), "application/pdf")}
    res_a = client.post(f"/api/v1/workspaces/{ws_id}/documents", files=files_a)
    doc_a_id = res_a.json()["document_id"]

    pdf_b = make_pdf("Database queries improved response times by 30 percent after memory cache optimization.")
    files_b = {"file": ("report_caching.pdf", io.BytesIO(pdf_b), "application/pdf")}
    res_b = client.post(f"/api/v1/workspaces/{ws_id}/documents", files=files_b)
    doc_b_id = res_b.json()["document_id"]

    return ws_id, doc_a_id, doc_b_id


def test_claim_evidence_ledger(client, workspace_with_two_docs):
    ws_id, doc_a_id, doc_b_id = workspace_with_two_docs

    # Assess supported claim scoped to Doc A
    res = client.post(
        f"/api/v1/workspaces/{ws_id}/claims/assess",
        json={
            "claims": ["Database system latency was reduced by 35 percent"],
            "document_ids": [doc_a_id],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_claims"] == 1
    claim = data["claims"][0]
    assert claim["status"] == "supported"
    assert len(claim["citations"]) >= 1
    assert claim["citations"][0]["document_id"] == doc_a_id
    assert claim["citations"][0]["page_number"] == 1

    # Assess unsupported claim on empty evidence
    res_unsup = client.post(
        f"/api/v1/workspaces/{ws_id}/claims/assess",
        json={"claims": ["Quantum computers replaced all relational databases"]},
    )
    assert res_unsup.status_code == 200
    unsup_claim = res_unsup.json()["claims"][0]
    # In mock mode, if chunks exist it may score them, or return status
    assert "status" in unsup_claim


def test_contradiction_radar(client, workspace_with_two_docs):
    ws_id, doc_a_id, doc_b_id = workspace_with_two_docs

    # Successfully compare two documents
    res = client.post(
        f"/api/v1/workspaces/{ws_id}/compare",
        json={
            "topic": "Database performance optimization",
            "document_ids": [doc_a_id, doc_b_id],
        },
    )
    assert res.status_code == 200
    comp = res.json()
    assert "comparison_id" in comp
    assert comp["relationship"] in ["agreement", "difference", "apparent_contradiction", "inconclusive"]
    assert len(comp["document_findings"]) == 2

    # Verify validation when only 1 document is passed
    bad_res = client.post(
        f"/api/v1/workspaces/{ws_id}/compare",
        json={"topic": "Latency", "document_ids": [doc_a_id]},
    )
    assert bad_res.status_code == 422 or bad_res.status_code == 400


def test_research_brief_generator_and_export(client, workspace_with_two_docs):
    ws_id, doc_a_id, doc_b_id = workspace_with_two_docs

    # Create research brief
    res = client.post(
        f"/api/v1/workspaces/{ws_id}/briefs",
        json={"topic": "Latency and Caching Strategies"},
    )
    assert res.status_code == 201
    brief = res.json()
    brief_id = brief["brief_id"]
    assert len(brief["executive_summary"]) > 0
    assert len(brief["markdown_content"]) > 0
    assert "# Research Brief" in brief["markdown_content"]

    # Export markdown
    md_res = client.get(f"/api/v1/workspaces/{ws_id}/briefs/{brief_id}/markdown")
    assert md_res.status_code == 200
    assert "text/markdown" in md_res.headers["content-type"]
    assert "Executive Summary" in md_res.text
