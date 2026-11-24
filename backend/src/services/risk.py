from dataclasses import dataclass

from src.schemas.risk import RiskResult


@dataclass(frozen=True)
class Option:
    value: int
    label: str


@dataclass(frozen=True)
class Question:
    key: str
    title: str
    description: str
    options: tuple[Option, ...]


FREQUENCY_OPTIONS = (
    Option(0, "Не было"),
    Option(1, "1–2 дня"),
    Option(2, "3–4 дня"),
    Option(3, "5 и более дней"),
)
SEVERITY_OPTIONS = (
    Option(0, "Нет изменений"),
    Option(1, "Незначительно"),
    Option(2, "Заметно"),
    Option(3, "Выраженно"),
)

QUESTIONS = (
    Question(
        "nausea",
        "Симптомы со стороны ЖКТ",
        "Как часто за последние 7 дней у вас была тошнота, рвота или вздутие?",
        FREQUENCY_OPTIONS,
    ),
    Question(
        "appetite",
        "Аппетит",
        "Насколько снизился аппетит за последнюю неделю?",
        SEVERITY_OPTIONS,
    ),
    Question(
        "nutrition",
        "Объём питания",
        "Насколько уменьшился привычный объём съедаемой пищи?",
        SEVERITY_OPTIONS,
    ),
    Question(
        "fluid",
        "Потребление жидкости",
        "Есть ли трудности с потреблением привычного объёма жидкости?",
        SEVERITY_OPTIONS,
    ),
    Question(
        "weight",
        "Изменение массы тела",
        "Замечали ли вы снижение веса за последние 3 месяца?",
        SEVERITY_OPTIONS,
    ),
    Question(
        "activity",
        "Повседневная активность",
        "Насколько симптомы ограничивают вашу привычную активность?",
        SEVERITY_OPTIONS,
    ),
)


def calculate_risk(
    answers: dict[str, int],
    initial_weight_kg: float,
    current_weight_kg: float,
) -> RiskResult:
    score = sum(answers.values())
    weight_change = round((current_weight_kg - initial_weight_kg) / initial_weight_kg * 100, 1)
    weight_loss = -weight_change

    if weight_loss >= 5 or score >= 10:
        level = "high"
        title = "Высокий нутритивный риск"
        patient_message = (
            "Ваши ответы требуют внимания врача. Пожалуйста, свяжитесь с клиникой "
            "для записи на приём в ближайшее время."
        )
        recommendations = [
            "Связаться с пациентом и оценить необходимость внеочередного приёма.",
            "Уточнить динамику массы тела, выраженность симптомов и объём потребления.",
            "Рассмотреть консультацию специалиста по нутритивной поддержке.",
        ]
    elif weight_loss >= 2 or score >= 5:
        level = "moderate"
        title = "Умеренный нутритивный риск"
        patient_message = (
            "Есть изменения, на которые стоит обратить внимание. "
            "Рекомендуется обсудить результаты с лечащим врачом."
        )
        recommendations = [
            "Обсудить результаты на ближайшем приёме.",
            "Проследить динамику массы тела и пищевого поведения.",
            "Повторить опрос в соответствии с планом наблюдения.",
        ]
    else:
        level = "low"
        title = "Низкий нутритивный риск"
        patient_message = (
            "Спасибо за ответы. Выраженных признаков нутритивного риска по этой анкете не выявлено."
        )
        recommendations = [
            "Продолжить плановое наблюдение.",
            "Сохранять привычный режим питания, если врач не дал других рекомендаций.",
            "Пройти следующий контрольный опрос в назначенный срок.",
        ]

    return RiskResult(
        level=level,
        score=score,
        weight_change_percent=weight_change,
        title=title,
        patient_message=patient_message,
        recommendations=recommendations,
    )
