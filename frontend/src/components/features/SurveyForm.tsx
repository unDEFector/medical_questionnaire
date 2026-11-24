"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { SurveyDetail, SurveyQuestion } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Loading, ErrorState } from "@/components/ui/Loading";

export function SurveyForm() {
  const params = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const survey = useQuery({
    queryKey: ["survey", params.id],
    queryFn: () => api.survey(params.id),
    retry: false,
  });

  if (survey.isLoading) return <Loading label="Загружаем анкету" />;
  if (survey.error || !survey.data) {
    return <ErrorState message={survey.error?.message ?? "Анкета не найдена"} />;
  }
  return (
    <SurveyLayout patientId={survey.data.patient_public_id}>
      {user?.role === "doctor" ? (
        <DoctorSurveyView survey={survey.data} />
      ) : (
        <PatientSurvey key={survey.data.id} survey={survey.data} />
      )}
    </SurveyLayout>
  );
}

function PatientSurvey({ survey }: { survey: SurveyDetail }) {
  const queryClient = useQueryClient();
  const questions = survey.questions.filter((question) => question.respondent === "patient");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [redFlags, setRedFlags] = useState<string[] | null>(null);
  const submission = useMutation({
    mutationFn: () =>
      api.submitSurvey(survey.id, {
        answers,
        details,
        current_weight_kg: weight ? Number(weight) : undefined,
        wellbeing_note: note,
      }),
    onSuccess: async (response) => {
      setRedFlags(response.red_flags);
      await queryClient.invalidateQueries({ queryKey: ["patient", "me"] });
    },
  });

  if (survey.status === "completed" || redFlags) {
    return (
      <div>
        <SurveyResult redFlags={redFlags ?? survey.red_flags} />
        {survey.status === "completed" && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h2 className="mb-4 text-lg font-bold">Ваши ответы</h2>
            <AnswersList survey={survey} respondent="patient" />
          </div>
        )}
      </div>
    );
  }

  const question = questions[step];
  const isLast = step === questions.length - 1;
  const selected = answers[question.key];
  const canContinue =
    question.kind === "text"
      ? !question.required || (typeof selected === "string" && selected.trim().length > 0)
      : typeof selected === "number";

  function submit() {
    if (isLast) submission.mutate();
    else setStep((value) => value + 1);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
          <span>{survey.kind === "baseline" ? "Исходная анкета" : "Контрольная анкета"}</span>
          <span>
            Шаг {step + 1} из {questions.length}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="card p-6 sm:p-8"
      >
        <fieldset>
          <legend className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            {question.section}
          </legend>
          <h1 className="mt-4 text-xl font-bold leading-8 text-navy sm:text-2xl">
            {question.title}
          </h1>
          {question.kind === "text" ? (
            <textarea
              aria-label={question.title}
              className="field mt-6 min-h-32 resize-y"
              maxLength={2000}
              required={question.required}
              placeholder="Введите ответ"
              value={typeof selected === "string" ? selected : ""}
              onChange={(event) => setAnswers({ ...answers, [question.key]: event.target.value })}
            />
          ) : (
            <div className="mt-6 space-y-3">
              {question.options.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all ${selected === option.value ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-slate-200 bg-white hover:border-brand-500"}`}
                >
                  <input
                    type="radio"
                    name={question.key}
                    value={option.value}
                    checked={selected === option.value}
                    onChange={() => setAnswers({ ...answers, [question.key]: option.value })}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
                  />
                  <span className="text-sm font-medium leading-6 text-slate-600">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          )}
          {question.detail_label && selected !== undefined && (
            <div className="mt-5">
              <label htmlFor={`${question.key}-detail`} className="label">
                {question.detail_label}{" "}
                <span className="font-normal text-slate-400">(необязательно)</span>
              </label>
              <textarea
                id={`${question.key}-detail`}
                className="field min-h-24 resize-y"
                maxLength={1000}
                value={details[question.key] ?? ""}
                onChange={(event) => setDetails({ ...details, [question.key]: event.target.value })}
              />
            </div>
          )}
        </fieldset>
        {isLast && (
          <div className="mt-7 space-y-4 border-t border-slate-100 pt-6">
            {survey.kind === "followup" && (
              <div>
                <label htmlFor="weight" className="label">
                  Текущий вес, кг{" "}
                  <span className="font-normal text-slate-400">(если известен)</span>
                </label>
                <input
                  id="weight"
                  className="field"
                  type="number"
                  min="21"
                  max="500"
                  step="0.1"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Исходный вес: {survey.baseline_weight_kg} кг
                </p>
              </div>
            )}
            <div>
              <label htmlFor="note" className="label">
                Комментарий для врача{" "}
                <span className="font-normal text-slate-400">(необязательно)</span>
              </label>
              <textarea
                id="note"
                className="field min-h-24 resize-y"
                maxLength={2000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>
        )}
        {submission.error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
            {submission.error.message}
          </p>
        )}
        <div className="mt-8 flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0 || submission.isPending}
            className="flex-1"
          >
            <Icon name="arrow-left" className="h-4 w-4" />
            Назад
          </Button>
          <Button
            type="submit"
            disabled={!canContinue || submission.isPending}
            className="flex-[2]"
          >
            {submission.isPending ? "Отправляем…" : isLast ? "Завершить анкету" : "Далее"}
            {!isLast && <Icon name="arrow-right" className="h-4 w-4" />}
          </Button>
        </div>
      </form>
      <p className="mt-6 text-center text-xs leading-5 text-slate-400">
        Ответы доступны вам и врачу. Анкета не заменяет очную консультацию.
      </p>
    </div>
  );
}

function DoctorSurveyView({ survey }: { survey: SurveyDetail }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-600">
          {survey.kind === "baseline" ? "Исходная анкета" : "Контрольная анкета"}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy">
          Ответы пациента {survey.patient_public_id}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {survey.status === "completed" ? "Анкета завершена" : "Пациент ещё не завершил анкету"}
        </p>
      </div>
      {survey.red_flags.length > 0 && (
        <div
          className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm leading-6 text-red-800"
          role="alert"
        >
          <strong>Red flags: {survey.red_flags.join(", ")}.</strong> Оцените соответствующие ответы
          ниже.
        </div>
      )}
      <section className="card p-6">
        <h2 className="mb-5 text-lg font-bold">Ответы пациента</h2>
        <AnswersList survey={survey} respondent="patient" />
      </section>
      {survey.kind === "baseline" && <ClinicalEditor key={survey.id} survey={survey} />}
    </div>
  );
}

