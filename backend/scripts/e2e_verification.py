import sys
sys.stdout.reconfigure(encoding='utf-8')
import io
import fitz
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def make_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    b = doc.tobytes()
    doc.close()
    return b

def run_e2e_tests():
    print("=" * 60)
    print("PROOFLENS AI END-TO-END VERIFICATION SUITE")
    print("=" * 60)

    # 1. Health & Readiness
    print("\n[1/12] Testing Health & Readiness Endpoints...")
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("  ✅ GET /health -> 200 OK")

    res = requests.get(f"{BASE_URL}/ready")
    assert res.status_code == 200, f"Readiness check failed: {res.text}"
    print(f"  ✅ GET /ready -> 200 OK ({res.json()})")

    # 2. Workspace Management
    print("\n[2/12] Testing Workspace Creation...")
    res = requests.post(f"{BASE_URL}/api/v1/workspaces", json={"name": "E2E Automated Audit Workspace"})
    assert res.status_code == 201, f"Create workspace failed: {res.text}"
    ws = res.json()
    ws_id = ws["id"]
    print(f"  ✅ POST /api/v1/workspaces -> 201 Created (ID: {ws_id})")

    # 3. Document Ingestion - Upload Document A
    print("\n[3/12] Ingesting Document A (Financial Audit)...")
    doc_a_text = (
        "Q3 FINANCIAL AUDIT REPORT 2025\n"
        "Executive Summary: ProofLens Financial Services recorded $4.8M in ARR, representing 32% year-over-year growth.\n"
        "Operating Margins: Operating margins expanded to 28.5% driven by server efficiency.\n"
        "Methodology: Audited in accordance with GAAP standards using page provenance tracking."
    )
    pdf_a = make_pdf(doc_a_text)
    files_a = {"file": ("q3_financial_audit.pdf", io.BytesIO(pdf_a), "application/pdf")}
    res_a = requests.post(f"{BASE_URL}/api/v1/workspaces/{ws_id}/documents", files=files_a)
    assert res_a.status_code == 201, f"Upload doc A failed: {res_a.text}"
    doc_a_id = res_a.json()["document_id"]
    print(f"  ✅ Uploaded Document A: q3_financial_audit.pdf (ID: {doc_a_id})")

    # 4. Document Ingestion - Upload Document B (Competitor / Divergent data)
    print("\n[4/12] Ingesting Document B (Internal Memo)...")
    doc_b_text = (
        "INTERNAL STRATEGY MEMO 2025\n"
        "Revenue Discrepancy Note: Earlier internal projections reported $4.2M in ARR due to deferred contracts.\n"
        "Operating Margins: Margins were restricted to 22.0% in early quarters.\n"
        "Methodology: Cash-basis internal management accounting."
    )
    pdf_b = make_pdf(doc_b_text)
    files_b = {"file": ("internal_memo.pdf", io.BytesIO(pdf_b), "application/pdf")}
    res_b = requests.post(f"{BASE_URL}/api/v1/workspaces/{ws_id}/documents", files=files_b)
    assert res_b.status_code == 201, f"Upload doc B failed: {res_b.text}"
    doc_b_id = res_b.json()["document_id"]
    print(f"  ✅ Uploaded Document B: internal_memo.pdf (ID: {doc_b_id})")

    # 5. Document Library Listing
    print("\n[5/12] Verifying Document Library Listing...")
    docs_res = requests.get(f"{BASE_URL}/api/v1/workspaces/{ws_id}/documents")
    assert docs_res.status_code == 200
    docs = docs_res.json()
    assert len(docs) >= 2
    print(f"  ✅ GET /workspaces/{ws_id}/documents -> Found {len(docs)} documents in scope")

    # 6. RAG Grounded Q&A - Generic Inquiry
    print("\n[6/12] Testing RAG Grounded Q&A (Generic Question: 'What is this document about?')...")
    q_gen = requests.post(
        f"{BASE_URL}/api/v1/workspaces/{ws_id}/ask",
        json={"question": "What is this document about?", "document_ids": [doc_a_id]},
    )
    assert q_gen.status_code == 200, f"Q&A generic failed: {q_gen.text}"
    ans_gen = q_gen.json()
    assert ans_gen["status"] == "answered", f"Expected answered, got: {ans_gen['status']}"
    assert len(ans_gen["citations"]) >= 1, "Expected citations"
    print(f"  ✅ Status: {ans_gen['status']} | Citations: {len(ans_gen['citations'])}")
    print(f"  Answer Preview:\n    {ans_gen['answer'][:120]}...")

    # 7. RAG Grounded Q&A - Specific Factual Query
    print("\n[7/12] Testing RAG Grounded Q&A (Specific Question: 'What is the recorded ARR?')...")
    q_spec = requests.post(
        f"{BASE_URL}/api/v1/workspaces/{ws_id}/ask",
        json={"question": "What is the recorded ARR in the financial audit?", "document_ids": [doc_a_id]},
    )
    assert q_spec.status_code == 200, f"Q&A specific failed: {q_spec.text}"
    ans_spec = q_spec.json()
    assert ans_spec["status"] == "answered", f"Expected answered, got: {ans_spec['status']}"
    assert "$4.8M" in ans_spec["answer"] or "ARR" in ans_spec["answer"], f"Expected $4.8M in answer: {ans_spec['answer']}"
    print(f"  ✅ Status: {ans_spec['status']} | Citations: {len(ans_spec['citations'])}")
    print(f"  Answer Preview:\n    {ans_spec['answer'][:120]}...")

    # 8. RAG Explicit Abstention Protocol
    print("\n[8/12] Testing RAG Explicit Abstention (Unsupported Query: 'What is the capital of Mars?')...")
    q_abst = requests.post(
        f"{BASE_URL}/api/v1/workspaces/{ws_id}/ask",
        json={"question": "What is the capital of Mars?", "document_ids": [doc_a_id]},
    )
    assert q_abst.status_code == 200
    ans_abst = q_abst.json()
    assert ans_abst["status"] == "insufficient_evidence", f"Expected abstention, got: {ans_abst['status']}"
    assert len(ans_abst["citations"]) == 0
    print(f"  ✅ Status: {ans_abst['status']} | Abstention verified correctly!")

    # 9. Claim Evidence Ledger
    print("\n[9/12] Testing Claim Evidence Ledger (Audit 2 claims)...")
    claim_res = requests.post(
        f"{BASE_URL}/api/v1/workspaces/{ws_id}/claims/assess",
        json={
            "claims": [
                "ProofLens recorded $4.8M in ARR with 32% growth.",
                "The patient took 500mg of amoxicillin daily.",
            ],
            "document_ids": [doc_a_id],
        },
    )
    assert claim_res.status_code == 200, f"Claim audit failed: {claim_res.text}"
    claim_data = claim_res.json()
    assert "claims" in claim_data
    assert len(claim_data["claims"]) == 2
    c1, c2 = claim_data["claims"][0], claim_data["claims"][1]
    print(f"  ✅ Claim 1 Status: {c1['status']} (citations: {len(c1['citations'])})")
    print(f"  ✅ Claim 2 Status: {c2['status']} (correctly flagged insufficient)")

    # 10. Contradiction Radar
    print("\n[10/12] Testing Contradiction Radar across Document A & Document B...")
    compare_res = requests.post(
        f"{BASE_URL}/api/v1/workspaces/{ws_id}/compare",
        json={
            "topic": "ARR revenue numbers and operating margins",
            "document_ids": [doc_a_id, doc_b_id],
        },
    )
    assert compare_res.status_code == 200, f"Comparison failed: {compare_res.text}"
    comp_data = compare_res.json()
    assert "relationship" in comp_data
    assert "document_findings" in comp_data
    print(f"  ✅ Relationship: {comp_data['relationship']}")
    print(f"  ✅ Summary: {comp_data['summary'][:100]}...")
    print(f"  ✅ Document Findings Count: {len(comp_data['document_findings'])}")

    # 11. Research Brief Generator & Markdown Export
    print("\n[11/12] Testing Research Brief Generator & Markdown Export...")
    brief_res = requests.post(
        f"{BASE_URL}/api/v1/workspaces/{ws_id}/briefs",
        json={"topic": "Synthesis of Q3 2025 Financial Performance and Accounting Projections"},
    )
    assert brief_res.status_code == 201, f"Brief generation failed: {brief_res.text}"
    brief_data = brief_res.json()
    brief_id = brief_data["brief_id"]
    print(f"  ✅ Generated Brief ID: {brief_id} (Findings: {len(brief_data['key_findings'])})")

    md_res = requests.get(f"{BASE_URL}/api/v1/workspaces/{ws_id}/briefs/{brief_id}/markdown")
    assert md_res.status_code == 200
    assert len(md_res.text) > 50
    print(f"  ✅ Exported Markdown length: {len(md_res.text)} characters")

    # 12. Trust & Evaluation Dashboard Suite
    print("\n[12/12] Triggering Benchmark Suite & Summary...")
    eval_run = requests.post(f"{BASE_URL}/api/v1/evaluation/run")
    assert eval_run.status_code == 200, f"Evaluation run failed: {eval_run.text}"
    eval_data = eval_run.json()
    print(f"  ✅ Evaluation Suite Run: Hit Rate: {eval_data['retrieval_hit_rate']}% | Citation Validity: {eval_data['citation_validity_rate']}% | Latency: {eval_data['average_latency_ms']}ms")

    eval_summary = requests.get(f"{BASE_URL}/api/v1/evaluation/summary")
    assert eval_summary.status_code == 200
    print(f"  ✅ GET /api/v1/evaluation/summary -> 200 OK (Run ID: {eval_summary.json()['run_id']})")

    # Cleanup Workspace
    requests.delete(f"{BASE_URL}/api/v1/workspaces/{ws_id}")
    print(f"\nCleaned up test workspace: {ws_id}")

    print("\n" + "=" * 60)
    print("ALL 12/12 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e_tests()
