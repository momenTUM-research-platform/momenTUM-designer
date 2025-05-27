import os
import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Form, status
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import httpx
from fastapi.responses import JSONResponse
from models.study import StudyCreate as StudyModel   # no _id/timestamp
from db import get_db

router = APIRouter(prefix="/redcap", tags=["redcap"])

REDCAP_API_URL     = os.getenv(
    "REDCAP_API_URL",
    "https://tuspl22-redcap.srv.mwn.de/redcap/api/"
)
REDCAP_SUPER_TOKEN = os.getenv("REDCAP_SUPER_API_TOKEN")
if not REDCAP_SUPER_TOKEN:
    raise RuntimeError("Missing REDCAP_SUPER_API_TOKEN in environment")


class LogEntry(BaseModel):
    data_type:      str
    user_id:        str
    study_id:       str
    module_index:   int
    platform:       str
    page:           str
    event:          str
    timestamp:      str
    timestamp_in_ms:int

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

class Key(BaseModel):
    study_id: str
    api_key:  str


async def _get_redcap_api_url(
    db: AsyncIOMotorDatabase,
    study_id: str
) -> str:
    """
    Look for a study-specific REDCap URL in Mongo; return it if found,
    otherwise fall back to the global REDCAP_API_URL.
    """
    doc = await db["studies"].find_one(
        {"properties.study_id": study_id},
        {"properties.redcap_server_api_url": 1}
    )
    if doc:
        url = doc.get("properties", {}).get("redcap_server_api_url")
        if url:
            return url
    return REDCAP_API_URL


async def _submit_to_redcap(
    db:  AsyncIOMotorDatabase,
    rsp: ResponseEntry
) -> None:
    # look up API key
    key_doc = await db["keys"].find_one({"study_id": rsp.study_id})
    if not key_doc:
        return

    api_key = key_doc["api_key"]
    record: Dict[str, Any] = {
        "field_record_id":            rsp.user_id,
        "redcap_repeat_instrument":   f"module_{rsp.module_id}",
        "redcap_repeat_instance":     "new",
        f"field_response_time_in_ms_{rsp.module_index}": rsp.response_time_in_ms,
        f"field_response_time_{rsp.module_index}":      rsp.response_time,
    }
    if rsp.responses:
        for k, v in json.loads(rsp.responses).items():
            record[f"field_{k}"] = v
    if rsp.entries:
        record[rsp.module_id] = rsp.entries

    # backup
    raw = dict(record)
    raw["raw"] = rsp.json()
    await db["responses_backup"].insert_one(raw)

    # post to REDCap
    payload = {
        "token":   api_key,
        "content": "record",
        "format":  "json",
        "type":    "flat",
        "data":    json.dumps([record]),
    }
    url = await _get_redcap_api_url(db, rsp.study_id)
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(url, data=payload, timeout=15.0)
            r.raise_for_status()
    except Exception:
        # swallow
        pass


