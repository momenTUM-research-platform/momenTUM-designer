from __future__ import annotations
from typing import Any, List, Optional, Union, Literal
from pydantic import BaseModel, Field, ConfigDict, field_serializer, field_validator, root_validator
from bson import ObjectId
from datetime import datetime, date, timedelta


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v: Any, info: Any = None):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        if isinstance(v, dict) and "$oid" in v and ObjectId.is_valid(v["$oid"]):
            return ObjectId(v["$oid"])
        raise TypeError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_json_schema__(cls, _):
        return {"type": "string"}


class Time(BaseModel):
    hours: int
    minutes: int




class Alert(BaseModel):
    title: str
    message: str

    startDateTime: datetime = Field(alias="startDateTime")
    interval: int = Field(1, ge=1)
    repeat: Literal["never", "daily", "weekly", "monthly", "yearly"] = Field("never")
    until: Optional[date] = Field(None, alias="until")

    random: bool
    random_interval: int = Field(..., alias="randomInterval")
    sticky: bool
    sticky_label: str = Field(..., alias="stickyLabel")
    timeout: bool
    timeout_after: int = Field(..., alias="timeoutAfter")

    @root_validator(pre=True)
    def _migrate_legacy_schema(cls, values):
        # migrate old start_offset/times to new fields
        so = values.pop("start_offset", None)
        times = values.pop("times", None) or []
        if so is not None and times and not values.get("startDateTime"):
            # build initial datetime
            today = date.today() + timedelta(days=so)
            first = times[0]
            hour = getattr(first, "hours", 0) if hasattr(first, "hours") else first.get("hours",0)
            minute = getattr(first, "minutes",0) if hasattr(first, "minutes") else first.get("minutes",0)
            values["startDateTime"] = f"{today.isoformat()}T{hour:02d}:{minute:02d}:00"
            values["repeat"] = "daily"
            # optional duration→until
            dur = values.pop("duration", None)
            if dur and dur > 1:
                until_date = date.today() + timedelta(days=so + dur - 1)
                values["until"] = until_date.isoformat()
        values.setdefault("interval", 1)
        return values


class Graph(BaseModel):
    display: bool
    variable: str
    title: str
    blurb: str
    type: str
    max_points: int


class NoGraph(BaseModel):
    display: bool


GraphOrNoGraph = Union[Graph, NoGraph]


class SectionQuestionBase(BaseModel):
    # corresponds to JSON "_type"
    type: str = Field(alias="_type")
    # corresponds to JSON "type"
    question_type: str = Field(alias="type")
    id: str
    text: str
    required: bool
    rand_group: Optional[str] = None
    hide_id: Optional[str] = None
    hide_value: Optional[Union[str, bool]] = None
    hide_if: Optional[bool] = None

    model_config = ConfigDict(populate_by_alias=True)


class TextQuestion(SectionQuestionBase):
    subtype: str
    min_value: Optional[float] = Field(
        None,
        description="If this is a numeric question, the minimum allowed value"
    )
    max_value: Optional[float] = Field(
        None,
        description="If this is a numeric question, the maximum allowed value"
    )

    @field_validator("max_value", mode="after")
    def _check_max_gt_min(cls, v, info):
        data = info.data
        # only enforce when subtype=="numeric" and both bounds are present
        if data.get("subtype") == "numeric":
            minv = data.get("min_value")
            if v is not None and minv is not None and v <= minv:
                raise ValueError(f"max_value ({v}) must be > min_value ({minv})")
        return v


class DateTimeQuestion(SectionQuestionBase):
    subtype: str


class YesNoQuestion(SectionQuestionBase):
    yes_text: str
    no_text: str


class SliderQuestion(SectionQuestionBase):
    min: int
    max: int
    hint_left: str
    hint_right: str


class MultiQuestion(SectionQuestionBase):
    radio: bool
    modal: bool
    options: List[str]
    shuffle: bool


class MediaQuestion(SectionQuestionBase):
    subtype: str
    src: str
    thumb: Optional[str] = None


class InstructionQuestion(SectionQuestionBase):
    pass


class PhotoQuestion(SectionQuestionBase):
    pass


Question = Union[
    TextQuestion,
    DateTimeQuestion,
    YesNoQuestion,
    SliderQuestion,
    MultiQuestion,
    MediaQuestion,
    InstructionQuestion,
    PhotoQuestion,
]


class Section(BaseModel):
    type: str = Field(alias="_type")
    id: str
    name: str
    shuffle: bool
    questions: List[Question]

    model_config = ConfigDict(populate_by_alias=True)


class Survey(BaseModel):
    # discriminator now comes from the JSON "type" field
    type: Literal["survey"] = Field(alias="type")
    submit_text: str
    id: str
    sections: List[Section]
    shuffle: bool

    model_config = ConfigDict(
        populate_by_alias=True,
        extra="ignore",     # drop any keys we don’t explicitly declare (e.g. _type)
    )


class Pvt(BaseModel):
    # discriminator now comes from the JSON "type" field
    type: Literal["pvt"] = Field(alias="type")
    id: str
    trials: int
    min_waiting: int
    max_waiting: int
    max_reaction: int
    show: bool
    exit: bool

    model_config = ConfigDict(
        populate_by_alias=True,
        extra="ignore",
    )


Params = Union[Pvt, Survey]


class Module(BaseModel):
    type: str = Field(alias="_type")
    id: str
    name: str
    condition: str
    alerts: Alert
    graph: GraphOrNoGraph
    unlock_after: List[str]
    params: Params

    model_config = ConfigDict(populate_by_alias=True)

    @field_serializer("params", mode="plain")
    def _serialize_params(self, params_value, _info):
        # Dump to dict and inject legacy tag
        if isinstance(params_value, BaseModel):
            data = params_value.model_dump(by_alias=True, exclude_none=True)
        elif isinstance(params_value, dict):
            data = params_value.copy()
        else:
            return params_value
        data.setdefault("_type", "params")
        return data


class Properties(BaseModel):
    type: str = Field(alias="_type")
    study_name: str
    study_id: str
    created_by: str
    instructions: str
    post_url: str
    empty_msg: str
    banner_url: str
    support_url: str
    support_email: str
    cache: bool
    ethics: str
    pls: str
    conditions: List[str]
    redcap_server_api_url: Optional[str] = None

    model_config = ConfigDict(populate_by_alias=True)


class StudyOut(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    type: Literal["study"] = Field(alias="_type")
    timestamp: int
    properties: Properties
    modules: List[Module]

    model_config = ConfigDict(
        validate_by_name=True,
        json_encoders={ObjectId: str},
    )


class StudyCreate(BaseModel):
    type: Literal["study"] = Field(alias="_type")
    properties: Properties
    modules: List[Module]

    model_config = ConfigDict(populate_by_alias=True)
