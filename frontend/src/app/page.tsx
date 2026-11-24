"use client";

import { AppShell } from "@/components/features/AppShell";
import { AuthGate } from "@/components/features/AuthGate";
import { Dashboard } from "@/components/features/Dashboard";
import { PatientDashboard } from "@/components/features/PatientDashboard";
import { useAuthStore } from "@/store/useAuthStore";

function HomeContent() {
  const user = useAuthStore((state) => state.user);
  return <AppShell>{user?.role === "patient" ? <PatientDashboard /> : <Dashboard />}</AppShell>;
}

export default function HomePage() {
  return (
    <AuthGate>
      <HomeContent />
    </AuthGate>
  );
}
