import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgePill } from "@/components/common/BadgePill";
import { CreditCard, Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem, PaymentMethod, Promotion } from "@/types";

type Props = {
  cart: CartItem[];
  total: number;
  finalTotal: number;
  previewDiscount: number;
  activePromos: Promotion[];
  selectedPromotionId: number | null;
  selectedPaymentMethod: PaymentMethod;
  onSelectPromotion: (id: number | null) => void;
  onUpdateQuantity: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
};

export function PosCartPanel({
  cart,
  total,
  finalTotal,
  previewDiscount,
  activePromos,
  selectedPromotionId,
  selectedPaymentMethod,
  onSelectPromotion,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: Props) {
  return (
    <Card className="border-border/60 bg-white/80 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Current Order
            </h2>
            <p className="text-sm text-muted-foreground">
              Review items before checking out.
            </p>
          </div>
          <BadgePill tone="neutral">{cart.length} items</BadgePill>
        </div>

        <div className="min-h-[200px] max-h-[300px] space-y-3 overflow-auto pr-1">
          {cart.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
              Your cart is empty.
              <br />
              Tap items to add.
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight">{item.name}</p>
                  {item.selectedOptionLabels?.length ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.selectedOptionLabels.join(", ")}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-semibold text-amber-600">
                    ₱{item.itemTotal.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl"
                    onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl"
                    onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <button
                    onClick={() => onRemove(idx)}
                    className="ml-1 rounded-xl p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {activePromos.length > 0 &&
          cart.length > 0 &&
          selectedPaymentMethod !== "PayLater" && (
            <div className="mt-5 rounded-2xl border border-border/60 bg-zinc-50 p-4 dark:bg-zinc-900/50">
              <p className="mb-3 text-sm font-medium">Apply Promotion</p>
              <div className="space-y-1">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 hover:bg-white dark:hover:bg-zinc-800">
                  <input
                    type="radio"
                    name="promo"
                    checked={selectedPromotionId === null}
                    onChange={() => onSelectPromotion(null)}
                  />
                  <span className="text-sm">None</span>
                </label>
                {activePromos.map((promo) => {
                  const label =
                    promo.type === "FixedAmount"
                      ? `₱${promo.value} off`
                      : promo.type === "BuyOneGetOne"
                        ? "Buy 1 Get 1"
                        : `${promo.value}% off`;
                  return (
                    <label
                      key={promo.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 hover:bg-white dark:hover:bg-zinc-800"
                    >
                      <input
                        type="radio"
                        name="promo"
                        checked={selectedPromotionId === promo.id}
                        onChange={() => onSelectPromotion(promo.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{promo.name}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {previewDiscount > 0 && (
                <p className="mt-3 text-sm font-semibold text-emerald-600">
                  Discount: −₱{previewDiscount.toFixed(2)}
                </p>
              )}
            </div>
          )}

        <div className="mt-6 border-t border-border/60 pt-5">
          {previewDiscount > 0 && (
            <div className="mb-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>−₱{previewDiscount.toFixed(2)}</span>
              </div>
            </div>
          )}
          <div className="mb-6 flex items-center justify-between text-3xl font-bold">
            <span>Total</span>
            <span>₱{finalTotal.toFixed(2)}</span>
          </div>
          <Button
            onClick={onCheckout}
            className="h-14 w-full text-lg font-semibold"
            disabled={cart.length === 0}
          >
            <CreditCard className="mr-3 h-5 w-5" />
            Proceed to Checkout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}