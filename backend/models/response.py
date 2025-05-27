from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from datetime import datetime

class ResponseIn(BaseModel):
    user_id: str
    data: Dict[str, Any]

class ResponseOut(ResponseIn):
    id: Optional[str] = Field(alias="_id")
    study_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True