function ClinicalEditor({ survey }: { survey: SurveyDetail }) {
  const queryClient = useQueryClient();
  const questions = survey.questions.filter((question) => question.respondent === "doctor");
  const initialAnswers = Object.fromEntries(
    survey.answers
      .filter((answer) => questions.some((question) => question.key === answer.question_key))
      .map((answer) => [answer.question_key, answer.value ?? answer.text_value]),
  );
  const initialDetails = Object.fromEntries(
    survey.answers
      .filter((answer) =>
        questions.some((question) => question.key === answer.question_key && question.detail_label),
      )
      .map((answer) => [answer.question_key, answer.text_value]),
  );
  const [answers, setAnswers] = useState<Record<string, number | string>>(initialAnswers);
  const [details, setDetails] = useState<Record<string, string>>(initialDetails);
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: () => api.updateClinicalAnswers(survey.id, { answers, details }),
    onSuccess: async (response) => {
      setSaved(true);
      queryClient.setQueryData(["survey", survey.id], response);
      await queryClient.invalidateQueries({ queryKey: ["patient"] });
    },
  });

  return (
    <section className="card p-6">
      <h2 className="text-lg font-bold">Дополнительные данные исследователя</h2>
      <p className="mt-1 text-xs text-slate-400">
        Этот раздел доступен для редактирования только врачу
      </p>
      <div className="mt-6 space-y-5">
        {questions.map((question) => (
          <div key={question.key} className="rounded-xl bg-slate-50 p-4">
            <label htmlFor={`clinical-${question.key}`} className="label">
              {question.title}
            </label>
            {question.kind === "text" ? (
              <input
                id={`clinical-${question.key}`}
                className="field bg-white"
                maxLength={2000}
                value={typeof answers[question.key] === "string" ? answers[question.key] : ""}
                onChange={(event) => {
                  setAnswers({ ...answers, [question.key]: event.target.value });
                  setSaved(false);
                }}
              />
            ) : (
              <select
                id={`clinical-${question.key}`}
                className="field bg-white"
                value={typeof answers[question.key] === "number" ? answers[question.key] : ""}
                onChange={(event) => {
                  setAnswers({ ...answers, [question.key]: Number(event.target.value) });
                  setSaved(false);
                }}
              >
                <option value="" disabled>
                  Выберите ответ
                </option>
                {question.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {question.detail_label && (
              <input
                aria-label={question.detail_label}
                className="field mt-3 bg-white"
                maxLength={1000}
                placeholder={question.detail_label}
                value={details[question.key] ?? ""}
                onChange={(event) => {
                  setDetails({ ...details, [question.key]: event.target.value });
                  setSaved(false);
                }}
              />
            )}
          </div>
        ))}
      </div>
      {mutation.error && <p className="mt-4 text-sm text-red-700">{mutation.error.message}</p>}
      {saved && <p className="mt-4 text-sm text-emerald-700">Дополнительные данные сохранены</p>}
      <Button className="mt-6" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? "Сохранение…" : "Сохранить данные врача"}
      </Button>
    </section>
  );
}

function AnswersList({
  survey,
  respondent,
}: {
  survey: SurveyDetail;
  respondent: "doctor" | "patient";
}) {
  const questions = survey.questions.filter((question) => question.respondent === respondent);
  const answers = new Map(survey.answers.map((answer) => [answer.question_key, answer]));
  const sections = Array.from(new Set(questions.map((question) => question.section)));
  return (
    <div className="space-y-7">
      {sections.map((section) => (
        <div key={section}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-600">
            {section}
          </h3>
          <div className="divide-y divide-slate-100">
            {questions
              .filter((question) => question.section === section)
              .map((question) => (
                <AnswerRow
                  key={question.key}
                  question={question}
                  answer={answers.get(question.key)}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnswerRow({
  question,
  answer,
}: {
  question: SurveyQuestion;
  answer: SurveyDetail["answers"][number] | undefined;
}) {
  const option = question.options.find((item) => item.value === answer?.value);
  const value = question.kind === "text" ? answer?.text_value : option?.label;
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[1fr_minmax(180px,0.8fr)]">
      <p className="text-sm leading-6 text-slate-600">{question.title}</p>
      <div className="sm:text-right">
        <p className="text-sm font-semibold leading-6 text-navy">{value || "—"}</p>
        {question.kind !== "text" && answer?.text_value && (
          <p className="mt-1 text-xs leading-5 text-slate-500">{answer.text_value}</p>
        )}
      </div>
    </div>
  );
}

function SurveyResult({ redFlags }: { redFlags: string[] }) {
  return (
    <div className="card p-8 text-center" role={redFlags.length ? "alert" : "status"}>
      <span
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${redFlags.length ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
      >
        <Icon name={redFlags.length ? "bell" : "check"} className="h-10 w-10" />
      </span>
      <p className="mt-6 text-sm font-semibold text-emerald-600">Ваши ответы получены</p>
      <h1 className="mt-2 text-2xl font-bold text-navy">Спасибо за заполнение анкеты</h1>
      <p className="mt-4 text-sm leading-7 text-slate-500">
        {redFlags.length
          ? "В ответах отмечены важные симптомы. Свяжитесь с медицинской организацией; при резком ухудшении состояния обратитесь за неотложной помощью."
          : "Результаты доступны лечащему врачу. Следующий опрос появится в вашем кабинете по плану наблюдения."}
      </p>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-brand-600">
        Вернуться в личный кабинет →
      </Link>
    </div>
  );
}

function SurveyLayout({ children, patientId }: { children: React.ReactNode; patientId: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"
        >
          <Icon name="arrow-left" className="h-4 w-4" />
          Личный кабинет
        </Link>
        <span className="font-mono text-xs text-slate-400">{patientId}</span>
      </div>
      {children}
    </div>
  );
}
