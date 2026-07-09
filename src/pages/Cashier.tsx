import { useEffect, useState } from "react";
import { menuService } from "@/services/menu.service";
import { ordersService } from "@/services/orders.service";
import type { MenuItem, CartItem, ModifierGroup, OrderResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { PageHeader } from "@/components/layout";
import { getFullImageUrl } from "@/lib/imageUtils";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { BadgePill } from "@/components/common/BadgePill";
import { CashierSkeleton } from "@/components/skeletons/CashierSkeleton";

type PaymentMethod = "Cash" | "GCash" | "Maya" | "Card";

export default function CashierPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [myOrders, setMyOrders] = useState<OrderResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Modals
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [currentModifiers, setCurrentModifiers] = useState<ModifierGroup[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [customNote, setCustomNote] = useState("");

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("Cash");
  const [amountTendered, setAmountTendered] = useState("");

  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(
    null,
  );

  const { cart, addToCart, removeFromCart, clearCart, total } = useCart();

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await menuService.getMenu();
      setMenuItems(res.data || []);
    } catch (err) {
      console.error("Failed to fetch menu:", err);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await ordersService.getMyOrders();
      setMyOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchMyOrders();
  }, []);

  const openModifiersModal = async (item: MenuItem) => {
    const hasLowStock = item.inventoryLinks?.some(
      (link) => link.quantityUsedPerUnit > 5,
    );
    if (hasLowStock) {
      if (
        !confirm(
          `Warning: Some ingredients for ${item.name} might be low in stock. Continue?`,
        )
      ) {
        return;
      }
    }

    setSelectedItem(item);
    setSelectedOptionIds([]);
    setCustomNote("");

    try {
      const res = await menuService.getMenuItem(item.id);
      setCurrentModifiers(res.data?.modifierGroups || []);
    } catch (e) {
      console.error(e);
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

  const openCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setAmountTendered("");
    setSelectedPaymentMethod("Cash");
    setShowCheckoutModal(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    const orderPayload = {
      tableNumber: "T1",
      customerNotes: "",
      items: cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        selectedModifierOptionIds: item.selectedModifierOptionIds,
        itemNotes: item.note || "",
      })),
    };

    try {
      const createRes = await ordersService.createOrder(orderPayload);
      const orderId = createRes.data?.id;

      const checkoutPayload = {
        orderId,
        paymentMethod: selectedPaymentMethod,
        amountTendered:
          selectedPaymentMethod === "Cash"
            ? parseFloat(amountTendered) || undefined
            : undefined,
        transactionId:
          selectedPaymentMethod !== "Cash" ? `TX-${Date.now()}` : undefined,
        notes: "",
      };

      await ordersService.checkoutOrder(checkoutPayload);

      toast.success("✅ Order completed successfully!", {
        description: "Inventory has been automatically deducted.",
      });

      await fetchMenu();
      clearCart();
      setShowCheckoutModal(false);
      fetchMyOrders();
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Checkout failed. Please try again.";
      toast.error(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredMenu = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const changeDue =
    selectedPaymentMethod === "Cash" && amountTendered
      ? Math.max(0, parseFloat(amountTendered) - total)
      : 0;

  const quickStats = [
    { label: "Menu Items", value: filteredMenu.length },
    { label: "Items in Cart", value: cart.length },
    { label: "Recent Orders", value: myOrders.length },
  ];

  if (loading) {
    return <CashierSkeleton />;
  }

  return (
    <div className="mx-auto max-w-screen-2xl space-y-8 p-4 md:p-6">
      <PageHeader
        title="POS Terminal"
        description="Search menu items, build orders, and complete payment with a clean cashier workflow."
        actions={
          <Input
            placeholder="Search menu items..."
            className="w-full max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-900/75">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
              <p className="mt-3 font-heading text-3xl font-semibold tracking-tight">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Menu Items Grid */}
        <div className="lg:col-span-7">
          <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-900/75">
            <CardContent className="p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight">Menu items</h2>
                  <p className="text-sm text-muted-foreground">Tap a card to add modifiers and build the order.</p>
                </div>
                <BadgePill tone="info">{filteredMenu.length} available</BadgePill>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredMenu.map((item) => {
              const hasLowStock = item.inventoryLinks?.some(
                (link) => link.quantityUsedPerUnit > 5,
              );
              return (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-3xl border border-border/60 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-950/50"
                  onClick={() => openModifiersModal(item)}
                >
                  <div className="relative h-52 bg-zinc-100 dark:bg-zinc-800">
                    {getFullImageUrl(item.imageUrl) ? (
                      <img
                        src={getFullImageUrl(item.imageUrl)!}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
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
                        <h3 className="font-heading text-lg font-semibold tracking-tight">{item.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.category}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-amber-600">₱{item.price.toFixed(2)}</p>
                    </div>
                    {item.inventoryLinks?.length > 0 && (
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {item.inventoryLinks
                          .map((l) => l.inventoryItemName)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Current Order */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-900/75">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight">Current order</h2>
                  <p className="text-sm text-muted-foreground">Review items before checking out.</p>
                </div>
                <BadgePill tone="neutral">{cart.length} items</BadgePill>
              </div>

              <div className="min-h-[320px] max-h-[420px] space-y-4 overflow-auto pr-1">
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
                      className="flex items-start justify-between rounded-2xl border border-border/60 bg-zinc-50 p-4 dark:bg-zinc-950/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.note && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Note: {item.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₱{item.itemTotal.toFixed(2)}</p>
                        <button
                          onClick={() => removeFromCart(idx)}
                          className="mt-1 text-sm text-red-500 hover:underline"
                        >
                          Remove
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
                  onClick={openCheckout}
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
          <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-900/75">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-tight">Recent orders</h2>
                  <p className="text-sm text-muted-foreground">Quick access to recent cashier activity.</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchMyOrders}
                  disabled={ordersLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${ordersLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              <div className="max-h-[300px] space-y-3 overflow-auto pr-1">
                {ordersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-12 text-center text-muted-foreground">
                    No recent orders yet.
                  </div>
                ) : (
                  myOrders.slice(0, 4).map((order) => (
                    <div
                      key={order.id}
                      className="cursor-pointer rounded-2xl border border-border/60 bg-zinc-50 p-4 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-zinc-950/50"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetail(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-mono font-medium">
                            {order.orderNumber}
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
                            ₱{order.total.toFixed(2)}
                          </div>
                          <div className="mt-2">
                            <BadgePill tone={order.status === "Completed" ? "success" : "warning"}>
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

      {/* Modifiers Modal */}
      {showModifiersModal && selectedItem && (
        <ModalShell
          open={showModifiersModal}
          title={selectedItem.name}
          description={`Base price: ₱${selectedItem.price.toFixed(2)}`}
          onClose={() => setShowModifiersModal(false)}
          className="max-w-md"
        >
          <div className="space-y-8">
            {currentModifiers.map((group) => (
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
                        <div>{option.name}</div>
                        {option.priceAdjustment > 0 && (
                          <div className="text-xs text-emerald-600">
                            +₱{option.priceAdjustment}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <label className="mb-2 block text-sm font-medium">
              Special Requests
            </label>
            <Input
              placeholder="No ice, extra sugar..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
            />
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              onClick={handleAddToCart}
              className="flex-1 py-7 text-lg"
            >
              Add - ₱{calculatePrice(selectedItem.price).toFixed(2)}
            </Button>
            <Button
              variant="outline"
              className="flex-1 py-7"
              onClick={() => setShowModifiersModal(false)}
            >
              Cancel
            </Button>
          </div>
        </ModalShell>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <ModalShell
          open={showCheckoutModal}
          title="Complete Payment"
          description={`Order total: ₱${total.toFixed(2)}`}
          onClose={() => setShowCheckoutModal(false)}
          className="max-w-md"
        >
          <div className="text-center text-5xl font-bold">
            ₱{total.toFixed(2)}
          </div>

          <div className="mb-8 mt-8 space-y-4">
            {(["Cash", "GCash", "Maya", "Card"] as PaymentMethod[]).map(
              (method) => (
                <Button
                  key={method}
                  variant={
                    selectedPaymentMethod === method ? "default" : "outline"
                  }
                  className="h-14 w-full justify-start"
                  onClick={() => setSelectedPaymentMethod(method)}
                >
                  {method}
                </Button>
              ),
            )}
          </div>

          {selectedPaymentMethod === "Cash" && (
            <div className="mb-6">
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
                <p className="mt-2 text-emerald-600">
                  Change: ₱{changeDue.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleCheckout}
              disabled={
                checkoutLoading ||
                (selectedPaymentMethod === "Cash" && !amountTendered)
              }
              className="flex-1 py-7 text-lg"
            >
              {checkoutLoading && <Loader2 className="mr-2 animate-spin" />}
              Confirm Payment
            </Button>
            <Button
              variant="outline"
              className="flex-1 py-7"
              onClick={() => setShowCheckoutModal(false)}
            >
              Cancel
            </Button>
          </div>
        </ModalShell>
      )}

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <ModalShell
          open={showOrderDetail}
          title="Order Details"
          description={selectedOrder.orderNumber}
          onClose={() => setShowOrderDetail(false)}
          className="max-w-lg"
        >
          <Button
            className="mt-8 w-full"
            onClick={() => setShowOrderDetail(false)}
          >
            Close
          </Button>
        </ModalShell>
      )}
    </div>
  );
}
