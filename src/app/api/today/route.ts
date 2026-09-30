import { NextResponse } from "next/server";
import { verifyFirebaseUser } from "@/lib/server/verify-firebase-user";
import { firmToday, getAttorneyScores, getTodaysSchedule } from "@/lib/server/docket-flow";
import type { TodayResponse } from "@/types/today";

export const dynamic = "force-dynamic";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Could not load from Docket Flow";

export async function GET(request: Request) {
  const user = await verifyFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wantsAll = new URL(request.url).searchParams.get("scope") === "all";
  const scope: TodayResponse["scope"] = wantsAll && user.isAdmin ? "all" : "mine";

  const [schedule, scores] = await Promise.allSettled([
    getTodaysSchedule({ email: user.email, includeEveryone: scope === "all" }),
    getAttorneyScores(),
  ]);

  const body: TodayResponse = {
    date: schedule.status === "fulfilled" ? schedule.value.date : firmToday(),
    scope,
    canViewAll: user.isAdmin,
    meetings: schedule.status === "fulfilled" ? schedule.value.meetings : [],
    deadlines: schedule.status === "fulfilled" ? schedule.value.deadlines : [],
    attorneys: scores.status === "fulfilled" ? scores.value : [],
    errors: {
      ...(schedule.status === "rejected" ? { schedule: errorMessage(schedule.reason) } : {}),
      ...(scores.status === "rejected" ? { scores: errorMessage(scores.reason) } : {}),
    },
  };

  return NextResponse.json(body);
}
