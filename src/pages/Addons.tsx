import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgePill } from "@/components/common/BadgePill";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { AddonGroupFormFields } from "@/components/addons/AddonGroupForm";
import { addonService } from "@/services/addon.service";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw, Layers } from "lucide-react";
import type { ModifierGroup, AddonGroupForm } from "@/types/addons";

function toForm(g: ModifierGroup): AddonGroupForm {
  return {
    key: String(g.id),
    name: g.name,
    isRequired: g.isRequired,
    displayOrder: g.displayOrder,
    options: g.options.map((o) => ({
      key: String(o.id),
      name: o.name,
      priceAdjustment: o.priceAdjustment,
    })),
  };
}

function toRequest(form: AddonGroupForm) {
  return {
    name: form.name,
    isRequired: form.isRequired,
    displayOrder: form.displayOrder,
    options: form.options.map((o) => ({
      name: o.name,
      priceAdjustment: o.priceAdjustment,
    })),
  };
}

export default function AddonsPage() {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ModifierGroup | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await addonService.getAll();
      setGroups(res.data ?? []);
    } catch {
      toast.error("Failed to load add-ons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (g: ModifierGroup) => {
    setEditing(g);
    setModalOpen(true);
  };

  const handleSave = async (form: AddonGroupForm) => {
    const body = toRequest(form);
    if (editing) {
      await addonService.update(editing.id, body);
      toast.success("Add-on group updated");
    } else {
      await addonService.create(body);
      toast.success("Add-on group created");
    }
    setModalOpen(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (g: ModifierGroup) => {
    if (
      !window.confirm(
        `Delete add-on group "${g.name}"? It will be removed from all menu items.`,
      )
    ) {
      return;
    }
    try {
      await addonService.delete(g.id);
      toast.success("Add-on group deleted");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-6">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Add-ons
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create reusable groups of extras with prices (e.g. Extra shot ₱25).
            Attach them to menu items from the Menu page.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button className="rounded-2xl gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Add-on Group
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-20 text-center">
          <Layers className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">No add-on groups yet.</p>
          <Button className="mt-4 rounded-2xl" onClick={openCreate}>
            Create your first group
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <Card
              key={g.id}
              className="border-border/60 bg-white/90 shadow-sm dark:bg-zinc-950/60"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-lg font-semibold tracking-tight">
                        {g.name}
                      </h2>
                      {g.isRequired ? (
                        <BadgePill tone="warning">Required</BadgePill>
                      ) : (
                        <BadgePill tone="neutral">Optional</BadgePill>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Order {g.displayOrder} · {g.options.length} option
                      {g.options.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl"
                      onClick={() => openEdit(g)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl text-red-500"
                      onClick={() => handleDelete(g)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <ul className="mt-4 space-y-1.5">
                  {g.options.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/50"
                    >
                      <span>{o.name}</span>
                      <span className="font-medium text-amber-600">
                        {o.priceAdjustment > 0
                          ? `+₱${o.priceAdjustment.toFixed(2)}`
                          : "₱0.00"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ModalShell
        open={modalOpen}
        title={editing ? "Edit Add-on Group" : "New Add-on Group"}
        description="Options can have an extra price charged on top of the menu item."
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        className="max-w-lg"
      >
        <AddonGroupFormFields
          key={editing?.id ?? "new"}
          initial={editing ? toForm(editing) : undefined}
          onSubmit={handleSave}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          submitLabel={editing ? "Update Group" : "Create Group"}
        />
      </ModalShell>
    </div>
  );
}