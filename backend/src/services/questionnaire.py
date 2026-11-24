from dataclasses import dataclass


@dataclass(frozen=True)
class Option:
    value: int
    label: str


@dataclass(frozen=True)
class Question:
    key: str
    section: str
    title: str
    kind: str
    options: tuple[Option, ...] = ()
    detail_label: str | None = None
    respondent: str = "patient"
    required: bool = True


SEVERITY_OPTIONS = (
    Option(0, "0 — совсем не было / не беспокоило"),
    Option(1, "1 — лёгкое"),
    Option(2, "2 — умеренное"),
    Option(3, "3 — выраженное"),
    Option(4, "4 — очень выраженное / мешало обычной жизни"),
)
LIFE_IMPACT_OPTIONS = (
    Option(0, "0 — совсем не мешали"),
    Option(1, "1 — мешали немного"),
    Option(2, "2 — мешали умеренно"),
    Option(3, "3 — сильно мешали"),
    Option(4, "4 — очень сильно препятствовали нормальной жизни"),
)
YES_NO_OPTIONS = (Option(0, "Нет"), Option(1, "Да"))
BASELINE_SECTION = "Состояние за 7 дней до терапии"
NUTRITION_SECTION = "Пищевое поведение и рацион за 7 дней"
WEIGHT_SECTION = "Динамика массы тела и изменения в питании"
ACTIVITY_SECTION = "Влияние симптомов на повседневную жизнь"
RED_FLAGS_SECTION = "Red flags"
CLINICAL_SECTION = "Дополнительные данные (заполняет врач)"
FOLLOWUP_SECTION = "Визит 2 — телефонный звонок через 3 месяца"


def scale(key: str, title: str, section: str = BASELINE_SECTION, impact: bool = False) -> Question:
    return Question(key, section, title, "scale", LIFE_IMPACT_OPTIONS if impact else SEVERITY_OPTIONS)


def choice(
    key: str,
    title: str,
    labels: tuple[str, ...],
    section: str = NUTRITION_SECTION,
    detail_label: str | None = None,
) -> Question:
    return Question(
        key,
        section,
        title,
        "choice",
        tuple(Option(index, label) for index, label in enumerate(labels)),
        detail_label,
    )


def yes_no(
    key: str,
    title: str,
    section: str = RED_FLAGS_SECTION,
    detail_label: str | None = None,
    respondent: str = "patient",
) -> Question:
    return Question(key, section, title, "boolean", YES_NO_OPTIONS, detail_label, respondent)


def clinical_text(key: str, title: str) -> Question:
    return Question(key, CLINICAL_SECTION, title, "text", respondent="doctor", required=False)


