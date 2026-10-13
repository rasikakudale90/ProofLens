import fitz
from fastapi.testclient import TestClient
from app.main import app

def main():
    client = TestClient(app)

    print("==================================================")
    print("      ProofLens AI — Local Live Verification      ")
    print("==================================================")

    # 1. Health & Ready
    print("\n[1] Checking /health and /ready endpoints...")
    res_health = client.get("/health")
    print(f" -> /health: HTTP {res_health.status_code} | {res_health.json()}")
    assert res_health.status_code == 200

    res_ready = client.get("/ready")
    print(f" -> /ready:  HTTP {res_ready.status_code} | {res_ready.json()}")
    assert res_ready.status_code == 200
    assert res_ready.json()["dependencies"]["database"] == "connected"

    # 2. Create Workspace
    print("\n[2] Creating Workspace in local PostgreSQL database...")
    res_ws = client.post("/api/v1/workspaces", json={"name": "Live Verification Workspace"})
    print(f" -> Workspace Created: HTTP {res_ws.status_code} | ID: {res_ws.json()['id']}")
    assert res_ws.status_code == 201
    ws_id = res_ws.json()["id"]

    # 3. Create & Ingest PDF
    print("\n[3] Generating and ingesting sample multi-page PDF into local PostgreSQL...")
    doc = fitz.open()
    p1 = doc.new_page()
    p1.insert_text((50, 72), "ProofLens AI Audit. Executive Summary: All claims must be verified with page provenance.")
    p2 = doc.new_page()
    p2.insert_text((50, 72), "System Architecture on Page 2: Vector embeddings are 768 dimensions using cosine similarity.")
    pdf_bytes = doc.tobytes()

    upload_files = {"file": ("audit_sample.pdf", pdf_bytes, "application/pdf")}
    res_upload = client.post(f"/api/v1/workspaces/{ws_id}/documents", files=upload_files)
    print(f" -> PDF Upload & Ingestion: HTTP {res_upload.status_code} | Status: {res_upload.json()['status']}")
    assert res_upload.status_code == 201
    doc_id = res_upload.json()["document_id"]
    print(f"    Document ID: {doc_id}")

    # 4. Scoped Vector Retrieval
    print("\n[4] Querying scoped vector retrieval from local database...")
    query_payload = {
        "question": "Where are the architecture details about 768 dimensions?",
        "document_ids": [doc_id],
        "top_k": 3
    }
    res_retrieval = client.post(f"/api/v1/workspaces/{ws_id}/retrieve", json=query_payload)
    print(f" -> Retrieval: HTTP {res_retrieval.status_code}")
    assert res_retrieval.status_code == 200
    retrieval_data = res_retrieval.json()
    chunks = retrieval_data["results"]
    print(f"    Retrieved {len(chunks)} chunk(s):")
    for idx, c in enumerate(chunks, 1):
        print(f"    [{idx}] Page {c['page_number']} (Score: {c['similarity']:.4f}): \"{c['excerpt'].strip()}\"")

    # 5. Cascading Cleanup
    print("\n[5] Testing cascading cleanup of workspace and stored PDF...")
    res_del = client.delete(f"/api/v1/workspaces/{ws_id}")
    print(f" -> Cascading Deletion: HTTP {res_del.status_code}")
    assert res_del.status_code == 200

    # 6. Verify Workspace is gone
    res_get_deleted = client.get(f"/api/v1/workspaces/{ws_id}")
    print(f" -> Confirm Deleted: HTTP {res_get_deleted.status_code}")
    assert res_get_deleted.status_code == 404

    print("\n==================================================")
    print("  SUCCESS: Local Backend Live Verification PASSED ")
    print("==================================================")

if __name__ == "__main__":
    main()
