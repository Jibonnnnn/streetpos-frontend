import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgePill } from "@/components/common/BadgePill";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { promotionService } from "@/services/promotion.service";
import { menuService } from "@/services/menu.service";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Power,
  Tag,
  Percent,
  Gift,
  Clock,
  Banknote,
} from "lucide-react";
import type { Promotion, CreatePromotionRequest, MenuItem } from "@/types";

const emptyForm: CreatePromotionRequest = {
  name: "",
  description: "",
  type: "Percentage",
  value: 10,
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
  minOrderAmount: undefined,
  menuItemIds: [],
};

const typeMeta: Record<
  string,
  { icon: React.ElementType; color: string; label: (v: number) => string }
> = {
  Percentage: {
    icon: Percent,
    color: "from-amber-500 to-orange-600",
    label: (v) => `${v}% off`,
  },
  FixedAmount: {
    icon: Banknote,
    color: "from-emerald-500 to-teal-600",
    label: (v) => `₱${v} off`,
  },
  BuyOneGetOne: {
    icon: Gift,
    color: "from-violet-500 to-purple-600",
    label: () => "Buy 1 Get 1",
  },
  HappyHour: {
    icon: Clock,
    color: "from-blue-500 to-cyan-600",
    label: (v) => `${v}% Happy Hour`,
  },
};

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<CreatePromotionRequest>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [promoRes, menuRes] = await Promise.all([
        promotionService.getAll(),
        menuService.getMenu(true),
      ]);
      setPromos(promoRes.data || []);
      setMenuItems(menuRes.data || []);
    } catch {
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      type: p.type,
      value: p.value,
      startDate: p.startDate.slice(0, 16),
      endDate: p.endDate.slice(0, 16),
      availableFrom: p.availableFrom?.slice(0, 5),
      availableUntil: p.availableUntil?.slice(0, 5),
      minOrderAmount: p.minOrderAmount,
      menuItemIds: p.menuItemIds || [],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.value <= 0) {
      toast.error("Value must be greater than 0");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };

      if (editing) {
        await promotionService.update(editing.id, {
          ...payload,
          isActive: editing.isActive,
        });
        toast.success("Promotion updated");
      } else {
        await promotionService.create(payload);
        toast.success("Promotion created");
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save promotion");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await promotionService.toggle(id);
      toast.success("Status updated");
      fetchData();
    } catch {
      toast.error("Failed to toggle promotion");
    }
  };

  const filtered = promos.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = promos.filter((p) => p.isActive).length;
  const totalUsage = promos.reduce((s, p) => s + (p.usageCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Promotions & Discounts
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create offers cashiers can apply at checkout.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-2xl gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          New Promotion
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-950/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <Tag className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Total Promotions
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold">
              {promos.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-950/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Power className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Active Now
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold">
              {activeCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-950/50">
          <CardContent className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Gift className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Times Used
            </p>
            <p className="mt-1 font-heading text-3xl font-semibold">
              {totalUsage}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-950/50">
        <CardContent className="p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                All Promotions
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage validity, value, and applicable items.
              </p>
            </div>
            <Input
              placeholder="Search promotions..."
              className="max-w-xs rounded-2xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
              <Tag className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p>No promotions found.</p>
              <Button
                variant="outline"
                className="mt-4 rounded-2xl"
                onClick={openCreate}
              >
                Create your first promotion
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => {
                const meta = typeMeta[p.type] || typeMeta.Percentage;
                const Icon = meta.icon;

                return (
                  <div
                    key={p.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-zinc-50/80 p-4 transition-colors hover:bg-zinc-100/80 sm:flex-row sm:items-center sm:justify-between dark:bg-zinc-900/40 dark:hover:bg-zinc-900/70"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.color} text-white shadow-sm`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{p.name}</p>
                          <BadgePill tone={p.isActive ? "success" : "danger"}>
                            {p.isActive ? "Active" : "Inactive"}
                          </BadgePill>
                          <BadgePill tone="info">
                            {meta.label(p.value)}
                          </BadgePill>
                        </div>
                        {p.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {p.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(p.startDate).toLocaleDateString()} →{" "}
                          {new Date(p.endDate).toLocaleDateString()}
                          {p.minOrderAmount
                            ? ` · Min ₱${p.minOrderAmount}`
                            : ""}
                          {p.usageCount > 0
                            ? ` · Used ${p.usageCount}×`
                            : ""}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {p.menuItemNames?.length
                            ? `Items: ${p.menuItemNames.join(", ")}`
                            : "Applies to all menu items"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => openEdit(p)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`rounded-xl ${
                          p.isActive
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                        onClick={() => handleToggle(p.id)}
                      >
                        <Power className="h-4 w-4" />
                        <span className="ml-1.5 hidden sm:inline">
                          {p.isActive ? "Disable" : "Enable"}
                        </span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      {showModal && (
        <ModalShell
          open={showModal}
          title={editing ? "Edit Promotion" : "New Promotion"}
          description="Set discount type, value, and validity period."
          onClose={() => setShowModal(false)}
          className="max-w-lg"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Happy Hour 20% Off"
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Description
              </label>
              <Input
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Type</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as CreatePromotionRequest["type"],
                    })
                  }
                >
                  <option value="Percentage">Percentage</option>
                  <option value="FixedAmount">Fixed Amount</option>
                  <option value="BuyOneGetOne">Buy 1 Get 1</option>
                  <option value="HappyHour">Happy Hour</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Value{" "}
                  {form.type === "FixedAmount" || form.type === "BuyOneGetOne"
                    ? "(₱)"
                    : "(%)"}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="rounded-xl"
                  disabled={form.type === "BuyOneGetOne"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Start</label>
                <Input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">End</label>
                <Input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Min Order Amount (optional)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.minOrderAmount ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minOrderAmount: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Applicable Items{" "}
                <span className="text-muted-foreground">(empty = all)</span>
              </label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-border/60 p-3">
                {menuItems
                  .filter((m) => m.isActive)
                  .map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.menuItemIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({
                              ...form,
                              menuItemIds: [...form.menuItemIds, item.id],
                            });
                          } else {
                            setForm({
                              ...form,
                              menuItemIds: form.menuItemIds.filter(
                                (id) => id !== item.id,
                              ),
                            });
                          }
                        }}
                      />
                      {item.name}
                    </label>
                  ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowModal(false)}
                disabled={saving}
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