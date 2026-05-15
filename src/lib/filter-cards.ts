import type { LaunchCard } from "@/types";

export function filterCards(
  cards: LaunchCard[],
  search: string,
  categoryId?: string,
  tag?: string
): LaunchCard[] {
  const q = search.trim().toLowerCase();
  return cards.filter((card) => {
    if (categoryId && card.categoryId !== categoryId) return false;
    if (tag && !card.tags.includes(tag)) return false;
    if (!q) return true;
    const haystack = [
      card.title,
      card.description,
      ...card.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function groupCardsByCategory(
  cards: LaunchCard[],
  categoryOrder: { id: string; name: string }[]
): { categoryId: string; categoryName: string; cards: LaunchCard[] }[] {
  const grouped = new Map<string, LaunchCard[]>();
  for (const card of cards) {
    const list = grouped.get(card.categoryId) ?? [];
    list.push(card);
    grouped.set(card.categoryId, list);
  }

  const result: { categoryId: string; categoryName: string; cards: LaunchCard[] }[] =
    [];

  for (const cat of categoryOrder) {
    const catCards = grouped.get(cat.id);
    if (catCards && catCards.length > 0) {
      result.push({
        categoryId: cat.id,
        categoryName: cat.name,
        cards: catCards.sort((a, b) => a.order - b.order),
      });
    }
  }

  const knownIds = new Set(categoryOrder.map((c) => c.id));
  for (const [categoryId, catCards] of grouped) {
    if (!knownIds.has(categoryId)) {
      result.push({
        categoryId,
        categoryName: "Other",
        cards: catCards.sort((a, b) => a.order - b.order),
      });
    }
  }

  return result;
}
