from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select
from src.db.session import SessionFactory
from src.models.patient import Patient
from src.models.survey import RiskLevel, Survey, SurveyAnswer, SurveyKind, SurveyStatus
from src.services.risk import calculate_risk


async def seed_demo_data() -> None:
    async with SessionFactory() as session:
        if await session.scalar(select(func.count(Patient.id))):
            return
        examples = [
            (
                "Анна Смирнова",
                date(1978, 4, 12),
                "female",
                "СД2, ожирение",
                "Семаглутид, 1,0 мг",
                168,
                86.4,
                1,
                2,
                81.2,
                11,
            ),
            (
                "Михаил Орлов",
                date(1965, 9, 23),
                "male",
                "Хронический панкреатит",
                "Ферментная терапия",
                176,
                74.8,
                1,
                2,
                72.9,
                5,
            ),
            (
                "Елена Волкова",
                date(1989, 2, 7),
                "female",
                "Гипотиреоз",
                "Левотироксин, 75 мкг",
                164,
                62.3,
                0,
                1,
                62.7,
                2,
            ),
            (
                "Игорь Никитин",
                date(1957, 11, 30),
                "male",
                "Ишемическая болезнь сердца",
                "Плановое наблюдение",
                181,
                91.0,
                0,
                1,
                90.2,
                3,
            ),
        ]
        now = datetime.now(UTC)
        for index, example in enumerate(examples):
            (
                name,
                birth_date,
                gender,
                diagnosis,
                therapy,
                height,
                weight,
                base_score,
                follow_score,
                current_weight,
                follow_value,
            ) = example
            patient = Patient(
                full_name=name,
                birth_date=birth_date,
                gender=gender,
                diagnosis=diagnosis,
                therapy=therapy,
                height_cm=height,
                initial_weight_kg=weight,
                created_at=now - timedelta(days=120 - index * 4),
            )
            baseline_answers = {
                key: base_score for key in ("nausea", "appetite", "nutrition", "fluid", "weight", "activity")
            }
            baseline_risk = calculate_risk(baseline_answers, weight, weight)
            baseline = Survey(
                kind=SurveyKind.baseline,
                status=SurveyStatus.completed,
                risk_level=RiskLevel(baseline_risk.level),
                risk_score=baseline_risk.score,
                weight_kg=weight,
                weight_change_percent=0,
                created_at=now - timedelta(days=100 - index * 4),
                completed_at=now - timedelta(days=100 - index * 4),
                answers=[
                    SurveyAnswer(question_key=key, value=value) for key, value in baseline_answers.items()
                ],
            )
            follow_answers = {
                "nausea": follow_value,
                "appetite": follow_score,
                "nutrition": follow_score,
                "fluid": max(0, follow_score - 1),
                "weight": follow_score,
                "activity": max(0, follow_score - 1),
            }
            follow_risk = calculate_risk(follow_answers, weight, current_weight)
            followup = Survey(
                kind=SurveyKind.followup,
                status=SurveyStatus.completed,
                risk_level=RiskLevel(follow_risk.level),
                risk_score=follow_risk.score,
                weight_kg=current_weight,
                weight_change_percent=follow_risk.weight_change_percent,
                created_at=now - timedelta(days=10 - index),
                completed_at=now - timedelta(days=10 - index),
                answers=[
                    SurveyAnswer(question_key=key, value=value) for key, value in follow_answers.items()
                ],
            )
            upcoming = Survey(
                kind=SurveyKind.followup,
                due_date=now + timedelta(days=80 + index * 5),
                created_at=now - timedelta(days=10 - index),
            )
            patient.surveys.extend([baseline, followup, upcoming])
            session.add(patient)
        await session.commit()
