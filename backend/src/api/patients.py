import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.cache.client import invalidate_dashboard
from src.config import get_settings
from src.db.session import get_session
from src.schemas.patient import PatientCreate, PatientCreated, PatientDetail, PatientListItem, SurveyRead
from src.services import patients

router = APIRouter(prefix="/patients", tags=["Пациенты"])


@router.get("", response_model=list[PatientListItem])
async def read_patients(
    search: str | None = Query(default=None, max_length=160),
    session: AsyncSession = Depends(get_session),
) -> list[PatientListItem]:
    items = await patients.list_patients(session, search)
    return [patients.patient_list_item(patient) for patient in items]


@router.post("", response_model=PatientCreated, status_code=status.HTTP_201_CREATED)
async def add_patient(
    data: PatientCreate,
    session: AsyncSession = Depends(get_session),
) -> PatientCreated:
    patient = await patients.create_patient(session, data)
    await session.commit()
    await invalidate_dashboard()
    detail = await patients.get_patient(session, patient.id)
    baseline = next(survey for survey in detail.surveys if survey.kind.value == "baseline")
    return PatientCreated(
        patient=patients.patient_detail(detail),
        survey_url=f"{get_settings().frontend_url}/survey/{baseline.token}",
    )


@router.get("/{patient_id}", response_model=PatientDetail)
async def read_patient(
    patient_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> PatientDetail:
    try:
        patient = await patients.get_patient(session, patient_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return patients.patient_detail(patient)


@router.post("/{patient_id}/surveys", response_model=SurveyRead, status_code=status.HTTP_201_CREATED)
async def add_followup(
    patient_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> SurveyRead:
    try:
        patient = await patients.get_patient(session, patient_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    survey = await patients.create_followup(session, patient)
    await session.commit()
    await invalidate_dashboard()
    return SurveyRead.model_validate(survey)
