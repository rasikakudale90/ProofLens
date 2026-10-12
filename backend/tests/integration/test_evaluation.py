import pytest


def test_evaluation_run_and_summary_endpoint(client):
    # 1. Trigger evaluation run
    res = client.post("/api/v1/evaluation/run")
    assert res.status_code == 200
    data = res.json()

    assert "run_id" in data
    assert data["sample_count"] >= 3
    assert data["retrieval_hit_rate"] >= 0.0
    assert data["abstention_success_rate"] >= 0.0
    assert data["citation_validity_rate"] >= 0.0
    assert len(data["results"]) >= 3

    # Verify individual cases
    case_ids = [r["case_id"] for r in data["results"]]
    assert "eval-01" in case_ids
    assert "eval-02" in case_ids
    assert "eval-03" in case_ids

    # 2. Retrieve summary
    sum_res = client.get("/api/v1/evaluation/summary")
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert sum_data["run_id"] == data["run_id"]
    assert sum_data["sample_count"] == data["sample_count"]
