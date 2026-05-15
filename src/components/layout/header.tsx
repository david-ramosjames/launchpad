"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { UserAvatar } from "@/components/profile/user-avatar";
import { isAdminRole } from "@/types";
import { cn } from "@/lib/utils";
import { LogOut, Settings, Users } from "lucide-react";

export function Header() {
  const { appUser, signOut } = useAuth();
  const pathname = usePathname();

  const navBtn = (active: boolean) =>
    cn(
      "gap-2 font-medium",
      active
        ? "bg-navy-100 text-navy-900 hover:bg-navy-100"
        : "text-navy-700 hover:bg-stone-100 hover:text-navy-900"
    );

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="h-1 bg-gradient-to-r from-pink-500 via-pink-400 to-navy-800" />
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="min-w-0 shrink transition-opacity hover:opacity-90">
          <Logo size="sm" />
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={navBtn(pathname === "/directory")}
          >
            <Link href="/directory">
              <Users className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Directory</span>
            </Link>
          </Button>
          {appUser && isAdminRole(appUser.role) && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className={cn(pathname === "/admin" && "border-navy-300 bg-navy-50")}
            >
              <Link href="/admin">
                <Settings className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </Button>
          )}
          {appUser && (
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-stone-100"
            >
              <UserAvatar
                name={appUser.displayName}
                photoURL={appUser.photoURL}
                size="sm"
              />
              <div className="hidden min-w-0 lg:block">
                <p className="truncate text-sm font-medium text-navy-800">
                  {appUser.displayName}
                </p>
                {appUser.jobTitle && (
                  <p className="truncate text-xs text-pink-600">
                    {appUser.jobTitle}
                  </p>
                )}
              </div>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
