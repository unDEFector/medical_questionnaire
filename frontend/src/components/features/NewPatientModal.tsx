"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import type { PatientCreated, PatientInput } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";

const initialForm: PatientInput = {
  full_name: "",
  birth_date: "",
  gender: "female",
  diagnosis: "",
  therapy: "",
  height_cm: 165,
  initial_weight_kg: 70,
};

export function NewPatientModal() {
  const { patientModalOpen, setPatientModalOpen } = useAppStore();
  const [form, setForm] = useState<PatientInput>(initialForm);
  const [created, setCreated] = useState<PatientCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: api.createPatient,
    onSuccess: async (data) => {
      setCreated(data);
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  function close() {
    setPatientModalOpen(false);
    setTimeout(() => {
      setForm(initialForm);
      setCreated(null);
      mutation.reset();
    }, 200);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate(form);
  }

  async function copyLink() {
    if (!created) return;
    await navigator.clipboard.writeText(created.survey_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      open={patientModalOpen}
      onClose={close}
      title={created ? "Пациент добавлен" : "Новый пациент"}
      wide
    >
      {created ? (
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Icon name="check" className="h-8 w-8" />
          </span>
          <h3 className="mt-4 text-lg font-bold">{created.patient.full_name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Исходная анкета создана. Отправьте пациенту персональную ссылку.
          </p>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-left">
            <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
              {created.survey_url}
            </span>
            <Button variant="secondary" onClick={copyLink} className="shrink-0">
              <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
              {copied ? "Скопировано" : "Копировать"}
            </Button>
          </div>
          <Button onClick={close} className="mt-6 w-full">
            Готово
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="label">
              Фамилия, имя и отчество
            </label>
            <input
              id="full_name"
              className="field"
              required
              minLength={2}
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              placeholder="Например, Анна Смирнова"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="birth_date" className="label">
                Дата рождения
              </label>
              <input
                id="birth_date"
                type="date"
                className="field"
                required
                max={new Date().toISOString().slice(0, 10)}
                value={form.birth_date}
                onChange={(event) => setForm({ ...form, birth_date: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="gender" className="label">
                Пол
              </label>
              <select
                id="gender"
                className="field"
                value={form.gender}
                onChange={(event) =>
                  setForm({ ...form, gender: event.target.value as PatientInput["gender"] })
                }
              >
                <option value="female">Женский</option>
                <option value="male">Мужской</option>
                <option value="other">Другой</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="diagnosis" className="label">
              Основной диагноз
            </label>
            <input
              id="diagnosis"
              className="field"
              required
              value={form.diagnosis}
              onChange={(event) => setForm({ ...form, diagnosis: event.target.value })}
              placeholder="Диагноз по медицинской карте"
            />
          </div>
          <div>
            <label htmlFor="therapy" className="label">
              Текущая терапия
            </label>
            <input
              id="therapy"
              className="field"
              value={form.therapy}
              onChange={(event) => setForm({ ...form, therapy: event.target.value })}
              placeholder="Препараты и дозировки"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="height_cm" className="label">
                Рост, см
              </label>
              <input
                id="height_cm"
                type="number"
                className="field"
                min={51}
                max={250}
                step="0.1"
                required
                value={form.height_cm}
                onChange={(event) => setForm({ ...form, height_cm: Number(event.target.value) })}
              />
            </div>
            <div>
              <label htmlFor="initial_weight_kg" className="label">
                Исходный вес, кг
              </label>
              <input
                id="initial_weight_kg"
                type="number"
                className="field"
                min={21}
                max={500}
                step="0.1"
                required
                value={form.initial_weight_kg}
                onChange={(event) =>
                  setForm({ ...form, initial_weight_kg: Number(event.target.value) })
                }
              />
            </div>
          </div>
          {mutation.error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : "Не удалось создать пациента"}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={close}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Сохранение…" : "Создать и получить ссылку"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