BASELINE_QUESTIONS = (
    scale("q01", "Тошнота"),
    scale("q02", "Эпизоды рвоты"),
    scale("q03", "Чувство «переполнения» желудка после еды"),
    scale("q04", "«Быстрое насыщение» — чувство, что вы наедаетесь раньше обычного"),
    scale("q05", "Вздутие живота, газообразование"),
    scale("q06", "Эпизоды болей или выраженный дискомфорт в верхних отделах живота"),
    scale("q07", "Эпизоды болей или дискомфорт в нижних отделах живота"),
    scale("q08", "Диарея или жидкий/частый стул"),
    scale("q09", "Запор или эпизоды затруднённого стула"),
    scale("q10", "Снижение аппетита"),
    scale("q11", "Потребность в меньшей порции из-за неприятных ощущений со стороны ЖКТ"),
    choice(
        "q12",
        "Как изменился общий объём пищи, который вы обычно съедаете, за прошедшую неделю?",
        ("Не изменился", "Немного уменьшился", "Заметно уменьшился", "Значительно уменьшился"),
    ),
    choice(
        "q13",
        "Как часто за прошедшую неделю вы пропускали обычный приём пищи "
        "из-за отсутствия аппетита или неприятных ощущений?",
        ("Никогда", "1–2 раза", "3–4 раза", "5 и более раз"),
    ),
    choice(
        "q14",
        "Стало ли в течение последней недели труднее съедать обычную порцию?",
        ("Нет", "Немного (незначительно)", "Значительно сложнее", "Труднопереносимо"),
    ),
    choice(
        "q15",
        "Уменьшилось ли разнообразие продуктов из-за ухудшения самочувствия "
        "или изменения/отсутствия аппетита?",
        ("Нет", "Немного", "Заметно (существенно уменьшилось)", "Значительно уменьшилось"),
    ),
    choice(
        "q16",
        "Стало ли труднее поддерживать обычное потребление жидкости в течение прошедшей недели?",
        ("Нет", "Немного", "Заметно (стало заметно труднее)", "Очень трудно"),
    ),
    yes_no(
        "q17",
        "Есть ли продукты, которых вы стали избегать из-за проблем с ЖКТ или неприятных ощущений?",
        NUTRITION_SECTION,
        "Какие продукты?",
    ),
    choice(
        "q18",
        "Изменилась ли ваша масса тела за последние 3–6 месяцев?",
        ("Нет", "Да", "Не знаю"),
        WEIGHT_SECTION,
        "На сколько кг и преднамеренно или непреднамеренно?",
    ),
    choice(
        "q19",
        "Была ли за последние 3–6 месяцев необходимость уменьшить количество еды или снизился аппетит?",
        (
            "Нет",
            "Да, из-за снижения аппетита",
            "Да, из-за неприятных ощущений со стороны ЖКТ",
            "Затрудняюсь ответить",
        ),
        WEIGHT_SECTION,
    ),
    choice(
        "q20",
        "Сколько основных приёмов пищи у вас обычно было за последние 7 дней?",
        ("3 и более", "2", "1", "Нерегулярное питание"),
        WEIGHT_SECTION,
    ),
    yes_no(
        "q21",
        "Были ли периоды, когда вы почти не ели или не могли нормально питаться более 24 часов?",
        WEIGHT_SECTION,
        "По какой причине?",
    ),
    choice(
        "q22",
        "Стало ли труднее употреблять продукты, богатые белком "
        "(мясо, рыбу, яйца, молочные продукты, бобовые)?",
        ("Нет", "Немного труднее", "Стало значительно труднее", "Практически перестал(а) употреблять"),
        WEIGHT_SECTION,
    ),
    scale(
        "q23",
        "Насколько симптомы со стороны ЖКТ или изменение аппетита мешали нормально питаться?",
        ACTIVITY_SECTION,
        impact=True,
    ),
    scale(
        "q24",
        "Насколько симптомы со стороны ЖКТ или изменение аппетита мешали обычной активности?",
        ACTIVITY_SECTION,
        impact=True,
    ),
    yes_no(
        "q25",
        "За последние 7 дней были ли эпизоды рвоты или невозможность удерживать обычное количество жидкости?",
    ),
    yes_no(
        "q26",
        "Были ли эпизоды, когда вы не могли нормально есть или пить "
        "из-за выраженных симптомов со стороны ЖКТ?",
    ),
    yes_no("q27", "Были ли за последние 7 дней состояния, требующие срочной медицинской помощи?"),
    yes_no("q28", "Были ли эпизоды появления крови в рвотных массах или стуле в течение последнего месяца?"),
    yes_no("q29", "Были ли эпизоды чёрного стула, не связанные с продуктами или лекарственными препаратами?"),
    yes_no(
        "q30", "Были ли выраженная слабость, головокружение или предобморочное состояние за последний месяц?"
    ),
    yes_no("q31", "Возникали ли желтушность кожи или глаз, потемнение мочи?"),
    yes_no(
        "q32",
        "Исходные заболевания ЖКТ",
        CLINICAL_SECTION,
        "Укажите заболевания",
        respondent="doctor",
    ),
    yes_no(
        "q33",
        "Сахарный диабет 2 типа",
        CLINICAL_SECTION,
        "Уровень гликированного гемоглобина, если есть анализ",
        respondent="doctor",
    ),
    yes_no(
        "q34",
        "Терапия сопутствующих заболеваний",
        CLINICAL_SECTION,
        "Укажите препараты",
        respondent="doctor",
    ),
    yes_no("q35", "Приём БАД", CLINICAL_SECTION, "Укажите БАД", respondent="doctor"),
    clinical_text("q36", "Какая доза препарата вводится в настоящее время?"),
)

