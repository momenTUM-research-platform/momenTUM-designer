import asyncio
import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient
from main import app
from config import settings
from db import get_db as real_get_db

# Async wrapper for a synchronous PyMongo cursor to call .to_list() in async code
class AsyncCursorWrapper:
    def __init__(self, sync_cursor):
        self._sync_cursor = sync_cursor

    def sort(self, *args, **kwargs):
        # Delegate to the sync cursor’s sort, and return self for chaining
        self._sync_cursor = self._sync_cursor.sort(*args, **kwargs)
        return self

    async def to_list(self, length: int):
        # Run the blocking list(...) call on a thread pool
        return await asyncio.to_thread(lambda: list(self._sync_cursor)[:length])


# Async wrapper for a synchronous PyMongo collection
# Exposes the same API as Motor’s async Collection
class AsyncCollectionWrapper:
    def __init__(self, sync_coll):
        self._sync_coll = sync_coll

    async def find_one(self, *args, **kwargs):
        return await asyncio.to_thread(self._sync_coll.find_one, *args, **kwargs)

    def find(self, *args, **kwargs):
        # Return cursor wrapper around the sync cursor
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


# Top-level DB wrapper: indexing returns an AsyncCollectionWrapper
class AsyncDBWrapper:
    def __init__(self, sync_db):
        self._sync_db = sync_db
        # Keep the underlying client around for any admin commands or health checks
        self.client = sync_db.client

    def __getitem__(self, name: str):
        return AsyncCollectionWrapper(self._sync_db[name])


@pytest.fixture(scope="module")
def test_db():
    # Only run these DB tests if the configured DB name looks like a dev or test database
    db_name = settings.mongo_db or ""
    if not any(sub in db_name.lower() for sub in ("dev", "test")):
        pytest.skip(f"Refusing to run DB tests against '{db_name}'")

    # Connect to MongoDB and yield the raw sync database
    client = MongoClient(settings.mongo_url)
    db = client[db_name]
    yield db

    # Clean up the client when tests are done
    client.close()


@pytest.fixture(scope="module")
def client(test_db):
    # Override FastAPI’s get_db dependency to return our AsyncDBWrapper around the test_db
    from conftest import AsyncDBWrapper

    app.dependency_overrides[real_get_db] = lambda: AsyncDBWrapper(test_db)

    # Use a context manager so FastAPI startup/shutdown events are triggered
    with TestClient(app) as c:
        yield c

    # Remove override so other tests aren’t affected
    app.dependency_overrides.clear()