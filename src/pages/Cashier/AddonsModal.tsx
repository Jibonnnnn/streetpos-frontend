import { ModalShell } from "@/components/dialogs/ModalShell";
import { Input } from "@/components/ui/input";
import { AddonPicker } from "@/components/addons/AddonPicker";
import { Loader2 } from "lucide-react";
import type { MenuItem } from "@/types";
import type { ModifierGroup } from "@/types/addons";

type Props = {
  open: boolean;
  item: MenuItem | null;
  groups: ModifierGroup[];
  loading: boolean;
  note: string;
  onNoteChange: (v: string) => void;
  onConfirm: (selectedOptionIds: number[], unitPrice: number) => void;
  onClose: () => void;
};

export function AddonsModal({
  open,
  item,
  groups,
  loading,
  note,
  onNoteChange,
  onConfirm,
  onClose,
}: Props) {
  if (!open || !item) return null;

  return (
    <ModalShell
      open={open}
      title={item.name}
      description={`Base price: ₱${item.price.toFixed(2)} · choose the add-ons for this item`}
      onClose={onClose}
      className="max-w-md"
    >
      <div className="space-y-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading add-ons…
          </div>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium">Notes</label>
              <Input
                placeholder="No ice, extra sugar..."
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
              />
            </div>
            <AddonPicker
              groups={groups}
              basePrice={item.price}
              onConfirm={onConfirm}
              onCancel={onClose}
              confirmLabel="Add to order"
            />
          </>
        )}
      </div>
    </ModalShell>
  );
}