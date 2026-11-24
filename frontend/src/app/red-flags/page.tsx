import { AppShell } from "@/components/features/AppShell";
import { AuthGate } from "@/components/features/AuthGate";
import { RedFlagsView } from "@/components/features/RedFlagsView";

export default function RedFlagsPage() {
  return (
    <AuthGate allowedRole="doctor">
      <AppShell>
        <RedFlagsView />
      </AppShell>
    </AuthGate>
  );
}
