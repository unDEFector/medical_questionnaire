"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const navigation: Array<{ label: string; icon: IconName; href: string }> = [
  { label: "Обзор", icon: "chart", href: "/" },
  { label: "Пациенты", icon: "users", href: "/#patients" },
  { label: "Опросники", icon: "clipboard", href: "/#surveys" },
  { label: "Рекомендации", icon: "heart", href: "/#recommendations" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mobileNavigationOpen, setMobileNavigationOpen } = useAppStore();
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
          <Icon name="heart" className="mb-3 text-cyan-300" />
          <p className="text-sm font-semibold">Нужна помощь?</p>
          <p className="mt-1 text-xs leading-5 text-blue-200">Инструкция и поддержка сервиса</p>
          <a
            href="mailto:support@inklira.local"
            className="mt-3 inline-block text-xs font-semibold text-white underline"
          >
            Связаться с нами
          </a>
        </div>
        <p className="mt-5 px-2 text-[10px] text-blue-300">
          Версия 0.1 · Медицинская информация защищена
        </p>
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
          <div className="hidden text-sm text-slate-400 sm:block">Кабинет врача</div>
          <div className="flex items-center gap-4">
            <button
              className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Уведомления"
            >
              <Icon name="bell" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              АП
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">Александра Петрова</p>
              <p className="text-xs text-slate-400">Врач-эндокринолог</p>
            </div>
          </div>
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