async def _import_metadata(
    db:      AsyncIOMotorDatabase,
    study:   StudyModel,
    api_key: str
) -> None:
    meta: List[Dict[str, Any]] = []

    for idx, module in enumerate(study.modules):
        form = f"module_{module.id}"
        if idx == 0:
            meta.append({
                "field_name":     "field_record_id",
                "form_name":      form,
                "section_header": "",
                "field_type":     "text",
                "field_label":    "Record ID",
                **{k: "" for k in [
                    "select_choices_or_calculations","field_note",
                    "text_validation_type_or_show_slider_number",
                    "text_validation_min","text_validation_max",
                    "identifier","branching_logic","required_field",
                    "custom_alignment","question_number",
                    "matrix_group_name","matrix_ranking",
                    "field_annotation"
                ]}
            })

        for suffix,label in [
            (f"response_time_in_ms_{idx}", "Response Time (ms)"),
            (f"response_time_{idx}",      "Response Time"),
        ]:
            meta.append({
                "field_name":     f"field_{suffix}",
                "form_name":      form,
                "section_header": "",
                "field_type":     "text",
                "field_label":    label,
                **{k: "" for k in [
                    "select_choices_or_calculations","field_note",
                    "text_validation_type_or_show_slider_number",
                    "text_validation_min","text_validation_max",
                    "identifier","branching_logic","required_field",
                    "custom_alignment","question_number",
                    "matrix_group_name","matrix_ranking",
                    "field_annotation"
                ]}
            })

        params = module.params
        if hasattr(params, "sections"):
            for section in params.sections:
                for q in section.questions:
                    meta.append({
                        "field_name":     f"field_{q.id}",
                        "form_name":      form,
                        "section_header": "",
                        "field_type":     "text",
                        "field_label":    q.text,
                        **{k: "" for k in [
                            "select_choices_or_calculations","field_note",
                            "text_validation_type_or_show_slider_number",
                            "text_validation_min","text_validation_max",
                            "identifier","branching_logic","required_field",
                            "custom_alignment","question_number",
                            "matrix_group_name","matrix_ranking",
                            "field_annotation"
                        ]}
                    })
        else:
            meta.append({
                "field_name":     f"field_{params.id}",
                "form_name":      form,
                "section_header": "",
                "field_type":     "text",
                "field_label":    "PVT results",
                **{k: "" for k in [
                    "select_choices_or_calculations","field_note",
                    "text_validation_type_or_show_slider_number",
                    "text_validation_min","text_validation_max",
                    "identifier","branching_logic","required_field",
                    "custom_alignment","question_number",
                    "matrix_group_name","matrix_ranking",
                    "field_annotation"
                ]}
            })

    url = await _get_redcap_api_url(db, study.properties.study_id)
    payload = {
        "token":   api_key,
        "content": "metadata",
        "format":  "json",
        "type":    "flat",
        "data":    json.dumps(meta),
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(url, data=payload, timeout=30.0)
        r.raise_for_status()


async def _enable_repeating_instruments(
    db:      AsyncIOMotorDatabase,
    study:   StudyModel,
    api_key: str
) -> None:
    repeating = [
        {"form_name": f"module_{m.id}", "custom_form_label": ""}
        for m in study.modules
    ]

    url = await _get_redcap_api_url(db, study.properties.study_id)
    payload = {
        "token":   api_key,
        "content": "repeatingFormsEvents",
        "format":  "json",
        "type":    "flat",
        "data":    json.dumps(repeating),
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(url, data=payload, timeout=30.0)
        r.raise_for_status()


async def _import_user(
    db:       AsyncIOMotorDatabase,
    username: str,
    api_key:  str
) -> None:
    user_payload = [{
        "username":                     username,
        "expiration":                   "",
        "data_access_group":            "",
        "data_access_group_id":         "",
        "design":                       1,
        "user_rights":                  1,
        **{f: 1 for f in [
            "data_access_groups","reports","stats_and_charts",
            "manage_survey_participants","calendar","data_import_tool",
            "data_comparison_tool","logging","file_repository",
            "data_quality_create","data_quality_execute",
            "api_export","api_import","record_create",
            "record_rename","record_delete",
            "lock_records_all_forms","lock_records",
            "lock_records_customization"
        ]},
        "mobile_app":                   0,
        "mobile_app_download_data":     0,
        "forms":                        {},
        "forms_export":                 {},
    }]

    url = await _get_redcap_api_url(db, username)
    payload = {
        "token":   api_key,
        "content": "user",
        "format":  "json",
        "type":    "flat",
        "data":    json.dumps(user_payload),
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(url, data=payload, timeout=30.0)
        r.raise_for_status()


@router.post(
    "/log",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Ingest a raw log event"
)
async def save_log(
    log: LogEntry                      = Depends(),
    db:  AsyncIOMotorDatabase         = Depends(get_db),
):
    await db["logs"].insert_one(log.dict())


@router.post(
    "/response",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Back up one response and queue REDCap push"
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
    db:                  AsyncIOMotorDatabase = Depends(get_db),
):
    rsp = ResponseEntry(
        data_type           = data_type,
        user_id             = user_id,
        study_id            = study_id,
        module_index        = module_index,
        platform            = platform,
        module_id           = module_id,
        module_name         = module_name,
        responses           = responses,
        entries             = json.loads(entries) if entries else None,
        response_time       = response_time,
        response_time_in_ms = response_time_in_ms,
        alert_time          = alert_time,
    )
    await db["responses_backup"].insert_one(rsp.dict())
    background.add_task(_submit_to_redcap, db, rsp)
    return {"accepted": True}


@router.get("/response/{study_id}/{user_id}")
async def get_combined_response(
    study_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    mongo_record = await db["responses_backup"].find_one({
        "study_id": study_id,
        "user_id":  user_id
    })
    if not mongo_record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Record not found")

    if "_id" in mongo_record:
        mongo_record["_id"] = str(mongo_record["_id"])

    key_doc = await db["keys"].find_one({"study_id": study_id})
    redcap_resp: Optional[Dict[str, Any]] = None
    if key_doc:
        url = await _get_redcap_api_url(db, study_id)
        payload = {
            "token": key_doc["api_key"],
            "content": "record",
            "format": "json",
            "type": "flat",
        }
        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(url, data=payload, timeout=15.0)
                r.raise_for_status()
                for rec in r.json():
                    if rec.get("field_record_id") == user_id:
                        redcap_resp = rec
                        break
        except Exception:
            redcap_resp = None

    return {
        "mongodb_response": mongo_record,
        "redcap_response":  redcap_resp,
    }


@router.post(
    "/project/{username}",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new REDCap project for this study + user"
)
async def create_redcap_project(
    username: str,
    study:    StudyModel,
    db:       AsyncIOMotorDatabase = Depends(get_db),
):
    sid = study.properties.study_id

    # 0) if we already have a key for this study, don’t re–create
    existing = await db["keys"].find_one({"study_id": sid})
    if existing:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": f"REDCap project already exists for study '{sid}'"
            }
        )

    # 1) create the project on the REDCap server
    url = await _get_redcap_api_url(db, sid)
    payload = {
        "token":   REDCAP_SUPER_TOKEN,
        "content": "project",
        "format":  "json",
        "type":    "flat",
        "data":    json.dumps([{
            "project_title":                study.properties.study_name,
            "purpose":                      "2",
            "is_longitudinal":              "1",
            "surveys_enabled":              "1",
            "record_autonumbering_enabled": "0",
            "project_notes":                study.properties.instructions,
        }]),
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, data=payload, timeout=30.0)
        try:
            resp.raise_for_status()
        except httpx.HTTPError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"REDCap project creation failed: {resp.text}"
            )

    api_key = resp.text.strip().strip('"')

    # 2) persist that API key privately
    await db["keys"].replace_one(
        {"study_id": sid},
        {"study_id": sid, "api_key": api_key},
        upsert=True
    )

    # 3) mirror all modules/forms/users into REDCap
    await _import_metadata(db, study, api_key)
    await _enable_repeating_instruments(db, study, api_key)
    await _import_user(db, username, api_key)

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={"message": f"REDCap project created for study '{sid}'"}
    )

@router.get("/keys/{study_id}", summary="(debug) get stored REDCap key")
async def debug_get_key(study_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Debug-only: retrieve the {study_id}→api_key doc from Mongo.
    """
    doc = await db["keys"].find_one({"study_id": study_id})
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return {"key": doc}
