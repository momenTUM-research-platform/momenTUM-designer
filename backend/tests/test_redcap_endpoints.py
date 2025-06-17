import os
import uuid
import json
from pathlib import Path

import pytest
import httpx
import pymongo
from fastapi.testclient import TestClient

from main import app
from config import settings

# ─── Stub out all httpx async POSTs ────────────────────────────────────────────

class DummyResponse:
    def __init__(self, *, json_data=None, text='"FAKE_API_KEY"', status_code=200):
        self._json = [] if json_data is None else json_data
        self._text = text
        self.status_code = status_code

    def raise_for_status(self):
        if not (200 <= self.status_code < 300):
            raise httpx.HTTPStatusError("HTTP error", request=None, response=self)

    @property
    def text(self):
        return self._text

    def json(self):
        return self._json

@pytest.fixture(autouse=True)
def stub_httpx(monkeypatch):
    async def fake_post(self, url, *, data=None, timeout=None):
        c = data.get("content") if data else None
        if c == "project":
            # REDCap returns the new API key as a quoted string
            return DummyResponse(text='"FAKE_API_KEY"', status_code=200)
        if c == "record":
            # Export will return a list of records
            return DummyResponse(json_data=[{"field_record_id": "u1"}], status_code=200)
        # metadata, repeatingFormsEvents, user → just no-op 200
        return DummyResponse(status_code=200)

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post, raising=True)

client = TestClient(app)

@pytest.fixture
def example_study_payload():
    p = Path(__file__).parent.parent / "studies" / "example_new.json"
    return json.loads(p.read_text())

def test_create_redcap_project(client, example_study_payload):
    # 0) mutate to a unique study_id
    base_id = example_study_payload["properties"]["study_id"]
    unique_id = f"{base_id}_{uuid.uuid4().hex}"
    example_study_payload["properties"]["study_id"] = unique_id
    study_id = unique_id

    # Prepare for cleanup using your config settings
    mongo_client = pymongo.MongoClient(settings.mongo_url)
    db = mongo_client[settings.mongo_db]

    try:
        # 1) first create → 201 Created, no api_key in body
        r1 = client.post(f"/api/v2/redcap/project/alice", json=example_study_payload)
        assert r1.status_code == 201, r1.text
        body1 = r1.json()
        assert "created" in body1["message"].lower()
        assert "api_key" not in body1

        # 2) ensure it was persisted (via debug route)
        dbg = client.get(f"/api/v2/redcap/keys/{study_id}")
        assert dbg.status_code == 200, dbg.text
        key_doc = dbg.json()["key"]
        assert key_doc and key_doc["api_key"] == "FAKE_API_KEY"

        # 3) second create → 200 OK, “already exists”, still no api_key in body
        r2 = client.post(f"/api/v2/redcap/project/alice", json=example_study_payload)
        assert r2.status_code == 200, r2.text
        body2 = r2.json()
        assert "already exists" in body2["message"].lower()
        assert "api_key" not in body2

        # 4) persistence didn’t change
        dbg2 = client.get(f"/api/v2/redcap/keys/{study_id}")
        assert dbg2.status_code == 200, dbg2.text
        key_doc2 = dbg2.json()["key"]
        assert key_doc2 and key_doc2["api_key"] == "FAKE_API_KEY"

    finally:
        # always delete our test key so future runs start clean
        db["keys"].delete_one({"study_id": study_id})