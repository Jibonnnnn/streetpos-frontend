import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { AddonPicker } from "@/components/addons/AddonPicker";
import { menuService } from "@/services/menu.service";
import { ordersService } from "@/services/orders.service";
import { getFullImageUrl } from "@/lib/imageUtils";
import { toast } from "sonner";
import { Plus, Minus, Trash2, ShoppingBag, X } from "lucide-react";
import type { MenuItem } from "@/types";
import type { ModifierGroup } from "@/types/addons";

interface OnlineCartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedModifierOptionIds: number[];
  unitPrice: number;
  selectedOptionLabels: string[];
}

function resolveModifierGroups(item: MenuItem): ModifierGroup[] {
  const raw = (item as any).modifierGroups ?? [];
  return raw.map((mg: any) => ({
    id: mg.id ?? mg.modifierGroupId ?? 0,
    name: mg.name ?? "Add-ons",
    isRequired: !!mg.isRequired,
    displayOrder: mg.displayOrder ?? 0,
    options: (mg.options ?? []).map((o: any) => ({
      id: o.id,
      name: o.name,
      priceAdjustment: Number(o.priceAdjustment ?? 0),
    })),
  }));
}

function optionLabelsFromIds(
  groups: ModifierGroup[],
  ids: number[],
): string[] {
  const labels: string[] = [];
  for (const g of groups) {
    for (const o of g.options) {
      if (ids.includes(o.id)) {
        labels.push(
          o.priceAdjustment > 0
            ? `${o.name} (+₱${o.priceAdjustment.toFixed(0)})`
            : o.name,
        );
      }
    }
  }
  return labels;
}

