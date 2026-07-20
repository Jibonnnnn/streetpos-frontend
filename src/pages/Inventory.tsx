import { useState, useEffect, useMemo } from "react";
import { inventoryService } from "@/services/inventory.service";
import type { InventoryItemResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, AlertTriangle, Loader2, Package, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/layout";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { BadgePill } from "@/components/common/BadgePill";
import { FormField } from "@/components/forms/form-field";
import { FormSection } from "@/components/forms/form-section";
import { cn } from "@/lib/utils";

const UNIT_PRESETS = ["pcs", "kg", "g", "L", "mL", "bottles", "bags", "boxes"];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<InventoryItemResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    initialStock: 0,
    unit: "pcs",
    reorderPoint: 10,
    reorderQuantity: 50,
  });

  const [adjustData, setAdjustData] = useState({
    quantityChange: 0,
    reason: "",
  });

  const nameError =
    touched.name && !formData.name.trim() ? "Item name is required" : undefined;
  const stockError =
    touched.initialStock && formData.initialStock < 0
      ? "Initial stock cannot be negative"
      : undefined;
  const reorderError =
    touched.reorderPoint && formData.reorderPoint > 0 && formData.reorderQuantity <= 0
      ? "Reorder quantity should be greater than 0"
      : undefined;

  const isFormValid =
    formData.name.trim().length > 0 &&
    formData.initialStock >= 0 &&
    formData.reorderQuantity >= 0;

  const stockLevel = useMemo(() => {
    if (formData.reorderPoint <= 0) return "unmonitored";
    if (formData.initialStock <= formData.reorderPoint) return "low";
    return "healthy";
  }, [formData.initialStock, formData.reorderPoint]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getInventory();
      setInventory(res.data || []);
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openCreateModal = () => {
    setSelectedItem(null);
    setTouched({});
    setFormData({
      name: "",
      description: "",
      initialStock: 0,
      unit: "pcs",
      reorderPoint: 10,
      reorderQuantity: 50,
    });
    setShowModal(true);
  };

  const openAdjustModal = (item: InventoryItemResponse) => {
    setSelectedItem(item);
    setAdjustData({ quantityChange: 0, reason: "" });
    setShowAdjustModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, initialStock: true, reorderPoint: true });

    if (!formData.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (formData.initialStock < 0) {
      toast.error("Initial stock cannot be negative");
      return;
    }

    setCreating(true);
    try {
      await inventoryService.createInventoryItem(formData);

      toast.success(`✅ ${formData.name} created successfully!`, {
        description: `Initial stock: ${formData.initialStock} ${formData.unit}`,
      });

      setShowModal(false);
      fetchInventory(); // Refresh the list
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create inventory item");
    } finally {
      setCreating(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !adjustData.reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    setAdjusting(true);
    try {
      await inventoryService.adjustInventoryItem(selectedItem.id, adjustData);
      toast.success("Stock updated successfully!");
      setShowAdjustModal(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update stock");
    } finally {
      setAdjusting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this inventory item?",
      )
    )
      return;

    try {
      await inventoryService.deleteInventoryItem(id);
      toast.success("Inventory item deleted successfully");
      fetchInventory();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Failed to delete item. It may be linked to menu items.",
      );
    }
  };

  const columns = [
    { header: "Item Name", accessor: "name" as const },
    { header: "Unit", accessor: "unit" as const },
    { header: "Current Stock", accessor: "currentStock" as const },
    { header: "Reorder Point", accessor: "reorderPoint" as const },
    {
      header: "Status",
      accessor: (item: InventoryItemResponse) =>
        item.isLowStock ? (
          <BadgePill tone="warning" className="gap-1">
            <AlertTriangle size={16} /> Low Stock
          </BadgePill>
        ) : (
          <BadgePill tone="success">In Stock</BadgePill>
        ),
    },
  ];

  const actions = (item: InventoryItemResponse) => (
    <div className="flex gap-2 justify-end">
      <Button variant="outline" size="sm" onClick={() => openAdjustModal(item)}>
        Update Stock
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 hover:bg-red-50"
        onClick={() => handleDelete(item.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Inventory Management"
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" /> New Item
          </Button>
        }
      />

      <DataTable
        data={inventory}
        columns={columns}
        loading={loading}
        actions={actions}
        emptyMessage="No inventory items found."
      />

      <ModalShell
        open={showModal}
        title="New Inventory Item"
        description="Add a stock item and its reorder thresholds."
        onClose={() => setShowModal(false)}
        className="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                <Package className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Item details
              </h3>
            </div>

            <FormField
              label="Item name"
              error={nameError}
            >
              <Input
                placeholder="Espresso beans"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                aria-invalid={Boolean(nameError)}
                required
              />
            </FormField>

            <FormField label="Description">
              <Input
                placeholder="Dark roast, whole bean (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </FormField>
          </div>

          <div className="h-px bg-border/60" />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Stock rules
              </h3>
            </div>

            <FormField label="Initial stock" error={stockError}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={formData.initialStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    initialStock: parseFloat(e.target.value) || 0,
                  })
                }
                onBlur={() => setTouched((t) => ({ ...t, initialStock: true }))}
                aria-invalid={Boolean(stockError)}
              />
            </FormField>

            <FormField label="Unit">
              <div className="grid grid-cols-4 gap-1.5">
                {UNIT_PRESETS.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setFormData({ ...formData, unit })}
                    className={cn(
                      "rounded-xl border px-2 py-1.5 text-xs font-medium transition-all",
                      formData.unit === unit
                        ? "border-transparent bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950"
                        : "border-border/70 bg-white text-muted-foreground hover:border-zinc-300 hover:text-foreground dark:bg-zinc-900 dark:hover:border-zinc-700",
                    )}
                  >
                    {unit}
                  </button>
                ))}
              </div>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Or type a custom unit"
                className="mt-1.5"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Reorder point" error={reorderError}>
                <Input
                  type="number"
                  min={0}
                  value={formData.reorderPoint}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reorderPoint: parseInt(e.target.value) || 0,
                    })
                  }
                  onBlur={() => setTouched((t) => ({ ...t, reorderPoint: true }))}
                />
              </FormField>

              <FormField label="Reorder qty">
                <Input
                  type="number"
                  min={0}
                  value={formData.reorderQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reorderQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </FormField>
            </div>

            {/* Live preview */}
            <div
              className={cn(
                "flex items-start gap-2.5 rounded-2xl p-3.5 transition-colors",
                stockLevel === "low"
                  ? "bg-amber-50 dark:bg-amber-500/10"
                  : stockLevel === "unmonitored"
                    ? "bg-muted/40"
                    : "bg-emerald-50 dark:bg-emerald-500/10",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg",
                  stockLevel === "low"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                    : stockLevel === "unmonitored"
                      ? "bg-zinc-500/10 text-zinc-500"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
                )}
              >
                {stockLevel === "low" ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : stockLevel === "unmonitored" ? (
                  <Package className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                <span className="font-medium text-foreground">
                  {formData.name.trim() || "This item"} starts at {formData.initialStock}{" "}
                  {formData.unit || "units"}.
                </span>{" "}
                {stockLevel === "low"
                  ? `That's at or below its reorder point, so it'll show as Low Stock right away.`
                  : stockLevel === "unmonitored"
                    ? "Set a reorder point above 0 to get low-stock alerts."
                    : `Stays In Stock until it drops to ${formData.reorderPoint} ${formData.unit || "units"}.`}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" className="flex-1" disabled={!isFormValid || creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create item"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowModal(false)}
              disabled={creating}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={showAdjustModal && Boolean(selectedItem)}
        title={
          selectedItem ? `Update Stock - ${selectedItem.name}` : "Update Stock"
        }
        description={
          selectedItem
            ? `Current: ${selectedItem.currentStock} ${selectedItem.unit}`
            : undefined
        }
        onClose={() => setShowAdjustModal(false)}
        className="max-w-lg"
      >
        {selectedItem ? (
          <form onSubmit={handleAdjustStock} className="space-y-5">
            <FormSection
              title="Stock adjustment"
              description="Use positive values for restocks and negative values for usage or corrections."
            >
              <FormField
                label="Quantity change (+ or -)"
                description="Example: 50, -10, or 12.5"
              >
                <Input
                  type="number"
                  step="0.01"
                  value={adjustData.quantityChange}
                  onChange={(e) =>
                    setAdjustData({
                      ...adjustData,
                      quantityChange: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="50 or -10"
                  required
                />
              </FormField>

              {adjustData.quantityChange !== 0 && (
                <p
                  className={cn(
                    "text-sm font-medium",
                    adjustData.quantityChange > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  New stock will be{" "}
                  {(selectedItem.currentStock + adjustData.quantityChange).toFixed(2)}{" "}
                  {selectedItem.unit}
                </p>
              )}

              <FormField
                label="Reason"
                description="Required for audit tracking and future stock history."
              >
                <Input
                  placeholder="Restock, Usage, Correction..."
                  value={adjustData.reason}
                  onChange={(e) =>
                    setAdjustData({ ...adjustData, reason: e.target.value })
                  }
                  required
                />
              </FormField>
            </FormSection>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={adjusting}>
                {adjusting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update stock"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowAdjustModal(false)}
                disabled={adjusting}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </ModalShell>
    </div>
  );
}