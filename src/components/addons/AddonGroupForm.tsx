import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { Plus, Trash2 } from "lucide-react";
import type { AddonGroupForm, AddonOptionForm } from "@/types/addons";

function newKey() {
  return Math.random().toString(36).slice(2, 10);
}

type Props = {
  initial?: AddonGroupForm;
  onSubmit: (value: AddonGroupForm) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
};

export function AddonGroupFormFields({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save Add-on Group",
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [isRequired, setIsRequired] = useState(initial?.isRequired ?? false);
  const [displayOrder, setDisplayOrder] = useState(initial?.displayOrder ?? 0);
  const [options, setOptions] = useState<AddonOptionForm[]>(
    initial?.options?.length
      ? initial.options
      : [{ key: newKey(), name: "", priceAdjustment: 0 }],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      { key: newKey(), name: "", priceAdjustment: 0 },
    ]);
  };

  const updateOption = (
    key: string,
    patch: Partial<Pick<AddonOptionForm, "name" | "priceAdjustment">>,
  ) => {
    setOptions((prev) =>
      prev.map((o) => (o.key === key ? { ...o, ...patch } : o)),
    );
  };

  const removeOption = (key: string) => {
    setOptions((prev) =>
      prev.length <= 1 ? prev : prev.filter((o) => o.key !== key),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Group name is required.");
      return;
    }

    const cleanOptions = options
      .map((o) => ({
        ...o,
        name: o.name.trim(),
        priceAdjustment: Math.max(0, Number(o.priceAdjustment) || 0),
      }))
      .filter((o) => o.name.length > 0);

    if (cleanOptions.length === 0) {
      setError("Add at least one option with a name.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        key: initial?.key ?? newKey(),
        name: name.trim(),
        isRequired,
        displayOrder: Number(displayOrder) || 0,
        options: cleanOptions,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
          {error}
        </p>
      ) : null}

      <FormField label="Group name" description='e.g. "Add-ons", "Size", "Milk type"'>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add-ons"
          className="rounded-xl"
        />
      </FormField>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Required (customer must choose)
        </label>

        <FormField label="Display order" className="w-32">
          <Input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            className="rounded-xl"
          />
        </FormField>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Options (with price)</p>
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={addOption}>
            <Plus className="mr-1 h-4 w-4" />
            Add option
          </Button>
        </div>

        <div className="space-y-2">
          {options.map((opt) => (
            <div
              key={opt.key}
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3"
            >
              <Input
                placeholder="Option name (e.g. Extra shot)"
                value={opt.name}
                onChange={(e) => updateOption(opt.key, { name: e.target.value })}
                className="min-w-[10rem] flex-1 rounded-xl"
              />
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">₱</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={opt.priceAdjustment}
                  onChange={(e) =>
                    updateOption(opt.key, {
                      priceAdjustment: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-28 rounded-xl"
                />
              </div>
              <button
                type="button"
                onClick={() => removeOption(opt.key)}
                className="rounded-xl p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                aria-label="Remove option"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1 rounded-2xl" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-2xl"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}