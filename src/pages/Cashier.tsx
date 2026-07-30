import { useState } from "react";
import { useMenuItems } from "@/hooks/queries/useMenu";
import { useMyOrders, useCreateOrder } from "@/hooks/queries/useOrders";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ordersService } from "@/services/orders.service";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  CreditCard,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { getFullImageUrl } from "@/lib/imageUtils";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { BadgePill } from "@/components/common/BadgePill";
import { CashierSkeleton } from "@/components/skeletons/CashierSkeleton";
import { menuService } from "@/services/menu.service";
import type { MenuItem, CartItem, ModifierGroup } from "@/types";

type PaymentMethod = "Cash" | "GCash" | "Maya" | "Card";

export default function CashierPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [currentModifiers, setCurrentModifiers] = useState<ModifierGroup[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [customNote, setCustomNote] = useState("");

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("Cash");
  const [amountTendered, setAmountTendered] = useState("");

  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();
  const {
    data: myOrders = [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useMyOrders();
  const createOrderMutation = useCreateOrder();

  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, total } =
    useCart();

  const filteredMenu = menuItems.filter(
    (item: MenuItem) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openModifiersModal = async (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedOptionIds([]);
    setCustomNote("");

    try {
      const res = await menuService.getMenuItem(item.id);
      setCurrentModifiers(res.data?.modifierGroups || []);
    } catch {
      setCurrentModifiers([]);
    }
    setShowModifiersModal(true);
  };

  const toggleOption = (optionId: number) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );
  };

  const calculatePrice = (basePrice: number) => {
    let extra = 0;
    currentModifiers.forEach((group) => {
      group.options.forEach((option) => {
        if (selectedOptionIds.includes(option.id)) {
          extra += option.priceAdjustment || 0;
        }
      });
    });
    return basePrice + extra;
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;

    const finalPrice = calculatePrice(selectedItem.price);
    const cartItem: CartItem = {
      ...selectedItem,
      quantity: 1,
      selectedModifierOptionIds: [...selectedOptionIds],
      note: customNote.trim() || undefined,
      itemTotal: finalPrice,
    };

    addToCart(cartItem);
    setShowModifiersModal(false);
    toast.success(`${selectedItem.name} added to order`);
  };

  const changeDue =
    selectedPaymentMethod === "Cash" && amountTendered
      ? Math.max(0, parseFloat(amountTendered) - total)
      : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (selectedPaymentMethod === "Cash" && !amountTendered) {
      toast.error("Please enter amount tendered");
      return;
    }

    if (
      selectedPaymentMethod === "Cash" &&
      parseFloat(amountTendered) < total
    ) {
      toast.error("Amount tendered is insufficient");
      return;
    }

    try {
      // 1. Create the order
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

      if (!orderId) {
        throw new Error("Failed to create order");
      }

      // 2. Checkout / Finalize the order
      const checkoutPayload = {
        orderId,
        paymentMethod: selectedPaymentMethod,
        amountTendered:
          selectedPaymentMethod === "Cash"
            ? parseFloat(amountTendered)
            : undefined,
        transactionId:
          selectedPaymentMethod !== "Cash" ? `TX-${Date.now()}` : undefined,
        notes: "",
      };

      await ordersService.checkoutOrder(checkoutPayload);

      toast.success("✅ Order completed successfully!", {
        description: "Inventory has been automatically deducted.",
      });

      clearCart();
      setShowCheckoutModal(false);
      setAmountTendered("");
      setSelectedPaymentMethod("Cash");
      refetchOrders();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Checkout failed. Please try again.",
      );
    }
  };

  if (menuLoading) return <CashierSkeleton />;

  return (
    <div className="mx-auto max-w-screen-2xl space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            POS Terminal
          </h1>
          <p className="text-muted-foreground">
            Search menu • Build orders • Complete payment
          </p>
        </div>
        <Input
          placeholder="Search menu items or category..."
          className="max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-white/80 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Menu Items
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {filteredMenu.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Items in Cart
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {cart.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 shadow-sm">
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
        {/* ==================== MENU GRID ==================== */}
        <div className="lg:col-span-7">
          <Card className="border-border/60 bg-white/80 shadow-sm">
            <CardContent className="p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight">
                    Menu Items
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tap a card to add modifiers and build the order.
                  </p>
                </div>
                <BadgePill tone="info">
                  {filteredMenu.length} available
                </BadgePill>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredMenu.map((item: MenuItem) => {
                  const hasLowStock = item.inventoryLinks?.some(
                    (link) => link.quantityUsedPerUnit > 5,
                  );

                  return (
                    <div
                      key={item.id}
                      className="group cursor-pointer overflow-hidden rounded-3xl border border-border/60 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-950/50"
                      onClick={() => openModifiersModal(item)}
                    >
                      <div className="relative h-48 bg-zinc-100 dark:bg-zinc-800">
                        {getFullImageUrl(
                          item.imageFileName ?? item.imageUrl,
                        ) ? (
                          <img
                            src={
                              getFullImageUrl(
                                item.imageFileName ?? item.imageUrl,
                              )!
                            }
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-6xl opacity-30">
                            ☕
                          </div>
                        )}

                        {hasLowStock && (
                          <div className="absolute left-4 top-4">
                            <BadgePill tone="warning" className="gap-1">
                              <AlertTriangle size={14} /> Low Stock
                            </BadgePill>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-heading text-lg font-semibold tracking-tight">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.categoryName}
                            </p>
                          </div>
                          <p className="text-lg font-semibold text-amber-600">
                            ₱{item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
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

        {/* ==================== SIDEBAR ==================== */}
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

              <div className="min-h-[280px] max-h-[380px] space-y-3 overflow-auto pr-1">
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
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-zinc-50 p-4 dark:bg-zinc-950/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-tight">{item.name}</p>
                        {item.note && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Note: {item.note}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-semibold text-amber-600">
                          ₱{item.itemTotal.toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls + Delete */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-xl"
                          onClick={() => updateQuantity(idx, item.quantity - 1)}
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
                          onClick={() => updateQuantity(idx, item.quantity + 1)}
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

              <div className="mt-8 border-t border-border/60 pt-6">
                <div className="mb-6 flex items-center justify-between text-3xl font-bold">
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
                <Button
                  onClick={() => setShowCheckoutModal(true)}
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
                            {new Date(order.createdAt).toLocaleString([], {
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

      {/* ==================== MODIFIERS MODAL ==================== */}
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

      {/* ==================== CHECKOUT MODAL ==================== */}
      {showCheckoutModal && (
        <ModalShell
          open={showCheckoutModal}
          title="Complete Payment"
          description={`Order total: ₱${total.toFixed(2)}`}
          onClose={() => setShowCheckoutModal(false)}
          className="max-w-md"
        >
          <div className="space-y-6">
            <div className="text-center text-5xl font-bold tracking-tight">
              ₱{total.toFixed(2)}
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
                  createOrderMutation.isPending ||
                  (selectedPaymentMethod === "Cash" && !amountTendered)
                }
                className="flex-1 py-7 text-lg"
              >
                {createOrderMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Payment
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-7"
                onClick={() => setShowCheckoutModal(false)}
                disabled={createOrderMutation.isPending}
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
