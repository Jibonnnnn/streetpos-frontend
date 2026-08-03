import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgePill } from "@/components/common/BadgePill";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { inventoryService } from "@/services/inventory.service";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "sonner";
import {
  Plus,
  Package,
  AlertTriangle,
  RefreshCw,
  Banknote,
  Boxes,
  Trash2,
} from "lucide-react";
import type { InventoryItemResponse } from "@/types";

const emptyCreate = {
  name: "",
  description: "",
  initialStock: 0,
  unit: "unit",
  reorderPoint: 0,
  reorderQuantity: 1,
  unitCost: 0,
};

const emptyAdjust = {
  quantityChange: 0,
  reason: "",
  unitCost: 0,
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [creating, setCreating] = useState(false);

  const [adjustItem, setAdjustItem] = useState<InventoryItemResponse | null>(
    null,
  );
  const [adjustForm, setAdjustForm] = useState(emptyAdjust);
  const [adjusting, setAdjusting] = useState(false);

  const [deleteItem, setDeleteItem] = useState<InventoryItemResponse | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getInventory();
      setItems(res.data || []);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) || i.unit?.toLowerCase().includes(q),
    );
  }, [items, search]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    total,
    paginated,
    from,
    to,
  } = usePagination(filtered, 10);

  const getItemValue = (item: InventoryItemResponse) => {
    const stock = Number(item.currentStock ?? 0);
    const cost = Number(item.unitCost ?? 0);
    return stock * cost;
  };
  const totalValue = items.reduce((s, i) => s + getItemValue(i), 0);
  const lowStockCount = items.filter((i) => i.isLowStock).length;

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (createForm.unitCost < 0) {
      toast.error("Unit cost cannot be negative");
      return;
    }

    try {
      setCreating(true);
      await inventoryService.createInventoryItem({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        initialStock: createForm.initialStock,
        unit: createForm.unit.trim() || "unit",
        reorderPoint: createForm.reorderPoint,
        reorderQuantity: createForm.reorderQuantity,
        unitCost: createForm.unitCost,
      });
      toast.success("Inventory item created");
      setShowCreate(false);
      setCreateForm(emptyCreate);
      fetchItems();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create item");
    } finally {
      setCreating(false);
    }
  };

  const openAdjust = (item: InventoryItemResponse) => {
    setAdjustItem(item);
    setAdjustForm({
      quantityChange: 0,
      reason: "",
      unitCost: item.unitCost ?? 0,
    });
  };

  const handleAdjust = async () => {
    if (!adjustItem) return;
    if (adjustForm.quantityChange === 0) {
      toast.error("Quantity change cannot be zero");
      return;
    }
    if (adjustForm.quantityChange > 0 && adjustForm.unitCost <= 0) {
      toast.error("Unit cost is required when restocking");
      return;
    }

    try {
      setAdjusting(true);
      await inventoryService.adjustInventoryItem(adjustItem.id, {
        quantityChange: adjustForm.quantityChange,
        reason: adjustForm.reason.trim() || "Stock adjustment",
        unitCost:
          adjustForm.quantityChange > 0 ? adjustForm.unitCost : undefined,
      });
      toast.success(
        adjustForm.quantityChange > 0 ? "Stock restocked" : "Stock deducted",
      );
      setAdjustItem(null);
      setAdjustForm(emptyAdjust);
      fetchItems();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to adjust stock");
    } finally {
      setAdjusting(false);
    }
  };

  const openDelete = (item: InventoryItemResponse) => {
    setDeleteItem(item);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      await inventoryService.deleteInventoryItem(deleteItem.id);
      toast.success("Inventory item deleted");
      setDeleteItem(null);
      fetchItems();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete item");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Inventory
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track stock levels, unit costs, and inventory value.
          </p>
        </div>
        <Button
          className="rounded-2xl gap-2"
          onClick={() => {
            setCreateForm(emptyCreate);
            setShowCreate(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/40 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:from-zinc-950 dark:to-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Boxes className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Total Items
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold">
              {items.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:from-zinc-950 dark:to-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <Banknote className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Inventory Value
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold">
              ₱
              {totalValue.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:from-zinc-950 dark:to-zinc-900/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Low Stock
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold">
              {lowStockCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-950/50">
        <CardContent className="p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Stock List
              </h2>
              <p className="text-sm text-muted-foreground">
                Unit cost and stock value per item.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search inventory..."
                className="max-w-xs rounded-2xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={fetchItems}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p>No inventory items found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Item</th>
                    <th className="pb-3 pr-4 font-medium">Stock</th>
                    <th className="pb-3 pr-4 font-medium">Unit Cost</th>
                    <th className="pb-3 pr-4 font-medium">Value</th>
                    <th className="pb-3 pr-4 font-medium">Reorder</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="py-3.5 pr-4">
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-3.5 pr-4">
                        ₱
                        {(item.unitCost ?? 0).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 pr-4 font-medium text-amber-700 dark:text-amber-400">
                        ₱
                        {getItemValue(item).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        ≤ {item.reorderPoint} {item.unit}
                      </td>
                      <td className="py-3.5 pr-4">
                        <BadgePill
                          tone={item.isLowStock ? "warning" : "success"}
                        >
                          {item.isLowStock ? "Low" : "OK"}
                        </BadgePill>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => openAdjust(item)}
                          >
                            Adjust
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                            onClick={() => openDelete(item)}
                          >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                from={from}
                to={to}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreate && (
        <ModalShell
          open={showCreate}
          title="Add Inventory Item"
          description="Set initial stock and unit cost."
          onClose={() => setShowCreate(false)}
          className="max-w-lg"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <Input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="Coffee Beans"
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Description
              </label>
              <Input
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
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
                  value={createForm.initialStock}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      initialStock: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Unit</label>
                <Input
                  value={createForm.unit}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, unit: e.target.value })
                  }
                  placeholder="kg, pcs, L..."
                  className="rounded-xl"
                />
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
                value={createForm.unitCost}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    unitCost: parseFloat(e.target.value) || 0,
                  })
                }
                className="rounded-xl"
              />
              {createForm.initialStock > 0 && createForm.unitCost > 0 && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Opening value: ₱
                  {(
                    createForm.initialStock * createForm.unitCost
                  ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
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
                  value={createForm.reorderPoint}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
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
                  value={createForm.reorderQuantity}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
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
                onClick={() => setShowCreate(false)}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Adjust Modal */}
      {adjustItem && (
        <ModalShell
          open={!!adjustItem}
          title={`Adjust — ${adjustItem.name}`}
          description={`Current stock: ${adjustItem.currentStock} ${adjustItem.unit}`}
          onClose={() => setAdjustItem(null)}
          className="max-w-md"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Quantity Change
              </label>
              <Input
                type="number"
                value={adjustForm.quantityChange}
                onChange={(e) =>
                  setAdjustForm({
                    ...adjustForm,
                    quantityChange: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="+10 to restock, -5 to remove"
                className="rounded-xl"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Use positive to restock, negative to deduct.
              </p>
            </div>

            {adjustForm.quantityChange > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Unit Cost (₱) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={adjustForm.unitCost}
                  onChange={(e) =>
                    setAdjustForm({
                      ...adjustForm,
                      unitCost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="rounded-xl"
                />
                {adjustForm.unitCost > 0 && (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Line total: ₱
                    {(
                      adjustForm.quantityChange * adjustForm.unitCost
                    ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">Reason</label>
              <Input
                value={adjustForm.reason}
                onChange={(e) =>
                  setAdjustForm({ ...adjustForm, reason: e.target.value })
                }
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
                {adjusting ? "Saving..." : "Save Adjustment"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setAdjustItem(null)}
                disabled={adjusting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Delete Modal */}
      {deleteItem && (
        <ModalShell
          open={!!deleteItem}
          title={`Delete — ${deleteItem.name}`}
          description="This removes the inventory item permanently."
          onClose={() => setDeleteItem(null)}
          className="max-w-md"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
              <p className="font-medium">
                Are you sure you want to delete this item?
              </p>
              <p className="mt-1 text-red-700/90 dark:text-red-200/80">
                {deleteItem.name} currently has {deleteItem.currentStock}{" "}
                {deleteItem.unit} in stock.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl"
              >
                {deleting ? "Deleting..." : "Delete Item"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDeleteItem(null)}
                disabled={deleting}
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
