import { NextResponse } from "next/server";
import { verifyFirebaseUser } from "@/lib/server/verify-firebase-user";
import { getAttorneyScores } from "@/lib/server/docket-flow";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await verifyFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const attorneys = await getAttorneyScores();
    return NextResponse.json({
      attorneys: attorneys.map(({ attorneyId, name, caseCount, averageScore }) => ({
        attorneyId,
        name,
        caseCount,
        averageScore,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load attorneys";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
