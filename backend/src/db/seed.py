from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from src.db.session import SessionFactory
from src.models.patient import Patient
from src.models.survey import Survey, SurveyAnswer, SurveyKind, SurveyStatus
from src.models.user import User, UserRole
from src.services.auth import hash_password
from src.services.questionnaire import questions_for

DEMO_PATIENT_PASSWORD = "patient-demo-password"


def demo_answers(kind: str, attention: bool = False) -> list[SurveyAnswer]:
    answers = []
    for question in questions_for(kind):
        if question.kind == "text":
            value = None
            text_value = "1,0 мг" if question.key == "q36" else ""
        else:
            value = 1 if attention and question.key == "q25" else 0
            text_value = ""
        answers.append(SurveyAnswer(question_key=question.key, value=value, text_value=text_value))
    return answers


async def seed_demo_data() -> None:
    async with SessionFactory() as session:
        if await session.scalar(select(func.count(Patient.id))):
            return
        now = datetime.now(UTC)
        examples = (
            ("P-100001", "Семаглутид", 168, 86.4, 1.0, True),
            ("P-100002", "Тирзепатид", 176, 74.8, 2.5, False),
            ("P-100003", "Семаглутид", 164, 62.3, 0.5, False),
        )
        for index, (public_id, medication, height, weight, dose, attention) in enumerate(examples):
            user = User(
                public_id=public_id,
                password_hash=hash_password(DEMO_PATIENT_PASSWORD),
                role=UserRole.patient,
            )
            patient = Patient(
                user=user,
                medication=medication,
                height_cm=height,
                initial_weight_kg=weight,
                starting_dose=dose,
                created_at=now - timedelta(days=30 - index),
            )
            baseline = Survey(
                kind=SurveyKind.baseline,
                status=SurveyStatus.completed,
                weight_kg=weight,
                created_at=now - timedelta(days=20 - index),
                completed_at=now - timedelta(days=20 - index),
                answers=demo_answers("baseline", attention),
            )
            upcoming = Survey(
                kind=SurveyKind.followup,
                due_date=now + timedelta(days=70 + index * 5),
                created_at=now - timedelta(days=20 - index),
            )
            patient.surveys.extend([baseline, upcoming])
            session.add(patient)
        await session.commit()
