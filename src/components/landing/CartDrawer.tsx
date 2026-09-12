import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CartItem = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  selectedOptionLabels?: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
};

export function CartDrawer({
  open,
  onClose,
  items,
  onUpdateQty,
  onRemove,
  onCheckout,
}: Props) {
  const total = items.reduce((s, i) => s + i.itemTotal, 0);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/35 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50">
              <ShoppingBag className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Your Order
              </h2>
              {items.length > 0 && (
                <p className="text-xs text-zinc-500">
                  {items.length} item{items.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
                <ShoppingBag className="h-7 w-7 text-zinc-300" />
              </div>
              <p className="text-sm font-medium text-zinc-500">Your cart is empty</p>
              <p className="max-w-[200px] text-xs text-zinc-400">
                Add something delicious from the menu to get started
              </p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 transition hover:border-amber-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug text-zinc-900">
                      {item.name}
                    </p>
                    {item.selectedOptionLabels && item.selectedOptionLabels.length > 0 && (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        {item.selectedOptionLabels.join(" · ")}
                      </p>
                    )}
                    <p className="mt-1.5 text-sm font-semibold text-amber-700">
                      ₱{item.itemTotal.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl border-zinc-200"
                    onClick={() => onUpdateQty(idx, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl border-zinc-200"
                    onClick={() => onUpdateQty(idx, item.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-zinc-100 bg-white px-5 py-5">
            <div className="mb-4 flex items-end justify-between">
              <span className="text-sm text-zinc-500">Total</span>
              <span className="font-heading text-2xl font-semibold tracking-tight text-zinc-900">
                ₱{total.toFixed(2)}
              </span>
            </div>
            <Button
              className="h-12 w-full rounded-2xl bg-amber-600 text-base font-semibold shadow-lg shadow-amber-200/40 hover:bg-amber-700"
              onClick={onCheckout}
            >
              Continue to Checkout
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}