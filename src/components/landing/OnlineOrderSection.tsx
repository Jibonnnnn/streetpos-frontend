import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { AddonPicker } from "@/components/addons/AddonPicker";
import { menuService } from "@/services/menu.service";
import { ordersService } from "@/services/orders.service";
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
  /** Category to pre-select when parent sets it (e.g. landing category chip). */
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
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
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

    const handleMenuUpdate = () => loadMenu();
    window.addEventListener("menu-items-updated", handleMenuUpdate);
    return () => {
      window.removeEventListener("menu-items-updated", handleMenuUpdate);
    };
  }, []);

  // Parent (LandingPage) can push a category into this section
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
      list = list.filter((item) => item.categoryName === activeCategory);
    }
    if (term) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.categoryName?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term),
      );
    }

    return [...list].sort(
      (a, b) =>
        a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
    );
  }, [activeItems, activeCategory, search]);

  // Grouped view when "All" is selected
  const grouped = useMemo(() => {
    if (activeCategory !== "All") return null;
    const map = new Map<string, MenuItem[]>();
    for (const item of filtered) {
      const key = item.categoryName || "Other";
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, activeCategory]);

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
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              <Coffee className="h-10 w-10 opacity-40" />
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
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-semibold tracking-tight">
                {item.name}
              </h3>
              {item.categoryName && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.categoryName}
                </p>
              )}
              {item.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
            <p className="shrink-0 text-lg font-bold text-amber-700 dark:text-amber-400">
              ₱{Number(item.price).toFixed(2)}
            </p>
          </div>
          <Button
            className="mt-4 w-full rounded-2xl"
            onClick={() => handleAddClick(item)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {hasAddons ? "Choose add-ons" : "Add to cart"}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <section
      id="order"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      {/* Header + cart */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
            Order online
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Browse by category & order
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Pick a category, choose your item, customize add-ons, and checkout —
            all in one place.
          </p>
        </div>
        <Button
          variant="outline"
          className="relative shrink-0 rounded-2xl"
          onClick={() => setShowCart(true)}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Cart
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu..."
          className="rounded-2xl pl-11"
        />
      </div>

      {/* Category chips */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("All")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeCategory === "All"
              ? "bg-amber-500 text-white shadow-sm"
              : "border border-zinc-200 bg-white/80 text-zinc-800 hover:border-amber-300 hover:bg-amber-50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100"
          }`}
        >
          All
          <span className="ml-1.5 opacity-80">{activeItems.length}</span>
        </button>
        {categories.map((cat) => {
          const count = activeItems.filter((i) => i.categoryName === cat).length;
          const selected = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selected
                  ? "bg-amber-500 text-white shadow-sm"
                  : "border border-zinc-200 bg-white/80 text-zinc-800 hover:border-amber-300 hover:bg-amber-50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100"
              }`}
            >
              {cat}
              <span className="ml-1.5 opacity-80">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Menu grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
          No menu items
          {activeCategory !== "All" ? ` in “${activeCategory}”` : ""} match your
          search.
        </div>
      ) : activeCategory === "All" && grouped ? (
        <div className="space-y-10">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className="font-heading text-xl font-semibold tracking-tight hover:text-amber-700 dark:hover:text-amber-400"
                >
                  {category}
                </button>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(renderMenuCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(renderMenuCard)}
        </div>
      )}

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-border/60 p-5">
              <div>
                <h3 className="font-heading text-xl font-semibold">Your cart</h3>
                <p className="text-sm text-muted-foreground">
                  {cartCount} item{cartCount !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setShowCart(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <ShoppingBag className="mx-auto mb-3 h-10 w-10 opacity-40" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {cart.map((c, index) => (
                    <li
                      key={`${c.menuItem.id}-${index}`}
                      className="rounded-2xl border border-border/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{c.menuItem.name}</p>
                          {c.selectedOptionLabels.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {c.selectedOptionLabels.join(", ")}
                            </p>
                          )}
                          <p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
                            ₱{(c.unitPrice * c.quantity).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-red-500"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-xl"
                          onClick={() => updateQty(index, c.quantity - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
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
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3 border-t border-border/60 p-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Your name <span className="text-red-500">*</span>
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
