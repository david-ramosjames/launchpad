"use client";

import { Star, ExternalLink } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LaunchCard as LaunchCardType } from "@/types";

interface LaunchCardProps {
  card: LaunchCardType;
  isFavorite: boolean;
  onToggleFavorite: (cardId: string) => void;
  onOpen: (card: LaunchCardType) => void;
  compact?: boolean;
}

function CardIcon({ card, size }: { card: LaunchCardType; size: "sm" | "md" }) {
  const Icon = getIcon(card.icon);
  const logo = card.logoUrl?.trim();
  const box = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  if (logo) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-stone-100",
          box
        )}
      >
        <img
          src={logo}
          alt=""
          className="max-h-full max-w-full object-contain p-1"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-navy-50 to-stone-50 text-navy-700 ring-1 ring-stone-100",
        box
      )}
    >
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </div>
  );
}

export function LaunchCard({
  card,
  isFavorite,
  onToggleFavorite,
  onOpen,
  compact = false,
}: LaunchCardProps) {
  const favoriteButton = (
    <button
      type="button"
      className={cn(
        "shrink-0 rounded-full p-1.5 transition-colors",
        isFavorite
          ? "text-pink-500 hover:text-pink-600"
          : "text-stone-300 hover:text-pink-400"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite(card.id);
      }}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
    </button>
  );

  const interactionProps = {
    onClick: () => onOpen(card),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen(card);
      }
    },
    role: "button" as const,
    tabIndex: 0,
  };

  if (compact) {
    return (
      <article
        className="group flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:border-pink-200 hover:shadow-md cursor-pointer"
        title={card.description || card.title}
        {...interactionProps}
      >
        <CardIcon card={card} size="sm" />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-navy-900 group-hover:text-navy-700">
          {card.title}
        </h3>
        {favoriteButton}
      </article>
    );
  }

  return (
    <article
      className="group relative flex flex-col rounded-xl border border-stone-200/80 bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md cursor-pointer"
      {...interactionProps}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <CardIcon card={card} size="sm" />
        <div className="flex items-center gap-1">
          <ExternalLink
            className="h-3.5 w-3.5 text-navy-400 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
          {favoriteButton}
        </div>
      </div>

      {(card.isNew || card.isImportant) && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {card.isNew && <Badge variant="new">New</Badge>}
          {card.isImportant && <Badge variant="important">Important</Badge>}
        </div>
      )}

      <h3 className="font-semibold text-navy-900 group-hover:text-navy-700 line-clamp-1">
        {card.title}
      </h3>
      <p className="mt-0.5 text-sm text-stone-500 line-clamp-2 flex-1">
        {card.description}
      </p>

      {card.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
