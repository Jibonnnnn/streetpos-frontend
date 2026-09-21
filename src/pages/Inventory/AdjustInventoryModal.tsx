import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { inventoryService } from "@/services/inventory.service";
import { toast } from "sonner";
import type { InventoryItemResponse } from "@/types";

type AdjustMode = "restock" | "deduct";

type AdjustForm = {
  mode: AdjustMode;
  quantity: number;
  reason: string;
  unitCost: number;
};

const emptyAdjust: AdjustForm = {
  mode: "restock",
  quantity: 0,
  reason: "",
  unitCost: 0,
};

type AdjustInventoryModalProps = {
  item: InventoryItemResponse | null;
  onClose: () => void;
  onAdjusted: () => void;
};

export function AdjustInventoryModal({
  item,
  onClose,
  onAdjusted,
}: AdjustInventoryModalProps) {
  const [form, setForm] = useState<AdjustForm>(emptyAdjust);
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        mode: "restock",
        quantity: 0,
        reason: "",
        unitCost: item.unitCost ?? 0,
      });
    } else {
      setForm(emptyAdjust);
    }
  }, [item]);

  const handleAdjust = async () => {
    if (!item) return;

    const qty = Number(form.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Enter a quantity greater than 0");
      return;
    }

    if (form.mode === "restock" && Number(form.unitCost) <= 0) {
      toast.error("Unit cost is required when restocking");
      return;
    }

    if (form.mode === "deduct" && qty > Number(item.currentStock)) {
      toast.error(
        `Cannot deduct more than current stock (${item.currentStock} ${item.unit})`,
      );
      return;
    }

    // API expects signed quantityChange: + restock, − deduct
    const quantityChange = form.mode === "restock" ? qty : -qty;

    try {
      setAdjusting(true);
      await inventoryService.adjustInventoryItem(item.id, {
        quantityChange,
        reason:
          form.reason.trim() ||
          (form.mode === "restock" ? "Restock" : "Stock deduction"),
        unitCost:
          form.mode === "restock" ? Number(form.unitCost) : undefined,
      });
      toast.success(
        form.mode === "restock" ? "Stock restocked" : "Stock deducted",
      );
      setForm(emptyAdjust);
      onAdjusted();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to adjust stock");
    } finally {
      setAdjusting(false);
    }
  };

  if (!item) return null;

  return (
    <ModalShell
      open={!!item}
      title={`Adjust — ${item.name}`}
      description={`Current stock: ${item.currentStock} ${item.unit}`}
      onClose={onClose}
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={form.mode === "restock" ? "default" : "outline"}
            className="flex-1 rounded-xl"
            onClick={() => setForm({ ...form, mode: "restock" })}
          >
            Restock
          </Button>
          <Button
            type="button"
            variant={form.mode === "deduct" ? "default" : "outline"}
            className="flex-1 rounded-xl"
            onClick={() => setForm({ ...form, mode: "deduct" })}
          >
            Deduct
          </Button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Quantity ({item.unit})
          </label>
          <Input
            type="number"
            min={0}
            step="any"
            value={form.quantity || ""}
            onChange={(e) =>
              setForm({
                ...form,
                quantity: parseFloat(e.target.value) || 0,
              })
            }
            className="rounded-xl"
          />
          {form.mode === "deduct" && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Max: {item.currentStock} {item.unit}
            </p>
          )}
        </div>

        {form.mode === "restock" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Unit Cost (₱) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.unitCost === 0 ? "" : form.unitCost}
              onChange={(e) => {
                const raw = e.target.value;
                setForm({
                  ...form,
                  unitCost: raw === "" ? 0 : Number(raw),
                });
              }}
              placeholder="0.00"
              className="rounded-xl"
            />
            {form.quantity > 0 && form.unitCost > 0 && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                Line total: ₱
                {(Number(form.quantity) * Number(form.unitCost)).toLocaleString(
                  "en-PH",
                  { minimumFractionDigits: 2 },
                )}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">Reason</label>
          <Input
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Supplier delivery, spoilage, etc."
            className="rounded-xl"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleAdjust}
            disabled={adjusting}
            className="flex-1 rounded-xl"
          >
            {adjusting
              ? "Saving..."
              : form.mode === "restock"
                ? "Confirm Restock"
                : "Confirm Deduct"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
            disabled={adjusting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}