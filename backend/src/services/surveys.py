from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.models.survey import Survey, SurveyAnswer, SurveyKind, SurveyStatus
from src.schemas.risk import RiskResult
from src.schemas.survey import PublicSurvey, QuestionOption, SurveyQuestion, SurveySubmit
from src.services.patients import next_followup_date
from src.services.risk import QUESTIONS, calculate_risk


def questions_schema() -> list[SurveyQuestion]:
    return [
        SurveyQuestion(
            key=question.key,
            title=question.title,
            description=question.description,
            options=[QuestionOption(value=option.value, label=option.label) for option in question.options],
        )
        for question in QUESTIONS
    ]


async def get_by_token(session: AsyncSession, token: str) -> Survey:
    survey = await session.scalar(
        select(Survey)
        .where(Survey.token == token)
        .options(selectinload(Survey.patient), selectinload(Survey.answers))
    )
    if survey is None:
        raise LookupError("Анкета не найдена или ссылка недействительна")
    return survey


def public_survey(survey: Survey) -> PublicSurvey:
    result = None
    if survey.status == SurveyStatus.completed:
        answers = {answer.question_key: answer.value for answer in survey.answers}
        result = calculate_risk(
            answers,
            survey.patient.initial_weight_kg,
            survey.weight_kg or survey.patient.initial_weight_kg,
        )
    return PublicSurvey(
        id=survey.id,
        patient_name=survey.patient.full_name,
        kind=survey.kind.value,
        status=survey.status.value,
        due_date=survey.due_date,
        baseline_weight_kg=survey.patient.initial_weight_kg,
        questions=questions_schema(),
        result=result,
    )


async def submit_survey(session: AsyncSession, survey: Survey, data: SurveySubmit) -> RiskResult:
    if survey.status == SurveyStatus.completed:
        raise ValueError("Анкета уже заполнена")
    current_weight = data.current_weight_kg
    if survey.kind == SurveyKind.baseline:
        current_weight = survey.patient.initial_weight_kg
    if current_weight is None:
        raise ValueError("Укажите текущий вес")

    result = calculate_risk(data.answers, survey.patient.initial_weight_kg, current_weight)
    survey.answers = [SurveyAnswer(question_key=key, value=value) for key, value in data.answers.items()]
    survey.status = SurveyStatus.completed
    survey.completed_at = datetime.now(UTC)
    survey.weight_kg = current_weight
    survey.weight_change_percent = result.weight_change_percent
    survey.risk_score = result.score
    from src.models.survey import RiskLevel

    survey.risk_level = RiskLevel(result.level)
    survey.wellbeing_note = data.wellbeing_note
    session.add(
        Survey(
            patient_id=survey.patient_id,
            kind=SurveyKind.followup,
            due_date=next_followup_date(survey.completed_at),
        )
    )
    await session.flush()
    return result
