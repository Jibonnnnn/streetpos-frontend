import { ModalShell } from "@/components/dialogs/ModalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReceiptPreview } from "@/components/receipts/ReceiptPreview";
import { Download, Loader2, Printer } from "lucide-react";
import type { OrderReceiptDto, PaymentMethod } from "@/types";

const METHODS: PaymentMethod[] = [
  "Cash",
  "GCash",
  "Maya",
  "Card",
  "PayLater",
];

type Props = {
  open: boolean;
  finalTotal: number;
  previewDiscount: number;
  selectedPaymentMethod: PaymentMethod;
  amountTendered: string;
  changeDue: number;
  payLaterCustomerName: string;
  isCheckingOut: boolean;
  settleOrderId: number | null;
  checkoutOnlineOrderId: number | null;
  onlineCustomerName?: string;
  completedOrderId: number | null;
  receiptData: OrderReceiptDto | null;
  receiptLoading: boolean;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  onAmountTenderedChange: (v: string) => void;
  onPayLaterNameChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
  onFinishWithoutReceipt: () => void;
};

export function CheckoutModal({
  open,
  finalTotal,
  previewDiscount,
  selectedPaymentMethod,
  amountTendered,
  changeDue,
  payLaterCustomerName,
  isCheckingOut,
  settleOrderId,
  checkoutOnlineOrderId,
  onlineCustomerName,
  completedOrderId,
  receiptData,
  receiptLoading,
  onPaymentMethodChange,
  onAmountTenderedChange,
  onPayLaterNameChange,
  onConfirm,
  onClose,
  onDownloadPdf,
  onPrint,
  onFinishWithoutReceipt,
}: Props) {
  if (!open) return null;

  const title =
    completedOrderId || receiptLoading
      ? "Order Complete"
      : settleOrderId
        ? "Collect Payment (Open Tab)"
        : checkoutOnlineOrderId
          ? "Complete Online Order"
          : "Complete Payment";

  const description =
    completedOrderId || receiptLoading
      ? receiptData?.orderNumber
        ? `Receipt · ${receiptData.orderNumber}`
        : "Preparing receipt…"
      : settleOrderId
        ? `Settling tab · ₱${finalTotal.toFixed(2)}`
        : checkoutOnlineOrderId
          ? `Online order · ${onlineCustomerName || ""}`
          : `Order total: ₱${finalTotal.toFixed(2)}`;

  return (
    <ModalShell
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      className="max-w-md"
    >
      {receiptLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading receipt…</p>
        </div>
      ) : completedOrderId && receiptData ? (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-emerald-600">
              Order completed!
            </p>
            <p className="font-mono text-sm text-muted-foreground">
              {receiptData.orderNumber}
            </p>
          </div>

          <div className="max-h-[360px] overflow-auto rounded-xl border border-border/60 bg-white">
            <ReceiptPreview receipt={receiptData} />
          </div>

          <div className="flex flex-col gap-2">
            <Button className="h-12 w-full" onClick={onDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" className="h-12 w-full" onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              variant="ghost"
              className="h-11 w-full"
              onClick={onFinishWithoutReceipt}
            >
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold tracking-tight">
              ₱{finalTotal.toFixed(2)}
            </div>
            {!settleOrderId &&
              !checkoutOnlineOrderId &&
              previewDiscount > 0 && (
                <p className="mt-2 text-sm text-emerald-600">
                  Includes −₱{previewDiscount.toFixed(2)} discount
                </p>
              )}
          </div>

          {!settleOrderId &&
            !checkoutOnlineOrderId &&
            selectedPaymentMethod === "PayLater" && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Juan Dela Cruz"
                  value={payLaterCustomerName}
                  onChange={(e) => onPayLaterNameChange(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}

          <div className="space-y-3">
            {METHODS.map((method) => (
              <Button
                key={method}
                variant={
                  selectedPaymentMethod === method ? "default" : "outline"
                }
                className="h-14 w-full justify-start text-base"
                onClick={() => onPaymentMethodChange(method)}
                disabled={!!settleOrderId && method === "PayLater"}
              >
                {method === "PayLater" ? "Pay Later (Open Tab)" : method}
              </Button>
            ))}
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
                onChange={(e) => onAmountTenderedChange(e.target.value)}
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
              onClick={onConfirm}
              disabled={
                isCheckingOut ||
                (selectedPaymentMethod === "Cash" && !amountTendered) ||
                (!settleOrderId &&
                  !checkoutOnlineOrderId &&
                  selectedPaymentMethod === "PayLater" &&
                  !payLaterCustomerName.trim())
              }
              className="flex-1 py-7 text-lg"
            >
              {isCheckingOut && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {settleOrderId
                ? "Confirm Payment"
                : selectedPaymentMethod === "PayLater"
                  ? "Place on Tab"
                  : "Confirm Payment"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 py-7"
              onClick={onClose}
              disabled={isCheckingOut}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}