export function OnlineOrderSection() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<OnlineCartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [addonItem, setAddonItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const loadMenu = () => {
      setLoading(true);
      menuService
        .getMenu(false)
        .then((res) => setMenuItems(res.data || []))
        .catch(() => toast.error("Failed to load menu"))
        .finally(() => setLoading(false));
    };

    loadMenu();

    const handleMenuUpdate = () => {
      loadMenu();
    };

    window.addEventListener("menu-items-updated", handleMenuUpdate);
    return () => {
      window.removeEventListener("menu-items-updated", handleMenuUpdate);
    };
  }, []);

  const filtered = menuItems.filter(
    (item) =>
      item.isActive &&
      (item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.categoryName?.toLowerCase().includes(search.toLowerCase())),
  );

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);

  const handleAddClick = (item: MenuItem) => {
    const groups = resolveModifierGroups(item);
    if (groups.length > 0) {
      setAddonItem(item);
    } else {
      addToCart(item, [], Number(item.price), []);
    }
  };

  const addToCart = (
    item: MenuItem,
    selectedModifierOptionIds: number[],
    unitPrice: number,
    selectedOptionLabels: string[],
  ) => {
    setCart((prev) => {
      const key = (ids: number[]) => [...ids].sort((a, b) => a - b).join(",");
      const existing = prev.find(
        (c) =>
          c.menuItem.id === item.id &&
          key(c.selectedModifierOptionIds) === key(selectedModifierOptionIds),
      );
      if (existing) {
        return prev.map((c) =>
          c === existing ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          menuItem: item,
          quantity: 1,
          selectedModifierOptionIds,
          unitPrice,
          selectedOptionLabels,
        },
      ];
    });
    toast.success(`${item.name} added to cart`);
    setAddonItem(null);
  };

  const updateQty = (index: number, qty: number) => {
    if (qty < 1) {
      setCart((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setCart((prev) =>
      prev.map((c, i) => (i === index ? { ...c, quantity: qty } : c)),
    );
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const placeOrder = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      setSubmitting(true);
      await ordersService.createOnlineOrder({
        customerName: customerName.trim(),
        customerNotes: customerNotes.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          selectedModifierOptionIds: c.selectedModifierOptionIds,
        })),
      });

      toast.success("Order placed successfully!", {
        description: "We'll prepare it shortly. See you at the café!",
      });

      setCart([]);
      setCustomerName("");
      setCustomerNotes("");
      setPhoneNumber("");
      setShowCart(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to place order. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const addonGroups = addonItem ? resolveModifierGroups(addonItem) : [];

  return (
    <section id="order" className="relative py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Order Online
            </h2>
            <p className="mt-2 text-muted-foreground">
              Add items to your cart and place an order. We'll prepare it for
              you.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Input
              placeholder="Search menu..."
              className="max-w-xs rounded-2xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              className="relative rounded-2xl gap-2"
              onClick={() => setShowCart(true)}
            >
              <ShoppingBag className="h-4 w-4" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-3xl bg-zinc-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const hasAddons = resolveModifierGroups(item).length > 0;
              return (
                <Card
                  key={item.id}
                  className="overflow-hidden border-border/60 bg-white/90 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-44 bg-zinc-100">
                    {getFullImageUrl(item.imageFileName ?? item.imageUrl) ? (
                      <img
                        src={
                          getFullImageUrl(item.imageFileName ?? item.imageUrl)!
                        }
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl opacity-30">
                        ☕
                      </div>
                    )}
                    {hasAddons && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-amber-700 shadow-sm">
                        Add-ons available
                      </span>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-lg font-semibold">
                          {item.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.categoryName}
                        </p>
                      </div>
                      <p className="font-semibold text-amber-600">
                        ₱{Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      className="mt-4 w-full rounded-2xl"
                      onClick={() => handleAddClick(item)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {hasAddons ? "Choose & Add" : "Add to Cart"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="rounded-3xl border border-dashed border-border/70 py-16 text-center text-muted-foreground">
            No menu items available right now.
          </div>
        )}
      </div>

      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCart(false)}
          />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-border/60 p-5">
              <div>
                <h3 className="font-heading text-xl font-semibold">Your Cart</h3>
                <p className="text-sm text-muted-foreground">
                  {cartCount} item{cartCount !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <ShoppingBag className="mx-auto mb-3 h-10 w-10 opacity-30" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map((c, index) => (
                  <div
                    key={`${c.menuItem.id}-${c.selectedModifierOptionIds.join(",")}-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-zinc-50 p-3 dark:bg-zinc-900/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{c.menuItem.name}</p>
                      {c.selectedOptionLabels.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {c.selectedOptionLabels.join(", ")}
                        </p>
                      )}
                      <p className="text-sm text-amber-600">
                        ₱{(c.unitPrice * c.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => updateQty(index, c.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">
                        {c.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => updateQty(index, c.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="ml-1 rounded-xl p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3 border-t border-border/60 p-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Juan Dela Cruz"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Phone (optional)
                  </label>
                  <Input
                    placeholder="09XX XXX XXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Notes (optional)
                  </label>
                  <Input
                    placeholder="No onions, extra sauce..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-xl font-bold">
                  <span>Total</span>
                  <span>₱{cartTotal.toFixed(2)}</span>
                </div>

                <Button
                  className="h-12 w-full rounded-2xl text-base font-semibold"
                  onClick={placeOrder}
                  disabled={submitting || !customerName.trim()}
                >
                  {submitting ? "Placing order..." : "Place Order"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {addonItem && (
        <ModalShell
          open={!!addonItem}
          title={addonItem.name}
          description={`Base ₱${Number(addonItem.price).toFixed(2)} — choose add-ons`}
          onClose={() => setAddonItem(null)}
          className="max-w-md"
        >
          <AddonPicker
            groups={addonGroups}
            basePrice={Number(addonItem.price)}
            onConfirm={(ids, unitPrice) => {
              const labels = optionLabelsFromIds(addonGroups, ids);
              addToCart(addonItem, ids, unitPrice, labels);
            }}
            onCancel={() => setAddonItem(null)}
            confirmLabel="Add to Cart"
          />
        </ModalShell>
      )}
    </section>
  );
}