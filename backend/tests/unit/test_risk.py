import pytest
from src.services.risk import QUESTIONS, calculate_risk


def answers(value: int) -> dict[str, int]:
    return {question.key: value for question in QUESTIONS}


@pytest.mark.parametrize(
    ("score", "weight", "expected"),
    [
        (0, 80, "low"),
        (1, 78, "moderate"),
        (2, 75, "high"),
        (0, 80, "low"),
    ],
)
def test_weight_loss_risk_thresholds(score: int, weight: float, expected: str) -> None:
    result = calculate_risk(answers(score), 80, weight)
    assert result.level == expected


def test_symptoms_define_high_risk_without_weight_loss() -> None:
    result = calculate_risk(answers(2), 80, 80)
    assert result.level == "high"
    assert result.score == 12
    assert result.weight_change_percent == 0


def test_low_risk_contains_followup_recommendation() -> None:
    result = calculate_risk(answers(0), 80, 80)
    assert result.level == "low"
    assert result.recommendations
