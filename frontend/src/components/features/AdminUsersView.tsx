"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import type { AdminUser } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { NewDoctorModal } from "./NewDoctorModal";
import { NewPatientModal } from "./NewPatientModal";

export function AdminUsersView({ userRole }: { userRole: "doctor" | "patient" }) {
  const isDoctor = userRole === "doctor";
  const title = isDoctor ? "Врачи" : "Пациенты";
  const [search, setSearch] = useState("");
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const { setPatientModalOpen } = useAppStore();
  const queryClient = useQueryClient();
  const users = useQuery({
    queryKey: ["admin", "users", userRole],
    queryFn: () => api.adminUsers(userRole),
  });
  const deletion = useMutation({
    mutationFn: (id: string) => api.deleteAdminUser(id),
    onSuccess: async () => {
      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
  const filteredUsers = (users.data ?? []).filter((user) =>
    user.public_id.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm text-slate-400">Панель администратора</p>
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isDoctor
              ? "Учётные записи и доступ врачей к системе"
              : "Обезличенные учётные записи и карточки пациентов"}
          </p>
        </div>
        <Button onClick={() => (isDoctor ? setDoctorModalOpen(true) : setPatientModalOpen(true))}>
          <Icon name="plus" />
          {isDoctor ? "Добавить врача" : "Добавить пациента"}
        </Button>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Список пользователей</h2>
            <p className="mt-1 text-xs text-slate-400">Всего: {users.data?.length ?? 0}</p>
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Поиск по ID</span>
            <Icon name="search" className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="field py-2.5 pl-9"
              placeholder={isDoctor ? "Например, D-000001" : "Например, P-100001"}
            />
          </label>
        </div>
        {users.isLoading ? (
          <Loading label="Загружаем пользователей" />
        ) : users.error ? (
          <div className="p-5">
            <ErrorState message={users.error.message} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Пользователи не найдены</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">ID пользователя</th>
                  <th className="px-5 py-3 font-medium">Роль</th>
                  <th className="px-5 py-3 font-medium">Дата создания</th>
                  <th className="px-5 py-3 text-right font-medium">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4 font-mono font-semibold text-navy">
                      {user.public_id}
                    </td>
                    <td className="px-5 py-4 text-slate-500">{isDoctor ? "Врач" : "Пациент"}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(
                        new Date(user.created_at),
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => setSelected(user)}
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isDoctor ? (
        <NewDoctorModal open={doctorModalOpen} onClose={() => setDoctorModalOpen(false)} />
      ) : (
        <NewPatientModal admin />
      )}
      <Modal
        open={selected !== null}
        onClose={() => {
          if (!deletion.isPending) setSelected(null);
        }}
        title={`Удалить ${isDoctor ? "врача" : "пациента"}?`}
      >
        <p className="text-sm leading-6 text-slate-600">
          {isDoctor
            ? `Доступ врача ${selected?.public_id} будет отозван. Карточки пациентов сохранятся.`
            : `Пациент ${selected?.public_id}, все его анкеты, ответы и активные сессии будут удалены без возможности восстановления.`}
        </p>
        {deletion.error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
            {deletion.error.message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setSelected(null)}
            disabled={deletion.isPending}
          >
            Отмена
          </Button>
          <Button
            variant="danger"
            disabled={deletion.isPending}
            onClick={() => selected && deletion.mutate(selected.id)}
          >
            {deletion.isPending ? "Удаление…" : "Удалить безвозвратно"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
