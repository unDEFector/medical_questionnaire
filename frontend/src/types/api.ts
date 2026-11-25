export type UserRole = "admin" | "doctor" | "patient";
export type SurveyStatus = "pending" | "completed";
export type SurveyKind = "baseline" | "followup";

export type User = {
  public_id: string;
  role: UserRole;
  patient_id: string | null;
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  expires_at: string;
  user: User;
};

export type PatientListItem = {
  id: string;
  public_id: string;
  medication: string;
  created_at: string;
  survey_count: number;
  latest_attention: boolean | null;
  latest_survey_at: string | null;
  next_survey_at: string | null;
};

export type Dashboard = {
  patient_count: number;
  attention_count: number;
  pending_count: number;
  completed_count: number;
  recent_patients: PatientListItem[];
};

export type PatientInput = {
  height_cm: number;
  initial_weight_kg: number;
  medication: string;
  first_dose_date?: string;
  starting_dose?: number;
};

export type SurveyAnswer = { question_key: string; value: number | null; text_value: string };

export type Survey = {
  id: string;
  kind: SurveyKind;
  status: SurveyStatus;
  weight_kg: number | null;
  weight_change_percent: number;
  wellbeing_note: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  answers: SurveyAnswer[];
  red_flags: string[];
};

export type TrendPoint = {
  survey_id: string;
  date: string;
  kind: SurveyKind;
  weight_kg: number;
  weight_change_percent: number;
};

export type PatientDetail = {
  id: string;
  public_id: string;
  height_cm: number;
  initial_weight_kg: number;
  bmi: number;
  medication: string;
  first_dose_date: string | null;
  starting_dose: number | null;
  created_at: string;
  surveys: Survey[];
  trends: TrendPoint[];
  current_red_flags: string[];
};

export type PatientCredentials = { public_id: string; password: string };
export type PatientCreated = { patient: PatientDetail; credentials: PatientCredentials };

export type AdminUser = {
  id: string;
  public_id: string;
  role: "doctor" | "patient";
  created_at: string;
  patient_id: string | null;
};

export type AdminStats = {
  admin_count: number;
  doctor_count: number;
  patient_count: number;
  attention_count: number;
  pending_count: number;
  completed_count: number;
};

export type DoctorInput = { public_id: string; password: string };

export type QuestionOption = { value: number; label: string };
export type SurveyQuestion = {
  key: string;
  section: string;
  title: string;
  kind: "scale" | "choice" | "boolean" | "text";
  options: QuestionOption[];
  detail_label: string | null;
  respondent: "doctor" | "patient";
  required: boolean;
};

export type SurveyDetail = {
  id: string;
  patient_public_id: string;
  kind: SurveyKind;
  status: SurveyStatus;
  due_date: string | null;
  baseline_weight_kg: number;
  questions: SurveyQuestion[];
  answers: SurveyAnswer[];
  red_flags: string[];
};

export type SurveyPayload = {
  answers: Record<string, number | string>;
  details: Record<string, string>;
  current_weight_kg?: number;
  wellbeing_note: string;
};

export type SurveySubmitted = {
  survey_id: string;
  status: SurveyStatus;
  completed_at: string;
  red_flags: string[];
};
