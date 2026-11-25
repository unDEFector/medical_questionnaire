"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import type { AdminStats } from "@/types/api";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/Loading";

const cards: Array<{
  key: keyof AdminStats;
  label: string;
  note: string;
  icon: IconName;
  color: string;
}> = [
  {
    key: "doctor_count",
    label: "Врачи",
    note: "Активные учётные записи",
    icon: "heart",
    color: "bg-brand-50 text-brand-600",
  },
  {
    key: "patient_count",
    label: "Пациенты",
    note: "Обезличенные карточки",
    icon: "users",
    color: "bg-blue-50 text-blue-600",
  },
  {
    key: "admin_count",
    label: "Администраторы",
    note: "Доступ к управлению",
    icon: "settings",
    color: "bg-violet-50 text-violet-600",
  },
  {
    key: "completed_count",
    label: "Завершено опросов",
    note: "За всё время",
    icon: "check",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "pending_count",
    label: "Ожидают опроса",
    note: "Незавершённые анкеты",
    icon: "clipboard",
    color: "bg-amber-50 text-amber-600",
  },
  {
    key: "attention_count",
    label: "Есть red flags",
    note: "По последней анкете",
    icon: "bell",
    color: "bg-red-50 text-red-600",
  },
];

export function AdminDashboard() {
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: api.adminStats });

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-7">
        <p className="mb-1 text-sm text-slate-400">Панель администратора</p>
        <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Статистика</h1>
        <p className="mt-2 text-sm text-slate-500">Общие показатели пользователей и опросов</p>
      </div>

      {stats.error ? (
        <ErrorState message={stats.error.message} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.key} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-navy">
                    {stats.isLoading ? "—" : (stats.data?.[card.key] ?? 0)}
                  </p>
                </div>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}
                >
                  <Icon name={card.icon} />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">{card.note}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ManagementLink
          href="/admin/doctors"
          icon="heart"
          title="Управление врачами"
          text="Добавление учётных записей врачей и отзыв доступа."
        />
        <ManagementLink
          href="/admin/patients"
          icon="users"
          title="Управление пациентами"
          text="Создание обезличенных карточек и удаление данных пациентов."
        />
      </div>
      <p className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        Удаление пациента необратимо: вместе с учётной записью удаляются анкеты, ответы и активные
        сессии. Удаление врача отзывает его доступ, но не удаляет карточки пациентов.
      </p>
    </div>
  );
}

function ManagementLink({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: IconName;
  title: string;
  text: string;
}) {
  return (
    <Link href={href} className="card block p-6 transition-colors hover:border-brand-200">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon name={icon} />
      </span>
      <h2 className="mt-4 font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
        Открыть раздел <Icon name="arrow-right" className="h-4 w-4" />
      </span>
    </Link>
  );
}
