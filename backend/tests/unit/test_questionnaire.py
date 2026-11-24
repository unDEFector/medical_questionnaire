import pytest
from src.services.auth import hash_password, verify_password
from src.services.questionnaire import questions_for, validate_answers


def test_questionnaire_matches_document_structure() -> None:
    assert len(questions_for("baseline", "patient")) == 31
    assert len(questions_for("baseline", "doctor")) == 5
    assert len(questions_for("followup", "patient")) == 13
    assert {question.key for question in questions_for("baseline") if question.key.startswith("q25")} == {
        "q25"
    }


def test_validate_choice_and_text_answers() -> None:
    answers = {question.key: 0 for question in questions_for("baseline", "patient")}
    validate_answers("baseline", "patient", answers, {})
    with pytest.raises(ValueError, match="недопустимый"):
        validate_answers("baseline", "patient", {**answers, "q01": 7}, {})
    with pytest.raises(ValueError, match="обязательные"):
        validate_answers("baseline", "patient", {}, {})


def test_password_hash_does_not_expose_password() -> None:
    password = "a-secure-password"
    password_hash = hash_password(password)
    assert password not in password_hash
    assert verify_password(password, password_hash)
    assert not verify_password("incorrect-password", password_hash)
    assert not verify_password(password, "!disabled")
