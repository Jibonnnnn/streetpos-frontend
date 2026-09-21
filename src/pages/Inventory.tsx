import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { inventoryService } from "@/services/inventory.service";
import { toast } from "sonner";
import type { InventoryItemResponse } from "@/types";
import { usePagination } from "@/hooks/usePagination";
import {
  InventoryStats,
  InventoryTable,
  CreateInventoryModal,
  AdjustInventoryModal,
  DeleteInventoryModal,
} from "./Inventory/index";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItemResponse | null>(
    null,
  );
  const [deleteItem, setDeleteItem] = useState<InventoryItemResponse | null>(
    null,
  );

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
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <InventoryStats
        totalItems={items.length}
        totalValue={totalValue}
        lowStockCount={lowStockCount}
      />

      <InventoryTable
        items={paginated}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        onRefresh={fetchItems}
        onAdjust={setAdjustItem}
        onDelete={setDeleteItem}
        getItemValue={getItemValue}
        page={page}
        totalPages={totalPages}
        total={total}
        from={from}
        to={to}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <CreateInventoryModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchItems}
      />

      <AdjustInventoryModal
        item={adjustItem}
        onClose={() => setAdjustItem(null)}
        onAdjusted={fetchItems}
      />

      <DeleteInventoryModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onDeleted={fetchItems}
      />
    </div>
  );
}