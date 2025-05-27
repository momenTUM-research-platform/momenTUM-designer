import json
from pathlib import Path

import pytest
from models.study import StudyCreate

@pytest.fixture
def example_study():
    p = Path(__file__).parent.parent / "studies" / "example.json"
    return json.loads(p.read_text())

def test_study_model_parsing(example_study):
    study = StudyCreate.model_validate(example_study)
    assert study.properties.study_id == example_study["properties"]["study_id"]
    assert len(study.modules) == len(example_study["modules"])