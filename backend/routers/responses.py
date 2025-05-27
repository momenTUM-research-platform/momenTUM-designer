import json
from typing import Optional, List

from fastapi import APIRouter, Depends, BackgroundTasks, Form, status
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from db import get_db
from routers.redcap import _submit_to_redcap

router = APIRouter(tags=["responses"])

class ResponseEntry(BaseModel):
    data_type:           str
    user_id:             str
    study_id:            str
    module_index:        int
    platform:            str
    module_id:           str
    module_name:         str
    responses:           Optional[str]   
    entries:             Optional[List[int]]
    response_time:       str
    response_time_in_ms: int
    alert_time:          str

@router.post(
    "/response",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Save a response and queue REDCap push"
)
async def save_response(
    background: BackgroundTasks,
    data_type:           str  = Form(...),
    user_id:             str  = Form(...),
    study_id:            str  = Form(...),
    module_index:        int  = Form(...),
    platform:            str  = Form(...),
    module_id:           str  = Form(...),
    module_name:         str  = Form(...),
    responses:           Optional[str] = Form(None),
    entries:             Optional[str] = Form(None),
    response_time:       str  = Form(...),
    response_time_in_ms: int  = Form(...),
    alert_time:          str  = Form(...),
    db:                   AsyncIOMotorDatabase = Depends(get_db),
):
    # hydrate the Pydantic model
    entries_list = json.loads(entries) if entries else None
    rsp = ResponseEntry(
        data_type           = data_type,
        user_id             = user_id,
        study_id            = study_id,
        module_index        = module_index,
        platform            = platform,
        module_id           = module_id,
        module_name         = module_name,
        responses           = responses,
        entries             = entries_list,
        response_time       = response_time,
        response_time_in_ms = response_time_in_ms,
        alert_time          = alert_time,
    )

    # back up into Mongo
    await db["responses_backup"].insert_one(rsp.dict())

    # also save into responses collection
    await db["responses"].insert_one(rsp.dict())

    # queue the REDCap push using the same live db client
    background.add_task(_submit_to_redcap, db, rsp)

    return {"accepted": True}