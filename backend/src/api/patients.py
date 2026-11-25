import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import DoctorUser, PatientUser
from src.cache.client import invalidate_dashboard
from src.db.session import get_session
from src.schemas.auth import PatientCredentials
from src.schemas.patient import PatientCreate, PatientCreated, PatientDetail, PatientListItem, SurveyRead
from src.services import patients

router = APIRouter(prefix="/patients", tags=["Пациенты"])


@router.get("", response_model=list[PatientListItem])
async def read_patients(
    user: DoctorUser,
    search: str | None = Query(default=None, max_length=20),
    session: AsyncSession = Depends(get_session),
) -> list[PatientListItem]:
    items = await patients.list_patients(session, search, doctor_id=user.id)
    return [patients.patient_list_item(patient) for patient in items]


@router.post("", response_model=PatientCreated, status_code=status.HTTP_201_CREATED)
async def add_patient(
    data: PatientCreate,
    user: DoctorUser,
    session: AsyncSession = Depends(get_session),
) -> PatientCreated:
    patient, credentials = await patients.create_patient(session, data, doctor=user)
    await session.commit()
    await invalidate_dashboard()
    detail = await patients.get_patient(session, patient.id)
    return PatientCreated(patient=patients.patient_detail(detail), credentials=credentials)


@router.get("/me", response_model=PatientDetail)
async def read_own_patient(
    user: PatientUser,
    session: AsyncSession = Depends(get_session),
) -> PatientDetail:
    assert user.patient is not None
    patient = await patients.get_patient(session, user.patient.id)
    return patients.patient_detail(patient)


@router.get("/{patient_id}", response_model=PatientDetail)
async def read_patient(
    patient_id: uuid.UUID,
    user: DoctorUser,
    session: AsyncSession = Depends(get_session),
) -> PatientDetail:
    try:
        patient = await patients.get_patient(session, patient_id, doctor_id=user.id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return patients.patient_detail(patient)


@router.post("/{patient_id}/password", response_model=PatientCredentials)
async def reset_password(
    patient_id: uuid.UUID,
    user: DoctorUser,
    session: AsyncSession = Depends(get_session),
) -> PatientCredentials:
    try:
        patient = await patients.get_patient(session, patient_id, doctor_id=user.id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    credentials = await patients.reset_patient_password(session, patient)
    await session.commit()
    return credentials


@router.post("/{patient_id}/surveys", response_model=SurveyRead, status_code=status.HTTP_201_CREATED)
async def add_followup(
    patient_id: uuid.UUID,
    user: DoctorUser,
    session: AsyncSession = Depends(get_session),
) -> SurveyRead:
    try:
        patient = await patients.get_patient(session, patient_id, doctor_id=user.id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    survey = await patients.create_followup(session, patient)
    await session.commit()
    await invalidate_dashboard()
    return SurveyRead.model_validate(survey)
