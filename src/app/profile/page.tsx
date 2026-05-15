"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfilePage } from "@/components/profile/profile-page";

export default function ProfileRoute() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}
