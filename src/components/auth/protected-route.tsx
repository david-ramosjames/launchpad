"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { isAdminRole, needsOnboarding, type UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  /** Only for /onboarding — skip redirect when profile incomplete */
  allowOnboarding?: boolean;
  minRole?: UserRole;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  allowOnboarding = false,
}: ProtectedRouteProps) {
  const { firebaseUser, appUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (requireAdmin && appUser && !isAdminRole(appUser.role)) {
      router.replace("/");
      return;
    }
    const incomplete = needsOnboarding(appUser);
    if (incomplete && !allowOnboarding && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }
    if (!incomplete && allowOnboarding) {
      router.replace("/");
    }
  }, [
    firebaseUser,
    appUser,
    loading,
    requireAdmin,
    allowOnboarding,
    pathname,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-800 border-t-pink-500" />
      </div>
    );
  }

  if (!firebaseUser) return null;
  if (requireAdmin && appUser && !isAdminRole(appUser.role)) return null;
  if (needsOnboarding(appUser) && !allowOnboarding) return null;
  if (!needsOnboarding(appUser) && allowOnboarding) return null;

  return <>{children}</>;
}
