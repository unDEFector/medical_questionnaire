"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

const doctorNavigation: Array<{ label: string; icon: IconName; href: string }> = [
  { label: "Обзор", icon: "chart", href: "/" },
  { label: "Пациенты", icon: "users", href: "/#patients" },
  { label: "Опросники", icon: "clipboard", href: "/#surveys" },
  { label: "Red flags", icon: "heart", href: "/#recommendations" },
];
const patientNavigation: Array<{ label: string; icon: IconName; href: string }> = [
  { label: "Мои опросы", icon: "clipboard", href: "/" },
  { label: "Динамика", icon: "chart", href: "/#dynamics" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileNavigationOpen, setMobileNavigationOpen } = useAppStore();
  const { user, clearAuth } = useAuthStore();
  const navigation = user?.role === "patient" ? patientNavigation : doctorNavigation;

  async function logout() {
    await api.logout().catch(() => undefined);
    clearAuth();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-canvas">
      {mobileNavigationOpen && (
        <button
          aria-label="Закрыть меню"
          className="fixed inset-0 z-30 bg-navy/40 lg:hidden"
          onClick={() => setMobileNavigationOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy px-5 py-7 text-white transition-transform lg:translate-x-0",
          mobileNavigationOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link href="/" className="mb-10 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-black text-brand-600">
            +
          </span>
          <span>
            <span className="block text-2xl font-bold tracking-tight">инКлира</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-blue-200">
              забота в динамике
            </span>
          </span>
        </Link>
        <nav aria-label="Основная навигация" className="space-y-2">
          {navigation.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileNavigationOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-blue-100 transition-colors hover:bg-white/10 hover:text-white",
                index === 0 && pathname === "/" && "bg-brand-500 text-white",
              )}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-white/10 p-4">
          <Icon name="settings" className="mb-3 text-cyan-300" />
          <p className="text-sm font-semibold">Доступ по ID и паролю</p>
          <p className="mt-1 text-xs leading-5 text-blue-200">
            Не передавайте свои учётные данные другим людям.
          </p>
        </div>
        <p className="mt-5 px-2 text-[10px] text-blue-300">Версия 0.2 · Опросник 1.0</p>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between border-b border-slate-200/70 bg-white px-5 sm:px-8">
          <button
            className="rounded-lg p-2 text-navy lg:hidden"
            onClick={() => setMobileNavigationOpen(true)}
            aria-label="Открыть меню"
          >
            <Icon name="menu" />
          </button>
          <div className="hidden text-sm text-slate-400 sm:block">
            {user?.role === "patient" ? "Кабинет пациента" : "Кабинет врача"}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Icon name={user?.role === "patient" ? "users" : "heart"} className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">{user?.public_id}</p>
              <p className="text-xs text-slate-400">
                {user?.role === "patient" ? "Пациент" : "Врач"}
              </p>
            </div>
            <Button variant="ghost" onClick={logout} className="ml-2 px-3">
              Выйти
            </Button>
          </div>
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
