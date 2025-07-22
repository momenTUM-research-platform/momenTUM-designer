from __future__ import annotations
from typing import Any, List, Optional, Union, Literal
from pydantic import BaseModel, Field, ConfigDict, field_serializer, field_validator, model_validator
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


class Alert(BaseModel):
    """
    Configuration for a scheduled notification in a study.
    Supports both fixed-calendar scheduling ("absolute")
    and enrollment-relative scheduling ("relative").
    """

    # ─── Mode selector ────────────────────────────────────────────────
    scheduleMode: Literal["absolute", "relative"] = Field(
        "absolute",
        description="‘absolute’ uses startDateTime; ‘relative’ uses offsetDays/offsetTime",
    )

    # ─── Absolute scheduling ──────────────────────────────────────────
    startDateTime: Optional[datetime] = Field(
        None,
        alias="startDateTime",
        description="Initial notification date/time for absolute mode",
    )

    # ─── Relative scheduling ──────────────────────────────────────────
    offsetDays: Optional[int] = Field(
        None,
        ge=0,
        description="Days after enrollment for first notification (relative mode)",
    )
    offsetTime: Optional[str] = Field(
        None,
        description="Time of day (HH:MM) on offset day for first notification (relative mode)",
    )

    # ─── Designer-only preview ───────────────────────────────────────
    expectedEnrollmentDate: Optional[date] = Field(
        None,
        alias="expectedEnrollmentDate",
        description=(
            "Assumed enrollment date for calendar preview in designer; "
            "ignored by the mobile runtime."
        ),
    )

    # ─── Notification content ────────────────────────────────────────
    title: str = Field(..., description="Notification title text")
    message: str = Field(..., description="Notification message/body text")

    # ─── Repeat configuration ────────────────────────────────────────
    repeat: Literal["never", "daily", "weekly", "monthly", "yearly"] = Field(
        "never",
        description="Repeat frequency",
    )
    interval: int = Field(
        1,
        ge=1,
        description="Repeat interval count (e.g., every N days/weeks)",
    )
    # absolute end date
    until: Optional[date] = Field(
        None,
        alias="until",
        description="End date for repeating notifications (absolute mode)",
    )
    # relative repeat count
    repeatCount: Optional[int] = Field(
        None,
        ge=0,
        description="Number of additional notifications after the first (relative mode)",
    )

    # ─── Randomization, stickiness, timeout ─────────────────────────
    random: bool = Field(..., description="Enable random offset for each notification")
    randomInterval: int = Field(
        ...,
        alias="randomInterval",
        description="Maximum minutes to randomize before/after scheduled time",
    )
    sticky: bool = Field(..., description="Keep notification visible until acted on")
    stickyLabel: str = Field(
        ...,
        alias="stickyLabel",
        description="Label for grouping sticky notifications",
    )
    timeout: bool = Field(..., description="Remove notification after timeout")
    timeoutAfter: int = Field(
        ...,
        alias="timeoutAfter",
        description="Milliseconds before notification times out",
    )

    # ─── Additional times ────────────────────────────────────────────
    times: List[str] = Field(
        default_factory=list,
        alias="times",
        description="Extra times of day for this alert (HH:MM strings)",
    )

    @field_validator("times", mode="before")
    def _normalize_times(cls, v):
        """
        Normalize `times` entries to "HH:MM" strings,
        accepting either strings or dicts with 'hours'/'minutes'.
        """
        out: List[str] = []
        for entry in v or []:
            if isinstance(entry, str):
                out.append(entry)
            elif isinstance(entry, dict):
                h = entry.get("hours", 0)
                m = entry.get("minutes", 0)
                out.append(f"{h:02d}:{m:02d}")
        return out

    @model_validator(mode="after")
    def _check_schedule_consistency(self):
        """
        Enforce mode-specific fields:
          - Absolute mode: `startDateTime` required; `offset*` and `repeatCount` cleared;
            if repeat≠never then `until` required.
          - Relative mode: `offsetDays` & `offsetTime` required; `startDateTime` & `until` cleared;
            if repeat≠never then `repeatCount` required.
        """
        # NOTE: because this is an AFTER validator, `self` is the fully-built model
        if self.scheduleMode == "absolute":
            if self.startDateTime is None:
                raise ValueError("startDateTime is required when scheduleMode='absolute'")
            self.offsetDays = None
            self.offsetTime = None
            self.repeatCount = None
            if self.repeat != "never" and self.until is None:
                raise ValueError("‘until’ is required in absolute mode when repeat ≠ never")
        else:  # relative
            if self.offsetDays is None or self.offsetTime is None:
                raise ValueError(
                    "offsetDays and offsetTime are required when scheduleMode='relative'"
                )
            self.startDateTime = None
            self.until = None
            if self.repeat != "never" and self.repeatCount is None:
                raise ValueError("‘repeatCount’ is required in relative mode when repeat ≠ never")

        return self

    # Serialize using field aliases and omit any None values
    model_config = ConfigDict(
      populate_by_alias=True,
      exclude_none=True,
    )

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
