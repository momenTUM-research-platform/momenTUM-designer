import json
import logging
from fastapi import APIRouter, HTTPException, Body
from models.study import StudyCreate
from routers.nlp_local import generate_filled_study
from pathlib import Path

router = APIRouter(prefix="/nlp", tags=["nlp"])

# 1) Precompute StudyCreate’s JSON schema once (for prompt‐injection)
SCHEMA_JSON = json.dumps(
    StudyCreate.model_json_schema(),
    separators=(",", ":")
)

p = Path(__file__).parent.parent / "studies" / "example.json"
EXAMPLE_STUDY = json.loads(p.read_text())
EXAMPLE_JSON = json.dumps(EXAMPLE_STUDY, separators=(",", ":"))


@router.post(
    "/generate-study",
    response_model=StudyCreate,   # <— Return exactly StudyCreate (no extra keys)
)
async def generate_study(
    instructions: str = Body(
        ...,
        embed=True,
        description="Natural-language instructions for study generation"
    )
):
    """
    1) Build a prompt that asks the LLM to return raw JSON matching StudyCreate.
    2) Call generate_filled_study(prompt) to get a JSON string back.
    3) json.loads() → validate via StudyCreate.parse_obj().
    4) Return .model_dump(by_alias=True) so that FastAPI only sends `_type`, `properties`, `modules`.
    """

    prompt = f"""
You are a JSON-only generator. Return exactly one JSON object (no markdown fences, no extra keys) that conforms to this Pydantic schema:

```json
{SCHEMA_JSON}
```

Here is also a valid example:
{EXAMPLE_JSON}

Interpret the user’s instructions below to create a valid "study" JSON. You do not need to hardcode anything—just follow these generic rules to fill in any required fields the user did not mention:

• If a required string is not mentioned by the user (and the schema enforces minLength ≥3), use "unknown" (or another ≥3-character placeholder) instead of "".

• If a required ID (study_id, module id, question id, etc.) is not provided, generate a placeholder matching /^[a-z0-9_]+$/, for example "default_id".

• If a URL field is not provided, use "http://example.com/placeholder" (so it begins with http:// and is ≥3 characters).

• If an email field is not provided, use "user@example.com".

• If a boolean field is not provided, use false.

• If a number field is not provided, use 0.

• If an array field is not provided:
    – Use [] for most arrays.
    – Except for `conditions`, default to ["*"].

• For any field named `_type`, always use the exact alias (e.g. `_type`: `module`).

• If the user says “include one survey module with a slider and a yes/no question,” then under `"modules"` create exactly one object with:
    - `_type`: `module`
    - `id`: `default_id`, `name`: `default_name`, `condition`: `*`
    - `alerts`: {{ 
          "title": "unknown", 
          "message": "unknown", 
          "start_offset": 0, 
          "duration": 0, 
          "times": [], 
          "random": false, 
          "random_interval": 0, 
          "sticky": false, 
          "sticky_label": "unknown", 
          "timeout": false, 
          "timeout_after": 0 
      }}
    - `graph`: {{ "display": false }}
    - `unlock_after`: []
    - `params`: {{ 
          `_type`: `params`, 
          `type`: `survey`,  
          `id`: `default_id`, 
          `submit_text`: `Submit`, 
          `shuffle`: false, 
          `sections`: [
            {{ 
              `_type`: `section`, 
              `id`: `default_id`, 
              `name`: `default_name`, 
              `shuffle`: false, 
              `questions`: [
                {{ 
                  `_type`: `question`, 
                  `type`: `slider`, 
                  `id`: `default_id`, 
                  `text`: `mood rating`, 
                  `required`: true, 
                  `rand_group`: ``, 
                  `hide_id`: ``, 
                  `hide_value`: ``, 
                  `hide_if`: false, 
                  `min`: 0, 
                  `max`: 10, 
                  `hint_left`: `0`, 
                  `hint_right`: `10` 
                }},
                {{ 
                  `_type`: `question`, 
                  `type`: `yesno`, 
                  `id`: `default_id`, 
                  `text`: `sleep quality`, 
                  `required`: true, 
                  `rand_group`: ``, 
                  `hide_id`: ``, 
                  `hide_value`: ``, 
                  `hide_if`: false, 
                  `yes_text`: `Yes`, 
                  `no_text`: `No` 
                }}
              ]
            }}
          ]
      }}

• Never leave a required field empty—always provide at least a schema-valid placeholder.

• Output raw JSON only (no markdown fences, no extra commentary).

User’s instructions:
"{instructions}"
"""

    # 2) Call LLM
    raw = generate_filled_study(prompt)

    # 3) Log the raw output to help debugging if it’s invalid JSON
    logging.info("LLM raw output:\n" + repr(raw))

    raw = raw.strip()
    if not raw:
        raise HTTPException(
            status_code=500,
            detail="LLM returned an empty response (no JSON)."
        )

    # 4) json.loads the string
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"LLM returned invalid JSON: {e}"
        )

    # 5) Validate with Pydantic → StudyCreate
    try:
        study_create = StudyCreate.parse_obj(data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {e}")

    # 6) Return exactly the StudyCreate fields (no _id, no timestamp)
    return study_create.model_dump(by_alias=True)
