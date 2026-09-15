import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgePill } from "@/components/common/BadgePill";
import { Pagination } from "@/components/common/Pagination";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import { ordersService } from "@/services/orders.service";
import { toast } from "sonner";
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
  onlinePage: PageState;
  isOnline: boolean;
  onRefresh: () => void;
  onCheckout: (order: OrderResponse) => void;
};

export function OnlineOrdersPanel({
  orders,
  loading,
  onlinePage,
  isOnline,
  onRefresh,
  onCheckout,
}: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const updateStatus = async (id: number, status: string, label: string) => {
    if (!isOnline) {
      toast.error("This action needs an internet connection.");
      return;
    }
    try {
      await ordersService.updateStatus(id, status);
      toast.success(`${label} – customer notified via SMS`);
      onRefresh();
    } catch {
      toast.error(`Failed to mark as ${status}`);
    }
  };

  return (
    <Card className="border-border/40 bg-white/90 shadow-sm">
      <CardContent className="p-5 md:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Online Orders
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Prepare, mark ready, and checkout pickup orders.
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
            Online order actions require an internet connection.
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
            No online orders yet.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {onlinePage.paginated.map((order) => {
                const isExpanded = expandedId === order.id;
                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-border/60 bg-zinc-50 p-4 dark:bg-zinc-950/50"
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-4 text-left"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : order.id)
                      }
                    >
                      <div>
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
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ₱{(order.total || 0).toFixed(2)}
                        </div>
                        <BadgePill
                          tone={
                            order.status === "Completed"
                              ? "success"
                              : order.status === "Ready"
                                ? "info"
                                : "warning"
                          }
                        >
                          {order.status}
                        </BadgePill>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 border-t border-border/40 pt-4">
                        <ul className="space-y-1 text-sm">
                          {(order.items || []).map((it) => (
                            <li key={it.id}>
                              {it.quantity}× {it.menuItemName} — ₱
                              {it.subtotal.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                        {order.customerNotes && (
                          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                            <span className="font-medium">Customer note:</span>{" "}
                            {order.customerNotes}
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          {order.status === "Pending" && (
                            <Button
                              variant="outline"
                              className="rounded-2xl"
                              disabled={!isOnline}
                              onClick={() =>
                                updateStatus(
                                  order.id,
                                  "Preparing",
                                  "Order marked as Preparing",
                                )
                              }
                            >
                              Prepare Order
                            </Button>
                          )}
                          {order.status === "Preparing" && (
                            <Button
                              variant="outline"
                              className="rounded-2xl"
                              disabled={!isOnline}
                              onClick={() =>
                                updateStatus(
                                  order.id,
                                  "Ready",
                                  "Order marked as Ready",
                                )
                              }
                            >
                              Ready for Pickup
                            </Button>
                          )}
                          {(order.status === "Pending" ||
                            order.status === "Preparing" ||
                            order.status === "Ready") && (
                            <Button
                              className="rounded-2xl"
                              disabled={!isOnline}
                              onClick={() => onCheckout(order)}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Checkout
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {!isExpanded && order.status === "Pending" && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          className="rounded-2xl"
                          disabled={!isOnline}
                          onClick={() => onCheckout(order)}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Checkout
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Pagination
              page={onlinePage.page}
              totalPages={onlinePage.totalPages}
              total={onlinePage.total}
              from={onlinePage.from}
              to={onlinePage.to}
              onPageChange={onlinePage.setPage}
              pageSize={onlinePage.pageSize}
              onPageSizeChange={onlinePage.setPageSize}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}