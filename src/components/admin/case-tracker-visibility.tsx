"use client";

import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getHiddenAttorneyIds, setHiddenAttorneyIds } from "@/lib/firestore/helpers";
import { cn } from "@/lib/utils";

interface AttorneyOption {
  attorneyId: string;
  name: string;
  caseCount: number;
  averageScore: number;
}

export function CaseTrackerVisibility() {
  const { firebaseUser } = useAuth();
  const [attorneys, setAttorneys] = useState<AttorneyOption[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    let cancelled = false;

    (async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const [res, hiddenIds] = await Promise.all([
          fetch("/api/case-tracker/attorneys", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          getHiddenAttorneyIds(),
        ]);
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { attorneys: AttorneyOption[] };
        if (cancelled) return;
        setAttorneys([...body.attorneys].sort((a, b) => a.name.localeCompare(b.name)));
        setHidden(new Set(hiddenIds));
      } catch {
        if (!cancelled) setError("Couldn't load attorneys from Docket Flow.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  const toggle = async (attorneyId: string) => {
    const previous = hidden;
    const next = new Set(hidden);
    if (next.has(attorneyId)) next.delete(attorneyId);
    else next.add(attorneyId);

    setHidden(next);
    setSaving(true);
    setError(null);
    try {
      await setHiddenAttorneyIds([...next]);
    } catch {
      setHidden(previous);
      setError("Couldn't save. Check that Firestore rules are deployed and you're an admin.");
    } finally {
      setSaving(false);
    }
  };

  const shownCount = attorneys.filter((a) => !hidden.has(a.attorneyId)).length;

  return (
    <section className="mb-10 rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-navy-900">
        <Gauge className="h-5 w-5" />
        Case Tracker Scores
      </h2>
      <p className="mb-4 text-sm text-stone-500">
        Choose whose scores appear on the Launch Pad dashboard. Hidden attorneys are removed
        on the server, so their scores never reach anyone&apos;s browser. Changes save
        immediately.
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      ) : attorneys.length === 0 && !error ? (
        <p className="text-sm text-stone-500">No attorneys with active cases found.</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-stone-500">
            Showing {shownCount} of {attorneys.length}
            {saving && " · Saving…"}
          </p>
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-100">
            {attorneys.map((attorney) => {
              const visible = !hidden.has(attorney.attorneyId);
              return (
                <li
                  key={attorney.attorneyId}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        visible ? "text-navy-900" : "text-stone-400"
                      )}
                    >
                      {attorney.name}
                    </p>
                    <p className="text-xs text-stone-500">
                      {attorney.averageScore}% · {attorney.caseCount} active cases
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={visible}
                    aria-label={`Show ${attorney.name} on the dashboard`}
                    onClick={() => toggle(attorney.attorneyId)}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      visible ? "bg-navy-700" : "bg-stone-300"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                        visible && "translate-x-5"
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
