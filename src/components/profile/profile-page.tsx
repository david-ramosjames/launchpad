"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/layout/header";
import { ProfileForm } from "./profile-form";
import { updateUserProfile } from "@/lib/firestore/helpers";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ProfileUpdate } from "@/types";

export function ProfilePage() {
  const { appUser, firebaseUser, refreshUser } = useAuth();

  if (!appUser) return null;

  const handleSave = async (values: ProfileUpdate) => {
    await updateUserProfile(appUser.id, values);
    await refreshUser();
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Launch Pad
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-navy-800">Your profile</h1>
        <p className="mt-1 text-sm text-stone-500">
          Update how you appear across Launch Pad and the team directory.
        </p>
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <ProfileForm
            user={appUser}
            googlePhotoURL={firebaseUser?.photoURL}
            onSubmit={handleSave}
          />
        </div>
      </main>
    </div>
  );
}
