"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCards,
  getCategories,
  getAnnouncements,
} from "@/lib/firestore/helpers";
import type { LaunchCard, Category, Announcement } from "@/types";
import { canAccessCard } from "@/types";
import type { UserRole } from "@/types";

export function useLaunchData(userRole: UserRole | undefined) {
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

  const visibleCards =
    userRole != null
      ? cards.filter((c) => canAccessCard(userRole, c.visibilityRoles))
      : [];

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
    categories,
    announcements: visibleAnnouncements,
    loading,
    error,
    reload: load,
  };
}
