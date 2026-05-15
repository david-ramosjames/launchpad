"use client";

import { Megaphone, X } from "lucide-react";
import { useState } from "react";
import type { Announcement } from "@/types";
import { cn } from "@/lib/utils";

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = announcements.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const top = visible[0];

  return (
    <div
      className={cn(
        "mb-6 flex items-start gap-3 rounded-xl border px-4 py-3",
        top.priority === "high"
          ? "border-pink-300 bg-pink-50/80"
          : "border-navy-200 bg-navy-50/50"
      )}
    >
      <Megaphone
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          top.priority === "high" ? "text-pink-600" : "text-navy-600"
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-navy-900">{top.title}</p>
        <p className="mt-0.5 text-sm text-stone-600">{top.message}</p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed((prev) => new Set([...prev, top.id]))}
        className="shrink-0 rounded p-1 text-stone-400 hover:bg-white/60 hover:text-stone-600"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
