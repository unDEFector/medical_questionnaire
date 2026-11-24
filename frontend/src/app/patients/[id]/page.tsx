import { AppShell } from "@/components/features/AppShell";
import { PatientDetailView } from "@/components/features/PatientDetailView";

export default function PatientPage() {
  return (
    <AppShell>
      <PatientDetailView />
    </AppShell>
  );
}
