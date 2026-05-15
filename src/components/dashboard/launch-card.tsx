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

export function LaunchCard({
  card,
  isFavorite,
  onToggleFavorite,
  onOpen,
  compact = false,
}: LaunchCardProps) {
  const Icon = getIcon(card.icon);
  const logo = card.logoUrl?.trim();

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md cursor-pointer",
        compact && "p-3"
      )}
      onClick={() => onOpen(card)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(card);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        {logo ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-stone-100">
            <img
              src={logo}
              alt=""
              className="max-h-full max-w-full object-contain p-1"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-navy-50 to-stone-50 text-navy-700 ring-1 ring-stone-100">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <button
          type="button"
          className={cn(
            "rounded-full p-1.5 transition-colors",
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
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {card.isNew && <Badge variant="new">New</Badge>}
        {card.isImportant && <Badge variant="important">Important</Badge>}
      </div>

      <h3 className="font-semibold text-navy-900 group-hover:text-navy-700 line-clamp-1">
        {card.title}
      </h3>
      {!compact && (
        <p className="mt-1 text-sm text-stone-500 line-clamp-2 flex-1">
          {card.description}
        </p>
      )}

      {card.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
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

      <div className="mt-3 flex items-center gap-1 text-xs text-navy-600 opacity-0 transition-opacity group-hover:opacity-100">
        <ExternalLink className="h-3 w-3" />
        <span>Open</span>
      </div>
    </article>
  );
}
