import { AppShell } from "@/components/features/AppShell";
import { AuthGate } from "@/components/features/AuthGate";
import { SurveysView } from "@/components/features/SurveysView";

export default function SurveysPage() {
  return (
    <AuthGate allowedRole="doctor">
      <AppShell>
        <SurveysView />
      </AppShell>
    </AuthGate>
  );
}
