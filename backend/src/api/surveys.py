import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import CurrentUser, DoctorUser, PatientUser
from src.cache.client import invalidate_dashboard
from src.db.session import get_session
from src.models.survey import Survey
from src.models.user import User, UserRole
from src.schemas.survey import ClinicalAnswersUpdate, SurveyDetail, SurveySubmit, SurveySubmitted
from src.services import surveys

router = APIRouter(prefix="/surveys", tags=["Анкеты"])


def check_survey_access(survey: Survey, user: User) -> None:
    if user.role == UserRole.patient and (user.patient is None or survey.patient_id != user.patient.id):
        raise HTTPException(status_code=404, detail="Анкета не найдена")


@router.get("/{survey_id}", response_model=SurveyDetail)
async def read_survey(
    survey_id: uuid.UUID,
    user: CurrentUser,
    session: AsyncSession = Depends(get_session),
) -> SurveyDetail:
    try:
        survey = await surveys.get_by_id(session, survey_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    check_survey_access(survey, user)
    return surveys.survey_detail(survey)


@router.post("/{survey_id}/submit", response_model=SurveySubmitted)
async def submit_survey(
    survey_id: uuid.UUID,
    data: SurveySubmit,
    user: PatientUser,
    session: AsyncSession = Depends(get_session),
) -> SurveySubmitted:
    try:
        survey = await surveys.get_by_id(session, survey_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    check_survey_access(survey, user)
    try:
        red_flags = await surveys.submit_survey(session, survey, data)
    except surveys.SurveyCompletedError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error)) from error
    await session.commit()
    await invalidate_dashboard()
    if survey.completed_at is None:
        raise HTTPException(status_code=500, detail="Не удалось завершить анкету")
    return SurveySubmitted(
        survey_id=survey.id,
        status=survey.status.value,
        completed_at=survey.completed_at,
        red_flags=red_flags,
    )


@router.patch("/{survey_id}/clinical", response_model=SurveyDetail)
async def update_clinical_answers(
    survey_id: uuid.UUID,
    data: ClinicalAnswersUpdate,
    _: DoctorUser,
    session: AsyncSession = Depends(get_session),
) -> SurveyDetail:
    try:
        survey = await surveys.get_by_id(session, survey_id)
        await surveys.update_clinical_answers(session, survey, data)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error)) from error
    await session.commit()
    return surveys.survey_detail(survey)
