from httpx import AsyncClient
from tests.integration.test_api import PATIENT_DATA, patient_headers


async def test_admin_manages_doctors_patients_and_stats(
    client: AsyncClient,
    admin_headers: dict[str, str],
    doctor_headers: dict[str, str],
) -> None:
    assert (await client.get("/api/v1/admin/stats")).status_code == 401
    assert (await client.get("/api/v1/admin/stats", headers=doctor_headers)).status_code == 403
    assert (await client.get("/api/v1/patients", headers=admin_headers)).status_code == 403

    doctor_data = {"public_id": "d-100001", "password": "new-doctor-password"}
    response = await client.post("/api/v1/admin/doctors", json=doctor_data, headers=admin_headers)
    assert response.status_code == 201, response.text
    doctor = response.json()
    assert doctor["public_id"] == "D-100001"
    assert doctor["role"] == "doctor"
    assert "password" not in doctor
    assert (
        await client.post("/api/v1/admin/doctors", json=doctor_data, headers=admin_headers)
    ).status_code == 409
    new_doctor_login = await client.post(
        "/api/v1/auth/login",
        json={"public_id": "D-100001", "password": doctor_data["password"]},
    )
    assert new_doctor_login.status_code == 200
    new_doctor_headers = {"Authorization": f"Bearer {new_doctor_login.json()['access_token']}"}
    assert (await client.get("/api/v1/dashboard", headers=new_doctor_headers)).status_code == 200

    response = await client.post("/api/v1/admin/patients", json=PATIENT_DATA, headers=admin_headers)
    assert response.status_code == 201, response.text
    created_patient = response.json()
    patient = next(
        user
        for user in (await client.get("/api/v1/admin/patients", headers=admin_headers)).json()
        if user["public_id"] == created_patient["patient"]["public_id"]
    )
    current_patient_headers = await patient_headers(client, created_patient["credentials"])

    assert (await client.get("/api/v1/patients", headers=doctor_headers)).json() == []
    assert (
        await client.get(f"/api/v1/patients/{created_patient['patient']['id']}", headers=doctor_headers)
    ).status_code == 404

    stats = (await client.get("/api/v1/admin/stats", headers=admin_headers)).json()
    assert stats == {
        "admin_count": 1,
        "doctor_count": 2,
        "patient_count": 1,
        "attention_count": 0,
        "pending_count": 1,
        "completed_count": 0,
    }

    assert (
        await client.delete(f"/api/v1/admin/users/{doctor['id']}", headers=doctor_headers)
    ).status_code == 403
    assert (
        await client.delete(f"/api/v1/admin/users/{doctor['id']}", headers=admin_headers)
    ).status_code == 204
    assert (await client.get("/api/v1/auth/me", headers=new_doctor_headers)).status_code == 401
    assert (
        await client.post(
            "/api/v1/auth/login",
            json={"public_id": "D-100001", "password": doctor_data["password"]},
        )
    ).status_code == 401

    assert (
        await client.delete(f"/api/v1/admin/users/{patient['id']}", headers=admin_headers)
    ).status_code == 204
    assert (await client.get("/api/v1/patients/me", headers=current_patient_headers)).status_code == 401
    assert (await client.get("/api/v1/admin/patients", headers=admin_headers)).json() == []
    assert (
        await client.delete(f"/api/v1/admin/users/{patient['id']}", headers=admin_headers)
    ).status_code == 404
