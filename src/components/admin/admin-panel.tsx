"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/layout/header";
import { CaseTrackerVisibility } from "./case-tracker-visibility";
import { CategoryAccessButton } from "./category-access-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getCards,
  getAllCategories,
  getAllUsers,
  createCard,
  updateCard,
  archiveCard,
  deleteCard,
  createCategory,
  deleteCategory,
  updateCategory,
  createAnnouncement,
  updateUserProfile,
} from "@/lib/firestore/helpers";
import type {
  LaunchCard,
  Category,
  AppUser,
  UserRole,
  CardType,
} from "@/types";
import { ALL_ROLES } from "@/types";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Users,
  ArrowUp,
  ArrowDown,
  Archive,
  Check,
  X,
} from "lucide-react";

const CARD_TYPES: CardType[] = [
  "external_link",
  "internal_tool",
  "training",
  "document",
  "dashboard",
];

const EMPTY_CARD = {
  title: "",
  description: "",
  icon: "grid",
  logoUrl: "",
  categoryId: "",
  type: "external_link" as CardType,
  url: "",
  tags: "",
  visibilityRoles: ["viewer"] as UserRole[],
  isActive: true,
  isNew: false,
  isImportant: false,
  order: 0,
};

export function AdminPanel() {
  const { appUser } = useAuth();
  const [cards, setCards] = useState<LaunchCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardForm, setCardForm] = useState(EMPTY_CARD);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const load = async () => {
    setLoading(true);
    const [c, cat, u] = await Promise.all([
      getCards(false),
      getAllCategories(),
      getAllUsers(),
    ]);
    setCards(c);
    setCategories(cat);
    setUsers(u);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateCard = () => {
    if (categories.length === 0) {
      alert(
        "Add at least one category first. Use the Categories section on this page (name + Add), then try again."
      );
      return;
    }
    setEditingId(null);
    setCardForm({
      ...EMPTY_CARD,
      categoryId: categories[0]?.id ?? "",
      order: cards.length + 1,
    });
    setCardDialogOpen(true);
  };

  const openEditCard = (card: LaunchCard) => {
    setEditingId(card.id);
    setCardForm({
      title: card.title,
      description: card.description,
      icon: card.icon,
      logoUrl: card.logoUrl ?? "",
      categoryId: card.categoryId,
      type: card.type,
      url: card.url,
      tags: card.tags.join(", "),
      visibilityRoles: card.visibilityRoles,
      isActive: card.isActive,
      isNew: card.isNew,
      isImportant: card.isImportant,
      order: card.order,
    });
    setCardDialogOpen(true);
  };

  const saveCard = async () => {
    if (!cardForm.categoryId && categories.length > 0) {
      alert("Please select a category.");
      return;
    }
    if (!cardForm.title.trim()) {
      alert("Please enter a title.");
      return;
    }

    const payload = {
      title: cardForm.title,
      description: cardForm.description,
      icon: cardForm.icon.trim() || "grid",
      logoUrl: cardForm.logoUrl.trim(),
      categoryId: cardForm.categoryId,
      type: cardForm.type,
      url: cardForm.url.trim() || "#",
      tags: cardForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      visibilityRoles: cardForm.visibilityRoles,
      isActive: cardForm.isActive,
      isNew: cardForm.isNew,
      isImportant: cardForm.isImportant,
      order: cardForm.order,
    };

    if (editingId) {
      await updateCard(editingId, payload);
    } else {
      await createCard(payload);
    }
    setCardDialogOpen(false);
    await load();
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Archive this card? It will be hidden from Launch Pad but kept in the database."))
      return;
    await archiveCard(id);
    await load();
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const slug = newCategoryName.toLowerCase().replace(/\s+/g, "-");
    await createCategory({
      name: newCategoryName,
      slug,
      order: categories.length + 1,
      isActive: true,
      allowedUserIds: [],
    });
    setNewCategoryName("");
    await load();
  };

  const handleCreateAnnouncement = async () => {
    if (!announceTitle.trim()) return;
    await createAnnouncement({
      title: announceTitle,
      message: announceMessage,
      visibilityRoles: ALL_ROLES,
      isActive: true,
      priority: "normal",
    });
    setAnnounceTitle("");
    setAnnounceMessage("");
    alert("Announcement created.");
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    await updateUserProfile(userId, { role });
    await load();
  };

  const toggleVisibilityRole = (role: UserRole) => {
    setCardForm((prev) => ({
      ...prev,
      visibilityRoles: prev.visibilityRoles.includes(role)
        ? prev.visibilityRoles.filter((r) => r !== role)
        : [...prev.visibilityRoles, role],
    }));
  };

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    [categories]
  );

  const reorderCategory = async (categoryId: string, direction: "up" | "down") => {
    const list = [...sortedCategories];
    const i = list.findIndex((c) => c.id === categoryId);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await Promise.all(
      list.map((c, idx) => updateCategory(c.id, { order: idx + 1 }))
    );
    await load();
  };

  const cardsByCategoryId = useMemo(() => {
    const map = new Map<string, LaunchCard[]>();
    for (const c of cards) {
      const list = map.get(c.categoryId) ?? [];
      list.push(c);
      map.set(c.categoryId, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          (a.order !== b.order ? a.order - b.order : a.title.localeCompare(b.title))
      );
    }
    return map;
  }, [cards]);

  const reorderCardWithinCategory = async (
    categoryId: string,
    cardId: string,
    direction: "up" | "down"
  ) => {
    const group = [...(cardsByCategoryId.get(categoryId) ?? [])];
    const i = group.findIndex((c) => c.id === cardId);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= group.length) return;
    [group[i], group[j]] = [group[j], group[i]];
    await Promise.all(
      group.map((c, idx) => updateCard(c.id, { order: idx + 1 }))
    );
    await load();
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const saveCategoryName = async (cat: Category) => {
    const name = editingCategoryName.trim();
    if (!name || name === cat.name) {
      cancelEditCategory();
      return;
    }
    await updateCategory(cat.id, { name });
    cancelEditCategory();
    await load();
  };

  const handleDeleteCategory = async (cat: Category) => {
    const n = cards.filter((c) => c.categoryId === cat.id).length;
    if (n > 0) {
      alert(
        `Cannot delete "${cat.name}": ${n} card(s) still use this category. Delete or move those cards first.`
      );
      return;
    }
    if (!confirm(`Delete category "${cat.name}" permanently?`)) return;
    await deleteCategory(cat.id);
    await load();
  };

  const handlePermanentDeleteCard = async (card: LaunchCard) => {
    if (
      !confirm(
        `Permanently delete "${card.title}"? This removes it from the database (not the same as archive).`
      )
    )
      return;
    await deleteCard(card.id);
    await load();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-800 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Launch Pad
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-navy-900">Admin</h1>
            <p className="text-sm text-stone-500">
              Manage cards, categories, announcements, and user roles.
            </p>
          </div>
          <Button
            onClick={openCreateCard}
            disabled={categories.length === 0}
            title={
              categories.length === 0
                ? "Create at least one category below first"
                : undefined
            }
          >
            <Plus className="h-4 w-4" />
            Add Card
          </Button>
        </div>

        {/* Categories — create these before cards */}
        <section className="mb-10 rounded-xl border border-navy-100 bg-white p-6 shadow-sm ring-1 ring-navy-50">
          <h2 className="mb-2 text-lg font-semibold text-navy-900">Categories</h2>
          <p className="mb-4 text-sm text-stone-600">
            Every card needs a category (e.g. &quot;Case Management&quot;, &quot;Daily Work&quot;).
            Add one here first — then the category dropdown when adding a card will populate. Use the
            pencil to rename a category (its cards stay attached), and ↑ ↓ to change the order sections
            appear on Launch Pad.
          </p>
          <ul className="mb-3 divide-y divide-stone-100 rounded-lg border border-stone-200 text-sm">
            {categories.length === 0 ? (
              <li className="px-3 py-2 text-stone-500 italic">No categories yet — add one.</li>
            ) : (
              sortedCategories.map((cat, idx) => (
                <li
                  key={cat.id}
                  className="flex items-center gap-1 py-1 pl-3 pr-0.5"
                >
                  {editingCategoryId === cat.id ? (
                    <>
                      <Input
                        autoFocus
                        aria-label="Category name"
                        className="h-7 min-w-0 flex-1 text-sm"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveCategoryName(cat);
                          if (e.key === "Escape") cancelEditCategory();
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-emerald-600 hover:bg-emerald-50"
                        title="Save name"
                        onClick={() => saveCategoryName(cat)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        title="Cancel"
                        onClick={cancelEditCategory}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate font-medium text-navy-800">
                        {cat.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        title="Rename category"
                        onClick={() => startEditCategory(cat)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <CategoryAccessButton
                    category={cat}
                    users={users}
                    onSave={async (allowedUserIds) => {
                      await updateCategory(cat.id, { allowedUserIds });
                      await load();
                    }}
                  />
                  <span className="shrink-0 tabular-nums text-xs text-stone-400">{idx + 1}</span>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === 0}
                      title="Move category up"
                      onClick={() => reorderCategory(cat.id, "up")}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx === sortedCategories.length - 1}
                      title="Move category down"
                      onClick={() => reorderCategory(cat.id, "down")}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    title="Delete category"
                    onClick={() => handleDeleteCategory(cat)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))
            )}
          </ul>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Case Management"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Button variant="secondary" onClick={handleCreateCategory}>
              Add category
            </Button>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-10 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-navy-900">Cards</h2>
          <p className="mb-4 text-sm text-stone-600">
            Cards are grouped by category. Use the arrows to change order within that section on the
            Launch Pad. Archive hides a card; delete removes it permanently.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-stone-500">
                  <th className="pb-2 pr-3">Title</th>
                  <th className="pb-2 pr-3">Category</th>
                  <th className="pb-2 pr-3 whitespace-nowrap">Order</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3 whitespace-nowrap">Move</th>
                  <th className="pb-2 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((cat) => {
                  const catCards = cardsByCategoryId.get(cat.id) ?? [];
                  return (
                    <Fragment key={cat.id}>
                      <tr className="bg-navy-50/70">
                        <td
                          colSpan={6}
                          className="py-2 pl-3 text-xs font-semibold uppercase tracking-wider text-navy-700"
                        >
                          {cat.name}
                          <span className="ml-2 font-normal normal-case text-stone-500">
                            ({catCards.length} {catCards.length === 1 ? "card" : "cards"})
                          </span>
                        </td>
                      </tr>
                      {catCards.length === 0 ? (
                        <tr className="border-b border-stone-100">
                          <td colSpan={6} className="py-3 pl-6 text-stone-400 italic">
                            No cards in this category yet.
                          </td>
                        </tr>
                      ) : (
                        catCards.map((card, idx) => (
                          <tr key={card.id} className="border-b border-stone-100">
                            <td className="py-3 pr-3 font-medium">{card.title}</td>
                            <td className="py-3 pr-3 text-stone-500">{cat.name}</td>
                            <td className="py-3 pr-3 tabular-nums text-stone-600">{card.order}</td>
                            <td className="py-3 pr-3">
                              <span
                                className={
                                  card.isActive ? "text-emerald-600" : "text-stone-400"
                                }
                              >
                                {card.isActive ? "Active" : "Archived"}
                              </span>
                            </td>
                            <td className="py-3 pr-3">
                              <div className="flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={idx === 0}
                                  title="Move up in category"
                                  onClick={() =>
                                    reorderCardWithinCategory(cat.id, card.id, "up")
                                  }
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={idx === catCards.length - 1}
                                  title="Move down in category"
                                  onClick={() =>
                                    reorderCardWithinCategory(cat.id, card.id, "down")
                                  }
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Edit"
                                  onClick={() => openEditCard(card)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Archive (hide from Launch Pad)"
                                  onClick={() => handleArchive(card.id)}
                                >
                                  <Archive className="h-4 w-4 text-navy-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Delete permanently"
                                  onClick={() => handlePermanentDeleteCard(card)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </Fragment>
                  );
                })}
                {(() => {
                  const known = new Set(categories.map((c) => c.id));
                  const orphanIds = [
                    ...new Set(
                      cards.filter((c) => !known.has(c.categoryId)).map((c) => c.categoryId)
                    ),
                  ];
                  if (orphanIds.length === 0) return null;
                  return (
                    <Fragment key="__orphans__">
                      <tr className="bg-amber-50">
                        <td
                          colSpan={6}
                          className="py-2 pl-3 text-xs font-semibold uppercase tracking-wider text-amber-900"
                        >
                          Cards with unknown / deleted category ID
                        </td>
                      </tr>
                      {orphanIds.flatMap((oid) => {
                        const catCards = cardsByCategoryId.get(oid) ?? [];
                        return catCards.map((card, idx) => (
                          <tr key={card.id} className="border-b border-amber-100 bg-amber-50/40">
                            <td className="py-3 pr-3 font-medium">{card.title}</td>
                            <td className="py-3 pr-3 font-mono text-xs text-amber-800">
                              {oid || "(empty)"}
                            </td>
                            <td className="py-3 pr-3 tabular-nums">{card.order}</td>
                            <td className="py-3 pr-3">
                              <span
                                className={
                                  card.isActive ? "text-emerald-600" : "text-stone-400"
                                }
                              >
                                {card.isActive ? "Active" : "Archived"}
                              </span>
                            </td>
                            <td className="py-3 pr-3">
                              <div className="flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={idx === 0}
                                  onClick={() =>
                                    reorderCardWithinCategory(oid, card.id, "up")
                                  }
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={idx === catCards.length - 1}
                                  onClick={() =>
                                    reorderCardWithinCategory(oid, card.id, "down")
                                  }
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditCard(card)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleArchive(card.id)}
                                >
                                  <Archive className="h-4 w-4 text-navy-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePermanentDeleteCard(card)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })}
                    </Fragment>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </section>

        <CaseTrackerVisibility />

        {/* Announcements */}
        <section className="mb-10 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-navy-900">
            Announcements
          </h2>
          <div className="space-y-3 max-w-lg">
            <div>
              <Label>Title</Label>
              <Input
                value={announceTitle}
                onChange={(e) => setAnnounceTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={announceMessage}
                onChange={(e) => setAnnounceMessage(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateAnnouncement}>Create Announcement</Button>
          </div>
        </section>

        {/* Users */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-navy-900">
            <Users className="h-5 w-5" />
            User Roles
          </h2>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-100 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-sm">{user.displayName}</p>
                  <p className="text-xs text-stone-500">{user.email}</p>
                </div>
                <Select
                  value={user.role}
                  onValueChange={(v) =>
                    handleRoleChange(user.id, v as UserRole)
                  }
                  disabled={
                    appUser?.role !== "super_admin" && user.id !== appUser?.id
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </section>

        <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
          <DialogTrigger asChild>
            <span className="hidden" />
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Card" : "Add Card"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  value={cardForm.title}
                  onChange={(e) =>
                    setCardForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={cardForm.description}
                  onChange={(e) =>
                    setCardForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Logo image URL (optional)</Label>
                <Input
                  placeholder="https://…/logo.png — square image looks best"
                  value={cardForm.logoUrl}
                  onChange={(e) =>
                    setCardForm((p) => ({ ...p, logoUrl: e.target.value }))
                  }
                />
                <p className="mt-1 text-xs text-stone-500">
                  If set, this shows on the dashboard instead of the icon key. Use a direct link to a PNG,
                  JPG, or SVG (many sites block hotlinking — host on Drive/Dropbox public link or your site).
                </p>
              </div>
              <div>
                <Label>Icon key (fallback)</Label>
                <Input
                  value={cardForm.icon}
                  onChange={(e) =>
                    setCardForm((p) => ({ ...p, icon: e.target.value }))
                  }
                  placeholder="grid, slack, workflow, globe, calendar…"
                />
                <p className="mt-1 text-xs text-stone-500">
                  Used when no logo URL. Built-in keys include: grid, slack, workflow, globe, directory,
                  phone, cloud, training, megaphone — add more in code under{" "}
                  <code className="rounded bg-stone-100 px-1">src/lib/icons.ts</code>.
                </p>
              </div>
              <div>
                <Label>Link URL</Label>
                <Input
                  value={cardForm.url}
                  onChange={(e) =>
                    setCardForm((p) => ({ ...p, url: e.target.value }))
                  }
                  placeholder="https://your-tool.com or /directory"
                />
                <p className="mt-1 text-xs text-stone-500">
                  Full web address for external tools (include https://). For pages inside Launch Pad use a path like{" "}
                  <code className="rounded bg-stone-100 px-1">/directory</code>.
                </p>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={cardForm.categoryId || undefined}
                  onValueChange={(v) =>
                    setCardForm((p) => ({ ...p, categoryId: v }))
                  }
                  disabled={categories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        categories.length === 0
                          ? "Add a category above first"
                          : "Select category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={cardForm.type}
                  onValueChange={(v) =>
                    setCardForm((p) => ({ ...p, type: v as CardType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={cardForm.tags}
                  onChange={(e) =>
                    setCardForm((p) => ({ ...p, tags: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Visibility roles</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {ALL_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleVisibilityRole(role)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border ${
                        cardForm.visibilityRoles.includes(role)
                          ? "bg-navy-800 text-white border-navy-800"
                          : "bg-white text-stone-600 border-stone-200"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={cardForm.isNew}
                    onChange={(e) =>
                      setCardForm((p) => ({ ...p, isNew: e.target.checked }))
                    }
                  />
                  New
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={cardForm.isImportant}
                    onChange={(e) =>
                      setCardForm((p) => ({
                        ...p,
                        isImportant: e.target.checked,
                      }))
                    }
                  />
                  Important
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={cardForm.isActive}
                    onChange={(e) =>
                      setCardForm((p) => ({ ...p, isActive: e.target.checked }))
                    }
                  />
                  Active
                </label>
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={cardForm.order}
                  onChange={(e) =>
                    setCardForm((p) => ({
                      ...p,
                      order: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </div>
              <Button className="w-full" onClick={saveCard}>
                Save Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
