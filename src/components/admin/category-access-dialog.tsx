"use client";

import { useMemo, useState } from "react";
import { Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isAdminRole, type AppUser, type Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryAccessDialogProps {
  category: Category;
  users: AppUser[];
  onSave: (allowedUserIds: string[]) => Promise<void>;
}

export function CategoryAccessButton({ category, users, onSave }: CategoryAccessDialogProps) {
  const [open, setOpen] = useState(false);
  const restricted = category.allowedUserIds.length > 0;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 shrink-0 gap-1 px-2 text-xs",
          restricted ? "text-pink-600 hover:bg-pink-50" : "text-stone-500"
        )}
        title="Choose who can see this category"
        onClick={() => setOpen(true)}
      >
        {restricted ? <Lock className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
        {restricted ? `${category.allowedUserIds.length} people` : "Everyone"}
      </Button>
      {open && (
        <AccessDialog
          category={category}
          users={users}
          onSave={onSave}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function AccessDialog({
  category,
  users,
  onSave,
  onClose,
}: CategoryAccessDialogProps & { onClose: () => void }) {
  const [everyone, setEveryone] = useState(category.allowedUserIds.length === 0);
  const [selected, setSelected] = useState<Set<string>>(new Set(category.allowedUserIds));
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedUsers = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return [...users]
      .filter(
        (u) =>
          !q ||
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [users, filter]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSave = everyone || selected.size > 0;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(everyone ? [] : [...selected]);
      onClose();
    } catch {
      setError("Couldn't save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Who can see &ldquo;{category.name}&rdquo;?</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: true, label: "Everyone" },
              { value: false, label: "Only selected people" },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setEveryone(option.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  everyone === option.value
                    ? "border-navy-700 bg-navy-50 text-navy-900"
                    : "border-stone-200 text-stone-600 hover:border-stone-300"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {!everyone && (
            <>
              <Input
                placeholder="Search people…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <ul className="max-h-64 divide-y divide-stone-100 overflow-y-auto rounded-lg border border-stone-200">
                {sortedUsers.map((user) => {
                  const admin = isAdminRole(user.role);
                  return (
                    <li key={user.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-stone-50">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-navy-700"
                          checked={admin || selected.has(user.id)}
                          disabled={admin}
                          onChange={() => toggle(user.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-navy-900">
                            {user.displayName}
                          </span>
                          <span className="block truncate text-xs text-stone-500">
                            {user.email}
                          </span>
                        </span>
                        {admin && (
                          <span className="shrink-0 text-[10px] font-medium uppercase text-stone-400">
                            Admin
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
                {sortedUsers.length === 0 && (
                  <li className="px-3 py-4 text-center text-sm text-stone-500">
                    No matching people.
                  </li>
                )}
              </ul>
              <p className="text-xs text-stone-500">
                Admins always see every category so they can manage it. People appear here after
                they&apos;ve signed in to Launch Pad once.
              </p>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!canSave || saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
