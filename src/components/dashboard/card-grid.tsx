"use client";

import { LaunchCard } from "./launch-card";
import type { LaunchCard as LaunchCardType } from "@/types";

interface CardGridProps {
  cards: LaunchCardType[];
  favoriteIds: string[];
  onToggleFavorite: (cardId: string) => void;
  onOpen: (card: LaunchCardType) => void;
  compact?: boolean;
}

export function CardGrid({
  cards,
  favoriteIds,
  onToggleFavorite,
  onOpen,
  compact = false,
}: CardGridProps) {
  if (cards.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-stone-500">
        No cards match your search.
      </p>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>article]:mb-4 [&>article]:break-inside-avoid">
      {cards.map((card) => (
        <LaunchCard
          key={card.id}
          card={card}
          isFavorite={favoriteIds.includes(card.id)}
          onToggleFavorite={onToggleFavorite}
          onOpen={onOpen}
          compact={compact}
        />
      ))}
    </div>
  );
}
