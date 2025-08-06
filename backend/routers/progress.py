from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import time
from fastapi.responses import JSONResponse
from db import get_db
from models.study import StudyCreate, StudyOut
from datetime import  datetime
from fastapi.encoders import jsonable_encoder
import logging


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/progress", tags=["study-events"])

@router.post("/event", summary="Log a study event")
async def log_event(event: StudyEvent, db: AsyncIOMotorDatabase=Depends(get_db)):
    """
    Log a study event to the database.
    """
    doc=event.dict()
    doc["_id"] = ObjectId()
    doc["timestamp"] = datetime.utcnow()
    await db["study_events"].insert_one(doc)
    return{"message": "Event logged successfully", "event_id": str(doc["_id"])}
   
   
   
   