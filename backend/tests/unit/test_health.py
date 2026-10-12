def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ProofLens AI" in data["app"]


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["docs"] == "/docs"


def test_custom_headers_in_response(client):
    response = client.get("/health")
    assert "X-Request-ID" in response.headers
    assert "X-Response-Time-Ms" in response.headers
