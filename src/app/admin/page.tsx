"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminPanel } from "@/components/admin/admin-panel";

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminPanel />
    </ProtectedRoute>
  );
}
