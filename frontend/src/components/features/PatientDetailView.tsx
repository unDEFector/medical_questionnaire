"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { formatDate, genderLabels, riskLabels } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Loading, ErrorState } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { TrendChart } from "./TrendChart";

const tabs = [
  { id: "overview", label: "Обзор" },
  { id: "dynamics", label: "Динамика" },
  { id: "surveys", label: "Опросники" },
  { id: "recommendations", label: "Рекомендации" },
] as const;

type Tab = (typeof tabs)[number]["id"];

export function PatientDetailView() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("overview");
  const [riskModalOpen, setRiskModalOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const patient = useQuery({
    queryKey: ["patient", params.id],
    queryFn: () => api.patient(params.id),
  });

  if (patient.isLoading) return <Loading label="Открываем карточку пациента" />;
  if (patient.error || !patient.data)
    return <ErrorState message={patient.error?.message ?? "Пациент не найден"} />;
  const data = patient.data;
  const latest = data.trends.at(-1);
  const pending = data.surveys.find((survey) => survey.status === "pending");
  const risk = data.current_risk;
  const riskStyles =
    risk === "high"
      ? "border-red-100 bg-red-50 text-red-900"
      : risk === "moderate"
        ? "border-amber-100 bg-amber-50 text-amber-900"
        : "border-emerald-100 bg-emerald-50 text-emerald-900";

  async function copySurveyLink() {
    if (!pending) return;
    await navigator.clipboard.writeText(`${window.location.origin}/survey/${pending.token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-[1360px]">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-600"
      >
        <Icon name="arrow-left" className="h-4 w-4" />
        Все пациенты
      </Link>
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-xl font-bold text-brand-700">
              {data.full_name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <h1 className="text-2xl font-bold">{data.full_name}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {genderLabels[data.gender]} · {data.age} лет · {data.diagnosis}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {data.therapy || "Текущая терапия не указана"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RiskBadge risk={risk} className="px-3 py-2" />
            <Button
              onClick={copySurveyLink}
              disabled={!pending}
              title={pending ? "Скопировать ссылку на текущий опрос" : "Нет доступных опросов"}
            >
              <Icon name={copied ? "check" : "copy"} />
              {copied ? "Ссылка скопирована" : "Ссылка на опрос"}
            </Button>
          </div>
        </div>
        <div
          className="flex overflow-x-auto border-t border-slate-100 px-4"
          role="tablist"
          aria-label="Разделы карточки"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm font-medium ${tab === item.id ? "border-brand-600 text-brand-700" : "border-transparent text-slate-400 hover:text-navy"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {(tab === "overview" || tab === "dynamics") && (
        <>
          {risk && (
            <section className={`mt-6 flex items-start gap-4 rounded-2xl border p-5 ${riskStyles}`}>
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80">
                <Icon name={risk === "low" ? "check" : "bell"} />
              </span>
              <div>
                <h2 className="font-bold">{riskLabels[risk]}</h2>
                <p className="mt-1 text-sm opacity-80">
                  {risk === "high"
                    ? "Выявлены выраженные изменения. Оцените необходимость связаться с пациентом и назначить приём."
                    : risk === "moderate"
                      ? "Есть изменения показателей. Рекомендуется обсудить их с пациентом на ближайшем приёме."
                      : "По последней анкете выраженных признаков нутритивного риска не выявлено."}
                </p>
              </div>
            </section>
          )}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Текущий вес"
              value={latest ? `${latest.weight_kg} кг` : "—"}
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
            <Metric
              label="Балл симптомов"
              value={latest ? `${latest.risk_score} / 18` : "—"}
              note="По последней анкете"
            />
            <Metric
              label="Следующий опрос"
              value={pending ? formatDate(pending.due_date) : "—"}
              note={pending?.kind === "baseline" ? "Исходная анкета" : "Контрольное наблюдение"}
            />
          </div>
          <section className="card mt-6 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Динамика показателей</h2>
                <p className="mt-1 text-xs text-slate-400">Результаты всех завершённых опросов</p>
              </div>
              <Icon name="activity" className="text-brand-500" />
            </div>
            <TrendChart trends={data.trends} />
          </section>
          {tab === "dynamics" && data.trends.length > 0 && (
            <section className="card mt-6 overflow-x-auto p-6">
              <h2 className="mb-4 text-lg font-bold">История измерений</h2>
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="text-xs text-slate-400">
                  <tr className="border-b">
                    <th className="py-3">Дата</th>
                    <th>Тип</th>
                    <th>Вес</th>
                    <th>Изменение</th>
                    <th>Балл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.trends.map((point) => (
                    <tr key={point.survey_id}>
                      <td className="py-3">{formatDate(point.date)}</td>
                      <td>{point.kind === "baseline" ? "Исходный" : "Контрольный"}</td>
                      <td>{point.weight_kg} кг</td>
                      <td>{point.weight_change_percent}%</td>
                      <td>{point.risk_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}

      {tab === "surveys" && (
        <section className="card mt-6 overflow-hidden">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-bold">История опросников</h2>
            <p className="mt-1 text-xs text-slate-400">
              Персональные ссылки и результаты обработки
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {data.surveys.map((survey) => (
              <div key={survey.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${survey.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
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
                <RiskBadge risk={survey.risk_level} />
                {survey.status === "pending" && (
                  <Link
                    href={`/survey/${survey.token}`}
                    target="_blank"
                    className="text-sm font-semibold text-brand-600"
                  >
                    Открыть анкету
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "recommendations" && (
        <section className="card mt-6 p-6">
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name="heart" />
          </span>
          <h2 className="text-xl font-bold">Рекомендации по результатам</h2>
          <p className="mt-2 text-sm text-slate-500">
            Сформированы на основании последней заполненной анкеты.
          </p>
          {data.current_recommendations.length ? (
            <ol className="mt-6 space-y-4">
              {data.current_recommendations.map((recommendation, index) => (
                <li key={recommendation} className="flex gap-4 rounded-xl bg-slate-50 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{recommendation}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              Рекомендации появятся после заполнения исходной анкеты.
            </p>
          )}
          <p className="mt-6 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-400">
            Автоматическая оценка не заменяет клиническое заключение врача. Решения о лечении
            принимаются с учётом всей медицинской информации.
          </p>
        </section>
      )}

      <Modal
        open={risk === "high" && riskModalOpen}
        onClose={() => setRiskModalOpen(false)}
        title="Требуется внимание врача"
      >
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Icon name="bell" className="h-8 w-8" />
          </span>
          <h3 className="mt-4 text-lg font-bold">Высокий нутритивный риск</h3>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Последние ответы пациента {data.full_name} указывают на выраженные изменения.
            Рекомендуется связаться с пациентом и оценить необходимость внеочередного приёма.
          </p>
          <Button onClick={() => setRiskModalOpen(false)} className="mt-6 w-full">
            Принять к сведению
          </Button>
        </div>
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
