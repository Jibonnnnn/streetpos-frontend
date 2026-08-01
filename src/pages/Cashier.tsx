import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgePill } from "@/components/common/BadgePill";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { CashierSkeleton } from "@/components/skeletons/CashierSkeleton";
import { useCart } from "@/contexts/CartContext";
import { useMenuItems } from "@/hooks/queries/useMenu";
import { useMyOrders } from "@/hooks/queries/useOrders";
import { ordersService } from "@/services/orders.service";
import { promotionService } from "@/services/promotion.service";
import { getFullImageUrl } from "@/lib/imageUtils";
import { toast } from "sonner";
import {
  CreditCard,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Globe,
} from "lucide-react";
import type { MenuItem, Promotion, CartItem } from "@/types";

type PaymentMethod = "Cash" | "GCash" | "Maya" | "Card";

export default function CashierPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, total } =
    useCart();

  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();
  const {
    data: myOrders = [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useMyOrders();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("Cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Promotions
  const [activePromos, setActivePromos] = useState<Promotion[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(
    null,
  );
  const [previewDiscount, setPreviewDiscount] = useState(0);

  // Online orders tab
  const [posTab, setPosTab] = useState<"pos" | "online">("pos");
  const [expandedOnlineOrderId, setExpandedOnlineOrderId] = useState<
    number | null
  >(null);
  const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [checkoutOnlineOrderId, setCheckoutOnlineOrderId] = useState<
    number | null
  >(null);

  useEffect(() => {
    promotionService
      .getActive()
      .then((res) => setActivePromos(res.data || []))
      .catch(() => setActivePromos([]));
  }, []);

  const fetchOnlineOrders = async () => {
    try {
      setOnlineLoading(true);
      const res = await ordersService.getOnlineOrders();
      setOnlineOrders(res.data || []);
    } catch {
      toast.error("Failed to load online orders");
    } finally {
      setOnlineLoading(false);
    }
  };

  useEffect(() => {
    if (posTab === "online") {
      fetchOnlineOrders();
    }
  }, [posTab]);

  const filteredMenu = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return (menuItems as MenuItem[]).filter((item) => {
      if (!item.isActive) return false;
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.categoryName?.toLowerCase().includes(term)
      );
    });
  }, [menuItems, searchTerm]);

  const currentModifiers = selectedItem?.modifierGroups || [];

  const calculatePrice = (basePrice: number) => {
    const modifierTotal = currentModifiers
      .flatMap((g) => g.options)
      .filter((o) => selectedOptionIds.includes(o.id))
      .reduce((sum, o) => sum + o.priceAdjustment, 0);
    return basePrice + modifierTotal;
  };

  const calculatePreviewDiscount = (promo: Promotion | null) => {
    if (!promo || cart.length === 0) return 0;

    const eligible = cart.filter(
      (item) =>
        promo.menuItemIds.length === 0 || promo.menuItemIds.includes(item.id),
    );
    if (eligible.length === 0) return 0;
    if (promo.minOrderAmount && total < promo.minOrderAmount) return 0;

    const eligibleTotal = eligible.reduce((sum, i) => sum + i.itemTotal, 0);

    switch (promo.type) {
      case "Percentage":
      case "HappyHour":
        return Math.round(eligibleTotal * (promo.value / 100) * 100) / 100;
      case "FixedAmount":
        return Math.min(promo.value, eligibleTotal);
      case "BuyOneGetOne": {
        const prices = eligible
          .flatMap((i) => Array(i.quantity).fill(i.itemTotal / i.quantity))
          .sort((a: number, b: number) => a - b);
        const freeCount = Math.floor(prices.length / 2);
        return prices
          .slice(0, freeCount)
          .reduce((s: number, p: number) => s + p, 0);
      }
      default:
        return 0;
    }
  };

  useEffect(() => {
    if (checkoutOnlineOrderId) {
      setPreviewDiscount(0);
      return;
    }
    const promo =
      activePromos.find((p) => p.id === selectedPromotionId) || null;
    setPreviewDiscount(calculatePreviewDiscount(promo));
  }, [selectedPromotionId, cart, activePromos, total, checkoutOnlineOrderId]);

  const onlineOrderBeingCheckedOut = onlineOrders.find(
    (o) => o.id === checkoutOnlineOrderId,
  );
  const onlineOrderTotal = onlineOrderBeingCheckedOut?.total ?? 0;

  const finalTotal = checkoutOnlineOrderId
    ? onlineOrderTotal
    : Math.max(0, total - previewDiscount);

  const changeDue =
    selectedPaymentMethod === "Cash" && amountTendered
      ? Math.max(0, parseFloat(amountTendered) - finalTotal)
      : 0;

  const pendingOnlineCount = onlineOrders.filter(
    (o) => o.status === "Pending",
  ).length;

  const openModifiersModal = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedOptionIds([]);
    setCustomNote("");
    setShowModifiersModal(true);
  };

  const toggleOption = (optionId: number) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;

    const unitPrice = calculatePrice(selectedItem.price);
    const cartItem: CartItem = {
      ...selectedItem,
      quantity: 1,
      selectedModifierOptionIds: selectedOptionIds,
      note: customNote || undefined,
      itemTotal: unitPrice,
    };

    addToCart(cartItem);
    setShowModifiersModal(false);
    toast.success(`${selectedItem.name} added to order`);
  };

  const openOnlineCheckout = (order: any) => {
    setCheckoutOnlineOrderId(order.id);
    setSelectedPaymentMethod("Cash");
    setAmountTendered("");
    setSelectedPromotionId(null);
    setPreviewDiscount(0);
    setShowCheckoutModal(true);
  };

  const closeCheckoutModal = () => {
    setShowCheckoutModal(false);
    setCheckoutOnlineOrderId(null);
  };

  const handleCheckout = async () => {
    if (selectedPaymentMethod === "Cash" && !amountTendered) {
      toast.error("Please enter amount tendered");
      return;
    }

    if (
      selectedPaymentMethod === "Cash" &&
      parseFloat(amountTendered) < finalTotal
    ) {
      toast.error("Amount tendered is insufficient");
      return;
    }

    try {
      setIsCheckingOut(true);

      // ===== Online order: checkout only =====
      if (checkoutOnlineOrderId) {
        await ordersService.checkoutOrder({
          orderId: checkoutOnlineOrderId,
          paymentMethod: selectedPaymentMethod,
          amountTendered:
            selectedPaymentMethod === "Cash"
              ? parseFloat(amountTendered)
              : undefined,
          transactionId:
            selectedPaymentMethod !== "Cash" ? `TX-${Date.now()}` : undefined,
          notes: "",
          promotionId: undefined,
        });

        toast.success("✅ Online order completed!");
        closeCheckoutModal();
        setAmountTendered("");
        setSelectedPaymentMethod("Cash");
        fetchOnlineOrders();
        refetchOrders();
        return;
      }

      // ===== POS cart: create + checkout =====
      if (cart.length === 0) {
        toast.error("Cart is empty");
        return;
      }

      const orderPayload = {
        tableNumber: "T1",
        customerNotes: "",
        items: cart.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
          selectedModifierOptionIds: item.selectedModifierOptionIds || [],
          itemNotes: item.note || "",
        })),
      };

      const createRes = await ordersService.createOrder(orderPayload);
      const orderId = createRes.data?.id;
      if (!orderId) throw new Error("Failed to create order");

      await ordersService.checkoutOrder({
        orderId,
        paymentMethod: selectedPaymentMethod,
        amountTendered:
          selectedPaymentMethod === "Cash"
            ? parseFloat(amountTendered)
            : undefined,
        transactionId:
          selectedPaymentMethod !== "Cash" ? `TX-${Date.now()}` : undefined,
        notes: "",
        promotionId: selectedPromotionId ?? undefined,
      });

      toast.success("✅ Order completed successfully!", {
        description:
          previewDiscount > 0
            ? `Discount applied: −₱${previewDiscount.toFixed(2)}`
            : "Inventory has been automatically deducted.",
      });

      clearCart();
      closeCheckoutModal();
      setAmountTendered("");
      setSelectedPaymentMethod("Cash");
      setSelectedPromotionId(null);
      setPreviewDiscount(0);
      refetchOrders();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Checkout failed. Please try again.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (menuLoading) return <CashierSkeleton />;

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            POS Terminal
          </h1>
          <p className="text-muted-foreground">
            Walk-in orders • Online orders • Discounts • Payment
          </p>
        </div>
        {posTab === "pos" && (
          <Input
            placeholder="Search menu items or category..."
            className="max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={posTab === "pos" ? "default" : "outline"}
          className="rounded-2xl"
          onClick={() => setPosTab("pos")}
        >
          POS Terminal
        </Button>
        <Button
          variant={posTab === "online" ? "default" : "outline"}
          className="rounded-2xl gap-2"
          onClick={() => setPosTab("online")}
        >
          <Globe className="h-4 w-4" />
          Orders From Online
          {pendingOnlineCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
              {pendingOnlineCount}
            </span>
          )}
        </Button>
      </div>

      {/* ========== ONLINE TAB ========== */}
      {posTab === "online" ? (
        <Card className="border-border/60 bg-white/80 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  Orders From Online
                </h2>
                <p className="text-sm text-muted-foreground">
                  Customer orders placed from the landing page.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchOnlineOrders}
                disabled={onlineLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${onlineLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            {onlineLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : onlineOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
                No online orders yet.
              </div>
            ) : (
              <div className="space-y-4">
                {onlineOrders.map((order) => {
                  const items = order.items || order.orderItems || [];
                  const isExpanded = expandedOnlineOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-border/60 bg-zinc-50 p-5 transition-colors dark:bg-zinc-950/50"
                    >
                      {/* Clickable header */}
                      <button
                        type="button"
                        className="flex w-full flex-col gap-4 text-left sm:flex-row sm:items-start sm:justify-between"
                        onClick={() =>
                          setExpandedOnlineOrderId(isExpanded ? null : order.id)
                        }
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono font-semibold">
                              {order.orderNumber || `#${order.id}`}
                            </p>
                            <BadgePill
                              tone={
                                order.status === "Completed"
                                  ? "success"
                                  : order.status === "Pending"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {order.status}
                            </BadgePill>
                            <span className="text-xs text-muted-foreground">
                              {isExpanded ? "Hide details ▲" : "View details ▼"}
                            </span>
                          </div>

                          <p className="mt-2 text-sm font-medium">
                            Customer:{" "}
                            <span className="text-amber-700 dark:text-amber-400">
                              {order.customerName || "—"}
                            </span>
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
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
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-3 sm:shrink-0">
                          <p className="text-xl font-bold">
                            ₱{(order.total || 0).toFixed(2)}
                          </p>
                        </div>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-4 border-t border-border/50 pt-4">
                          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Order items
                          </p>

                          {items.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No item details available.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {items.map((item: any, idx: number) => (
                                <li
                                  key={idx}
                                  className="flex items-start justify-between gap-3 rounded-xl bg-white/80 px-3 py-2.5 dark:bg-zinc-900/60"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                      {item.quantity}×{" "}
                                      {item.menuItemName ||
                                        item.menuItem?.name ||
                                        "Item"}
                                    </p>
                                    {item.itemNotes && (
                                      <p className="mt-0.5 text-xs text-muted-foreground">
                                        Note: {item.itemNotes}
                                      </p>
                                    )}
                                    {(item.selectedModifiers || []).length >
                                      0 && (
                                      <p className="mt-0.5 text-xs text-muted-foreground">
                                        {(item.selectedModifiers || [])
                                          .map(
                                            (m: any) =>
                                              m.name || m.modifierOptionName,
                                          )
                                          .join(", ")}
                                      </p>
                                    )}
                                  </div>
                                  <p className="shrink-0 text-sm font-semibold text-amber-600">
                                    ₱
                                    {(
                                      item.subtotal ??
                                      (item.unitPrice || 0) *
                                        (item.quantity || 1)
                                    ).toFixed(2)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          )}

                          {order.customerNotes && (
                            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                              <span className="font-medium">
                                Customer note:
                              </span>{" "}
                              {order.customerNotes}
                            </p>
                          )}

                          {order.status === "Pending" && (
                            <div className="mt-4 flex justify-end">
                              <Button
                                className="rounded-2xl"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOnlineCheckout(order);
                                }}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Checkout
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Checkout button when collapsed */}
                      {!isExpanded && order.status === "Pending" && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            className="rounded-2xl"
                            onClick={() => openOnlineCheckout(order)}
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
            )}
          </CardContent>
        </Card>
      ) : (
        /* ========== POS TAB ========== */
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-border/40 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:from-zinc-950 dark:to-zinc-900/50">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Menu Items
                </p>
                <p className="mt-2 font-heading text-3xl font-semibold">
                  {filteredMenu.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:from-zinc-950 dark:to-zinc-900/50">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Items in Cart
                </p>
                <p className="mt-2 font-heading text-3xl font-semibold">
                  {cart.length}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:from-zinc-950 dark:to-zinc-900/50">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Recent Orders
                </p>
                <p className="mt-2 font-heading text-3xl font-semibold">
                  {myOrders.length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Menu grid */}
            <div className="lg:col-span-7">
              <Card className="overflow-hidden border-border/40 bg-white/90 shadow-sm backdrop-blur-sm dark:bg-zinc-950/60">
                <CardContent className="p-5 md:p-6">
                  <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-2xl font-semibold tracking-tight">
                        Menu Items
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tap a card to add modifiers and build the order.
                      </p>
                    </div>
                    <BadgePill tone="info" className="shrink-0">
                      {filteredMenu.length} available
                    </BadgePill>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredMenu.map((item: MenuItem) => {
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
                          onClick={() => openModifiersModal(item)}
                          className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white text-left shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/60 hover:shadow-[0_20px_40px_rgba(245,158,11,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-amber-500/30"
                        >
                          {/* Image */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={item.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-5xl opacity-25">
                                ☕
                              </div>
                            )}

                            {/* Soft gradient overlay */}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60" />

                            {/* Price pill */}
                            <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-amber-700 shadow-sm backdrop-blur-sm dark:bg-zinc-950/90 dark:text-amber-400">
                              ₱{item.price.toFixed(2)}
                            </div>

                            {hasLowStock && (
                              <div className="absolute left-3 top-3">
                                <BadgePill
                                  tone="warning"
                                  className="gap-1 shadow-sm"
                                >
                                  <AlertTriangle size={12} />
                                  Low stock
                                </BadgePill>
                              </div>
                            )}
                          </div>

                          {/* Text */}
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

                  {filteredMenu.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
                      No menu items match your search.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 lg:col-span-5">
              {/* Current Order */}
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
                            <p className="font-medium leading-tight">
                              {item.name}
                            </p>
                            {item.note && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Note: {item.note}
                              </p>
                            )}
                            <p className="mt-1 text-sm font-semibold text-amber-600">
                              ₱{item.itemTotal.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-xl"
                              onClick={() =>
                                updateQuantity(idx, item.quantity - 1)
                              }
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
                              onClick={() =>
                                updateQuantity(idx, item.quantity + 1)
                              }
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <button
                              onClick={() => removeFromCart(idx)}
                              className="ml-1 rounded-xl p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Apply Promotion */}
                  {activePromos.length > 0 && cart.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-border/60 bg-zinc-50 p-4 dark:bg-zinc-900/50">
                      <p className="mb-3 text-sm font-medium">
                        Apply Promotion
                      </p>
                      <div className="space-y-1">
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 hover:bg-white dark:hover:bg-zinc-800">
                          <input
                            type="radio"
                            name="promo"
                            checked={selectedPromotionId === null}
                            onChange={() => setSelectedPromotionId(null)}
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
                                onChange={() =>
                                  setSelectedPromotionId(promo.id)
                                }
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                  {promo.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {label}
                                </p>
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

                  {/* Totals */}
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
                      onClick={() => {
                        setCheckoutOnlineOrderId(null);
                        setShowCheckoutModal(true);
                      }}
                      className="h-14 w-full text-lg font-semibold"
                      disabled={cart.length === 0}
                    >
                      <CreditCard className="mr-3 h-5 w-5" />
                      Proceed to Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
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
                      onClick={() => refetchOrders()}
                      disabled={ordersLoading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${ordersLoading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>

                  <div className="max-h-[260px] space-y-3 overflow-auto pr-1">
                    {ordersLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : myOrders.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-12 text-center text-muted-foreground">
                        No recent orders yet.
                      </div>
                    ) : (
                      myOrders.slice(0, 5).map((order: any) => (
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
                                    order.status === "Completed"
                                      ? "success"
                                      : "warning"
                                  }
                                >
                                  {order.status}
                                </BadgePill>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Modifiers Modal */}
      {showModifiersModal && selectedItem && (
        <ModalShell
          open={showModifiersModal}
          title={selectedItem.name}
          description={`Base price: ₱${selectedItem.price.toFixed(2)}`}
          onClose={() => setShowModifiersModal(false)}
          className="max-w-md"
        >
          <div className="space-y-6">
            {currentModifiers.length > 0 ? (
              currentModifiers.map((group) => (
                <div key={group.id}>
                  <h3 className="mb-3 font-medium">
                    {group.name}{" "}
                    {group.isRequired && (
                      <span className="text-red-500">(Required)</span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {group.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-amber-50 dark:hover:bg-zinc-800"
                      >
                        <input
                          type="checkbox"
                          checked={selectedOptionIds.includes(option.id)}
                          onChange={() => toggleOption(option.id)}
                        />
                        <div>
                          <div className="text-sm font-medium">
                            {option.name}
                          </div>
                          {option.priceAdjustment > 0 && (
                            <div className="text-xs text-emerald-600">
                              +₱{option.priceAdjustment.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No modifiers available for this item.
              </p>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Special Requests
              </label>
              <Input
                placeholder="No ice, extra sugar..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleAddToCart} className="flex-1 py-6 text-lg">
                Add — ₱{calculatePrice(selectedItem.price).toFixed(2)}
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-6"
                onClick={() => setShowModifiersModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <ModalShell
          open={showCheckoutModal}
          title="Complete Payment"
          description={
            checkoutOnlineOrderId
              ? `Online order · ${onlineOrderBeingCheckedOut?.customerName || ""}`
              : `Order total: ₱${finalTotal.toFixed(2)}`
          }
          onClose={closeCheckoutModal}
          className="max-w-md"
        >
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold tracking-tight">
                ₱{finalTotal.toFixed(2)}
              </div>
              {!checkoutOnlineOrderId && previewDiscount > 0 && (
                <p className="mt-2 text-sm text-emerald-600">
                  Includes −₱{previewDiscount.toFixed(2)} discount
                </p>
              )}
            </div>

            <div className="space-y-3">
              {(["Cash", "GCash", "Maya", "Card"] as PaymentMethod[]).map(
                (method) => (
                  <Button
                    key={method}
                    variant={
                      selectedPaymentMethod === method ? "default" : "outline"
                    }
                    className="h-14 w-full justify-start text-base"
                    onClick={() => setSelectedPaymentMethod(method)}
                  >
                    {method}
                  </Button>
                ),
              )}
            </div>

            {selectedPaymentMethod === "Cash" && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Amount Tendered
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  className="py-6 text-3xl"
                />
                {changeDue > 0 && (
                  <p className="mt-2 text-lg font-semibold text-emerald-600">
                    Change: ₱{changeDue.toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCheckout}
                disabled={
                  isCheckingOut ||
                  (selectedPaymentMethod === "Cash" && !amountTendered)
                }
                className="flex-1 py-7 text-lg"
              >
                {isCheckingOut && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Payment
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-7"
                onClick={closeCheckoutModal}
                disabled={isCheckingOut}
              >
                Cancel
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
