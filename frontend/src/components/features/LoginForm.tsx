"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [publicId, setPublicId] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () => api.login({ public_id: publicId, password }),
    onSuccess: (response) => {
      setAuth(response);
      router.replace("/");
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    login.mutate();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-canvas to-blue-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-3xl font-bold text-white">
            +
          </span>
          <h1 className="mt-4 text-3xl font-bold text-navy">инКлира</h1>
          <p className="mt-2 text-sm text-slate-500">Медицинский опрос и наблюдение пациентов</p>
        </div>
        <form onSubmit={submit} className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">Вход в личный кабинет</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Используйте ID и пароль, выданные медицинской организацией.
          </p>
          <div className="mt-6">
            <label htmlFor="public_id" className="label">
              ID пользователя
            </label>
            <input
              id="public_id"
              className="field"
              autoComplete="username"
              autoCapitalize="characters"
              required
              maxLength={20}
              placeholder="D-000001 или P-100001"
              value={publicId}
              onChange={(event) => setPublicId(event.target.value.toUpperCase())}
            />
          </div>
          <div className="mt-4">
            <label htmlFor="password" className="label">
              Пароль
            </label>
            <input
              id="password"
              className="field"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {login.error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
              {login.error.message}
            </p>
          )}
          <Button type="submit" className="mt-6 w-full" disabled={login.isPending}>
            {login.isPending ? "Выполняется вход…" : "Войти"}
            {!login.isPending && <Icon name="arrow-right" className="h-4 w-4" />}
          </Button>
          <p className="mt-5 text-center text-xs leading-5 text-slate-400">
            Врач и пациент входят через одну форму. Роль определяется автоматически.
          </p>
        </form>
      </div>
    </main>
  );
}
