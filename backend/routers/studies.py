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

router = APIRouter(prefix="/studies", tags=["studies"])

@router.get(
    "/{study_id}",
    response_model=StudyOut,
    summary="Fetch the latest version of a study",
)
async def get_latest_study(
    study_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    clauses = []
    if ObjectId.is_valid(study_id):
        clauses.append({"_id": ObjectId(study_id)})
    clauses.append({"properties.study_id": study_id})

    doc = await db["studies"].find_one(
        {"$or": clauses},
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
    summary="Fetch all versions of a study",
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

@router.get(
     "/{study_id}/version",
     summary="Get the latest version of a study by study_id",
 )   
async def get_study_version(
    study_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc=await db["studies"].find_one(
        {"properties.study_id": study_id},
        sort=[("timestamp", -1)],
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study '{study_id}' not found"
        )
    version= doc.get("version", 1)
    if version is None:
        raise  HTTPException(
            statis_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study '{study_id}' has no version information"
        )
    return {"study_id": study_id, "version": version}

@router.get(
    "/{study_id}/versions",
    summary="Get all versions of a study by study_id",
)
async def get_all_study_versions(
    study_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        logger.info(f"Received request for study_id: {study_id}")
        docs = await db["studies"].find(
            {"properties.study_id": study_id}
        ).to_list(length=100)
        logger.info(f"Found {len(docs)} documents for study_id={study_id}")

        if not docs:
            logger.warning(f"No documents found for study_id={study_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Study '{study_id}' not found"
            )

        versions = [d.get("version", 1) for d in docs]
        if not versions:
            logger.warning(f"No version fields in documents for study_id={study_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Study '{study_id}' has no version information"
            )

        return {"study_id": study_id, "versions": versions}

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error fetching versions for study_id={study_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

    

@router.post(
    "",
    summary="Create a new study (or reuse existing)",
    status_code=status.HTTP_200_OK,
)
async def create_study(
    payload: StudyCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    sid = payload.properties.study_id
    incoming=jsonable_encoder(payload, by_alias=True, exclude_none=True)
    existing = await db["studies"].find_one({"properties.study_id": sid},
                                            sort=[("version", -1)])
    
    def compare(doc):
        return{
            k: v for k, v in doc.items() if k not in ["_id", "timestamp", "version"]
        }
    existing_compare=compare(existing) if existing else None
    incoming_compare= compare(incoming)
    if existing_compare == incoming_compare:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Study already exists. Using existing study.",
                "permalink": str(existing["_id"]),
            },
        )
    version_new=(existing.get("version", 0) if existing else 0)+1
    incoming["version"] = version_new
    incoming["_type"] = "study"
    incoming["timestamp"] = int(time.time() * 1000)
    result = await db["studies"].insert_one(incoming)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "message": "New version of study created",
            "permalink": str(result.inserted_id),
        },
    )
