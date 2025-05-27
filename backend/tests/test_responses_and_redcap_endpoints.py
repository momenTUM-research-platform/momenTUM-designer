import json
import pytest
import httpx
from httpx import HTTPStatusError

@pytest.fixture
def stub_external_calls(monkeypatch):
    """
    Stub out all HTTP calls made via httpx.AsyncClient.post:
      - content=project → return a fake API key
      - content=record  → return a fake record list
      - otherwise → 200 OK no‐op
    """
    class DummyResponse:
        def __init__(self, *, json_data=None, text='"DUMMY"', status_code=200):
            self._json = json_data or []
            self._text = text
            self.status_code = status_code

        def raise_for_status(self):
            if not (200 <= self.status_code < 300):
                raise HTTPStatusError("HTTP error", request=None, response=self)

        @property
        def text(self):
            return self._text

        def json(self):
            return self._json

    async def fake_post(self, url, *, data=None, timeout=None):
        c = data.get("content") if data else None
        if c == "project":
            # when creating a project, REDCap returns the new API key as a bare JSON string
            return DummyResponse(text='"FAKE_API_KEY"')
        if c == "record":
            # when exporting records, return a list with one stub
            return DummyResponse(json_data=[{"field_record_id": "u1"}])
        # otherwise just OK
        return DummyResponse()

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post, raising=True)
    return None  # fixture itself returns nothing

@pytest.mark.usefixtures("stub_external_calls")
def test_save_response_and_combined_export(client, test_db):
    study_id = "s1"
    user_id  = "u1"

    # 1) POST the response
    form = {
        "data_type":           "survey",
        "user_id":             user_id,
        "study_id":            study_id,
        "module_index":        "0",
        "platform":            "web",
        "module_id":           "m1",
        "module_name":         "First Module",
        "responses":           json.dumps({"q1": "yes"}),
        "entries":             json.dumps([1, 2, 3]),
        "response_time":       "2025-05-22T12:00:00Z",
        "response_time_in_ms": "150",
        "alert_time":          "2025-05-22T12:00:01Z",
    }
    r1 = client.post("/api/v2/response", data=form)
    assert r1.status_code == 202
    assert r1.json() == {"accepted": True}

    # 2) It shouldn’t exist yet in combined → 404
    r2 = client.get(f"/api/v2/redcap/response/{study_id}/does_not_exist")
    assert r2.status_code == 404

    # 3) Seed just the two collections it needs
    test_db.responses_backup.insert_one({
        "study_id": study_id,
        "user_id":  user_id,
        "foo":      "bar"
    })
    test_db.keys.insert_one({
        "study_id": study_id,
        "api_key":  "DUMMY"
    })

    # 4) Now combined shows both Mongo & stubbed REDCap
    r3 = client.get(f"/api/v2/redcap/response/{study_id}/{user_id}")
    assert r3.status_code == 200
    body = r3.json()
    assert body["mongodb_response"]["foo"] == "bar"
    assert body["mongodb_response"]["user_id"] == user_id
    assert body["redcap_response"]["field_record_id"] == "u1"

def test_response_also_saved_to_live_collection(client, test_db):
    study_id = "s2"
    user_id  = "u2"

    form = {
        "data_type":           "pvt",
        "user_id":             user_id,
        "study_id":            study_id,
        "module_index":        "1",
        "platform":            "mobile",
        "module_id":           "m2",
        "module_name":         "Second Module",
        "responses":           None,  # or json.dumps({...})
        "entries":             json.dumps([5,6,7]),
        "response_time":       "2025-06-01T10:00:00Z",
        "response_time_in_ms": "200",
        "alert_time":          "2025-06-01T10:00:02Z",
    }

    # fire it off
    r = client.post("/api/v2/response", data=form)
    assert r.status_code == 202

    # now check the live "responses" collection
    doc = test_db.responses.find_one({
        "study_id": study_id,
        "user_id":  user_id,
        "module_id": "m2"
    })
    assert doc is not None
    assert doc["entries"] == [5,6,7]
    assert doc["response_time_in_ms"] == 200