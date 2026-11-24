"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, Loading } from "@/components/ui/Loading";
import { PatientTable } from "./PatientTable";

export function RedFlagsView() {
  const patients = useQuery({ queryKey: ["patients", ""], queryFn: () => api.patients() });
  const flaggedPatients = (patients.data ?? []).filter((patient) => patient.latest_attention);

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Red flags</h1>
        <p className="mt-2 text-sm text-slate-500">
          Пациенты с положительными ответами в последней завершённой анкете
        </p>
      </div>

      <div className="mb-6 flex gap-4 rounded-2xl border border-red-100 bg-red-50 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Icon name="bell" />
        </span>
        <div>
          <h2 className="font-semibold text-red-900">Требуется оценка врача</h2>
          <p className="mt-1 text-sm leading-6 text-red-700">
            Red flags не являются автоматическим диагнозом. Откройте карточку пациента, проверьте
            формулировки ответов и примите клиническое решение.
          </p>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold">Пациенты с red flags</h2>
          <p className="mt-1 text-xs text-slate-400">
            {patients.isLoading
              ? "Загружаем результаты"
              : `Найдено пациентов: ${flaggedPatients.length}`}
          </p>
        </div>
        {patients.isLoading ? (
          <Loading label="Загружаем red flags" />
        ) : patients.error ? (
          <div className="p-5">
            <ErrorState message={patients.error.message} />
          </div>
        ) : flaggedPatients.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Icon name="check" className="h-6 w-6" />
            </span>
            <p className="font-semibold text-navy">Red flags не отмечены</p>
            <p className="mt-1 text-sm text-slate-400">
              В последних завершённых анкетах нет ответов, требующих внимания
            </p>
          </div>
        ) : (
          <PatientTable patients={flaggedPatients} />
        )}
      </section>
    </div>
  );
}
