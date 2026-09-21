import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { inventoryService } from "@/services/inventory.service";
import { toast } from "sonner";
import type { InventoryItemResponse } from "@/types";

type DeleteInventoryModalProps = {
  item: InventoryItemResponse | null;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteInventoryModal({
  item,
  onClose,
  onDeleted,
}: DeleteInventoryModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!item) return;

    try {
      setDeleting(true);
      await inventoryService.deleteInventoryItem(item.id);
      toast.success("Inventory item deleted");
      onDeleted();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete item");
    } finally {
      setDeleting(false);
    }
  };

  if (!item) return null;

  return (
    <ModalShell
      open={!!item}
      title={`Delete — ${item.name}`}
      description="This removes the inventory item permanently."
      onClose={onClose}
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          <p className="font-medium">
            Are you sure you want to delete this item?
          </p>
          <p className="mt-1 text-red-700/90 dark:text-red-200/80">
            {item.name} currently has {item.currentStock} {item.unit} in stock.
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
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}