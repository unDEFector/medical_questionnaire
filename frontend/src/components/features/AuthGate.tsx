"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserRole } from "@/types/api";
import { Loading } from "@/components/ui/Loading";

const subscribe = () => () => {};

export function AuthGate({
  children,
  allowedRole,
}: {
  children: ReactNode;
  allowedRole?: UserRole;
}) {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!mounted) return;
    if (!token || !user) router.replace("/login");
    else if (allowedRole && user.role !== allowedRole) router.replace("/");
  }, [allowedRole, mounted, router, token, user]);

  if (!mounted || !token || !user || (allowedRole && user.role !== allowedRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loading label="Проверяем доступ" />
      </div>
    );
  }
  return children;
}
