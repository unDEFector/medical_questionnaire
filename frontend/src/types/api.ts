export type RiskLevel = "low" | "moderate" | "high";
export type SurveyStatus = "pending" | "completed";
export type SurveyKind = "baseline" | "followup";

export type PatientListItem = {
  id: string;
  full_name: string;
  age: number;
  gender: "female" | "male" | "other";
  diagnosis: string;
  therapy: string;
  created_at: string;
  survey_count: number;
  latest_risk: RiskLevel | null;
  latest_survey_at: string | null;
  next_survey_at: string | null;
};

export type Dashboard = {
  patient_count: number;
  high_risk_count: number;
  pending_count: number;
  completed_count: number;
  recent_patients: PatientListItem[];
};

export type PatientInput = {
  full_name: string;
  birth_date: string;
  gender: "female" | "male" | "other";
  diagnosis: string;
  therapy: string;
  height_cm: number;
  initial_weight_kg: number;
};

export type SurveyAnswer = { question_key: string; value: number };

export type Survey = {
  id: string;
  kind: SurveyKind;
  status: SurveyStatus;
  token: string;
  risk_level: RiskLevel | null;
  risk_score: number | null;
  weight_kg: number | null;
  weight_change_percent: number;
  wellbeing_note: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  answers: SurveyAnswer[];
};

export type TrendPoint = {
  survey_id: string;
  date: string;
  kind: SurveyKind;
  risk_score: number;
  weight_kg: number;
  weight_change_percent: number;
  symptom_scores: Record<string, number>;
};

export type PatientDetail = {
  id: string;
  full_name: string;
  age: number;
  birth_date: string;
  gender: "female" | "male" | "other";
  diagnosis: string;
  therapy: string;
  height_cm: number;
  initial_weight_kg: number;
  created_at: string;
  surveys: Survey[];
  trends: TrendPoint[];
  current_risk: RiskLevel | null;
  current_recommendations: string[];
};

export type PatientCreated = { patient: PatientDetail; survey_url: string };

export type RiskResult = {
  level: RiskLevel;
  score: number;
  weight_change_percent: number;
  title: string;
  patient_message: string;
  recommendations: string[];
};

export type QuestionOption = { value: number; label: string };
export type SurveyQuestion = {
  key: string;
  title: string;
  description: string;
  options: QuestionOption[];
};

export type PublicSurvey = {
  id: string;
  patient_name: string;
  kind: SurveyKind;
  status: SurveyStatus;
  due_date: string | null;
  baseline_weight_kg: number;
  questions: SurveyQuestion[];
  result: RiskResult | null;
};

export type SurveySubmitted = {
  survey_id: string;
  status: SurveyStatus;
  completed_at: string;
  result: RiskResult;
};
