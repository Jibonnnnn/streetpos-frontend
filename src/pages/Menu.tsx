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
import { Plus, Edit, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/layout";
import { getFullImageUrl } from "@/lib/imageUtils";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { BadgePill } from "@/components/common/BadgePill";
import { FormField } from "@/components/forms/form-field";
import { FormSection } from "@/components/forms/form-section";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>(
    [],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: 0,
    price: 0,
    displayOrder: 0,
    availableFrom: "",
    availableUntil: "",
    inventoryLinks: [] as MenuItemInventoryLinkRequest[],
  });

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

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await menuService.getMenu();
      setMenuItems(res.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await inventoryService.getInventory();
      setInventoryItems(res.data || []);
    } catch (err) {
      toast.error("Failed to load inventory items");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getAll();
      setCategories(res.data.filter((c) => c.isActive));
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchInventory();
    fetchCategories();
  }, []);

  const openMenuModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        categoryId: item.categoryId,
        price: item.price,
        displayOrder: item.displayOrder,
        availableFrom: item.availableFrom || "",
        availableUntil: item.availableUntil || "",
        inventoryLinks: item.inventoryLinks.map((l) => ({
          inventoryItemId: l.inventoryItemId,
          quantityUsedPerUnit: l.quantityUsedPerUnit,
        })),
      });
      setImagePreview(getFullImageUrl(item.imageFileName ?? item.imageUrl));
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        categoryId: 0,
        price: 0,
        displayOrder: 0,
        availableFrom: "",
        availableUntil: "",
        inventoryLinks: [],
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const openCategoryModal = () => {
    setCategoryForm({ name: "", description: "", displayOrder: 0 });
    setShowCategoryModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addInventoryLink = useCallback(() => {
    if (ingredientOptions.length === 0) {
      toast.error("No active inventory items available");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      inventoryLinks: [
        ...prev.inventoryLinks,
        {
          inventoryItemId: ingredientOptions[0].id,
          quantityUsedPerUnit: 1,
        },
      ],
    }));
  }, [ingredientOptions]);

  const updateInventoryLink = useCallback(
    (
      index: number,
      field: "inventoryItemId" | "quantityUsedPerUnit",
      value: number,
    ) => {
      setFormData((prev) => {
        const newLinks = [...prev.inventoryLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        return { ...prev, inventoryLinks: newLinks };
      });
    },
    [],
  );

  const removeInventoryLink = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      inventoryLinks: prev.inventoryLinks.filter((_, i) => i !== index),
    }));
  }, []);

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name.trim());
    formDataToSend.append("categoryId", formData.categoryId.toString());
    formDataToSend.append("price", formData.price.toString());
    formDataToSend.append("displayOrder", formData.displayOrder.toString());

    if (formData.description?.trim())
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
        toast.success("Menu item updated successfully!");
      } else {
        await menuService.createMenuItem(formDataToSend);
        toast.success("Menu item created successfully!");
      }

      setShowModal(false);
      // Refresh BOTH lists
      await Promise.all([fetchMenu(), fetchCategories()]);
      // Reset form
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save menu item");
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
      await fetchCategories(); // Refresh dropdown
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create category");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Deactivate this menu item?")) return;

    try {
      await menuService.deleteMenuItem(id);
      toast.success("Menu item deactivated");
      fetchMenu();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to deactivate menu item",
      );
    }
  };

  const columns = [
    {
      header: "Image",
      accessor: (item: MenuItem) => {
        const url = getFullImageUrl(item.imageFileName ?? item.imageUrl);
        return (
          <div className="w-12 h-12 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200">
            {url ? (
              <img
                src={url}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl opacity-30">
                ☕
              </div>
            )}
          </div>
        );
      },
    },
    { header: "Name", accessor: "name" as const },
    {
      header: "Category",
      accessor: (item: MenuItem) => item.categoryName || "Uncategorized",
    },
    {
      header: "Price",
      accessor: (item: MenuItem) => `₱${item.price.toFixed(2)}`,
    },
    {
      header: "Status",
      accessor: (item: MenuItem) => (
        <BadgePill tone={item.isActive ? "success" : "danger"}>
          {item.isActive ? "Active" : "Inactive"}
        </BadgePill>
      ),
    },
  ];

  const actions = (item: MenuItem) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => openMenuModal(item)}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDeactivate(item.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Menu Management"
        description="Manage your café's menu items, pricing, availability, and ingredient links."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => openMenuModal()}>
              <Plus className="w-4 h-4 mr-2" /> Add New Item
            </Button>
            <Button variant="outline" onClick={openCategoryModal}>
              <Plus className="w-4 h-4 mr-2" /> Manage Categories
            </Button>
          </div>
        }
      />

      <DataTable
        data={menuItems}
        columns={columns}
        loading={loading}
        actions={actions}
        emptyMessage="No menu items found. Add your first item above."
      />

      {/* Menu Item Create/Edit Modal */}
      <ModalShell
        open={showModal}
        title={editingItem ? "Edit Menu Item" : "New Menu Item"}
        description="Manage details, availability windows, and ingredient consumption."
        onClose={() => setShowModal(false)}
        className="max-w-2xl"
      >
        <form onSubmit={handleMenuSubmit} className="space-y-6">
          {/* Visual Identity */}
          <FormSection
            title="Visual Identity"
            description="Upload a high-quality image for the menu (recommended 800x800px)"
          >
            <div className="rounded-[1.75rem] border border-dashed border-zinc-300 bg-muted/20 p-6 text-center">
              <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-sm">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-16 w-16 text-zinc-400" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700"
                />
                <p className="text-xs text-muted-foreground">
                  PNG, JPG or GIF • Max 5MB
                </p>
              </div>
            </div>
          </FormSection>

          {/* Item Details FormSection */}
          <FormSection title="Item Details">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Item Name"
                description="Clear, recognizable name"
              >
                <Input
                  placeholder="Iced Caramel Latte"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </FormField>

              {/* ← REPLACE WITH THIS BLOCK */}
              <FormField
                label="Category"
                description="Select from existing categories"
              >
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categoryId: parseInt(e.target.value),
                    }))
                  }
                  className="h-10 w-full rounded-2xl border px-3"
                  required
                >
                  <option value={0}>Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Price (₱)" description="Base selling price">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="149.00"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  required
                />
              </FormField>

              <FormField
                label="Display Order"
                description="Position in menu list"
              >
                <Input
                  type="number"
                  placeholder="1"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </FormField>
            </div>

            <FormField
              label="Description"
              description="Optional short description"
            >
              <Input
                placeholder="Rich espresso with steamed milk and caramel drizzle"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </FormField>
          </FormSection>

          {/* Availability */}
          <FormSection
            title="Availability"
            description="Optional time-based availability (24-hour format)"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Available From">
                <Input
                  type="time"
                  value={formData.availableFrom}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      availableFrom: e.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField label="Available Until">
                <Input
                  type="time"
                  value={formData.availableUntil}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      availableUntil: e.target.value,
                    }))
                  }
                />
              </FormField>
            </div>
          </FormSection>

          {/* Inventory Links */}
          <FormSection
            title="Inventory Ingredients"
            description="Link ingredients consumed per unit sold"
          >
            <div className="space-y-4">
              {formData.inventoryLinks.map((link, index) => (
                <div
                  key={index}
                  className="rounded-2xl border p-4 bg-zinc-50 dark:bg-zinc-900"
                >
                  <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
                    <FormField label="Ingredient">
                      <select
                        value={link.inventoryItemId}
                        onChange={(e) =>
                          updateInventoryLink(
                            index,
                            "inventoryItemId",
                            parseInt(e.target.value),
                          )
                        }
                        className="h-10 w-full rounded-2xl border px-3"
                      >
                        {ingredientOptions.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.currentStock} {inv.unit})
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Qty per Unit">
                      <Input
                        type="number"
                        step="0.001"
                        value={link.quantityUsedPerUnit}
                        onChange={(e) =>
                          updateInventoryLink(
                            index,
                            "quantityUsedPerUnit",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </FormField>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeInventoryLink(index)}
                      className="mt-6"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full"
              onClick={addInventoryLink}
            >
              + Add Ingredient Link
            </Button>
          </FormSection>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingItem
                  ? "Update Item"
                  : "Create Item"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ModalShell>

      {/* Category Creation Modal */}
      <ModalShell
        open={showCategoryModal}
        title="Create New Category"
        description="Categories help organize your menu items."
        onClose={() => setShowCategoryModal(false)}
        className="max-w-md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-6">
          <FormSection title="Category Details">
            <FormField
              label="Category Name"
              description="e.g. Coffee, Pastries"
            >
              <Input
                placeholder="Coffee"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                required
              />
            </FormField>

            <FormField label="Description" description="Optional">
              <Input
                placeholder="Hot and cold coffee beverages"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField
              label="Display Order"
              description="Position in menu (optional)"
            >
              <Input
                type="number"
                placeholder="1"
                value={categoryForm.displayOrder}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    displayOrder: parseInt(e.target.value) || 0,
                  })
                }
              />
            </FormField>
          </FormSection>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={categorySubmitting}
            >
              {categorySubmitting ? "Creating..." : "Create Category"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
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
