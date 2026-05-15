"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getDirectoryUsers } from "@/lib/firestore/helpers";
import { Header } from "@/components/layout/header";
import { UserAvatar } from "@/components/profile/user-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AppUser } from "@/types";
import { ArrowLeft, Mail, Phone, Search } from "lucide-react";

export function DirectoryPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getDirectoryUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const haystack = [
        u.displayName,
        u.jobTitle,
        u.department,
        u.email,
        u.bio,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search]);

  const byDepartment = useMemo(() => {
    const map = new Map<string, AppUser[]>();
    for (const u of filtered) {
      const dept = u.department || "Other";
      const list = map.get(dept) ?? [];
      list.push(u);
      map.set(dept, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Launch Pad
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Team directory
          </h1>
          <p className="mt-1 text-stone-500">
            Find colleagues across Ramos James Law.
          </p>
        </div>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            placeholder="Search by name, title, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-800 border-t-pink-500" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-stone-500">
            {search ? "No teammates match your search." : "No profiles in the directory yet."}
          </p>
        ) : (
          <div className="space-y-10">
            {byDepartment.map(([dept, members]) => (
              <section key={dept}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-pink-600">
                  {dept}
                  <span className="ml-2 font-normal text-stone-400">
                    ({members.length})
                  </span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((user) => (
                    <DirectoryCard key={user.id} user={user} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function DirectoryCard({ user }: { user: AppUser }) {
  return (
    <article className="flex flex-col rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <UserAvatar name={user.displayName} photoURL={user.photoURL} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-navy-800 truncate">{user.displayName}</h3>
          {user.jobTitle && (
            <p className="text-sm font-medium text-pink-600">{user.jobTitle}</p>
          )}
        </div>
      </div>
      {user.bio && (
        <p className="mt-3 text-sm text-stone-600 line-clamp-2">{user.bio}</p>
      )}
      <div className="mt-4 space-y-1.5 border-t border-stone-100 pt-3">
        <a
          href={`mailto:${user.email}`}
          className="flex items-center gap-2 text-sm text-navy-600 hover:text-pink-600 truncate"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" />
          {user.email}
        </a>
        {user.phone && (
          <a
            href={`tel:${user.phone}`}
            className="flex items-center gap-2 text-sm text-navy-600 hover:text-pink-600"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {user.phone}
          </a>
        )}
      </div>
    </article>
  );
}
