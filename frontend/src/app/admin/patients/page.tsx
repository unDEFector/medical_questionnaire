import { AdminUsersView } from "@/components/features/AdminUsersView";
import { AppShell } from "@/components/features/AppShell";
import { AuthGate } from "@/components/features/AuthGate";

export default function AdminPatientsPage() {
  return (
    <AuthGate allowedRole="admin">
      <AppShell>
        <AdminUsersView userRole="patient" />
      </AppShell>
    </AuthGate>
  );
}
