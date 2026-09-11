import type { OrderReceiptDto } from "@/types";

type Props = {
  receipt: OrderReceiptDto;
};

export function ReceiptPreview({ receipt: r }: Props) {
  const formatMoney = (n: number) => `₱${n.toFixed(2)}`;
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
      return d.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div
      id="receipt-print-area"
      className="mx-auto max-w-[320px] bg-white p-4 font-mono text-[11px] leading-relaxed text-black"
    >
      <div className="text-center">
        <div className="text-base font-bold tracking-tight">
          {r.cafeName || "Streetside Café"}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-neutral-600">
          Official Receipt
        </div>
      </div>

      <hr className="my-2 border-black" />

      <div className="space-y-0.5">
        <div>Order #: {r.orderNumber}</div>
        <div>Date: {formatDate(r.createdAt)}</div>
        {r.completedAt && <div>Completed: {formatDate(r.completedAt)}</div>}
        {r.customerName && <div>Customer: {r.customerName}</div>}
        <div>
          Cashier: {r.cashierName}
          {r.cashierEmployeeId ? ` (${r.cashierEmployeeId})` : ""}
        </div>
      </div>

      <hr className="my-2 border-dashed border-black" />

      <div className="space-y-1.5">
        {r.items.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between gap-2">
              <span className="min-w-0 flex-1">
                {item.quantity}x {item.name}
              </span>
              <span className="shrink-0">{formatMoney(item.subtotal)}</span>
            </div>
            {item.modifiers?.map((m, j) => (
              <div key={j} className="pl-3 text-[10px] text-neutral-600">
                + {m.name}
                {m.priceAdjustment > 0
                  ? ` (+${formatMoney(m.priceAdjustment)})`
                  : ""}
              </div>
            ))}
            {item.itemNotes && (
              <div className="pl-3 text-[10px] italic text-neutral-600">
                Note: {item.itemNotes}
              </div>
            )}
          </div>
        ))}
      </div>

      <hr className="my-2 border-dashed border-black" />

      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(r.subtotal)}</span>
        </div>

        {r.discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>{r.appliedPromotionName || "Discount"}</span>
            <span>-{formatMoney(r.discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatMoney(r.tax)}</span>
        </div>

        <div className="mt-1 flex justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span>{formatMoney(r.total)}</span>
        </div>
      </div>

      <hr className="my-2 border-black" />

      <div className="space-y-0.5">
        <div>Payment: {r.paymentMethod}</div>
        {r.amountTendered != null && (
          <div>Tendered: {formatMoney(r.amountTendered)}</div>
        )}
        {r.changeDue != null && r.changeDue > 0 && (
          <div>Change: {formatMoney(r.changeDue)}</div>
        )}
        {r.notes && (
          <div className="pt-1 text-[10px] text-neutral-600">
            Notes: {r.notes}
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-[10px] text-neutral-500">
        Thank you for your order!
        <br />
        streetsidecafe.vercel.app
      </div>
    </div>
  );
}