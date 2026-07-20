import { useMemo, useState } from "react";
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
  loading: boolean;
};

function toNumber(value: number | string): number {
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function MenuOrderModal({ open, onClose, menuItems, loading }: MenuOrderModalProps) {
  const [search, setSearch] = useState("");

  const groupedByCategory = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? menuItems.filter(
          (item) =>
            item.name.toLowerCase().includes(term) ||
            item.categoryName.toLowerCase().includes(term),
        )
      : menuItems;

    const groups = new Map<string, MenuItem[]>();
    for (const item of filtered) {
      const list = groups.get(item.categoryName) ?? [];
      list.push(item);
      groups.set(item.categoryName, list);
    }

    for (const list of groups.values()) {
      list.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
    }

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [menuItems, search]);

  return (
    <ModalShell
      open={open}
      title="Order from Streetside Café"
      description="Browse the full menu, sorted by category."
      onClose={onClose}
      className="max-w-3xl"
    >
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu or category..."
          className="pl-11"
        />
      </div>

      <div className="max-h-[60vh] space-y-8 overflow-y-auto pr-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-32 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((__, j) => (
                  <div key={j} className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            </div>
          ))
        ) : groupedByCategory.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
            No menu items match your search.
          </div>
        ) : (
          groupedByCategory.map(([category, items]) => (
            <div key={category}>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="font-heading text-lg font-semibold tracking-tight">{category}</h3>
                <BadgePill tone="neutral">{items.length}</BadgePill>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => {
                  const imageSrc = getFullImageUrl(item.imageFileName ?? item.imageUrl);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900/60"
                    >
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                        {imageSrc ? (
                          <img src={imageSrc} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-400">
                            <Coffee className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium tracking-tight">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₱{toNumber(item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </ModalShell>
  );
}