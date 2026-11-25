"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, Loading } from "@/components/ui/Loading";

export function SurveysView() {
  const patients = useQuery({ queryKey: ["patients", ""], queryFn: () => api.patients() });
  const items = patients.data ?? [];
  const pendingCount = items.filter((patient) => patient.next_survey_at !== null).length;

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Опросник</h1>
        <p className="mt-2 text-sm text-slate-500">
          Состояние исходных и контрольных анкет по каждому пациенту
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Icon name="clipboard" />
          </span>
          <div>
            <p className="text-2xl font-bold text-navy">
              {patients.isLoading ? "—" : pendingCount}
            </p>
            <p className="text-sm text-slate-500">Пациентов с ожидающей анкетой</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Icon name="check" />
          </span>
          <div>
            <p className="text-2xl font-bold text-navy">
              {patients.isLoading
                ? "—"
                : items.reduce((total, patient) => total + patient.survey_count, 0)}
            </p>
            <p className="text-sm text-slate-500">Завершено опросов за всё время</p>
          </div>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold">Анкеты пациентов</h2>
          <p className="mt-1 text-xs text-slate-400">
            Откройте карточку, чтобы посмотреть ответы или заполнить блок врача
          </p>
        </div>
        {patients.isLoading ? (
          <Loading label="Загружаем состояние опросов" />
        ) : patients.error ? (
          <div className="p-5">
            <ErrorState message={patients.error.message} />
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Icon name="clipboard" className="mx-auto mb-3 h-9 w-9 text-slate-300" />
            <p className="font-semibold text-navy">Опросников пока нет</p>
            <p className="mt-1 text-sm text-slate-400">
              Исходная анкета появится после добавления пациента
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-4 font-medium">ID пациента</th>
                  <th className="px-4 py-4 font-medium">Последний опрос</th>
                  <th className="px-4 py-4 font-medium">Следующий контроль</th>
                  <th className="px-4 py-4 font-medium">Статус</th>
                  <th className="px-6 py-4">
                    <span className="sr-only">Открыть</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((patient) => (
                  <tr key={patient.id} className="transition-colors hover:bg-brand-50/40">
                    <td className="px-6 py-4">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="font-mono text-sm font-semibold text-navy hover:text-brand-600"
                      >
                        {patient.public_id}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {formatDate(patient.latest_survey_at)}
                      <span className="block text-xs text-slate-400">
                        Завершено: {patient.survey_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {formatDate(patient.next_survey_at)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          patient.next_survey_at
                            ? "bg-amber-50 text-amber-700 ring-amber-600/10"
                            : "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                        }`}
                      >
                        {patient.next_survey_at ? "Ожидает заполнения" : "Запланированных нет"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="text-sm font-semibold text-brand-600 hover:underline"
                      >
                        Открыть опросники
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
