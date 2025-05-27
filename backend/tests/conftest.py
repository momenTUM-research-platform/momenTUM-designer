import asyncio
import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient
from main import app
from config import settings
from db import get_db as real_get_db

# ─── A tiny async shim around a sync PyMongo cursor ────────────────────────────
class AsyncCursorWrapper:
    def __init__(self, sync_cursor):
        self._sync_cursor = sync_cursor

    def sort(self, *args, **kwargs):
        self._sync_cursor = self._sync_cursor.sort(*args, **kwargs)
        return self

    async def to_list(self, length: int):
        # run the blocking list(...) call in a thread
        return await asyncio.to_thread(lambda: list(self._sync_cursor)[:length])

# ─── A tiny async shim around a sync PyMongo collection ────────────────────────
class AsyncCollectionWrapper:
    def __init__(self, sync_coll):
        self._sync_coll = sync_coll

    async def find_one(self, *args, **kwargs):
        return await asyncio.to_thread(self._sync_coll.find_one, *args, **kwargs)

    def find(self, *args, **kwargs):
        # return our cursor‐wrapper
        return AsyncCursorWrapper(self._sync_coll.find(*args, **kwargs))

    async def insert_one(self, doc):
        return await asyncio.to_thread(self._sync_coll.insert_one, doc)

    async def replace_one(self, filter, update, upsert=False):
        return await asyncio.to_thread(
            self._sync_coll.replace_one, filter, update, upsert
        )

    async def delete_one(self, filter):
        return await asyncio.to_thread(self._sync_coll.delete_one, filter)

    async def update_one(self, filter, update, upsert=False):
        return await asyncio.to_thread(
            self._sync_coll.update_one, filter, update, upsert
        )

# ─── And wrap the top‐level Database so __getitem__ hands back our collection shim ─
class AsyncDBWrapper:
    def __init__(self, sync_db):
        self._sync_db = sync_db
        self.client = sync_db.client  # so health-check’s db.client.admin.command still works

    def __getitem__(self, name: str):
        return AsyncCollectionWrapper(self._sync_db[name])

# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def test_db():
    """
    Yield a synchronous PyMongo Database for testing.
    Only runs if the configured DB name contains "dev" or "test".
    """
    db_name = settings.mongo_db or ""
    if not any(substr in db_name.lower() for substr in ("dev", "test")):
        pytest.skip(f"Refusing to run DB tests against '{db_name}'")
    client = MongoClient(settings.mongo_url)
    db = client[db_name]
    yield db
    client.close()

@pytest.fixture(scope="module")
def client(test_db):
    """
    Override FastAPI's get_db to hand back our AsyncDBWrapper(test_db).
    That way all `await db[...]` calls in your routes will work
    against the sync PyMongo test_db under the covers.
    """
    app.dependency_overrides[real_get_db] = lambda: AsyncDBWrapper(test_db)
    yield TestClient(app)
    app.dependency_overrides.clear()