from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import time
from fastapi.responses import JSONResponse
from db import get_db
from models.study import StudyCreate, StudyOut, StudyEvent
from datetime import  datetime
from fastapi.encoders import jsonable_encoder
import logging



logger = logging.getLogger(__name__)

router = APIRouter(prefix="/progress", tags=["study-events"])

@router.post("/event", summary="Log a study event")
async def log_event(event: StudyEvent, db: AsyncIOMotorDatabase = Depends(get_db)):
    logger.info(f"Incoming study event: {event.dict()}")
    try:
        doc = event.dict()
        doc["_id"] = ObjectId()
        doc["timestamp"] = datetime.utcnow()
        await db["study_events"].insert_one(doc)
        logger.info(f"Event logged successfully: {doc['_id']}")
        return {"message": "Event logged successfully", "event_id": str(doc["_id"])}
    except Exception as e:
        logger.exception("Error logging event")
        raise HTTPException(status_code=500, detail=str(e))
   
 
@router.get("/{study_id}/timeline", response_model=Dict[str, Any], summary="Get study event timeline")
async def get_study_timeline(study_id: str, db: AsyncIOMotorDatabase=Depends(get_db)):
    """
    Fetch the timeline of events for a specific study.
    """
    cursor = db["study_events"].find({"study_id": study_id}).sort("timestamp", -1)
    events=await cursor.to_list(length=100)
    for event in events:
        event["_id"] = str(event["_id"])
    return {"study_id": study_id, "events": events}

@router.get("/{study_id}/participant/{participant_id}", response_model=Dict[str, Any], summary="Get participant events")
async def get_participant_events(
    study_id: str,
    participant_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    cursor=db["study_events"].find(
        {"study_id": study_id, "participant_id": participant_id}
    ).sort("timestamp", -1)
    events=await cursor.to_list(length=100)
    for event in events:
        event["_id"] = str(event["_id"])
    return {"participant_id":participant_id, "study_id": study_id, "events": events}