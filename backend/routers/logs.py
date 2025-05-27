from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from db import get_db

router = APIRouter(tags=["logs"])

class LogEntry(BaseModel):
    data_type:       str
    user_id:         str
    study_id:        str
    module_index:    int
    platform:        str
    page:            str
    event:           str
    timestamp:       str
    timestamp_in_ms: int

@router.post(
    "/log",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Back up a UI event/log to Mongo"
)
async def save_log(
    entry: LogEntry,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    await db["logs"].insert_one(entry.dict())
    return