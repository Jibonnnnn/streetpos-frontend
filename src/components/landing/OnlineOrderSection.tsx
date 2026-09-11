import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { AddonPicker } from "@/components/addons/AddonPicker";
import { menuService } from "@/services/menu.service";
import {
  ordersService,
  type PickupSlotsResponse,
} from "@/services/orders.service";
import { getFullImageUrl } from "@/lib/imageUtils";
import { toast } from "sonner";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  X,
  Search,
  Coffee,
  Clock,
  Loader2,
} from "lucide-react";
import type { MenuItem } from "@/types";
import type { ModifierGroup } from "@/types/addons";

interface OnlineCartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedModifierOptionIds: number[];
  unitPrice: number;
  selectedOptionLabels: string[];
}

type OnlineOrderSectionProps = {
  selectedCategory?: string | null;
  onCategoryApplied?: () => void;
};

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

function formatSlot(iso: string) {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function OnlineOrderSection({
  selectedCategory = null,
  onCategoryApplied,
}: OnlineOrderSectionProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<OnlineCartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [addonItem, setAddonItem] = useState<MenuItem | null>(null);

  // Pickup / ETA
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [pickupInfo, setPickupInfo] = useState<PickupSlotsResponse | null>(
    null,
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

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

    const handleMenuUpdate = () => loadMenu();
    window.addEventListener("menu-items-updated", handleMenuUpdate);
    return () => {
      window.removeEventListener("menu-items-updated", handleMenuUpdate);
    };
  }, []);

  useEffect(() => {
    if (selectedCategory === undefined || selectedCategory === null) return;
    if (selectedCategory === "" || selectedCategory === "All") {
      setActiveCategory("All");
    } else {
      setActiveCategory(selectedCategory);
    }
    setSearch("");
    onCategoryApplied?.();
  }, [selectedCategory, onCategoryApplied]);

  const cartTotals = useMemo(() => {
    const quantity = cart.reduce((s, c) => s + c.quantity, 0);
    const modifiers = cart.reduce(
      (s, c) => s + (c.selectedModifierOptionIds?.length ?? 0),
      0,
    );
    const total = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
    return { quantity, modifiers, total };
  }, [cart]);

  // Load ETA + slots when cart changes and cart panel is open
  useEffect(() => {
    if (!showCart || cart.length === 0) {
      setPickupInfo(null);
      setSelectedSlot(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setSlotsLoading(true);
        const res = await ordersService.getPickupSlots(
          Math.max(1, cartTotals.quantity),
          cartTotals.modifiers,
        );
        if (cancelled) return;
        setPickupInfo(res.data);
        // Keep selection if still valid; else pick first slot
        setSelectedSlot((prev) => {
          if (prev && res.data.slots.includes(prev)) return prev;
          return res.data.slots[0] ?? null;
        });
      } catch {
        if (!cancelled) {
          setPickupInfo(null);
          setSelectedSlot(null);
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [showCart, cartTotals.quantity, cartTotals.modifiers, cart.length]);

  const activeItems = useMemo(
    () => menuItems.filter((item) => item.isActive !== false),
    [menuItems],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of activeItems) {
      if (item.categoryName?.trim()) set.add(item.categoryName.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activeItems]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = activeItems;

    if (activeCategory !== "All") {
      list = list.filter(
        (item) =>
          item.categoryName?.trim().toLowerCase() ===
          activeCategory.toLowerCase(),
      );
    }

    if (term) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term),
      );
    }
    return list;
  }, [activeItems, activeCategory, search]);

  const cartTotal = cartTotals.total;

  const handleItemClick = (item: MenuItem) => {
    const groups = resolveModifierGroups(item);
    if (groups.length > 0) {
      setAddonItem(item);
      return;
    }
    addToCart(item, [], Number(item.price), []);
  };

  const addToCart = (
    item: MenuItem,
    selectedModifierOptionIds: number[],
    unitPrice: number,
    selectedOptionLabels: string[],
  ) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (c) =>
          c.menuItem.id === item.id &&
          JSON.stringify(c.selectedModifierOptionIds) ===
            JSON.stringify(selectedModifierOptionIds),
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
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
      const res = await ordersService.createOnlineOrder({
        customerName: customerName.trim(),
        customerNotes: customerNotes.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        preferredPickupAt: selectedSlot || undefined,
        notifySms: !!phoneNumber.trim(),
        notifyEmail: !!customerEmail.trim(),
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          selectedModifierOptionIds: c.selectedModifierOptionIds,
        })),
      });

      const order = res.data as any;
      const eta = order?.estimatedReadyAt
        ? formatSlot(order.estimatedReadyAt)
        : pickupInfo
          ? formatSlot(pickupInfo.estimatedReadyAt)
          : null;
      const slot = selectedSlot ? formatSlot(selectedSlot) : null;

      toast.success("Order placed successfully!", {
        description: [
          order?.orderNumber ? `Order ${order.orderNumber}` : null,
          eta ? `Ready ~${eta}` : null,
          slot ? `Pickup ${slot}` : null,
          phoneNumber.trim() || customerEmail.trim()
            ? "We'll notify you when it's ready."
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
      });

      setCart([]);
      setCustomerName("");
      setCustomerNotes("");
      setPhoneNumber("");
      setCustomerEmail("");
      setSelectedSlot(null);
      setPickupInfo(null);
      setShowCart(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const addonGroups = addonItem ? resolveModifierGroups(addonItem) : [];

  const renderMenuCard = (item: MenuItem) => {
    const hasAddons = resolveModifierGroups(item).length > 0;
    const imageSrc = getFullImageUrl(item.imageFileName ?? item.imageUrl);

    return (
      <Card
        key={item.id}
        className="overflow-hidden border-border/60 bg-white/90 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-900/70"
      >
        <div className="relative h-44 bg-zinc-100 dark:bg-zinc-800">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Coffee className="h-10 w-10 opacity-40" />
            </div>
          )}
        </div>
        <CardContent className="space-y-3 p-4">
          <div>
            <h3 className="font-semibold leading-tight">{item.name}</h3>
            {item.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-bold text-amber-600">
              ₱{Number(item.price).toFixed(2)}
            </span>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => handleItemClick(item)}
            >
              <Plus className="mr-1 h-4 w-4" />
              {hasAddons ? "Customize" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="relative">
      {/* Header + search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            Order Online
          </h2>
          <p className="mt-1 text-muted-foreground">
            Browse the menu, pick a pickup time, and we’ll text or email you
            when it’s ready — all in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-2xl pl-9"
            />
          </div>
          <Button
            variant="outline"
            className="relative rounded-2xl"
            onClick={() => setShowCart(true)}
          >
            <ShoppingBag className="h-4 w-4" />
            {cart.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {cart.reduce((s, c) => s + c.quantity, 0)}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeCategory === "All" ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setActiveCategory("All")}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={activeCategory === cat ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Menu grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 py-16 text-center text-muted-foreground">
          No items found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(renderMenuCard)}
        </div>
      )}

      {/* Cart drawer / panel */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <h3 className="text-lg font-semibold">Your order</h3>
              <button
                type="button"
                onClick={() => setShowCart(false)}
                className="rounded-xl p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  Cart is empty. Add items from the menu.
                </p>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight">
                        {item.menuItem.name}
                      </p>
                      {item.selectedOptionLabels?.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.selectedOptionLabels.join(", ")}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-semibold text-amber-600">
                        ₱{(item.unitPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => updateQty(idx, item.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-7 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => updateQty(idx, item.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(idx)}
                        className="ml-1 rounded-xl p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
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
                {/* ETA + slots */}
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Pickup time
                  </div>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Estimating ready time…
                    </div>
                  ) : pickupInfo ? (
                    <>
                      <p className="mb-2 text-sm text-muted-foreground">
                        Estimated ready ~{" "}
                        <span className="font-semibold text-foreground">
                          {formatSlot(pickupInfo.estimatedReadyAt)}
                        </span>{" "}
                        ({pickupInfo.estimatedMinutes} min)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {pickupInfo.slots.map((slot) => {
                          const active = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                active
                                  ? "border-amber-500 bg-amber-500 text-white"
                                  : "border-border/70 bg-background hover:border-amber-400"
                              }`}
                            >
                              {formatSlot(slot)}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Couldn’t load pickup times. You can still place the order.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Name <span className="text-red-500">*</span>
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
                    Phone (for SMS updates)
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
                    Email (for email updates)
                  </label>
                  <Input
                    type="email"
                    placeholder="you@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
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

                {(phoneNumber.trim() || customerEmail.trim()) && (
                  <p className="text-xs text-muted-foreground">
                    We’ll notify you by{" "}
                    {[phoneNumber.trim() && "SMS", customerEmail.trim() && "email"]
                      .filter(Boolean)
                      .join(" and ")}{" "}
                    when your order is ready.
                  </p>
                )}

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

      {/* Add-ons modal */}
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