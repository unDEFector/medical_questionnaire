from pydantic import BaseModel


class RiskResult(BaseModel):
    level: str
    score: int
    weight_change_percent: float
    title: str
    patient_message: str
    recommendations: list[str]
