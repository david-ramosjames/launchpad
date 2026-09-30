"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Gauge,
  Video,
  AlertCircle,
  Flag,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import type { TodayMeeting, TodayResponse } from "@/types/today";

const FIRM_TIME_ZONE = "America/Chicago";
const DOCKET_FLOW_URL =
  process.env.NEXT_PUBLIC_DOCKET_FLOW_URL || "https://rjl-docket-flow.vercel.app";
const CASE_TRACKER_URL =
  process.env.NEXT_PUBLIC_CASE_TRACKER_URL || "https://rjl-case-tracker.vercel.app";

function PanelHeadingLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group/heading flex items-center gap-2 rounded-md hover:text-navy-700"
    >
      <Icon className="h-4 w-4 text-navy-500" />
      <h2 className="text-base font-semibold text-navy-900 group-hover/heading:underline group-hover/heading:decoration-pink-300 group-hover/heading:underline-offset-4">
        {children}
      </h2>
      <ExternalLink
        className="h-3.5 w-3.5 text-stone-400 group-hover/heading:text-navy-600"
        aria-label="(opens in a new tab)"
      />
    </a>
  );
}

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: FIRM_TIME_ZONE,
});

function formatDateHeading(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function meetingStatus(meeting: TodayMeeting, now: number) {
  const start = Date.parse(meeting.start);
  const end = meeting.end ? Date.parse(meeting.end) : start + 60 * 60 * 1000;
  if (now >= end) return "past";
  if (now >= start) return "now";
  return "upcoming";
}

const WATCH_BELOW = 85;
const ATTENTION_BELOW = 70;

function scoreTone(score: number) {
  if (score >= WATCH_BELOW) return { bar: "bg-emerald-500/70", text: "text-navy-900" };
  if (score >= ATTENTION_BELOW) return { bar: "bg-amber-400", text: "text-amber-600" };
  return { bar: "bg-pink-500", text: "text-pink-600" };
}

export function TodayPanel() {
  const { firebaseUser } = useAuth();
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/today?scope=${scope}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as TodayResponse);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, scope]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="grid gap-4 lg:grid-cols-5">
      <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm lg:col-span-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PanelHeadingLink href={DOCKET_FLOW_URL} icon={CalendarDays}>
              Your Day
            </PanelHeadingLink>
            {data && (
              <span className="text-xs text-stone-500">{formatDateHeading(data.date)}</span>
            )}
          </div>
          {data?.canViewAll && (
            <div className="flex rounded-lg bg-stone-100 p-0.5 text-xs font-medium">
              {(["mine", "all"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScope(option)}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-colors",
                    scope === option
                      ? "bg-white text-navy-900 shadow-sm"
                      : "text-stone-500 hover:text-navy-700"
                  )}
                >
                  {option === "mine" ? "Mine" : "Everyone"}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && !data ? (
          <PanelSkeleton rows={3} />
        ) : failed || data?.errors.schedule ? (
          <PanelError message="Couldn't load today's calendar from Docket Flow." />
        ) : data && data.meetings.length === 0 && data.deadlines.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">
            Nothing on the calendar today.
          </p>
        ) : (
          data && (
            <div className={cn("space-y-3", loading && "opacity-60")}>
              {data.meetings.length > 0 && (
                <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
                  {data.meetings.map((meeting) => {
                    const status = meetingStatus(meeting, now);
                    return (
                      <li
                        key={meeting.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm",
                          status === "now" && "bg-pink-50 ring-1 ring-pink-200",
                          status === "past" && "opacity-50"
                        )}
                      >
                        <span className="w-16 shrink-0 text-xs font-medium tabular-nums text-navy-600">
                          {timeFormat.format(new Date(meeting.start))}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-navy-900">
                            {meeting.title}
                          </span>
                          {(meeting.caseNumber || meeting.clientName) && (
                            <span className="block truncate text-xs text-stone-500">
                              {[meeting.caseNumber, meeting.clientName]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </span>
                        {status === "now" && (
                          <span className="shrink-0 rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                            Now
                          </span>
                        )}
                        {meeting.zoomLink && status !== "past" && (
                          <a
                            href={meeting.zoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-md p-1 text-navy-500 hover:bg-navy-50 hover:text-navy-700"
                            aria-label={`Join Zoom for ${meeting.title}`}
                          >
                            <Video className="h-4 w-4" />
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {data.deadlines.length > 0 && (
                <div className="border-t border-stone-100 pt-2">
                  <p className="mb-1 flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    <Flag className="h-3 w-3" />
                    Due today ({data.deadlines.length})
                  </p>
                  <ul className="max-h-28 space-y-0.5 overflow-y-auto pr-1">
                    {data.deadlines.map((deadline) => (
                      <li
                        key={deadline.id}
                        className={cn(
                          "truncate px-2 text-sm text-navy-800",
                          deadline.completed && "text-stone-400 line-through"
                        )}
                        title={deadline.title}
                      >
                        {deadline.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        )}
      </div>

      <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm lg:col-span-2">
        <div className="mb-3">
          <PanelHeadingLink href={CASE_TRACKER_URL} icon={Gauge}>
            Case Tracker
          </PanelHeadingLink>
          <p className="mt-0.5 text-xs text-stone-500">Team case completeness</p>
        </div>

        {loading && !data ? (
          <PanelSkeleton rows={4} />
        ) : failed || data?.errors.scores ? (
          <PanelError message="Couldn't load case tracker scores." />
        ) : data && data.attorneys.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">No active cases found.</p>
        ) : (
          data && (
            <>
              <ul className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
                {data.attorneys.map((attorney) => {
                  const tone = scoreTone(attorney.averageScore);
                  return (
                    <li
                      key={attorney.attorneyId}
                      title={`Updated info ${attorney.averageFreshness}% · ${attorney.casesNeedingUpdate} of ${attorney.caseCount} cases need an update`}
                    >
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-navy-900">
                          {attorney.name}
                        </span>
                        <span className={cn("shrink-0 font-semibold tabular-nums", tone.text)}>
                          {attorney.averageScore}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className={cn("h-full rounded-full", tone.bar)}
                          style={{ width: `${attorney.averageScore}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[11px] text-stone-500">
                        Completeness {attorney.averageCompleteness}% · {attorney.caseCount}{" "}
                        active cases
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-stone-100 pt-2 text-[11px] text-stone-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Watch: below {WATCH_BELOW}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  Needs attention: below {ATTENTION_BELOW}%
                </span>
              </p>
            </>
          )
        )}
      </div>
    </section>
  );
}

function PanelSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-lg bg-stone-100" />
      ))}
    </div>
  );
}

function PanelError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-4 text-sm text-stone-500">
      <AlertCircle className="h-4 w-4 shrink-0 text-pink-500" />
      {message}
    </p>
  );
}
