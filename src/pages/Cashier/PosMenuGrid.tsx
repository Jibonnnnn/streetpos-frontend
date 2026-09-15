import { Card, CardContent } from "@/components/ui/card";
import { BadgePill } from "@/components/common/BadgePill";
import { Pagination } from "@/components/common/Pagination";
import { getFullImageUrl } from "@/lib/imageUtils";
import { AlertTriangle, Plus } from "lucide-react";
import type { MenuItem } from "@/types";

type PageState = {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  pageSize: number;
  paginated: MenuItem[];
  setPage: (p: number) => void;
  setPageSize: (n: number) => void;
};

type Props = {
  menuPage: PageState;
  filteredCount: number;
  onSelectItem: (item: MenuItem) => void;
};

export function PosMenuGrid({ menuPage, filteredCount, onSelectItem }: Props) {
  return (
    <Card className="overflow-hidden border-border/40 bg-white/90 shadow-sm backdrop-blur-sm dark:bg-zinc-950/60">
      <CardContent className="p-5 md:p-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Menu Items
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap a card to choose add-ons and build the order.
            </p>
          </div>
          <BadgePill tone="info" className="shrink-0">
            {filteredCount} available
          </BadgePill>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {menuPage.paginated.map((item) => {
            const hasLowStock = item.inventoryLinks?.some(
              (link) => link.quantityUsedPerUnit > 5,
            );
            const imageSrc = getFullImageUrl(
              item.imageFileName ?? item.imageUrl,
            );

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectItem(item)}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white text-left shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/60 hover:shadow-[0_20px_40px_rgba(245,158,11,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-amber-500/30"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl opacity-25">
                      ☕
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-amber-700 shadow-sm backdrop-blur-sm dark:bg-zinc-950/90 dark:text-amber-400">
                    ₱{item.price.toFixed(2)}
                  </div>
                  {hasLowStock && (
                    <div className="absolute left-3 top-3">
                      <BadgePill tone="warning" className="gap-1 shadow-sm">
                        <AlertTriangle size={12} />
                        Low stock
                      </BadgePill>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {item.categoryName}
                  </p>
                  <h3 className="mt-1 font-heading text-base font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-auto pt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-amber-400">
                      <Plus className="h-3.5 w-3.5" />
                      Add to order
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredCount === 0 && (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
            No menu items match your search.
          </div>
        )}

        {filteredCount > 0 && (
          <Pagination
            page={menuPage.page}
            totalPages={menuPage.totalPages}
            total={menuPage.total}
            from={menuPage.from}
            to={menuPage.to}
            onPageChange={menuPage.setPage}
            pageSize={menuPage.pageSize}
            onPageSizeChange={menuPage.setPageSize}
          />
        )}
      </CardContent>
    </Card>
  );
}