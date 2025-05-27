# db.py
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import settings

logger = logging.getLogger(__name__)

# create one client at import time, bound to the current event loop
_client: AsyncIOMotorClient = AsyncIOMotorClient(settings.mongo_url)
_db: AsyncIOMotorDatabase = _client[settings.mongo_db]

# optionally verify on startup
try:
    _client.admin.command("ping")
    logger.info("Connected to MongoDB %s at %s", settings.mongo_db, settings.mongo_url)
except Exception:
    logger.exception("Failed to connect to MongoDB at startup")

def get_db() -> AsyncIOMotorDatabase:
    """
    Dependency that returns the shared Motor database.
    """
    return _db