import { AppShell } from "@/components/features/AppShell";
import { AuthGate } from "@/components/features/AuthGate";
import { PatientsView } from "@/components/features/PatientsView";

export default function PatientsPage() {
  return (
    <AuthGate allowedRole="doctor">
      <AppShell>
        <PatientsView />
      </AppShell>
    </AuthGate>
  );
}
