from datetime import datetime

from httpx import AsyncClient
from src.services.risk import QUESTIONS


async def test_patient_survey_workflow(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/patients",
        json={
            "full_name": "Тестовый Пациент",
            "birth_date": "1980-05-15",
            "gender": "female",
            "diagnosis": "Тестовый диагноз",
            "therapy": "Наблюдение",
            "height_cm": 165,
            "initial_weight_kg": 70,
        },
    )
    assert response.status_code == 201, response.text
    created = response.json()
    assert created["survey_url"].startswith("http://localhost:3000/survey/")
    token = created["survey_url"].rsplit("/", 1)[-1]

    survey_response = await client.get(f"/api/v1/surveys/{token}")
    assert survey_response.status_code == 200
    assert survey_response.json()["patient_name"] == "Тестовый Пациент"

    submit_response = await client.post(
        f"/api/v1/surveys/{token}/submit",
        json={"answers": {question.key: 2 for question in QUESTIONS}},
    )
    assert submit_response.status_code == 200, submit_response.text
    assert submit_response.json()["result"]["level"] == "high"

    detail_response = await client.get(f"/api/v1/patients/{created['patient']['id']}")
    detail = detail_response.json()
    assert detail["current_risk"] == "high"
    assert len(detail["trends"]) == 1
    assert len(detail["surveys"]) == 2
    followup = next(survey for survey in detail["surveys"] if survey["status"] == "pending")
    completed_at = datetime.fromisoformat(submit_response.json()["completed_at"])
    due_date = datetime.fromisoformat(followup["due_date"])
    assert (due_date.replace(tzinfo=completed_at.tzinfo) - completed_at).days == 90

    followup_response = await client.post(
        f"/api/v1/surveys/{followup['token']}/submit",
        json={
            "answers": {question.key: 0 for question in QUESTIONS},
            "current_weight_kg": 65,
            "wellbeing_note": "Вес снизился",
        },
    )
    assert followup_response.status_code == 200
    assert followup_response.json()["result"]["level"] == "high"
    updated_detail = (await client.get(f"/api/v1/patients/{created['patient']['id']}")).json()
    assert len(updated_detail["trends"]) == 2
    assert updated_detail["trends"][-1]["weight_kg"] == 65

    duplicate_response = await client.post(
        f"/api/v1/surveys/{token}/submit",
        json={"answers": {question.key: 0 for question in QUESTIONS}},
    )
    assert duplicate_response.status_code == 409


async def test_dashboard_counts(client: AsyncClient) -> None:
    response = await client.get("/api/v1/dashboard")
    assert response.status_code == 200
    assert response.json()["patient_count"] == 0


async def test_unknown_survey_returns_404(client: AsyncClient) -> None:
    response = await client.get("/api/v1/surveys/not-a-real-token")
    assert response.status_code == 404
