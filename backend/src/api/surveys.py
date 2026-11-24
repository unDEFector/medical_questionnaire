from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.cache.client import invalidate_dashboard
from src.db.session import get_session
from src.schemas.survey import PublicSurvey, SurveySubmit, SurveySubmitted
from src.services import surveys

router = APIRouter(prefix="/surveys", tags=["Анкеты"])


@router.get("/{token}", response_model=PublicSurvey)
async def read_survey(
    token: str,
    session: AsyncSession = Depends(get_session),
) -> PublicSurvey:
    try:
        survey = await surveys.get_by_token(session, token)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return surveys.public_survey(survey)


@router.post("/{token}/submit", response_model=SurveySubmitted)
async def submit_survey(
    token: str,
    data: SurveySubmit,
    session: AsyncSession = Depends(get_session),
) -> SurveySubmitted:
    try:
        survey = await surveys.get_by_token(session, token)
        result = await surveys.submit_survey(session, survey, data)
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    await session.commit()
    await invalidate_dashboard()
    if survey.completed_at is None:
        raise HTTPException(status_code=500, detail="Не удалось завершить анкету")
    return SurveySubmitted(
        survey_id=survey.id,
        status=survey.status.value,
        completed_at=survey.completed_at,
        result=result,
    )
