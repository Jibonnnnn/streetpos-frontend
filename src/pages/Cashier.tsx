import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { CashierSkeleton } from "@/components/skeletons/CashierSkeleton";
import { useCart } from "@/contexts/CartContext";
import { useKioskMode } from "@/hooks/useKioskMode";
import { useMenuItems } from "@/hooks/queries/useMenu";
import { useMyOrders } from "@/hooks/queries/useOrders";
import { usePagination } from "@/hooks/usePagination";
import { useOfflineOrderQueue } from "@/hooks/useOfflineOrderQueue";
import { OfflineBanner } from "@/components/pos/OfflineBanner";
import {
  PosTabBar,
  type PosTab,
  PosMenuGrid,
  PosCartPanel,
  PosRecentOrders,
  PosStatsRow,
  AddonsModal,
  CheckoutModal,
  OpenTabsPanel,
  OnlineOrdersPanel,
} from "./Cashier/index";
import { ordersService } from "@/services/orders.service";
import { promotionService } from "@/services/promotion.service";
import { addonService } from "@/services/addon.service";
import { saveMenuCache } from "@/lib/offline/menuCache";
import { printReceipt } from "@/lib/printReceipt";
import { toast } from "sonner";
import type {
  MenuItem,
  Promotion,
  OrderResponse,
  PaymentMethod,
  OrderReceiptDto,
} from "@/types";
import type { ModifierGroup } from "@/types/addons";

function optionLabelsFromIds(groups: ModifierGroup[], ids: number[]): string[] {
  const labels: string[] = [];
  for (const group of groups) {
    for (const option of group.options) {
      if (ids.includes(option.id)) {
        labels.push(
          option.priceAdjustment > 0
            ? `${option.name} (+₱${option.priceAdjustment.toFixed(2)})`
            : option.name,
        );
      }
    }
  }
  return labels;
}

function isNetworkError(err: unknown): boolean {
  const e = err as { code?: string; response?: unknown };
  return (
    e?.code === "ERR_NETWORK" ||
    e?.code === "ECONNABORTED" ||
    e?.response === undefined
  );
}

