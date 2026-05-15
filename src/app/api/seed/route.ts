import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { seedDatabase } from "@/lib/firestore/helpers";
import { SEED_CATEGORIES, SEED_CARDS } from "@/lib/seed-data";

export async function POST(request: Request) {
  const secret = request.headers.get("x-seed-secret");
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { categoryIds } = await seedDatabase(
      SEED_CATEGORIES.map((c) => ({ ...c })),
      SEED_CARDS.map((card) => ({
        ...card,
        categoryId: card.categoryId,
      }))
    );
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      categoryIds,
      cardsCount: SEED_CARDS.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
