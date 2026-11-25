"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function NewDoctorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [publicId, setPublicId] = useState("D-");
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.createDoctor({ public_id: publicId, password }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      close();
    },
  });

  function close() {
    setPublicId("D-");
    setPassword("");
    mutation.reset();
    onClose();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <Modal open={open} onClose={close} title="Новый врач">
      <form onSubmit={submit} className="space-y-4">
        <p className="rounded-xl bg-brand-50 p-3 text-sm leading-6 text-brand-800">
          Задайте уникальный ID и начальный пароль. Передайте их врачу по защищённому каналу.
        </p>
        <div>
          <label htmlFor="doctor_public_id" className="label">
            ID врача
          </label>
          <input
            id="doctor_public_id"
            className="field font-mono"
            required
            minLength={3}
            maxLength={20}
            pattern="D-[A-Za-z0-9-]+"
            autoCapitalize="characters"
            value={publicId}
            onChange={(event) => setPublicId(event.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label htmlFor="doctor_password" className="label">
            Начальный пароль
          </label>
          <input
            id="doctor_password"
            className="field"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="mt-2 text-xs text-slate-400">Не менее 12 символов.</p>
        </div>
        {mutation.error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
            {mutation.error.message}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={close}>
            Отмена
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Создание…" : "Добавить врача"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
