"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import type { RiskResult } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Loading, ErrorState } from "@/components/ui/Loading";

export function SurveyForm() {
  const params = useParams<{ token: string }>();
  const survey = useQuery({
    queryKey: ["survey", params.token],
    queryFn: () => api.survey(params.token),
    retry: false,
  });
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<RiskResult | null>(null);
  const submission = useMutation({
    mutationFn: () =>
      api.submitSurvey(params.token, {
        answers,
        current_weight_kg: weight ? Number(weight) : undefined,
        wellbeing_note: note,
      }),
    onSuccess: (response) => setResult(response.result),
  });

  if (survey.isLoading)
    return (
      <SurveyLayout>
        <Loading label="Загружаем анкету" />
      </SurveyLayout>
    );
  if (survey.error || !survey.data)
    return (
      <SurveyLayout>
        <ErrorState message={survey.error?.message ?? "Анкета не найдена"} />
      </SurveyLayout>
    );
  const data = survey.data;
  const currentResult = result ?? data.result;
  if (currentResult)
    return (
      <SurveyLayout>
        <SurveyResult result={currentResult} />
      </SurveyLayout>
    );

  const question = data.questions[step];
  const isLast = step === data.questions.length - 1;
  const selected = answers[question.key];
  const canSubmit = selected !== undefined && (data.kind === "baseline" || Number(weight) > 0);

  function next() {
    if (isLast) submission.mutate();
    else setStep((value) => value + 1);
  }

  return (
    <SurveyLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
          <span>{data.kind === "baseline" ? "Исходная анкета" : "Контрольная анкета"}</span>
          <span>
            Шаг {step + 1} из {data.questions.length}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${((step + 1) / data.questions.length) * 100}%` }}
          />
        </div>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          next();
        }}
      >
        <fieldset>
          <legend className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            {question.title}
          </legend>
          <h1 className="mt-3 text-xl font-bold leading-8 text-navy sm:text-2xl">
            {question.description}
          </h1>
          <p className="mt-2 text-sm text-slate-400">Выберите один наиболее подходящий вариант</p>
          <div className="mt-6 space-y-3">
            {question.options.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all ${selected === option.value ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-slate-200 bg-white hover:border-brand-500"}`}
              >
                <input
                  type="radio"
                  name={question.key}
                  value={option.value}
                  checked={selected === option.value}
                  onChange={() => setAnswers({ ...answers, [question.key]: option.value })}
                  className="h-5 w-5 accent-brand-600"
                />
                <span className="text-sm font-medium text-slate-600">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {isLast && (
          <div className="mt-7 space-y-4 border-t border-slate-100 pt-6">
            {data.kind === "followup" && (
              <div>
                <label htmlFor="weight" className="label">
                  Текущий вес, кг
                </label>
                <input
                  id="weight"
                  className="field"
                  type="number"
                  min="21"
                  max="500"
                  step="0.1"
                  required
                  placeholder="Например, 68.5"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Исходный вес: {data.baseline_weight_kg} кг
                </p>
              </div>
            )}
            <div>
              <label htmlFor="note" className="label">
                Изменения самочувствия{" "}
                <span className="font-normal text-slate-400">(необязательно)</span>
              </label>
              <textarea
                id="note"
                className="field min-h-24 resize-y"
                maxLength={2000}
                placeholder="Расскажите, как вы себя чувствуете"
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
          <Button type="submit" disabled={!canSubmit || submission.isPending} className="flex-[2]">
            {submission.isPending ? "Отправляем…" : isLast ? "Завершить анкету" : "Далее"}
            {!isLast && <Icon name="arrow-right" className="h-4 w-4" />}
          </Button>
        </div>
      </form>
      <p className="mt-6 text-center text-xs leading-5 text-slate-400">
        Ваши ответы будут доступны лечащему врачу.
        <br />
        Анкета не заменяет очную консультацию.
      </p>
    </SurveyLayout>
  );
}

function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-canvas px-4 py-6 sm:py-10">
      <header className="mx-auto mb-6 flex max-w-xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-navy">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-lg font-bold text-white">
            +
          </span>
          <span className="text-xl font-bold">инКлира</span>
        </Link>
        <span className="text-xs text-slate-400">Безопасный медицинский опрос</span>
      </header>
      <main className="mx-auto max-w-xl rounded-3xl border border-white bg-white p-6 shadow-card sm:p-9">
        {children}
      </main>
    </div>
  );
}

function SurveyResult({ result }: { result: RiskResult }) {
  const styles =
    result.level === "high"
      ? "bg-red-50 text-red-700"
      : result.level === "moderate"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";
  return (
    <div
      className="text-center"
      role={result.level === "high" ? "alertdialog" : "status"}
      aria-label="Результат анкеты"
    >
      <span className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${styles}`}>
        <Icon name={result.level === "low" ? "check" : "heart"} className="h-10 w-10" />
      </span>
      <p className="mt-6 text-sm font-semibold text-emerald-600">Ваши ответы получены</p>
      <h1 className="mt-2 text-2xl font-bold text-navy">{result.title}</h1>
      <p className="mt-4 text-sm leading-7 text-slate-500">{result.patient_message}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-slate-400">Балл симптомов</p>
          <p className="mt-1 text-xl font-bold text-navy">{result.score} / 18</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-slate-400">Изменение веса</p>
          <p className="mt-1 text-xl font-bold text-navy">
            {result.weight_change_percent > 0 ? "+" : ""}
            {result.weight_change_percent}%
          </p>
        </div>
      </div>
      {result.level === "high" && (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-left">
          <p className="text-sm font-bold text-red-800">Необходима связь с врачом</p>
          <p className="mt-1 text-xs leading-5 text-red-700">
            Не откладывайте обращение. При резком ухудшении самочувствия обратитесь за неотложной
            медицинской помощью.
          </p>
        </div>
      )}
      <p className="mt-7 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-400">
        Результат основан на ваших ответах и не является диагнозом. Лечащий врач увидит анкету в
        вашей карточке.
      </p>
    </div>
  );
}
