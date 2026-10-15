import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ordersService } from "@/services/orders.service";
import type { OrderTrackingResponse } from "@/types";
import {
  Search,
  Loader2,
  Package,
  CheckCircle2,
  ChefHat,
  Bell,
  XCircle,
  ArrowLeft,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "Pending", label: "Order Received", icon: Package },
  { key: "Preparing", label: "Preparing", icon: ChefHat },
  { key: "Ready", label: "Ready for Pickup", icon: Bell },
  { key: "Completed", label: "Completed", icon: CheckCircle2 },
] as const;

function formatTime(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function stepIndex(status: string) {
  const i = STEPS.findIndex((s) => s.key === status);
  return i >= 0 ? i : -1;
}

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OrderTrackingResponse | null>(null);
  const [error, setError] = useState("");

  const track = async (num?: string) => {
    const value = (num ?? orderNumber).trim();
    if (!value) {
      setError("Please enter your order number.");
      return;
    }
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await ordersService.trackOrder(value);
      setData(res.data);
      setOrderNumber(res.data.orderNumber);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Order not found. Check the number and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get("order");
    if (q?.trim()) {
      setOrderNumber(q.trim());
      void track(q.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = data ? stepIndex(data.status) : -1;
  const isCancelled = data?.status === "Cancelled";

  return (
    <div className="min-h-screen bg-[#faf8f5] text-zinc-900">
      <header className="border-b border-amber-100/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-amber-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to café
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
              <Coffee className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-sm font-semibold">
              Streetside Café
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Track your order
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Enter the order number from your confirmation message.
          </p>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void track();
          }}
        >
          <Input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. ORD-20261016-001"
            className="h-12 flex-1 rounded-2xl border-zinc-200 bg-white"
            autoCapitalize="characters"
          />
          <Button
            type="submit"
            disabled={loading}
            className="h-12 rounded-2xl bg-amber-600 px-5 hover:bg-amber-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Track
              </>
            )}
          </Button>
        </form>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {data && (
          <div className="mt-8 space-y-6">
            {/* Status */}
            <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {data.orderNumber}
              </p>
              {isCancelled ? (
                <div className="mt-4 flex items-center gap-3 text-red-600">
                  <XCircle className="h-8 w-8" />
                  <div>
                    <p className="font-heading text-xl font-semibold">
                      Cancelled
                    </p>
                    <p className="text-sm text-zinc-500">
                      This order was cancelled.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-1 font-heading text-2xl font-semibold text-amber-700">
                    {data.statusLabel}
                  </p>
                  {data.customerName && (
                    <p className="mt-1 text-sm text-zinc-500">
                      For {data.customerName}
                    </p>
                  )}

                  <ol className="mt-6 space-y-0">
                    {STEPS.map((step, i) => {
                      const Icon = step.icon;
                      const done = current >= i;
                      const active = current === i;
                      return (
                        <li key={step.key} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full border-2",
                                done
                                  ? "border-amber-500 bg-amber-50 text-amber-700"
                                  : "border-zinc-200 bg-zinc-50 text-zinc-300",
                                active && "ring-4 ring-amber-100",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            {i < STEPS.length - 1 && (
                              <div
                                className={cn(
                                  "my-1 w-0.5 flex-1 min-h-[1.25rem]",
                                  current > i ? "bg-amber-400" : "bg-zinc-200",
                                )}
                              />
                            )}
                          </div>
                          <div className={cn("pb-4 pt-1.5", active && "font-semibold")}>
                            <p
                              className={cn(
                                "text-sm",
                                done ? "text-zinc-900" : "text-zinc-400",
                              )}
                            >
                              {step.label}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}

              <div className="mt-4 space-y-1 border-t border-zinc-100 pt-4 text-sm text-zinc-500">
                {formatTime(data.preferredPickupAt) && (
                  <p>Preferred pickup: {formatTime(data.preferredPickupAt)}</p>
                )}
                {formatTime(data.estimatedReadyAt) && (
                  <p>Estimated ready: {formatTime(data.estimatedReadyAt)}</p>
                )}
                {formatTime(data.completedAt) && (
                  <p>Completed: {formatTime(data.completedAt)}</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
              <h2 className="font-heading text-lg font-semibold">Items</h2>
              <ul className="mt-4 space-y-3">
                {data.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {item.quantity}× {item.name}
                      </p>
                      {item.modifiers?.length > 0 && (
                        <p className="text-xs text-zinc-500">
                          {item.modifiers.join(" · ")}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 font-medium tabular-nums">
                      ₱{Number(item.subtotal).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                <span className="text-sm text-zinc-500">Total</span>
                <span className="font-heading text-xl font-semibold">
                  ₱{Number(data.total).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-2xl"
              onClick={() => void track(data.orderNumber)}
              disabled={loading}
            >
              Refresh status
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}