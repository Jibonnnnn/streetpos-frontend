import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { BadgePill } from "@/components/common/BadgePill";
import type { ModifierGroup } from "@/types/addons";

type Props = {
  groups: ModifierGroup[];
  basePrice: number;
  initialSelectedIds?: number[];
  onConfirm: (selectedOptionIds: number[], unitPrice: number) => void;
  onCancel: () => void;
  confirmLabel?: string;
};

export function AddonPicker({
  groups,
  basePrice,
  initialSelectedIds = [],
  onConfirm,
  onCancel,
  confirmLabel = "Add to order",
}: Props) {
  const [selected, setSelected] = useState<number[]>(initialSelectedIds);

  const sortedGroups = useMemo(
    () =>
      [...groups].sort(
        (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
      ),
    [groups],
  );

  const optionPriceMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const g of groups) {
      for (const o of g.options) map.set(o.id, o.priceAdjustment);
    }
    return map;
  }, [groups]);

  const extra = selected.reduce(
    (s, id) => s + (optionPriceMap.get(id) ?? 0),
    0,
  );
  const unitPrice = basePrice + extra;

  const toggle = (group: ModifierGroup, optionId: number) => {
    setSelected((prev) => {
      const inGroupIds = new Set(group.options.map((o) => o.id));
      const withoutGroup = prev.filter((id) => !inGroupIds.has(id));

      if (group.isRequired) {
        return [...withoutGroup, optionId];
      }

      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      return [...prev, optionId];
    });
  };

  const missingRequired = sortedGroups.filter(
    (g) =>
      g.isRequired &&
      !g.options.some((o) => selected.includes(o.id)),
  );

  const handleConfirm = () => {
    if (missingRequired.length > 0) return;
    onConfirm(selected, unitPrice);
  };

  if (sortedGroups.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">No add-ons for this item.</p>
        <div className="flex gap-3">
          <Button
            className="flex-1 rounded-2xl py-6"
            onClick={() => onConfirm([], basePrice)}
          >
            {confirmLabel} — ₱{basePrice.toFixed(2)}
          </Button>
          <Button variant="outline" className="flex-1 rounded-2xl py-6" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedGroups.map((group) => (
        <div key={group.id}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="font-medium">{group.name}</h3>
            {group.isRequired ? (
              <BadgePill tone="warning">Required</BadgePill>
            ) : (
              <BadgePill tone="neutral">Optional</BadgePill>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {group.options.map((option) => {
              const checked = selected.includes(option.id);
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors ${
                    checked
                      ? "border-amber-400 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-950/30"
                      : "hover:bg-amber-50/50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <input
                    type={group.isRequired ? "radio" : "checkbox"}
                    name={`addon-group-${group.id}`}
                    checked={checked}
                    onChange={() => toggle(group, option.id)}
                    className="h-4 w-4"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{option.name}</div>
                    {option.priceAdjustment > 0 ? (
                      <div className="text-xs text-emerald-600">
                        +₱{option.priceAdjustment.toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Included</div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {missingRequired.length > 0 && (
        <p className="text-sm text-red-500">
          Please choose: {missingRequired.map((g) => g.name).join(", ")}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <Button
          className="flex-1 rounded-2xl py-6 text-lg"
          onClick={handleConfirm}
          disabled={missingRequired.length > 0}
        >
          {confirmLabel} — ₱{unitPrice.toFixed(2)}
        </Button>
        <Button
          variant="outline"
          className="flex-1 rounded-2xl py-6"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}