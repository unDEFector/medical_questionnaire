import { AdminUsersView } from "@/components/features/AdminUsersView";
import { AppShell } from "@/components/features/AppShell";
import { AuthGate } from "@/components/features/AuthGate";

export default function AdminDoctorsPage() {
  return (
    <AuthGate allowedRole="admin">
      <AppShell>
        <AdminUsersView userRole="doctor" />
      </AppShell>
    </AuthGate>
  );
}
