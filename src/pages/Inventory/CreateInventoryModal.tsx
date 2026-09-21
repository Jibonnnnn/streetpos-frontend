import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { inventoryService } from "@/services/inventory.service";
import { toast } from "sonner";
import { isSupportedUnit, SUPPORTED_UNITS } from "./units";

export type CreateInventoryForm = {
  name: string;
  description: string;
  initialStock: number;
  unit: string;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
};

export const emptyCreateForm: CreateInventoryForm = {
  name: "",
  description: "",
  initialStock: 0,
  unit: "pcs",
  reorderPoint: 0,
  reorderQuantity: 1,
  unitCost: 0,
};

type CreateInventoryModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateInventoryModal({
  open,
  onClose,
  onCreated,
}: CreateInventoryModalProps) {
  const [form, setForm] = useState<CreateInventoryForm>(emptyCreateForm);
  const [creating, setCreating] = useState(false);
  const [unitError, setUnitError] = useState("");

  const resetAndClose = () => {
    setForm(emptyCreateForm);
    setUnitError("");
    onClose();
  };

  const handleCreate = async () => {
    setUnitError("");

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const unit = form.unit.trim();
    if (!unit) {
      setUnitError("Unit is required. Please select a supported unit.");
      toast.error("Unit is required");
      return;
    }
    if (!isSupportedUnit(unit)) {
      setUnitError(
        `"${unit}" is not a supported unit. Choose one from the list.`,
      );
      toast.error(
        `Invalid unit. Supported units: ${SUPPORTED_UNITS.join(", ")}`,
      );
      return;
    }

    if (form.unitCost < 0) {
      toast.error("Unit cost cannot be negative");
      return;
    }

    if (form.initialStock < 0) {
      toast.error("Initial stock cannot be negative");
      return;
    }

    try {
      setCreating(true);
      await inventoryService.createInventoryItem({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        initialStock: form.initialStock,
        unit,
        reorderPoint: form.reorderPoint,
        reorderQuantity: form.reorderQuantity,
        unitCost: form.unitCost,
      });
      toast.success("Inventory item created");
      setForm(emptyCreateForm);
      setUnitError("");
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create item");
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <ModalShell
      open={open}
      title="Add Inventory Item"
      description="Set initial stock and unit cost."
      onClose={resetAndClose}
      className="max-w-lg"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Coffee Beans"
            className="rounded-xl"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <Input
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Optional"
            className="rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Initial Stock
            </label>
            <Input
              type="number"
              min={0}
              value={form.initialStock}
              onChange={(e) =>
                setForm({
                  ...form,
                  initialStock: parseFloat(e.target.value) || 0,
                })
              }
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Unit <span className="text-red-500">*</span>
            </label>
            <select
              value={form.unit}
              onChange={(e) => {
                setForm({ ...form, unit: e.target.value });
                setUnitError("");
              }}
              className={`flex h-10 w-full rounded-xl border bg-background px-3 text-sm ${
                unitError
                  ? "border-red-400 focus:ring-red-400"
                  : "border-input"
              }`}
              aria-invalid={!!unitError}
              aria-describedby={unitError ? "unit-error" : undefined}
            >
              <option value="" disabled>
                Select unit…
              </option>
              {SUPPORTED_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            {unitError ? (
              <p id="unit-error" className="mt-1.5 text-sm text-red-500">
                {unitError}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Only supported units can be saved.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Unit Cost (₱) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.unitCost}
            onChange={(e) =>
              setForm({
                ...form,
                unitCost: parseFloat(e.target.value) || 0,
              })
            }
            className="rounded-xl"
          />
          {form.initialStock > 0 && form.unitCost > 0 && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              Opening value: ₱
              {(form.initialStock * form.unitCost).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Reorder Point
            </label>
            <Input
              type="number"
              min={0}
              value={form.reorderPoint}
              onChange={(e) =>
                setForm({
                  ...form,
                  reorderPoint: parseFloat(e.target.value) || 0,
                })
              }
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Reorder Qty
            </label>
            <Input
              type="number"
              min={1}
              value={form.reorderQuantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  reorderQuantity: parseFloat(e.target.value) || 1,
                })
              }
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 rounded-xl"
          >
            {creating ? "Creating..." : "Create"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={resetAndClose}
            disabled={creating}
          >
            Cancel
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}