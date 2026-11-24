import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.models.patient import Patient
from src.models.survey import Survey, SurveyAnswer, SurveyKind, SurveyStatus
from src.schemas.survey import (
    ClinicalAnswersUpdate,
    QuestionOption,
    SurveyDetail,
    SurveyQuestion,
    SurveySubmit,
)
from src.services.patients import next_followup_date
from src.services.questionnaire import questions_for, validate_answers


class SurveyCompletedError(ValueError):
    pass


def questions_schema(kind: str) -> list[SurveyQuestion]:
    return [
        SurveyQuestion(
            key=question.key,
            section=question.section,
            title=question.title,
            kind=question.kind,
            options=[QuestionOption(value=option.value, label=option.label) for option in question.options],
            detail_label=question.detail_label,
            respondent=question.respondent,
            required=question.required,
        )
        for question in questions_for(kind)
    ]


async def get_by_id(session: AsyncSession, survey_id: uuid.UUID) -> Survey:
    survey = await session.scalar(
        select(Survey)
        .where(Survey.id == survey_id)
        .options(
            selectinload(Survey.patient).selectinload(Patient.user),
            selectinload(Survey.answers),
        )
    )
    if survey is None:
        raise LookupError("Анкета не найдена")
    return survey


def survey_detail(survey: Survey) -> SurveyDetail:
    return SurveyDetail(
        id=survey.id,
        patient_public_id=survey.patient.public_id,
        kind=survey.kind.value,
        status=survey.status.value,
        due_date=survey.due_date,
        baseline_weight_kg=survey.patient.initial_weight_kg,
        questions=questions_schema(survey.kind.value),
        answers=[
            {
                "question_key": answer.question_key,
                "value": answer.value,
                "text_value": answer.text_value,
            }
            for answer in survey.answers
        ],
        red_flags=survey.red_flags,
    )


async def submit_survey(session: AsyncSession, survey: Survey, data: SurveySubmit) -> list[str]:
    if survey.status == SurveyStatus.completed:
        raise SurveyCompletedError("Анкета уже заполнена")
    validate_answers(survey.kind.value, "patient", data.answers, data.details)
    current_weight = data.current_weight_kg or survey.patient.initial_weight_kg
    survey.weight_change_percent = round(
        (current_weight - survey.patient.initial_weight_kg) / survey.patient.initial_weight_kg * 100,
        1,
    )
    survey.answers = [
        SurveyAnswer(
            question_key=key,
            value=value if isinstance(value, int) and not isinstance(value, bool) else None,
            text_value=value.strip() if isinstance(value, str) else data.details.get(key, "").strip(),
        )
        for key, value in data.answers.items()
    ]
    survey.status = SurveyStatus.completed
    survey.completed_at = datetime.now(UTC)
    survey.weight_kg = current_weight
    survey.wellbeing_note = data.wellbeing_note
    session.add(
        Survey(
            patient_id=survey.patient_id,
            kind=SurveyKind.followup,
            due_date=next_followup_date(survey.completed_at),
        )
    )
    await session.flush()
    return survey.red_flags


async def update_clinical_answers(
    session: AsyncSession,
    survey: Survey,
    data: ClinicalAnswersUpdate,
) -> None:
    if survey.kind != SurveyKind.baseline:
        raise ValueError("Дополнительные данные исследователя есть только в исходной анкете")
    validate_answers(survey.kind.value, "doctor", data.answers, data.details, partial=True)
    existing = {answer.question_key: answer for answer in survey.answers}
    for key, value in data.answers.items():
        answer = existing.get(key)
        if answer is None:
            answer = SurveyAnswer(survey=survey, question_key=key)
            survey.answers.append(answer)
        answer.value = value if isinstance(value, int) and not isinstance(value, bool) else None
        answer.text_value = value.strip() if isinstance(value, str) else data.details.get(key, "").strip()
    await session.flush()
