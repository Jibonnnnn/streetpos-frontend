import { useState, useEffect, useCallback, useMemo } from "react";
import { menuService } from "@/services/menu.service";
import { inventoryService } from "@/services/inventory.service";
import { categoryService } from "@/services/category.service";
import type {
  MenuItem,
  MenuItemInventoryLinkRequest,
  InventoryItemResponse,
  Category,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Edit,
  ImageIcon,
  RefreshCw,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/layout";
import { getFullImageUrl } from "@/lib/imageUtils";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { BadgePill } from "@/components/common/BadgePill";
import { FormField } from "@/components/forms/form-field";
import { FormSection } from "@/components/forms/form-section";
import {
  MenuItemAddonsSection,
  attachGroupsAfterCreate,
} from "@/components/addons/MenuItemAddonsSection";

const emptyForm = {
  name: "",
  description: "",
  categoryId: 0,
  price: 0,
  displayOrder: 0,
  availableFrom: "",
  availableUntil: "",
  inventoryLinks: [] as MenuItemInventoryLinkRequest[],
};

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>(
    [],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAddonsModal, setShowAddonsModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingAddonsItem, setEditingAddonsItem] = useState<MenuItem | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [formData, setFormData] = useState({ ...emptyForm });
  const [selectedAddonGroupIds, setSelectedAddonGroupIds] = useState<number[]>(
    [],
  );

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    displayOrder: 0,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const ingredientOptions = useMemo(() => {
    const active = inventoryItems.filter((i) => i.isActive);
    const linkedIds = new Set(
      formData.inventoryLinks.map((l) => l.inventoryItemId),
    );
    return [
      ...active,
      ...inventoryItems.filter(
        (i) => linkedIds.has(i.id) && !active.some((a) => a.id === i.id),
      ),
    ];
  }, [inventoryItems, formData.inventoryLinks]);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await menuService.getMenu(/* includeInactive? */ true);
      setMenuItems(res.data ?? res ?? []);
    } catch {
      toast.error("Failed to load menu items");
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await inventoryService.getInventory();
      setInventoryItems(res.data ?? res ?? []);
    } catch {
      /* optional */
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getAll();
      setCategories(res.data ?? res ?? []);
    } catch {
      toast.error("Failed to load categories");
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMenu(), fetchInventory(), fetchCategories()]);
    setLoading(false);
  }, [fetchMenu, fetchInventory, fetchCategories]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setSelectedAddonGroupIds([]);
    setImageFile(null);
    setImagePreview(null);
    setEditingItem(null);
  };

  const openCreate = () => {
    resetForm();
    if (categories.length > 0) {
      setFormData((prev) => ({
        ...prev,
        categoryId: categories[0].id,
      }));
    }
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description ?? "",
      categoryId: item.categoryId,
      price: item.price,
      displayOrder: item.displayOrder ?? 0,
      availableFrom: item.availableFrom
        ? String(item.availableFrom).slice(0, 5)
        : "",
      availableUntil: item.availableUntil
        ? String(item.availableUntil).slice(0, 5)
        : "",
      inventoryLinks: (item.inventoryLinks ?? []).map((l) => ({
        inventoryItemId: l.inventoryItemId,
        quantityUsedPerUnit: l.quantityUsedPerUnit,
      })),
    });
    // Edit mode: MenuItemAddonsSection loads linked groups itself via menuItemId
    setSelectedAddonGroupIds(
      (item.modifierGroups ?? []).map((g) => g.id).filter(Boolean),
    );
    setImageFile(null);
    setImagePreview(
      item.imageFileName || item.imageUrl
        ? getFullImageUrl(item.imageFileName ?? item.imageUrl) || null
        : null,
    );
    setShowModal(true);
  };

  const openAddons = (item: MenuItem) => {
    setEditingAddonsItem(item);
    setShowAddonsModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const closeAddonsModal = () => {
    setShowAddonsModal(false);
    setEditingAddonsItem(null);
  };

  const addInventoryLink = () => {
    const first = ingredientOptions[0];
    if (!first) {
      toast.error("No inventory items available");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      inventoryLinks: [
        ...prev.inventoryLinks,
        { inventoryItemId: first.id, quantityUsedPerUnit: 1 },
      ],
    }));
  };

  const updateInventoryLink = (
    index: number,
    patch: Partial<MenuItemInventoryLinkRequest>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      inventoryLinks: prev.inventoryLinks.map((l, i) =>
        i === index ? { ...l, ...patch } : l,
      ),
    }));
  };

  const removeInventoryLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      inventoryLinks: prev.inventoryLinks.filter((_, i) => i !== index),
    }));
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.categoryId) {
      toast.error("Category is required");
      return;
    }
    if (formData.price < 0) {
      toast.error("Price cannot be negative");
      return;
    }

    setSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name.trim());
    formDataToSend.append("categoryId", String(formData.categoryId));
    formDataToSend.append("price", String(formData.price));
    formDataToSend.append("displayOrder", String(formData.displayOrder || 0));
    formDataToSend.append("description", formData.description.trim());

    if (formData.availableFrom)
      formDataToSend.append("availableFrom", formData.availableFrom);
    if (formData.availableUntil)
      formDataToSend.append("availableUntil", formData.availableUntil);

    formDataToSend.append(
      "inventoryLinks",
      JSON.stringify(formData.inventoryLinks || []),
    );

    if (imageFile) {
      formDataToSend.append("image", imageFile);
    }

    try {
      if (editingItem) {
        await menuService.updateMenuItem(editingItem.id, formDataToSend);
        // Groups are already attached/detached live by MenuItemAddonsSection in edit mode
        toast.success("Menu item updated successfully!");
      } else {
        const created = await menuService.createMenuItem(formDataToSend);
        // Support both axios-style { data } and plain object returns
        const newId =
          (created as any)?.data?.id ?? (created as any)?.id ?? null;

        if (newId && selectedAddonGroupIds.length > 0) {
          await attachGroupsAfterCreate(newId, selectedAddonGroupIds);
        }

        toast.success("Menu item created successfully!");
      }

      closeModal();
      await Promise.all([fetchMenu(), fetchCategories()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save menu item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categorySubmitting || !categoryForm.name.trim()) return;

    setCategorySubmitting(true);
    try {
      await categoryService.create(categoryForm);
      toast.success("Category created successfully!");
      setShowCategoryModal(false);
      setCategoryForm({ name: "", description: "", displayOrder: 0 });
      await fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create category");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (
      !confirm("Disable this menu item? It will no longer appear in the POS.")
    )
      return;
    try {
      await menuService.disableMenuItem(id);
      toast.success("Menu item disabled");
      fetchMenu();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to disable menu item",
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      setDeleteSubmitting(true);
      await menuService.deleteMenuItem(deletingItem.id);
      toast.success("Menu item deleted");
      setDeletingItem(null);
      fetchMenu();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete menu item");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await menuService.activateMenuItem(id);
      toast.success("Menu item enabled");
      fetchMenu();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to enable menu item");
    }
  };

  const columns = [
    {
      key: "image",
      accessor: "imageFileName" as keyof MenuItem,
      header: "Image",
      className: "w-20",
      render: (row: MenuItem) => {
        const src = getFullImageUrl(row.imageFileName ?? row.imageUrl);
        return src ? (
          <img src={src} alt="" className="h-10 w-10 rounded-xl object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        );
      },
    },
    {
      key: "name",
      accessor: "name" as keyof MenuItem,
      header: "Item",
      className: "min-w-56",
      render: (row: MenuItem) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.categoryName}</p>
        </div>
      ),
    },
    {
      key: "price",
      accessor: "price" as keyof MenuItem,
      header: "Price",
      className: "w-28",
      render: (row: MenuItem) => (
        <span className="font-semibold text-amber-600">
          ₱{Number(row.price).toFixed(2)}
        </span>
      ),
    },
    {
      key: "addons",
      accessor: "id" as keyof MenuItem,
      header: "Add-ons",
      className: "w-28",
      render: (row: MenuItem) => {
        const count = row.modifierGroups?.length ?? 0;
        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto rounded-full px-0 text-left hover:bg-transparent"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openAddons(row);
            }}
          >
            {count > 0 ? (
              <BadgePill tone="info">
                {count} group{count !== 1 ? "s" : ""}
              </BadgePill>
            ) : (
              <span className="text-xs text-muted-foreground underline decoration-dotted underline-offset-4">
                Choose groups
              </span>
            )}
          </Button>
        );
      },
    },
    {
      key: "status",
      accessor: "isActive" as keyof MenuItem,
      header: "Status",
      className: "w-28",
      render: (row: MenuItem) =>
        row.isActive ? (
          <BadgePill tone="success">Active</BadgePill>
        ) : (
          <BadgePill tone="neutral">Disabled</BadgePill>
        ),
    },
    {
      key: "actions",
      accessor: "id" as keyof MenuItem,
      header: "",
      className: "w-40",
      render: (row: MenuItem) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => openEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {row.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-red-500"
              onClick={() => handleDeactivate(row.id)}
            >
              Disable
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => handleActivate(row.id)}
            >
              Enable
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            onClick={() => setDeletingItem(row)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Menu Management"
        description="Create items, link inventory, and attach add-on groups for POS and online orders."
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={loadAll}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => setShowCategoryModal(true)}
            >
              New Category
            </Button>
            <Button className="rounded-2xl gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New Menu Item
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={menuItems}
          emptyMessage="No menu items yet. Create your first item."
        />
      )}

      <ModalShell
        open={showAddonsModal}
        title={
          editingAddonsItem ? `${editingAddonsItem.name} Add-ons` : "Add-ons"
        }
        description="Attach the groups that should appear for this menu item in POS and online ordering."
        onClose={closeAddonsModal}
        className="max-w-2xl"
        overlayClassName="bg-zinc-950/35 backdrop-blur-[0.5px]"
      >
        {editingAddonsItem ? (
          <MenuItemAddonsSection
            menuItemId={editingAddonsItem.id}
            onChange={fetchMenu}
          />
        ) : null}
      </ModalShell>

      <ModalShell
        open={!!deletingItem}
        title={
          deletingItem ? `Delete ${deletingItem.name}` : "Delete menu item"
        }
        description="This permanently removes the menu item from management."
        onClose={() => setDeletingItem(null)}
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
            <p className="font-medium">
              Are you sure you want to delete this menu item?
            </p>
            <p className="mt-1 text-red-700/90 dark:text-red-200/80">
              {deletingItem?.name} will be removed from the menu list.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSubmitting}
              className="flex-1 rounded-xl"
            >
              {deleteSubmitting ? "Deleting..." : "Delete Item"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDeletingItem(null)}
              disabled={deleteSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </ModalShell>

      {/* ========== CREATE / EDIT MENU ITEM ========== */}
      <ModalShell
        open={showModal}
        title={editingItem ? "Edit Menu Item" : "New Menu Item"}
        description="Price, category, ingredients, and add-on groups."
        onClose={closeModal}
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection title="Basics">
            <FormField label="Name">
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Iced Latte"
                className="rounded-xl"
              />
            </FormField>

            <FormField label="Description">
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Optional short description"
                className="rounded-xl"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category">
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={formData.categoryId || ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      categoryId: Number(e.target.value),
                    }))
                  }
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Price (₱)">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="rounded-xl"
                />
              </FormField>
            </div>

            <FormField label="Display order">
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    displayOrder: Number(e.target.value) || 0,
                  }))
                }
                className="rounded-xl w-32"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Available from">
                <Input
                  type="time"
                  value={formData.availableFrom}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      availableFrom: e.target.value,
                    }))
                  }
                  className="rounded-xl"
                />
              </FormField>
              <FormField label="Available until">
                <Input
                  type="time"
                  value={formData.availableUntil}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      availableUntil: e.target.value,
                    }))
                  }
                  className="rounded-xl"
                />
              </FormField>
            </div>

            <FormField label="Image">
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt=""
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="rounded-xl"
                />
              </div>
            </FormField>
          </FormSection>

          <FormSection
            title="Ingredients (inventory)"
            description="How much stock is used per unit sold."
          >
            <div className="space-y-2">
              {formData.inventoryLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 p-3"
                >
                  <select
                    className="min-w-[10rem] flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    value={link.inventoryItemId}
                    onChange={(e) =>
                      updateInventoryLink(index, {
                        inventoryItemId: Number(e.target.value),
                      })
                    }
                  >
                    {ingredientOptions.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} ({inv.unit})
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    className="w-24 rounded-xl"
                    value={
                      link.quantityUsedPerUnit === 0
                        ? ""
                        : link.quantityUsedPerUnit
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      updateInventoryLink(index, {
                        quantityUsedPerUnit: raw === "" ? 0 : Number(raw),
                      });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => removeInventoryLink(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={addInventoryLink}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add ingredient
              </Button>
            </div>
          </FormSection>

          {/* ========== ADD-ONS ========== */}
          <FormSection
            title="Add-ons"
            description="Select which add-on groups apply to this item. Customers see them in POS and online."
          >
            <MenuItemAddonsSection
              menuItemId={editingItem?.id ?? null}
              // Create: controlled list → attach after create
              // Edit: uncontrolled → component calls attach/detach APIs live
              selectedGroupIds={editingItem ? undefined : selectedAddonGroupIds}
              onSelectedGroupIdsChange={
                editingItem ? undefined : setSelectedAddonGroupIds
              }
            />
          </FormSection>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 rounded-2xl"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editingItem ? (
                "Update Item"
              ) : (
                "Create Item"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-2xl"
              onClick={closeModal}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ModalShell>

      {/* ========== NEW CATEGORY ========== */}
      <ModalShell
        open={showCategoryModal}
        title="New Category"
        description="Group menu items (Coffee, Pastries, etc.)."
        onClose={() => setShowCategoryModal(false)}
        className="max-w-md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-5">
          <FormField label="Name">
            <Input
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Coffee"
              className="rounded-xl"
            />
          </FormField>
          <FormField label="Description">
            <Input
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
              className="rounded-xl"
            />
          </FormField>
          <FormField label="Display order">
            <Input
              type="number"
              value={categoryForm.displayOrder}
              onChange={(e) =>
                setCategoryForm((p) => ({
                  ...p,
                  displayOrder: Number(e.target.value) || 0,
                }))
              }
              className="rounded-xl w-32"
            />
          </FormField>
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 rounded-2xl"
              disabled={categorySubmitting}
            >
              {categorySubmitting ? "Creating…" : "Create Category"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-2xl"
              onClick={() => setShowCategoryModal(false)}
              disabled={categorySubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}
