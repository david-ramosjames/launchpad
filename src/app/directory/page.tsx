"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DirectoryPage } from "@/components/directory/directory-page";

export default function DirectoryRoute() {
  return (
    <ProtectedRoute>
      <DirectoryPage />
    </ProtectedRoute>
  );
}