FOLLOWUP_QUESTIONS = (
    choice(
        "f01",
        "Принимали ли вы назначенный препарат в течение периода наблюдения?",
        ("Да, и продолжаю", "Да, но временно прекращал(а)", "Полностью прекратил(а) применение"),
        FOLLOWUP_SECTION,
    ),
    choice(
        "f02",
        "Производилась ли коррекция дозы препарата ввиду каких-либо событий?",
        ("Нет", "Да, плановая титрация дозы", "Да, из-за симптомов со стороны ЖКТ или других причин"),
        FOLLOWUP_SECTION,
        "Укажите события и причины",
    ),
    yes_no(
        "f03",
        "Возникали ли после начала лечения новые или усилившиеся тошнота, рвота, диарея, "
        "запор или другие ЖКТ-симптомы?",
        FOLLOWUP_SECTION,
    ),
    yes_no(
        "f04",
        "Потребовалось ли внеплановое обращение к врачу или в медицинскую организацию "
        "из-за нежелательных симптомов?",
        FOLLOWUP_SECTION,
    ),
    yes_no(
        "f05",
        "Потребовалась ли отмена, замена или снижение дозы "
        "из-за симптомов со стороны ЖКТ или других событий?",
        FOLLOWUP_SECTION,
    ),
    yes_no(
        "f06",
        "Были ли госпитализации из-за симптомов, ассоциированных с инкретинотерапией?",
        FOLLOWUP_SECTION,
    ),
    yes_no(
        "f07",
        "Были ли существенные трудности с питанием или потреблением жидкости после начала лечения?",
        FOLLOWUP_SECTION,
    ),
    choice(
        "f08",
        "Изменилась ли масса тела с начала лечения?",
        ("Нет", "Да", "Не знаю"),
        FOLLOWUP_SECTION,
        "На сколько изменилась масса тела?",
    ),
    choice(
        "f09",
        "Как изменилось состояние ЖКТ по сравнению с периодом до лечения?",
        ("Стало лучше", "Без изменений", "Стало хуже"),
        FOLLOWUP_SECTION,
    ),
    Question(
        "f10",
        FOLLOWUP_SECTION,
        "Дополнительные комментарии / события",
        "text",
        required=False,
    ),
    yes_no("f11a", "Начинались ли новые сопутствующие препараты?", FOLLOWUP_SECTION, "Какие препараты?"),
    yes_no("f11b", "Отменялись ли сопутствующие препараты?", FOLLOWUP_SECTION, "Какие препараты?"),
    yes_no("f11c", "Изменялась ли дозировка сопутствующих препаратов?", FOLLOWUP_SECTION, "Какие изменения?"),
)

RED_FLAG_KEYS = frozenset({f"q{number}" for number in range(25, 32)})


def questions_for(kind: str, respondent: str | None = None) -> tuple[Question, ...]:
    questions = BASELINE_QUESTIONS if kind == "baseline" else FOLLOWUP_QUESTIONS
    if respondent is None:
        return questions
    return tuple(question for question in questions if question.respondent == respondent)


def question_for(kind: str, key: str) -> Question | None:
    return next((question for question in questions_for(kind) if question.key == key), None)


def validate_answers(
    kind: str,
    respondent: str,
    answers: dict[str, int | str],
    details: dict[str, str],
    partial: bool = False,
) -> None:
    questions = questions_for(kind, respondent)
    by_key = {question.key: question for question in questions}
    if not partial:
        expected = {question.key for question in questions if question.required}
        if not expected.issubset(answers) or not set(answers).issubset(by_key):
            raise ValueError("Ответьте на все обязательные вопросы анкеты")
    elif not set(answers).issubset(by_key):
        raise ValueError("В ответах есть вопросы из другого раздела")
    if not set(details).issubset(by_key):
        raise ValueError("Уточнение относится к неизвестному вопросу")
    for key, value in answers.items():
        question = by_key[key]
        if question.kind == "text":
            if not isinstance(value, str) or len(value) > 2000:
                raise ValueError("Текстовый ответ должен содержать не более 2000 символов")
            if question.required and not value.strip():
                raise ValueError("Заполните обязательный текстовый ответ")
        elif (
            isinstance(value, bool)
            or not isinstance(value, int)
            or value not in {option.value for option in question.options}
        ):
            raise ValueError(f"Выбран недопустимый ответ на вопрос {key}")
    for key, value in details.items():
        if by_key[key].detail_label is None or len(value) > 1000:
            raise ValueError(f"Недопустимое уточнение к вопросу {key}")
