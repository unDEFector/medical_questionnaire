import { AppShell } from "@/components/features/AppShell";
import { AuthGate } from "@/components/features/AuthGate";
import { SurveyForm } from "@/components/features/SurveyForm";

export default function SurveyPage() {
  return (
    <AuthGate>
      <AppShell>
        <SurveyForm />
      </AppShell>
    </AuthGate>
  );
}
