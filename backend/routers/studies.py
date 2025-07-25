from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import time
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from db import get_db
from models.study import StudyCreate, StudyOut

router = APIRouter(prefix="/studies", tags=["studies"])


@router.get(
    "/{study_id}",
    response_model=StudyOut,
    response_model_exclude_none=True,
    status_code=status.HTTP_200_OK,
)
async def get_latest_study(
    study_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    filters = []
    if ObjectId.is_valid(study_id):
        filters.append({"_id": ObjectId(study_id)})
    filters.append({"properties.study_id": study_id})

    doc = await db["studies"].find_one(
        {"$or": filters},
        sort=[("timestamp", -1)],
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study '{study_id}' not found"
        )
    return doc


@router.get(
    "/all/{study_id}",
    response_model=List[StudyOut],
    response_model_exclude_none=True,
    status_code=status.HTTP_200_OK,
)
async def get_all_versions(
    study_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs = await (
        db["studies"]
        .find({"properties.study_id": study_id})
        .sort("timestamp", -1)
        .to_list(length=100)
    )
    return docs


@router.post(
    "",
    summary="Create a new study (or reuse existing)",
    status_code=status.HTTP_201_CREATED,
)
async def create_study(
    payload: StudyCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    sid = payload.properties.study_id
    existing = await db["studies"].find_one({"properties.study_id": sid})
    if existing and not sid.startswith("test"):
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Study already exists. Using existing study.",
                "permalink": str(existing["_id"]),
            },
        )

    doc = jsonable_encoder(payload, by_alias=True, exclude_none=True)
    doc["_type"] = "study"
    doc["timestamp"] = int(time.time() * 1000)

    result = await db["studies"].insert_one(doc)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "message": "New study created",
            "permalink": str(result.inserted_id),
        },
    )