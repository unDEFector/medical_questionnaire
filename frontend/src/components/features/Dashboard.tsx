"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Loading, ErrorState } from "@/components/ui/Loading";
import { PatientTable } from "./PatientTable";
import { NewPatientModal } from "./NewPatientModal";

export function Dashboard() {
  const [search, setSearch] = useState("");
  const { setPatientModalOpen } = useAppStore();
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });
  const patients = useQuery({
    queryKey: ["patients", search],
    queryFn: () => api.patients(search),
  });

  const stats: Array<{
    label: string;
    value: number;
    icon: IconName;
    color: string;
    note: string;
  }> = [
    {
      label: "Всего пациентов",
      value: dashboard.data?.patient_count ?? 0,
      icon: "users",
      color: "bg-brand-50 text-brand-600",
      note: "Под наблюдением",
    },
    {
      label: "Высокий риск",
      value: dashboard.data?.high_risk_count ?? 0,
      icon: "heart",
      color: "bg-red-50 text-red-600",
      note: "Требуют внимания",
    },
    {
      label: "Ожидают опроса",
      value: dashboard.data?.pending_count ?? 0,
      icon: "clipboard",
      color: "bg-amber-50 text-amber-600",
      note: "Запланировано",
    },
    {
      label: "Завершено опросов",
      value: dashboard.data?.completed_count ?? 0,
      icon: "check",
      color: "bg-emerald-50 text-emerald-600",
      note: "За всё время",
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm text-slate-400">Добрый день, Александра</p>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Обзор пациентов
          </h1>
        </div>
        <Button onClick={() => setPatientModalOpen(true)}>
          <Icon name="plus" />
          Добавить пациента
        </Button>
      </div>

      {dashboard.error ? (
        <ErrorState message={dashboard.error.message} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-navy">
                    {dashboard.isLoading ? "—" : stat.value}
                  </p>
                </div>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon name={stat.icon} />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">{stat.note}</p>
            </div>
          ))}
        </div>
      )}

      {!!dashboard.data?.high_risk_count && (
        <section
          id="recommendations"
          className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 sm:flex-row sm:items-center"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Icon name="bell" />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold text-red-900">
              Есть пациенты с высоким нутритивным риском
            </h2>
            <p className="mt-1 text-sm text-red-700">
              Просмотрите результаты и оцените необходимость внеочередного приёма.
            </p>
          </div>
          <span className="text-sm font-semibold text-red-800">
            {dashboard.data.high_risk_count} пациент(а)
          </span>
        </section>
      )}

      <section id="patients" className="card mt-6 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Пациенты</h2>
            <p className="mt-1 text-xs text-slate-400">Актуальные результаты и план наблюдения</p>
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Поиск пациента</span>
            <Icon name="search" className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="field py-2.5 pl-9"
              placeholder="Поиск по имени"
            />
          </label>
        </div>
        {patients.isLoading ? (
          <Loading label="Загружаем список пациентов" />
        ) : patients.error ? (
          <div className="p-5">
            <ErrorState message={patients.error.message} />
          </div>
        ) : (
          <PatientTable patients={patients.data ?? []} />
        )}
      </section>

      <section id="surveys" className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-brand-50 p-3 text-brand-600">
              <Icon name="calendar" />
            </span>
            <div>
              <h2 className="font-bold">Контроль через 3 месяца</h2>
              <p className="text-xs text-slate-400">Автоматический план наблюдения</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            После каждой анкеты система создаёт следующий контрольный опрос и сохраняет дату в
            карточке пациента.
          </p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Icon name="chart" />
            </span>
            <div>
              <h2 className="font-bold">Динамика показателей</h2>
              <p className="text-xs text-slate-400">Наглядная история состояния</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Откройте карточку пациента, чтобы сравнить массу тела, выраженность симптомов и группу
            риска.
          </p>
          {dashboard.data?.recent_patients[0] && (
            <Link
              className="mt-3 inline-block text-sm font-semibold text-brand-600"
              href={`/patients/${dashboard.data.recent_patients[0].id}`}
            >
              Посмотреть пример →
            </Link>
          )}
        </div>
      </section>
      <NewPatientModal />
    </div>
  );
}
