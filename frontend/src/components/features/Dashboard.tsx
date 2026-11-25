"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Loading, ErrorState } from "@/components/ui/Loading";
import { PatientTable } from "./PatientTable";
import { NewPatientModal } from "./NewPatientModal";

export function Dashboard() {
  const { setPatientModalOpen } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });

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
      label: "Есть red flags",
      value: dashboard.data?.attention_count ?? 0,
      icon: "heart",
      color: "bg-red-50 text-red-600",
      note: "По последней анкете",
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
          <p className="mb-1 text-sm text-slate-400">Кабинет врача · {user?.public_id}</p>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Обзор</h1>
          <p className="mt-2 text-sm text-slate-500">Основные показатели наблюдения пациентов</p>
        </div>
        <Button onClick={() => setPatientModalOpen(true)}>
          <Icon name="plus" />
          Добавить пациента
        </Button>
      </div>

      {dashboard.error ? (
        <ErrorState message={dashboard.error.message} />
      ) : (
        <>
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

          {!!dashboard.data?.attention_count && (
            <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 sm:flex-row sm:items-center">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Icon name="bell" />
              </span>
              <div className="flex-1">
                <h2 className="font-semibold text-red-900">В анкетах отмечены red flags</h2>
                <p className="mt-1 text-sm text-red-700">
                  {dashboard.data.attention_count} пациент(а) требуют клинической оценки ответов.
                </p>
              </div>
              <Link
                href="/red-flags"
                className="text-sm font-semibold text-red-800 hover:underline"
              >
                Открыть раздел →
              </Link>
            </section>
          )}

          <section className="card mt-6 overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold">Недавние пациенты</h2>
                <p className="mt-1 text-xs text-slate-400">Последние добавленные карточки</p>
              </div>
              <Link
                href="/patients"
                className="text-sm font-semibold text-brand-600 hover:underline"
              >
                Все пациенты
              </Link>
            </div>
            {dashboard.isLoading ? (
              <Loading label="Загружаем список пациентов" />
            ) : (
              <PatientTable patients={dashboard.data?.recent_patients ?? []} />
            )}
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoCard
              icon="calendar"
              title="Контроль через 3 месяца"
              text="После каждой анкеты система создаёт следующий контрольный опрос и сохраняет дату в карточке пациента."
            />
            <InfoCard
              icon="settings"
              title="Учётные данные пациента"
              text="При создании карточки система генерирует ID и временный пароль. Передайте их пациенту лично по защищённому каналу."
            />
          </section>
        </>
      )}
      <NewPatientModal />
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-brand-50 p-3 text-brand-600">
          <Icon name={icon} />
        </span>
        <h2 className="font-bold">{title}</h2>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
