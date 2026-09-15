import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgePill } from "@/components/common/BadgePill";
import { Pagination } from "@/components/common/Pagination";
import { Loader2, RefreshCw } from "lucide-react";
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
  orders: OrderResponse[];
  loading: boolean;
  recentPage: PageState;
  onRefresh: () => void;
};

/** PayLater is valid at runtime but may be missing from the PaymentMethod union. */
function isPayLaterTab(order: OrderResponse): boolean {
  return (
    order.status === "Pending" &&
    String(order.paymentMethod ?? "") === "PayLater"
  );
}

export function PosRecentOrders({
  orders,
  loading,
  recentPage,
  onRefresh,
}: Props) {
  return (
    <Card className="border-border/60 bg-white/80 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Recent Orders
            </h2>
            <p className="text-sm text-muted-foreground">
              Quick access to recent activity.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="max-h-[260px] space-y-3 overflow-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-12 text-center text-muted-foreground">
              No recent orders yet.
            </div>
          ) : (
            recentPage.paginated.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-border/60 bg-zinc-50 p-4 dark:bg-zinc-950/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono font-medium">
                      {order.orderNumber || `#${order.id}`}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
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
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ₱{(order.total || 0).toFixed(2)}
                    </div>
                    <div className="mt-2">
                      <BadgePill
                        tone={
                          order.status === "Completed" ? "success" : "warning"
                        }
                      >
                        {isPayLaterTab(order) ? "Pay Later" : order.status}
                      </BadgePill>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {orders.length > 0 && (
          <Pagination
            page={recentPage.page}
            totalPages={recentPage.totalPages}
            total={recentPage.total}
            from={recentPage.from}
            to={recentPage.to}
            onPageChange={recentPage.setPage}
            pageSize={recentPage.pageSize}
            onPageSizeChange={recentPage.setPageSize}
          />
        )}
      </CardContent>
    </Card>
  );
}