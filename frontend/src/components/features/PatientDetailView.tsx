"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { PatientCredentials } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Loading, ErrorState } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { AttentionBadge } from "@/components/ui/AttentionBadge";
import { TrendChart } from "./TrendChart";

export function PatientDetailView() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [credentials, setCredentials] = useState<PatientCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const patient = useQuery({
    queryKey: ["patient", params.id],
    queryFn: () => api.patient(params.id),
  });
  const resetPassword = useMutation({
    mutationFn: () => api.resetPatientPassword(params.id),
    onSuccess: setCredentials,
  });

  if (patient.isLoading) return <Loading label="Открываем карточку пациента" />;
  if (patient.error || !patient.data) {
    return <ErrorState message={patient.error?.message ?? "Пациент не найден"} />;
  }
  const data = patient.data;
  const latest = data.trends.at(-1);
  const pending = data.surveys.find((survey) => survey.status === "pending");
  const latestSurvey = data.surveys.find((survey) => survey.status === "completed");

  async function copyCredentials() {
    if (!credentials) return;
    await navigator.clipboard.writeText(
      `ID: ${credentials.public_id}\nПароль: ${credentials.password}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-600"
      >
        <Icon name="arrow-left" className="h-4 w-4" />
        Все пациенты
      </Link>
      <div className="card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <Icon name="users" className="h-8 w-8" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Карточка пациента</p>
              <h1 className="mt-1 font-mono text-2xl font-bold">{data.public_id}</h1>
              <p className="mt-1 text-sm text-slate-500">{data.medication}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AttentionBadge
              attention={latestSurvey ? data.current_red_flags.length > 0 : null}
              className="px-3 py-2"
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (window.confirm("Старый пароль перестанет работать. Выдать новый пароль?")) {
                  resetPassword.mutate();
                }
              }}
              disabled={resetPassword.isPending}
            >
              <Icon name="settings" />
              {resetPassword.isPending ? "Генерация…" : "Новый пароль"}
            </Button>
          </div>
        </div>
      </div>

      {data.current_red_flags.length > 0 && latestSurvey && (
        <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Icon name="bell" />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold text-red-900">В последней анкете есть red flags</h2>
            <p className="mt-1 text-sm text-red-700">
              Положительные ответы: {data.current_red_flags.join(", ")}. Просмотрите формулировки и
              примите клиническое решение.
            </p>
          </div>
          <Link href={`/survey/${latestSurvey.id}`} className="text-sm font-semibold text-red-800">
            Открыть ответы →
          </Link>
        </section>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Текущий вес"
          value={`${latest?.weight_kg ?? data.initial_weight_kg} кг`}
          note={`Исходный: ${data.initial_weight_kg} кг`}
        />
        <Metric
          label="Изменение веса"
          value={
            latest
              ? `${latest.weight_change_percent > 0 ? "+" : ""}${latest.weight_change_percent}%`
              : "—"
          }
          note="От исходной массы"
        />
        <Metric label="ИМТ" value={String(data.bmi)} note={`Рост: ${data.height_cm} см`} />
        <Metric
          label="Следующий опрос"
          value={pending ? formatDate(pending.due_date) : "—"}
          note={pending?.kind === "baseline" ? "Исходная анкета" : "Контрольное наблюдение"}
        />
      </div>

      <section className="card mt-6 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Динамика массы тела</h2>
            <p className="mt-1 text-xs text-slate-400">Результаты всех завершённых опросов</p>
          </div>
          <Icon name="activity" className="text-brand-500" />
        </div>
        <TrendChart trends={data.trends} />
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold">Опросники</h2>
          <p className="mt-1 text-xs text-slate-400">
            Ответы пациента и дополнительные данные врача
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {data.surveys.map((survey) => (
            <div key={survey.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${survey.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
              >
                <Icon name={survey.status === "completed" ? "check" : "clipboard"} />
              </span>
              <div className="flex-1">
                <p className="font-semibold">
                  {survey.kind === "baseline" ? "Исходная анкета" : "Контрольная анкета"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Создана {formatDate(survey.created_at)} ·{" "}
                  {survey.status === "completed"
                    ? `Завершена ${formatDate(survey.completed_at)}`
                    : `Срок ${formatDate(survey.due_date)}`}
                </p>
              </div>
              <AttentionBadge
                attention={survey.status === "completed" ? survey.red_flags.length > 0 : null}
              />
              <Link href={`/survey/${survey.id}`} className="text-sm font-semibold text-brand-600">
                {survey.status === "completed" ? "Посмотреть ответы" : "Открыть анкету"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-6 text-xs leading-5 text-slate-400">
        Red flags — сигнал для оценки врачом, а не автоматический диагноз. Дата первой дозы:{" "}
        {formatDate(data.first_dose_date)}.
        {data.starting_dose ? ` Стартовая доза: ${data.starting_dose}.` : ""}
      </p>

      <Modal
        open={!!credentials}
        onClose={() => {
          setCredentials(null);
          setCopied(false);
          void queryClient.invalidateQueries({ queryKey: ["patient", params.id] });
        }}
        title="Новый пароль пациента"
      >
        {credentials && (
          <div>
            <p className="text-sm leading-6 text-slate-500">
              Передайте новые данные пациенту. Пароль показывается только сейчас.
            </p>
            <div className="mt-5 rounded-xl bg-slate-50 p-4 font-mono text-sm">
              <p>ID: {credentials.public_id}</p>
              <p className="mt-2 break-all">Пароль: {credentials.password}</p>
            </div>
            <Button onClick={copyCredentials} variant="secondary" className="mt-4 w-full">
              <Icon name={copied ? "check" : "copy"} />
              {copied ? "Скопировано" : "Скопировать"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{note}</p>
    </div>
  );
}
