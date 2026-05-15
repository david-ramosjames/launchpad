"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "./user-avatar";
import { DEPARTMENTS, type AppUser, type ProfileUpdate } from "@/types";

export interface ProfileFormValues {
  displayName: string;
  jobTitle: string;
  department: string;
  phone: string;
  bio: string;
  photoURL: string;
  showInDirectory: boolean;
}

interface ProfileFormProps {
  user: AppUser;
  googlePhotoURL?: string | null;
  onSubmit: (values: ProfileUpdate) => Promise<void>;
  submitLabel?: string;
}

export function profileToForm(user: AppUser): ProfileFormValues {
  return {
    displayName: user.displayName,
    jobTitle: user.jobTitle ?? "",
    department: user.department ?? "",
    phone: user.phone ?? "",
    bio: user.bio ?? "",
    photoURL: user.photoURL ?? "",
    showInDirectory: user.showInDirectory,
  };
}

export function ProfileForm({
  user,
  googlePhotoURL,
  onSubmit,
  submitLabel = "Save profile",
}: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormValues>(() => profileToForm(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewPhoto = form.photoURL || googlePhotoURL || user.photoURL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim() || !form.jobTitle.trim()) {
      setError("Name and job title are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        displayName: form.displayName.trim(),
        jobTitle: form.jobTitle.trim(),
        department: form.department.trim() || undefined,
        phone: form.phone.trim() || undefined,
        bio: form.bio.trim() || undefined,
        photoURL: form.photoURL.trim() || googlePhotoURL || undefined,
        showInDirectory: form.showInDirectory,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save your profile.";
      console.error("Profile save failed:", err);
      setError(
        message.includes("permission")
          ? "Permission denied. Try signing out and back in, or contact an admin."
          : "Could not save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <UserAvatar
          name={form.displayName || user.displayName}
          photoURL={previewPhoto}
          size="xl"
        />
        <div className="flex-1 space-y-3 w-full">
          <div>
            <Label htmlFor="photoURL">Photo URL</Label>
            <Input
              id="photoURL"
              placeholder="Paste an image URL or use your Google photo"
              value={form.photoURL}
              onChange={(e) =>
                setForm((p) => ({ ...p, photoURL: e.target.value }))
              }
            />
            {googlePhotoURL && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 text-pink-600"
                onClick={() =>
                  setForm((p) => ({ ...p, photoURL: googlePhotoURL }))
                }
              >
                Use Google account photo
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="displayName">Full name *</Label>
          <Input
            id="displayName"
            value={form.displayName}
            onChange={(e) =>
              setForm((p) => ({ ...p, displayName: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="jobTitle">Job title *</Label>
          <Input
            id="jobTitle"
            placeholder="e.g. Paralegal, Associate Attorney"
            value={form.jobTitle}
            onChange={(e) =>
              setForm((p) => ({ ...p, jobTitle: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Select
            value={form.department || undefined}
            onValueChange={(v) => setForm((p) => ({ ...p, department: v }))}
          >
            <SelectTrigger id="department">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 555-5555"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled className="bg-stone-50" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="A short intro for the team directory..."
            rows={3}
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-4">
        <input
          type="checkbox"
          className="mt-1"
          checked={form.showInDirectory}
          onChange={(e) =>
            setForm((p) => ({ ...p, showInDirectory: e.target.checked }))
          }
        />
        <span>
          <span className="font-medium text-navy-800">Show me in the team directory</span>
          <span className="mt-0.5 block text-sm text-stone-500">
            Colleagues can find your name, title, and contact info.
          </span>
        </span>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
