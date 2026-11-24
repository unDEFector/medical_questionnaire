import { AppShell } from "@/components/features/AppShell";
import { AuthGate } from "@/components/features/AuthGate";
import { PatientDetailView } from "@/components/features/PatientDetailView";

export default function PatientPage() {
  return (
    <AuthGate allowedRole="doctor">
      <AppShell>
        <PatientDetailView />
      </AppShell>
    </AuthGate>
  );
}
