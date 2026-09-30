"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getCards,
  getCategories,
  getAnnouncements,
} from "@/lib/firestore/helpers";
import type { LaunchCard, Category, Announcement, AppUser } from "@/types";
import { canAccessCard, canSeeCategory } from "@/types";

export function useLaunchData(user: Pick<AppUser, "id" | "role"> | null | undefined) {
  const [cards, setCards] = useState<LaunchCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardsData, categoriesData, announcementsData] = await Promise.all([
        getCards(true),
        getCategories(),
        getAnnouncements(),
      ]);
      setCards(cardsData);
      setCategories(categoriesData);
      setAnnouncements(announcementsData);
    } catch {
      setError("Failed to load launch pad data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const userId = user?.id;
  const userRole = user?.role;

  const visibleCategories = useMemo(
    () =>
      userId && userRole
        ? categories.filter((c) => canSeeCategory(c, userId, userRole))
        : [],
    [categories, userId, userRole]
  );

  const visibleCards = useMemo(() => {
    if (!userId || !userRole) return [];
    const hiddenCategoryIds = new Set(
      categories
        .filter((c) => !canSeeCategory(c, userId, userRole))
        .map((c) => c.id)
    );
    return cards.filter(
      (c) =>
        !hiddenCategoryIds.has(c.categoryId) &&
        canAccessCard(userRole, c.visibilityRoles)
    );
  }, [cards, categories, userId, userRole]);

  const visibleAnnouncements =
    userRole != null
      ? announcements.filter(
          (a) =>
            a.visibilityRoles.length === 0 ||
            a.visibilityRoles.some((r) => canAccessCard(userRole, [r]))
        )
      : [];

  return {
    cards: visibleCards,
    allCards: cards,
    categories: visibleCategories,
    announcements: visibleAnnouncements,
    loading,
    error,
    reload: load,
  };
}
