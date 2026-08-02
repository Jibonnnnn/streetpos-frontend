import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BadgePill } from "@/components/common/BadgePill";
import { addonService } from "@/services/addon.service";
import { toast } from "sonner";
import { Link2, Unlink, Loader2 } from "lucide-react";
import type { ModifierGroup } from "@/types/addons";

type Props = {
  menuItemId?: number | null;
  selectedGroupIds?: number[];
  onSelectedGroupIdsChange?: (ids: number[]) => void;
  onChange?: () => void;
};

export function MenuItemAddonsSection({
  menuItemId,
  selectedGroupIds,
  onSelectedGroupIdsChange,
  onChange,
}: Props) {
  const queryClient = useQueryClient();
  const [allGroups, setAllGroups] = useState<ModifierGroup[]>([]);
  const [linkedIds, setLinkedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const isControlled = selectedGroupIds !== undefined;
  const activeIds = isControlled ? selectedGroupIds! : linkedIds;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const allRes = await addonService.getAll();
        if (cancelled) return;
        setAllGroups(allRes.data ?? []);

        if (menuItemId) {
          const linkedRes = await addonService.getByMenuItem(menuItemId);
          if (cancelled) return;
          setLinkedIds((linkedRes.data ?? []).map((g: ModifierGroup) => g.id));
        }
      } catch {
        if (!cancelled) toast.error("Failed to load add-ons");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [menuItemId]);

  const toggle = async (groupId: number) => {
    const isOn = activeIds.includes(groupId);

    if (isControlled) {
      const next = isOn
        ? activeIds.filter((id) => id !== groupId)
        : [...activeIds, groupId];
      onSelectedGroupIdsChange?.(next);
      return;
    }

    if (!menuItemId) return;

    try {
      setBusyId(groupId);
      if (isOn) {
        await addonService.detachFromMenuItem(menuItemId, groupId);
        setLinkedIds((prev) => prev.filter((id) => id !== groupId));
        toast.success("Add-on group removed from item");
      } else {
        await addonService.attachToMenuItem(menuItemId, groupId);
        setLinkedIds((prev) => [...prev, groupId]);
        toast.success("Add-on group attached");
      }

      await queryClient.invalidateQueries({ queryKey: ["menu"] });
      onChange?.();
      window.dispatchEvent(new Event("menu-items-updated"));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update add-ons");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading add-ons…
      </div>
    );
  }

  if (allGroups.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        No add-on groups yet. Create them on the{" "}
        <span className="font-medium text-foreground">Add-ons</span> page first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select which add-on groups apply to this menu item. Customers will see
        them when ordering (POS and online).
      </p>
      <div className="space-y-2">
        {allGroups.map((g) => {
          const on = activeIds.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggle(g.id)}
              disabled={busyId === g.id}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                on
                  ? "border-amber-300 bg-amber-50/80 dark:border-amber-500/40 dark:bg-amber-950/30"
                  : "border-border/60 bg-white hover:bg-zinc-50 dark:bg-zinc-900/40 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{g.name}</span>
                  {g.isRequired ? (
                    <BadgePill tone="warning">Required</BadgePill>
                  ) : (
                    <BadgePill tone="neutral">Optional</BadgePill>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {g.options
                    .map(
                      (o) =>
                        `${o.name}${
                          o.priceAdjustment > 0
                            ? ` +₱${o.priceAdjustment.toFixed(0)}`
                            : ""
                        }`,
                    )
                    .join(" · ")}
                </p>
              </div>
              <span className="shrink-0 text-muted-foreground">
                {busyId === g.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : on ? (
                  <Unlink className="h-4 w-4 text-amber-600" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
              </span>
            </button>
          );
        })}
      </div>
      {!menuItemId && isControlled ? (
        <p className="text-xs text-muted-foreground">
          Groups will be attached after the menu item is created.
        </p>
      ) : null}
    </div>
  );
}

export async function attachGroupsAfterCreate(
  menuItemId: number,
  groupIds: number[],
) {
  if (!groupIds.length) return;
  await addonService.setMenuItemGroups(menuItemId, groupIds);
}