export default function CashierPage() {
  useKioskMode();

  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, total } =
    useCart();

  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();
  const {
    data: myOrders = [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useMyOrders();

  // ---- Offline POS (POS only) ----
  const {
    isOnline,
    pendingCount,
    isSyncing,
    enqueue: enqueueOfflineOrder,
    runSync,
  } = useOfflineOrderQueue();

  const [searchTerm, setSearchTerm] = useState("");
  const [posTab, setPosTab] = useState<PosTab>("pos");

  // Add-ons modal
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customNote, setCustomNote] = useState("");
  const [addonGroups, setAddonGroups] = useState<ModifierGroup[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);

  // Checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("Cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [payLaterCustomerName, setPayLaterCustomerName] = useState("");
  const [settleOrderId, setSettleOrderId] = useState<number | null>(null);
  const [checkoutOnlineOrderId, setCheckoutOnlineOrderId] = useState<
    number | null
  >(null);
  const [onlineOrderBeingCheckedOut, setOnlineOrderBeingCheckedOut] =
    useState<OrderResponse | null>(null);

  // Receipt
  const [completedOrderId, setCompletedOrderId] = useState<number | null>(null);
  const [receiptData, setReceiptData] = useState<OrderReceiptDto | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  // Promotions
  const [activePromos, setActivePromos] = useState<Promotion[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<number | null>(
    null,
  );
  const [previewDiscount, setPreviewDiscount] = useState(0);

  // Online / tabs lists
  const [onlineOrders, setOnlineOrders] = useState<OrderResponse[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [openTabs, setOpenTabs] = useState<OrderResponse[]>([]);
  const [openTabsLoading, setOpenTabsLoading] = useState(false);

  // Persist menu for offline browse
  useEffect(() => {
    if (menuItems.length && navigator.onLine) {
      void saveMenuCache(menuItems);
    }
  }, [menuItems]);

  useEffect(() => {
    promotionService
      .getActive()
      .then((res) => setActivePromos(res.data ?? []))
      .catch(() => {});
  }, []);

  const fetchOnlineOrders = async () => {
    try {
      setOnlineLoading(true);
      const res = await ordersService.getOnlineOrders();
      setOnlineOrders(res.data ?? []);
    } catch {
      toast.error("Failed to load online orders");
    } finally {
      setOnlineLoading(false);
    }
  };

  const fetchOpenTabs = async () => {
    try {
      setOpenTabsLoading(true);
      const res = await ordersService.getOpenTabs();
      setOpenTabs(res.data ?? []);
    } catch {
      toast.error("Failed to load open tabs");
    } finally {
      setOpenTabsLoading(false);
    }
  };

  useEffect(() => {
    if (posTab === "online") void fetchOnlineOrders();
    if (posTab === "tabs") void fetchOpenTabs();
  }, [posTab]);

  const filteredMenu = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return menuItems.filter((m: MenuItem) => m.isActive);
    return menuItems.filter(
      (m: MenuItem) =>
        m.isActive &&
        (m.name.toLowerCase().includes(q) ||
          m.categoryName?.toLowerCase().includes(q)),
    );
  }, [menuItems, searchTerm]);

  const menuPage = usePagination<MenuItem>(filteredMenu, 12);
  const tabsPage = usePagination<OrderResponse>(openTabs, 10);
  const onlinePage = usePagination<OrderResponse>(onlineOrders, 10);
  const recentPage = usePagination<OrderResponse>(myOrders, 5);

  const calculatePreviewDiscount = (promo: Promotion | null) => {
    if (!promo || cart.length === 0) return 0;
    switch (promo.type) {
      case "Percentage":
        return (total * Number(promo.value)) / 100;
      case "FixedAmount":
        return Math.min(Number(promo.value), total);
      case "BuyOneGetOne": {
        const prices = cart
          .flatMap((c) => Array(c.quantity).fill(c.itemTotal / c.quantity))
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
    const promo =
      activePromos.find((p) => p.id === selectedPromotionId) ?? null;
    setPreviewDiscount(calculatePreviewDiscount(promo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPromotionId, cart, total, activePromos]);

  const finalTotal = Math.max(0, total - previewDiscount);
  const changeDue =
    selectedPaymentMethod === "Cash" && amountTendered
      ? Math.max(0, parseFloat(amountTendered) - finalTotal)
      : 0;

  // ---- Add-ons ----
  const openModifiersModal = async (item: MenuItem) => {
    setSelectedItem(item);
    setCustomNote("");
    setShowModifiersModal(true);
    setAddonsLoading(true);
    try {
      const res = await addonService.getByMenuItem(item.id);
      setAddonGroups(res.data ?? []);
    } catch {
      setAddonGroups([]);
    } finally {
      setAddonsLoading(false);
    }
  };

  const closeModifiersModal = () => {
    setShowModifiersModal(false);
    setSelectedItem(null);
    setCustomNote("");
    setAddonGroups([]);
  };

  const handleAddonConfirm = (
    selectedOptionIds: number[],
    unitPrice: number,
  ) => {
    if (!selectedItem) return;
    addToCart({
      ...selectedItem,
      quantity: 1,
      selectedModifierOptionIds: selectedOptionIds,
      selectedOptionLabels: optionLabelsFromIds(addonGroups, selectedOptionIds),
      note: customNote || undefined,
      itemTotal: unitPrice,
    });
    closeModifiersModal();
  };

  // ---- Checkout helpers ----
  const openOnlineCheckout = (order: OrderResponse) => {
    if (!isOnline) {
      toast.error("This action needs an internet connection.");
      return;
    }
    setSettleOrderId(null);
    setCheckoutOnlineOrderId(order.id);
    setOnlineOrderBeingCheckedOut(order);
    setSelectedPaymentMethod("Cash");
    setAmountTendered("");
    setShowCheckoutModal(true);
  };

  const openSettleCheckout = (order: OrderResponse) => {
    if (!isOnline) {
      toast.error("This action needs an internet connection.");
      return;
    }
    setCheckoutOnlineOrderId(null);
    setOnlineOrderBeingCheckedOut(null);
    setSettleOrderId(order.id);
    setSelectedPaymentMethod("Cash");
    setAmountTendered("");
    setShowCheckoutModal(true);
  };

  const finishWithoutReceipt = () => {
    setShowCheckoutModal(false);
    setCompletedOrderId(null);
    setReceiptData(null);
    setSettleOrderId(null);
    setCheckoutOnlineOrderId(null);
    setOnlineOrderBeingCheckedOut(null);
    setAmountTendered("");
    setSelectedPaymentMethod("Cash");
    setSelectedPromotionId(null);
    setPreviewDiscount(0);
    setPayLaterCustomerName("");
  };

  const closeCheckoutModal = () => {
    if (isCheckingOut) return;
    finishWithoutReceipt();
  };

  const showReceiptForOrder = async (orderId: number) => {
    setCompletedOrderId(orderId);
    setReceiptLoading(true);
    try {
      const res = await ordersService.getReceiptData(orderId);
      setReceiptData(res.data);
    } catch {
      setReceiptData(null);
      toast.error("Could not load receipt");
    } finally {
      setReceiptLoading(false);
    }
  };

  const resetAfterSuccess = () => {
    clearCart();
    setAmountTendered("");
    setSelectedPaymentMethod("Cash");
    setSelectedPromotionId(null);
    setPreviewDiscount(0);
    setPayLaterCustomerName("");
  };

  // ---- Checkout (with offline queue for normal POS cart) ----
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

      // 1. Settle open tab (online only)
      if (settleOrderId) {
        const settleRes = await ordersService.settlePayLater(settleOrderId, {
          paymentMethod: selectedPaymentMethod,
          amountTendered:
            selectedPaymentMethod === "Cash"
              ? parseFloat(amountTendered)
              : undefined,
          transactionId:
            selectedPaymentMethod !== "Cash" ? `TX-${Date.now()}` : undefined,
          notes: "",
        });
        toast.success("✅ Tab settled successfully!");
        setAmountTendered("");
        setSelectedPaymentMethod("Cash");
        void fetchOpenTabs();
        void refetchOrders();
        const settledId = settleRes.data?.id ?? settleOrderId;
        await showReceiptForOrder(settledId);
        return;
      }

      // 2. Online order checkout (online only)
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
        setAmountTendered("");
        setSelectedPaymentMethod("Cash");
        void fetchOnlineOrders();
        void refetchOrders();
        await showReceiptForOrder(checkoutOnlineOrderId);
        return;
      }

      // 3. Normal POS cart (supports offline)
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

      const checkoutPayload = {
        paymentMethod: selectedPaymentMethod,
        amountTendered:
          selectedPaymentMethod === "Cash"
            ? parseFloat(amountTendered)
            : undefined,
        transactionId:
          selectedPaymentMethod !== "Cash" ? `TX-${Date.now()}` : undefined,
        notes: "",
        promotionId:
          selectedPaymentMethod === "PayLater"
            ? undefined
            : (selectedPromotionId ?? undefined),
        customerName:
          selectedPaymentMethod === "PayLater"
            ? payLaterCustomerName.trim()
            : undefined,
      };

      const itemsSnapshot = cart.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.itemTotal / Math.max(1, item.quantity),
        itemTotal: item.itemTotal,
        selectedModifierOptionIds: item.selectedModifierOptionIds || [],
        selectedOptionLabels: item.selectedOptionLabels,
        itemNotes: item.note || "",
      }));

      const queueAndFinish = async () => {
        const queued = await enqueueOfflineOrder({
          orderPayload,
          checkoutPayload,
          itemsSnapshot,
          subtotal: total,
          discountAmount: previewDiscount,
          total: finalTotal,
        });
        resetAfterSuccess();
        setShowCheckoutModal(false);
        toast.success(
          `Order saved offline (${queued.localOrderNumber}). It will sync when you are back online.`,
        );
      };

      if (!navigator.onLine) {
        await queueAndFinish();
        return;
      }

      let orderId: number;
      try {
        const createRes = await ordersService.createOrder(orderPayload);
        orderId = createRes.data?.id;
        if (!orderId) throw new Error("Failed to create order");

        await ordersService.checkoutOrder({
          orderId,
          ...checkoutPayload,
        });
      } catch (err) {
        if (isNetworkError(err)) {
          await queueAndFinish();
          return;
        }
        throw err;
      }

      resetAfterSuccess();
      void refetchOrders();

      if (selectedPaymentMethod === "PayLater") {
        toast.success("Order placed on tab (Pay Later)", {
          description:
            "You can collect payment later from the Open Tabs tab.",
        });
        void fetchOpenTabs();
        finishWithoutReceipt();
      } else {
        toast.success("✅ Order completed successfully!", {
          description:
            previewDiscount > 0
              ? `Discount applied: −₱${previewDiscount.toFixed(2)}`
              : "Inventory has been automatically deducted.",
        });
        await showReceiptForOrder(orderId);
      }
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
    <div className="space-y-6">
      <OfflineBanner
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onSyncNow={() => void runSync()}
      />

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Cashier
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Point of sale · take orders, open tabs, and online pickups
          </p>
        </div>
        {posTab === "pos" && (
          <Input
            placeholder="Search menu…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs rounded-2xl"
          />
        )}
      </div>

      <PosTabBar
        tab={posTab}
        onChange={setPosTab}
        onlineCount={onlineOrders.filter((o) => o.status !== "Completed").length}
        tabsCount={openTabs.length}
        isOnline={isOnline}
      />

      {posTab === "tabs" ? (
        <OpenTabsPanel
          tabs={openTabs}
          loading={openTabsLoading}
          tabsPage={tabsPage}
          isOnline={isOnline}
          onRefresh={fetchOpenTabs}
          onSettle={openSettleCheckout}
        />
      ) : posTab === "online" ? (
        <OnlineOrdersPanel
          orders={onlineOrders}
          loading={onlineLoading}
          onlinePage={onlinePage}
          isOnline={isOnline}
          onRefresh={fetchOnlineOrders}
          onCheckout={openOnlineCheckout}
        />
      ) : (
        <>
          <PosStatsRow
            menuCount={filteredMenu.length}
            cartCount={cart.length}
            recentCount={myOrders.length}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <PosMenuGrid
                menuPage={menuPage}
                filteredCount={filteredMenu.length}
                onSelectItem={openModifiersModal}
              />
            </div>
            <div className="space-y-6 lg:col-span-5">
              <PosCartPanel
                cart={cart}
                total={total}
                finalTotal={finalTotal}
                previewDiscount={previewDiscount}
                activePromos={activePromos}
                selectedPromotionId={selectedPromotionId}
                selectedPaymentMethod={selectedPaymentMethod}
                onSelectPromotion={setSelectedPromotionId}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onCheckout={() => {
                  setSettleOrderId(null);
                  setCheckoutOnlineOrderId(null);
                  setOnlineOrderBeingCheckedOut(null);
                  setShowCheckoutModal(true);
                }}
              />
              <PosRecentOrders
                orders={myOrders}
                loading={ordersLoading}
                recentPage={recentPage}
                onRefresh={() => void refetchOrders()}
              />
            </div>
          </div>
        </>
      )}

      <AddonsModal
        open={showModifiersModal}
        item={selectedItem}
        groups={addonGroups}
        loading={addonsLoading}
        note={customNote}
        onNoteChange={setCustomNote}
        onConfirm={handleAddonConfirm}
        onClose={closeModifiersModal}
      />

      <CheckoutModal
        open={showCheckoutModal}
        finalTotal={
          settleOrderId
            ? openTabs.find((t) => t.id === settleOrderId)?.total ?? finalTotal
            : checkoutOnlineOrderId
              ? onlineOrderBeingCheckedOut?.total ?? finalTotal
              : finalTotal
        }
        previewDiscount={previewDiscount}
        selectedPaymentMethod={selectedPaymentMethod}
        amountTendered={amountTendered}
        changeDue={changeDue}
        payLaterCustomerName={payLaterCustomerName}
        isCheckingOut={isCheckingOut}
        settleOrderId={settleOrderId}
        checkoutOnlineOrderId={checkoutOnlineOrderId}
        onlineCustomerName={onlineOrderBeingCheckedOut?.customerName}
        completedOrderId={completedOrderId}
        receiptData={receiptData}
        receiptLoading={receiptLoading}
        onPaymentMethodChange={setSelectedPaymentMethod}
        onAmountTenderedChange={setAmountTendered}
        onPayLaterNameChange={setPayLaterCustomerName}
        onConfirm={handleCheckout}
        onClose={closeCheckoutModal}
        onDownloadPdf={async () => {
          if (!completedOrderId) return;
          try {
            await ordersService.downloadReceiptPdf(
              completedOrderId,
              receiptData?.orderNumber,
            );
            toast.success("PDF downloaded");
          } catch {
            toast.error("Failed to download PDF");
          }
        }}
        onPrint={() => printReceipt()}
        onFinishWithoutReceipt={finishWithoutReceipt}
      />
    </div>
  );
}