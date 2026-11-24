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
  height_cm: 165,
  initial_weight_kg: 70,
  medication: "Семаглутид",
  first_dose_date: "",
  starting_dose: 0.5,
};

export function NewPatientModal() {
  const { patientModalOpen, setPatientModalOpen } = useAppStore();
  const [form, setForm] = useState<PatientInput>(initialForm);
  const [created, setCreated] = useState<PatientCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: PatientInput) =>
      api.createPatient({
        ...data,
        first_dose_date: data.first_dose_date || undefined,
        starting_dose: data.starting_dose || undefined,
      }),
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

  async function copyCredentials() {
    if (!created) return;
    await navigator.clipboard.writeText(
      `ID: ${created.credentials.public_id}\nПароль: ${created.credentials.password}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      open={patientModalOpen}
      onClose={close}
      title={created ? "Учётная запись пациента создана" : "Новый пациент"}
      wide
    >
      {created ? (
        <div>
          <div className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Icon name="check" className="h-8 w-8" />
            </span>
            <h3 className="mt-4 text-lg font-bold">Пациент {created.patient.public_id}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Передайте пациенту ID и пароль. После закрытия окна пароль снова не отображается.
            </p>
          </div>
          <dl className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-slate-500">ID</dt>
              <dd className="font-mono text-sm font-bold text-navy">
                {created.credentials.public_id}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sm text-slate-500">Временный пароль</dt>
              <dd className="break-all font-mono text-sm font-bold text-navy">
                {created.credentials.password}
              </dd>
            </div>
          </dl>
          <Button variant="secondary" onClick={copyCredentials} className="mt-4 w-full">
            <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
            {copied ? "Скопировано" : "Скопировать ID и пароль"}
          </Button>
          <Button onClick={close} className="mt-3 w-full">
            Готово
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            mutation.mutate(form);
          }}
          className="space-y-4"
        >
          <p className="rounded-xl bg-brand-50 p-3 text-sm leading-6 text-brand-800">
            ФИО, телефон и дата рождения не запрашиваются. Пациент будет идентифицироваться только
            по ID.
          </p>
          <div>
            <label htmlFor="medication" className="label">
              Препарат
            </label>
            <select
              id="medication"
              className="field"
              value={form.medication}
              onChange={(event) => setForm({ ...form, medication: event.target.value })}
            >
              <option value="Семаглутид">Семаглутид</option>
              <option value="Тирзепатид">Тирзепатид</option>
              <option value="Другой препарат">Другой препарат</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id="height_cm"
              label="Рост, см"
              min={51}
              max={250}
              value={form.height_cm}
              onChange={(height_cm) => setForm({ ...form, height_cm })}
            />
            <NumberField
              id="initial_weight_kg"
              label="Исходный вес, кг"
              min={21}
              max={500}
              value={form.initial_weight_kg}
              onChange={(initial_weight_kg) => setForm({ ...form, initial_weight_kg })}
            />
            <div>
              <label htmlFor="first_dose_date" className="label">
                Дата первой дозы <span className="font-normal text-slate-400">(планируемая)</span>
              </label>
              <input
                id="first_dose_date"
                type="date"
                className="field"
                value={form.first_dose_date}
                onChange={(event) => setForm({ ...form, first_dose_date: event.target.value })}
              />
            </div>
            <NumberField
              id="starting_dose"
              label="Стартовая доза"
              min={0.001}
              max={1000}
              value={form.starting_dose ?? 0.5}
              onChange={(starting_dose) => setForm({ ...form, starting_dose })}
            />
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
              {mutation.isPending ? "Создание…" : "Создать ID и пароль"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function NumberField({
  id,
  label,
  min,
  max,
  value,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type="number"
        className="field"
        min={min}
        max={max}
        step="0.1"
        required
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
