import json
from pathlib import Path

def test_create_and_fetch_study(client):
    payload = json.loads(
        (Path(__file__).parent.parent / "studies" / "example.json").read_text()
    )
    # Create
    r1 = client.post("/api/v2/studies", json=payload)
    assert r1.status_code == 201, r1.text
    sid = r1.json()["permalink"]

    # Fetch single
    r2 = client.get(f"/api/v2/studies/{sid}")
    assert r2.status_code == 200, r2.text
    assert r2.json()["properties"]["study_id"] == payload["properties"]["study_id"]
