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


def test_multiuser_management(client):
    # 1. List seeded users
    users_res = client.get("/api/v1/users")
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 3
    rasika = next((u for u in users if u["email"] == "rasika@prooflens.ai"), None)
    assert rasika is not None
    assert rasika["name"] == "Rasika Kudale"
    assert rasika["role"] == "Lead Forensic Auditor"

    # 2. Create new user
    new_user_res = client.post(
        "/api/v1/users",
        json={
            "name": "Jane Compliance",
            "email": "jane.compliance@prooflens.ai",
            "role": "Regulatory Auditor",
            "avatar_color": "#ec4899",
        },
    )
    assert new_user_res.status_code == 201
    jane = new_user_res.json()
    assert jane["name"] == "Jane Compliance"
    assert jane["role"] == "Regulatory Auditor"


def test_conversation_persistence_and_retrieval(client):
    # 1. Create Workspace
    ws_res = client.post("/api/v1/workspaces", json={"name": "Multiuser Audit"})
    assert ws_res.status_code == 201
    ws_id = ws_res.json()["id"]

    # 2. Upload Document
    pdf_bytes = make_pdf("The quarterly operating cash flow reached 45 million dollars.")
    files = {"file": ("q3_cash_flow.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    up_res = client.post(f"/api/v1/workspaces/{ws_id}/documents", files=files)
    assert up_res.status_code == 201

    # 3. First Question in Conversation
    ask1 = client.post(
        f"/api/v1/workspaces/{ws_id}/ask",
        json={"question": "What was the operating cash flow?", "top_k": 3},
    )
    assert ask1.status_code == 200
    res1 = ask1.json()
    assert res1["status"] == "answered"
    assert "conversation_id" in res1
    convo_id = res1["conversation_id"]
    assert convo_id is not None

    # 4. Second Question in SAME Conversation thread
    ask2 = client.post(
        f"/api/v1/workspaces/{ws_id}/ask",
        json={
            "question": "Does this report mention liabilities?",
            "top_k": 3,
            "conversation_id": convo_id,
        },
    )
    assert ask2.status_code == 200
    res2 = ask2.json()
    assert res2["conversation_id"] == convo_id

    # 5. Retrieve Conversations for Workspace
    convos_res = client.get(f"/api/v1/workspaces/{ws_id}/conversations")
    assert convos_res.status_code == 200
    convos = convos_res.json()
    assert len(convos) >= 1
    target_convo = next((c for c in convos if c["id"] == convo_id), None)
    assert target_convo is not None
    assert target_convo["message_count"] == 4  # 2 user messages + 2 assistant messages

    # 6. Retrieve Detailed Conversation with all messages & citations
    detail_res = client.get(f"/api/v1/workspaces/{ws_id}/conversations/{convo_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["messages"]) == 4
    assert detail["messages"][0]["role"] == "user"
    assert detail["messages"][1]["role"] == "assistant"
    assert detail["messages"][1]["status"] == "answered"
    assert len(detail["messages"][1]["citations"]) >= 1

    # 7. Delete Conversation
    del_res = client.delete(f"/api/v1/workspaces/{ws_id}/conversations/{convo_id}")
    assert del_res.status_code == 200
    convos_after = client.get(f"/api/v1/workspaces/{ws_id}/conversations").json()
    assert not any(c["id"] == convo_id for c in convos_after)
