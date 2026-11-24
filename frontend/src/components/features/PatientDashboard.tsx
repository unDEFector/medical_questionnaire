"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Loading, ErrorState } from "@/components/ui/Loading";
import { AttentionBadge } from "@/components/ui/AttentionBadge";
import { TrendChart } from "./TrendChart";

export function PatientDashboard() {
  const user = useAuthStore((state) => state.user);
  const patient = useQuery({ queryKey: ["patient", "me"], queryFn: api.patientMe });

  if (patient.isLoading) return <Loading label="Загружаем ваши опросы" />;
  if (patient.error || !patient.data) {
    return <ErrorState message={patient.error?.message ?? "Не удалось загрузить данные"} />;
  }
  const data = patient.data;
  const pending = data.surveys.find((survey) => survey.status === "pending");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm text-slate-400">Ваш ID: {user?.public_id}</p>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Мои опросы</h1>
        </div>
        {pending && (
          <Link href={`/survey/${pending.id}`}>
            <Button>
              <Icon name="clipboard" />
              {pending.kind === "baseline"
                ? "Заполнить исходную анкету"
                : "Пройти контрольный опрос"}
            </Button>
          </Link>
        )}
      </div>

      {data.current_red_flags.length > 0 && (
        <section
          className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-900"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <Icon name="bell" className="mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold">Ответы переданы врачу</h2>
              <p className="mt-1 text-sm leading-6 text-red-700">
                В последней анкете отмечены важные симптомы. Свяжитесь с медицинской организацией;
                при резком ухудшении состояния обратитесь за неотложной помощью.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Завершено опросов" value={String(data.trends.length)} />
        <Metric
          label="Текущий вес"
          value={`${data.trends.at(-1)?.weight_kg ?? data.initial_weight_kg} кг`}
        />
        <Metric label="Следующий опрос" value={pending ? formatDate(pending.due_date) : "—"} />
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold">История анкет</h2>
          <p className="mt-1 text-xs text-slate-400">
            Откройте завершённую анкету, чтобы посмотреть ответы
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {data.surveys.map((survey) => (
            <Link
              href={`/survey/${survey.id}`}
              key={survey.id}
              className="flex flex-col gap-4 p-5 transition-colors hover:bg-brand-50/40 sm:flex-row sm:items-center"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${survey.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
              >
                <Icon name={survey.status === "completed" ? "check" : "clipboard"} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-navy">
                  {survey.kind === "baseline" ? "Исходная анкета" : "Контрольная анкета"}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  {survey.status === "completed"
                    ? `Завершена ${formatDate(survey.completed_at)}`
                    : `Доступна для заполнения · ${formatDate(survey.due_date)}`}
                </span>
              </span>
              <AttentionBadge
                attention={survey.status === "completed" ? survey.red_flags.length > 0 : null}
              />
              <Icon name="arrow-right" className="hidden text-slate-300 sm:block" />
            </Link>
          ))}
        </div>
      </section>

      <section id="dynamics" className="card mt-6 p-6">
        <h2 className="text-lg font-bold">Динамика массы тела</h2>
        <p className="mt-1 text-xs text-slate-400">Исходный вес: {data.initial_weight_kg} кг</p>
        <div className="mt-4">
          <TrendChart trends={data.trends} />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}
