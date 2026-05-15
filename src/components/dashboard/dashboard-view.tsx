"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLaunchData } from "@/hooks/use-launch-data";
import { Header } from "@/components/layout/header";
import { ValuesRotator } from "./values-rotator";
import { SearchBar } from "./search-bar";
import { AnnouncementBanner } from "./announcement-banner";
import { CategorySection } from "./category-section";
import { CardGrid } from "./card-grid";
import { filterCards, groupCardsByCategory } from "@/lib/filter-cards";
import {
  toggleFavorite,
  logClickEvent,
  updateRecentCards,
} from "@/lib/firestore/helpers";
import type { LaunchCard as LaunchCardType } from "@/types";
import { isAdminRole } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Clock, Settings, Sparkles } from "lucide-react";

export function DashboardView() {
  const { appUser, setAppUser } = useAuth();
  const { cards, categories, announcements, loading, error } = useLaunchData(
    appUser?.role
  );
  const [search, setSearch] = useState("");

  const isAdmin = appUser ? isAdminRole(appUser.role) : false;

  const filtered = useMemo(
    () => filterCards(cards, search),
    [cards, search]
  );

  const grouped = useMemo(
    () =>
      groupCardsByCategory(
        filtered,
        categories.map((c) => ({ id: c.id, name: c.name }))
      ),
    [filtered, categories]
  );

  const favoriteIds = appUser?.favoriteCardIds ?? [];
  const recentIds = appUser?.recentCardIds ?? [];

  const favoriteCards = useMemo(
    () => cards.filter((c) => favoriteIds.includes(c.id)),
    [cards, favoriteIds]
  );

  const recentCards = useMemo(
    () =>
      recentIds
        .map((id) => cards.find((c) => c.id === id))
        .filter((c): c is LaunchCardType => c != null),
    [cards, recentIds]
  );

  const handleToggleFavorite = useCallback(
    async (cardId: string) => {
      if (!appUser) return;
      const updated = await toggleFavorite(
        appUser.id,
        cardId,
        appUser.favoriteCardIds
      );
      setAppUser({ ...appUser, favoriteCardIds: updated });
    },
    [appUser, setAppUser]
  );

  const handleOpen = useCallback(
    async (card: LaunchCardType) => {
      if (!appUser) return;
      await logClickEvent(appUser.id, card.id, card.title);
      const updatedRecent = await updateRecentCards(
        appUser.id,
        card.id,
        appUser.recentCardIds
      );
      setAppUser({ ...appUser, recentCardIds: updatedRecent });

      if (card.url.startsWith("http") || card.url.startsWith("//")) {
        window.open(card.url, "_blank", "noopener,noreferrer");
      } else if (card.url.startsWith("/")) {
        window.location.href = card.url;
      } else if (card.url !== "#") {
        window.location.href = card.url;
      }
    },
    [appUser, setAppUser]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-800 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <Header />
      <ValuesRotator />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
            Welcome back{appUser?.displayName ? `, ${appUser.displayName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-stone-500">
            Your command center for tools, workflows, and resources.
          </p>
        </div>

        <SearchBar value={search} onChange={setSearch} />

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6">
          <AnnouncementBanner announcements={announcements} />
        </div>

        {!search && favoriteCards.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-pink-500 fill-pink-500" />
              <h2 className="text-lg font-semibold text-navy-900">Favorites</h2>
            </div>
            <CardGrid
              cards={favoriteCards}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onOpen={handleOpen}
              compact
            />
          </section>
        )}

        {!search && recentCards.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-navy-500" />
              <h2 className="text-lg font-semibold text-navy-900">Recently Used</h2>
            </div>
            <CardGrid
              cards={recentCards}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onOpen={handleOpen}
              compact
            />
          </section>
        )}

        {grouped.map((group) => (
          <CategorySection
            key={group.categoryId}
            categoryName={group.categoryName}
            cards={group.cards}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onOpen={handleOpen}
          />
        ))}

        {filtered.length === 0 && !loading && (
          <div className="py-16">
            {search.trim() ? (
              <p className="text-center text-stone-500">
                No tools match your search. Clear the search box to see everything.
              </p>
            ) : (
              <div className="mx-auto max-w-lg rounded-xl border border-stone-200 bg-white px-6 py-10 text-center shadow-sm">
                <Sparkles className="mx-auto h-10 w-10 text-pink-500" />
                <h2 className="mt-4 text-lg font-semibold text-navy-900">
                  No tools yet
                </h2>
                <p className="mt-2 text-sm text-stone-600">
                  Cards for Slack, workflows, training, and links appear here once they&apos;re
                  added to Firestore.
                </p>
                {isAdmin ? (
                  <>
                    <p className="mt-4 text-sm text-stone-600">
                      As an admin, open <strong className="text-navy-800">Admin</strong> in the
                      header and use <strong className="text-navy-800">Add Card</strong>, or run
                      the starter seed once (see README).
                    </p>
                    <Button className="mt-6" asChild>
                      <Link href="/admin">
                        <Settings className="h-4 w-4" />
                        Open Admin — add cards
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-stone-600">
                    Ask a firm admin to add launch pad cards, or have them run the seed script to
                    load the starter set.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
