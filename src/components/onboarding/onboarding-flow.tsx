"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { updateUserProfile } from "@/lib/firestore/helpers";
import { ProfileForm } from "@/components/profile/profile-form";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle2 } from "lucide-react";
import type { ProfileUpdate } from "@/types";

/** Profile step includes directory preference — no separate confirmation screen. */
const STEPS = ["welcome", "profile", "done"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingFlow() {
  const { appUser, firebaseUser, refreshUser, setAppUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");

  if (!appUser) return null;

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const handleProfileSubmit = async (values: ProfileUpdate) => {
    await updateUserProfile(appUser.id, {
      ...values,
      onboardingCompleted: true,
    });
    await refreshUser();
    setAppUser({
      ...appUser,
      ...values,
      onboardingCompleted: true,
    });
    setStep("done");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-pink-50/30">
      <div className="border-b border-navy-100 bg-white px-4 py-4">
        <Logo size="sm" className="mx-auto max-w-lg justify-center" />
        <div className="mx-auto mt-4 h-1.5 max-w-lg overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-navy-800 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-10">
        {step === "welcome" && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-800 text-pink-400">
              <Rocket className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-navy-800">
              Welcome to Launch Pad
            </h1>
            <p className="mt-3 text-stone-600">
              Let&apos;s set up your profile so your team knows who you are. This
              only takes a minute.
            </p>
            <Button className="mt-8 w-full" size="lg" onClick={() => setStep("profile")}>
              Get started
            </Button>
          </div>
        )}

        {step === "profile" && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-navy-800">Your profile</h1>
            <p className="mb-6 text-sm text-stone-500">
              Add your photo, title, and whether you&apos;d like to appear in the team
              directory. You can update this anytime under Profile.
            </p>
            <ProfileForm
              user={appUser}
              googlePhotoURL={firebaseUser?.photoURL}
              onSubmit={handleProfileSubmit}
              submitLabel="Finish & enter Launch Pad"
            />
          </div>
        )}

        {step === "done" && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-pink-500" />
            <h1 className="mt-4 text-2xl font-bold text-navy-800">You&apos;re all set!</h1>
            <p className="mt-3 text-stone-600">
              Explore tools and workflows from Launch Pad home, or browse the team
              directory.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button size="lg" onClick={() => router.replace("/")}>
                Go to Launch Pad
              </Button>
              <Button variant="outline" size="lg" onClick={() => router.replace("/directory")}>
                View team directory
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
