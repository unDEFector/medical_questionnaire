import { AppShell } from "@/components/features/AppShell";
import { Dashboard } from "@/components/features/Dashboard";

export default function HomePage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
