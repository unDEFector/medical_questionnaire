from httpx import AsyncClient
from src.services.questionnaire import questions_for

PATIENT_DATA = {
    "height_cm": 165,
    "initial_weight_kg": 70,
    "medication": "Семаглутид",
    "starting_dose": 0.5,
}


def answers(kind: str, respondent: str = "patient", red_flag: bool = False) -> dict[str, int | str]:
    result: dict[str, int | str] = {}
    for question in questions_for(kind, respondent):
        if question.kind == "text":
            result[question.key] = "1,0 мг" if question.key == "q36" else ""
        else:
            result[question.key] = 1 if red_flag and question.key == "q25" else 0
    return result


async def create_patient(client: AsyncClient, doctor_headers: dict[str, str]) -> dict:
    response = await client.post("/api/v1/patients", json=PATIENT_DATA, headers=doctor_headers)
    assert response.status_code == 201, response.text
    return response.json()


async def patient_headers(client: AsyncClient, credentials: dict[str, str]) -> dict[str, str]:
    response = await client.post("/api/v1/auth/login", json=credentials)
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


async def test_role_based_patient_survey_workflow(
    client: AsyncClient, doctor_headers: dict[str, str]
) -> None:
    assert (await client.get("/api/v1/patients")).status_code == 401
    created = await create_patient(client, doctor_headers)
    assert created["patient"]["public_id"].startswith("P-")
    assert "full_name" not in created["patient"]
    assert created["credentials"]["public_id"] == created["patient"]["public_id"]
    assert (
        await client.get("/api/v1/patients", headers=await patient_headers(client, created["credentials"]))
    ).status_code == 403

    headers = await patient_headers(client, created["credentials"])
    own_response = await client.get("/api/v1/patients/me", headers=headers)
    assert own_response.status_code == 200
    assert own_response.json()["public_id"] == created["patient"]["public_id"]
    survey = own_response.json()["surveys"][0]
    assert "token" not in survey

    survey_response = await client.get(f"/api/v1/surveys/{survey['id']}", headers=headers)
    assert survey_response.status_code == 200
    assert len(survey_response.json()["questions"]) == 36
    invalid = await client.post(
        f"/api/v1/surveys/{survey['id']}/submit",
        json={"answers": {}},
        headers=headers,
    )
    assert invalid.status_code == 422

    submit_response = await client.post(
        f"/api/v1/surveys/{survey['id']}/submit",
        json={"answers": answers("baseline", red_flag=True)},
        headers=headers,
    )
    assert submit_response.status_code == 200, submit_response.text
    assert submit_response.json()["red_flags"] == ["q25"]
    assert (
        await client.post(
            f"/api/v1/surveys/{survey['id']}/submit", json={"answers": answers("baseline")}, headers=headers
        )
    ).status_code == 409

    detail = (await client.get(f"/api/v1/patients/{created['patient']['id']}", headers=doctor_headers)).json()
    assert detail["current_red_flags"] == ["q25"]
    assert len(detail["surveys"]) == 2
    dashboard = (await client.get("/api/v1/dashboard", headers=doctor_headers)).json()
    assert dashboard["patient_count"] == 1
    assert dashboard["attention_count"] == 1

    second = await create_patient(client, doctor_headers)
    second_headers = await patient_headers(client, second["credentials"])
    assert (await client.get(f"/api/v1/surveys/{survey['id']}", headers=second_headers)).status_code == 404
    assert (
        await client.get(f"/api/v1/patients/{created['patient']['id']}", headers=headers)
    ).status_code == 403


async def test_clinical_answers_are_doctor_only(client: AsyncClient, doctor_headers: dict[str, str]) -> None:
    created = await create_patient(client, doctor_headers)
    headers = await patient_headers(client, created["credentials"])
    survey_id = created["patient"]["surveys"][0]["id"]
    payload = {"answers": {"q32": 1}, "details": {"q32": "Хронический гастрит"}}
    assert (
        await client.patch(f"/api/v1/surveys/{survey_id}/clinical", json=payload, headers=headers)
    ).status_code == 403
    response = await client.patch(
        f"/api/v1/surveys/{survey_id}/clinical",
        json=payload,
        headers=doctor_headers,
    )
    assert response.status_code == 200, response.text
    answer = next(answer for answer in response.json()["answers"] if answer["question_key"] == "q32")
    assert answer == {"question_key": "q32", "value": 1, "text_value": "Хронический гастрит"}


async def test_password_reset_and_logout(client: AsyncClient, doctor_headers: dict[str, str]) -> None:
    created = await create_patient(client, doctor_headers)
    old_headers = await patient_headers(client, created["credentials"])
    assert (await client.post("/api/v1/auth/logout", headers=old_headers)).status_code == 204
    assert (await client.get("/api/v1/auth/me", headers=old_headers)).status_code == 401
    old_headers = await patient_headers(client, created["credentials"])

    response = await client.post(
        f"/api/v1/patients/{created['patient']['id']}/password",
        headers=doctor_headers,
    )
    assert response.status_code == 200
    new_credentials = response.json()
    assert new_credentials["password"] != created["credentials"]["password"]
    assert (await client.get("/api/v1/auth/me", headers=old_headers)).status_code == 401
    assert (await client.post("/api/v1/auth/login", json=created["credentials"])).status_code == 401
    assert (await client.post("/api/v1/auth/login", json=new_credentials)).status_code == 200


async def test_followup_questionnaire(client: AsyncClient, doctor_headers: dict[str, str]) -> None:
    created = await create_patient(client, doctor_headers)
    headers = await patient_headers(client, created["credentials"])
    survey_id = created["patient"]["surveys"][0]["id"]
    response = await client.post(
        f"/api/v1/surveys/{survey_id}/submit",
        json={"answers": answers("baseline")},
        headers=headers,
    )
    assert response.status_code == 200
    own = (await client.get("/api/v1/patients/me", headers=headers)).json()
    followup = next(survey for survey in own["surveys"] if survey["kind"] == "followup")
    response = await client.post(
        f"/api/v1/surveys/{followup['id']}/submit",
        json={
            "answers": answers("followup"),
            "details": {"f08": "Снижение на 3 кг"},
            "current_weight_kg": 67,
        },
        headers=headers,
    )
    assert response.status_code == 200, response.text
    own = (await client.get("/api/v1/patients/me", headers=headers)).json()
    assert own["trends"][-1]["weight_kg"] == 67
