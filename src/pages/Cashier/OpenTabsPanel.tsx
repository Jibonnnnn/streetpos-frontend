import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgePill } from "@/components/common/BadgePill";
import { Pagination } from "@/components/common/Pagination";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import type { OrderResponse } from "@/types";

type PageState = {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  pageSize: number;
  paginated: OrderResponse[];
  setPage: (p: number) => void;
  setPageSize: (n: number) => void;
};

type Props = {
  tabs: OrderResponse[];
  loading: boolean;
  tabsPage: PageState;
  isOnline: boolean;
  onRefresh: () => void;
  onSettle: (order: OrderResponse) => void;
};

export function OpenTabsPanel({
  tabs,
  loading,
  tabsPage,
  isOnline,
  onRefresh,
  onSettle,
}: Props) {
  return (
    <Card className="border-border/40 bg-white/90 shadow-sm">
      <CardContent className="p-5 md:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Open Tabs (Pay Later)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Collect payment for orders placed on tab.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading || !isOnline}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {!isOnline && (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Settling tabs requires an internet connection.
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : tabs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
            No open tabs right now.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {tabsPage.paginated.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-zinc-50 p-4 dark:bg-zinc-950/50"
                >
                  <div className="min-w-0">
                    <div className="font-mono font-medium">
                      {order.orderNumber}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {order.customerName || "—"} ·{" "}
                      {new Date(
                        order.createdAt?.endsWith?.("Z")
                          ? order.createdAt
                          : order.createdAt + "Z",
                      ).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(order.items || []).slice(0, 4).map((it) => (
                        <BadgePill key={it.id} tone="neutral">
                          {it.quantity}× {it.menuItemName}
                        </BadgePill>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        ₱{(order.total || 0).toFixed(2)}
                      </div>
                      <BadgePill tone="warning">Pay Later</BadgePill>
                    </div>
                    <Button
                      className="rounded-2xl"
                      disabled={!isOnline}
                      onClick={() => onSettle(order)}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Settle
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              page={tabsPage.page}
              totalPages={tabsPage.totalPages}
              total={tabsPage.total}
              from={tabsPage.from}
              to={tabsPage.to}
              onPageChange={tabsPage.setPage}
              pageSize={tabsPage.pageSize}
              onPageSizeChange={tabsPage.setPageSize}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}