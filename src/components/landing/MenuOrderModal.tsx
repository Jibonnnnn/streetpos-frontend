import { useEffect, useMemo, useState } from "react";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { BadgePill } from "@/components/common/BadgePill";
import { Input } from "@/components/ui/input";
import { getFullImageUrl } from "@/lib/imageUtils";
import { Search, Coffee } from "lucide-react";
import type { MenuItem } from "@/types";

type MenuOrderModalProps = {
  open: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  loading?: boolean;
  /** Pre-select a category when opening (e.g. from a category chip on the landing page). */
  initialCategory?: string | null;
};

function toNumber(value: number | string): number {
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function MenuOrderModal({
  open,
  onClose,
  menuItems,
  loading = false,
  initialCategory = null,
}: MenuOrderModalProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const activeItems = useMemo(
    () => menuItems.filter((item) => item.isActive !== false),
    [menuItems],
  );

  // Unique categories, sorted A–Z
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of activeItems) {
      if (item.categoryName?.trim()) set.add(item.categoryName.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activeItems]);

  // When modal opens, apply initial category if provided
  useEffect(() => {
    if (!open) return;
    setSearch("");
    if (initialCategory && categories.includes(initialCategory)) {
      setActiveCategory(initialCategory);
    } else {
      setActiveCategory("All");
    }
  }, [open, initialCategory, categories]);

  // Items filtered by category + search, then grouped (when All) or flat list
  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    let list = activeItems;
    if (activeCategory !== "All") {
      list = list.filter((item) => item.categoryName === activeCategory);
    }
    if (term) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.categoryName?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term),
      );
    }

    return [...list].sort(
      (a, b) =>
        a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
    );
  }, [activeItems, activeCategory, search]);

  // Group by category for "All" view
  const grouped = useMemo(() => {
    if (activeCategory !== "All") return null;

    const map = new Map<string, MenuItem[]>();
    for (const item of visibleItems) {
      const key = item.categoryName || "Other";
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visibleItems, activeCategory]);

  const renderItemCard = (item: MenuItem) => {
    const imageSrc = getFullImageUrl(item.imageFileName ?? item.imageUrl);
    return (
      <div
        key={item.id}
        className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900/60"
      >
        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <Coffee className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium tracking-tight">{item.name}</p>
          {item.description ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {item.description}
            </p>
          ) : null}
          <p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
            ₱{toNumber(item.price).toFixed(2)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <ModalShell
      open={open}
      title="Our Menu"
      description="Pick a category or search — everything is sorted for easy browsing."
      onClose={onClose}
      className="max-w-3xl"
    >
      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu items..."
          className="pl-11 rounded-2xl"
        />
      </div>

      {/* Clickable categories */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("All")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            activeCategory === "All"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          All
          <span className="ml-1.5 opacity-80">{activeItems.length}</span>
        </button>
        {categories.map((cat) => {
          const count = activeItems.filter((i) => i.categoryName === cat).length;
          const selected = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selected
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {cat}
              <span className="ml-1.5 opacity-80">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Menu list */}
      <div className="max-h-[55vh] space-y-6 overflow-y-auto pr-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-32 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((__, j) => (
                  <div
                    key={j}
                    className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
                  />
                ))}
              </div>
            </div>
          ))
        ) : visibleItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
            No menu items match your search
            {activeCategory !== "All" ? ` in “${activeCategory}”` : ""}.
          </div>
        ) : activeCategory === "All" && grouped ? (
          grouped.map(([category, items]) => (
            <div key={category}>
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className="font-heading text-lg font-semibold tracking-tight hover:text-amber-700 dark:hover:text-amber-400"
                >
                  {category}
                </button>
                <BadgePill tone="neutral">{items.length}</BadgePill>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map(renderItemCard)}
              </div>
            </div>
          ))
        ) : (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="font-heading text-lg font-semibold tracking-tight">
                {activeCategory}
              </h3>
              <BadgePill tone="neutral">{visibleItems.length}</BadgePill>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleItems.map(renderItemCard)}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
