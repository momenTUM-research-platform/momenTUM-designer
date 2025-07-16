import json
from pathlib import Path

def test_create_and_fetch_study(client, test_db):
    # Load the example study payload
    payload = json.loads(
        (Path(__file__).parent.parent / "studies" / "example_new.json").read_text()
    )

    # Create the study via the API
    r1 = client.post("/api/v2/studies", json=payload)
    assert r1.status_code == 201, r1.text
    sid = r1.json()["permalink"]

    try:
        # Fetch it back and verify
        r2 = client.get(f"/api/v2/studies/{sid}")
        assert r2.status_code == 200, r2.text
        assert r2.json()["properties"]["study_id"] == payload["properties"]["study_id"]
    finally:
        # Clean up by study_id
        result = test_db["studies"].delete_one({
            "properties.study_id": payload["properties"]["study_id"]
        })
        assert result.deleted_count == 1, (
            f"Failed to delete test study with study_id="
            f"{payload['properties']['study_id']}"
        )