"use client";

import { CardGrid } from "./card-grid";
import type { LaunchCard as LaunchCardType } from "@/types";

interface CategorySectionProps {
  categoryName: string;
  cards: LaunchCardType[];
  favoriteIds: string[];
  onToggleFavorite: (cardId: string) => void;
  onOpen: (card: LaunchCardType) => void;
}

export function CategorySection({
  categoryName,
  cards,
  favoriteIds,
  onToggleFavorite,
  onOpen,
}: CategorySectionProps) {
  if (cards.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-navy-900">{categoryName}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-pink-400/70 to-transparent" />
        <span className="text-xs font-medium text-stone-400">
          {cards.length} {cards.length === 1 ? "tool" : "tools"}
        </span>
      </div>
      <CardGrid
        cards={cards}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onOpen={onOpen}
      />
    </section>
  );
}
