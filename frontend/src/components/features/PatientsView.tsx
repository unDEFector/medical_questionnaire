"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, Loading } from "@/components/ui/Loading";
import { NewPatientModal } from "./NewPatientModal";
import { PatientTable } from "./PatientTable";

export function PatientsView() {
  const [search, setSearch] = useState("");
  const { setPatientModalOpen } = useAppStore();
  const patients = useQuery({
    queryKey: ["patients", search],
    queryFn: () => api.patients(search),
  });

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Пациенты</h1>
          <p className="mt-2 text-sm text-slate-500">
            Обезличенные карточки, история наблюдения и доступ пациента
          </p>
        </div>
        <Button onClick={() => setPatientModalOpen(true)}>
          <Icon name="plus" />
          Добавить пациента
        </Button>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Список пациентов</h2>
            <p className="mt-1 text-xs text-slate-400">Найдите карточку по обезличенному ID</p>
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Поиск пациента по ID</span>
            <Icon name="search" className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="field py-2.5 pl-9"
              placeholder="Например, P-100001"
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
      <NewPatientModal />
    </div>
  );
}
