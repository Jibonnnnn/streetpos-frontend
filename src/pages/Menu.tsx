import { useState, useEffect, useCallback, useMemo } from "react";
import { menuService } from "@/services/menu.service";
import { inventoryService } from "@/services/inventory.service";
import type {
  MenuItem,
  MenuItemInventoryLinkRequest,
  InventoryItemResponse,
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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: 0,
    displayOrder: 0,
    availableFrom: "",
    availableUntil: "",
    inventoryLinks: [] as MenuItemInventoryLinkRequest[],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Optimized ingredient options
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
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await menuService.getMenu();
      setMenuItems(res.data || []);
    } catch (err) {
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await inventoryService.getInventory();
      setInventoryItems(res.data || []);
    } catch (err) {
      toast.error("Failed to load inventory");
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchInventory();
  }, []);

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        category: item.category,
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
        category: "",
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name?.trim() ||
      !formData.category?.trim() ||
      formData.price <= 0
    ) {
      toast.error("Name, category and price are required");
      return;
    }

    if (formData.inventoryLinks.length === 0) {
      toast.error("At least one inventory ingredient is required.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      category: formData.category.trim(),
      price: formData.price,
      displayOrder: formData.displayOrder,
      availableFrom: formData.availableFrom || null,
      availableUntil: formData.availableUntil || null,
      inventoryLinks: formData.inventoryLinks,
    };

    const formDataToSend = new FormData();
    formDataToSend.append("request", JSON.stringify(payload));
    if (imageFile) formDataToSend.append("image", imageFile);

    try {
      if (editingItem) {
        await menuService.updateMenuItem(editingItem.id, formDataToSend);
        toast.success("Menu item updated successfully!");
      } else {
        await menuService.createMenuItem(formDataToSend);
        toast.success("Menu item created successfully!");
      }
      const updatedMenu = await menuService.getMenu(); // force fresh fetch
      console.log(
        "🔍 Debug - Newly saved menu items:",
        updatedMenu.data?.map((item: any) => ({
          name: item.name,
          imageFileName: item.imageFileName,
          fullUrl: getFullImageUrl(item.imageFileName ?? item.imageUrl),
        })),
      );
      setShowModal(false);
      await fetchMenu();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save menu item");
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Deactivate this menu item?")) return;
    try {
      await menuService.deleteMenuItem(id);
      toast.success("Menu item deactivated");
      fetchMenu();
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  const columns = [
    {
      header: "Image",
      accessor: (item: MenuItem) => {
        const url = getFullImageUrl(item.imageFileName ?? item.imageUrl);
        console.log(`Image URL for ${item.name}:`, url); // debug
        return (
          <div className="w-12 h-12 bg-zinc-100 rounded-xl overflow-hidden border">
            {url ? (
              <img
                src={url}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load image for ${item.name}:`, url);
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
    { header: "Category", accessor: "category" as const },
    { header: "Price", accessor: (item: MenuItem) => `₱${item.price}` },
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
      <Button variant="outline" size="sm" onClick={() => openModal(item)}>
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
        actions={
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" /> Add New Item
          </Button>
        }
      />

      <DataTable
        data={menuItems}
        columns={columns}
        loading={loading}
        actions={actions}
        emptyMessage="No menu items found."
      />

      <ModalShell
        open={showModal}
        title={editingItem ? "Edit Menu Item" : "New Menu Item"}
        description="Manage menu details, availability, and ingredient links."
        onClose={() => setShowModal(false)}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormSection
            title="Visual identity"
            description="Add a menu image..."
          >
            <div className="rounded-[1.75rem] border border-dashed border-zinc-300 bg-muted/20 p-5 text-center dark:border-zinc-700">
              <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-white text-zinc-400 shadow-sm dark:bg-zinc-900">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Item details"
            description="Name, price, and menu ordering information."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Item name">
                <Input
                  placeholder="Iced Latte"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </FormField>
              <FormField label="Category">
                <Input
                  placeholder="Coffee"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                />
              </FormField>
              <FormField label="Price">
                <Input
                  type="number"
                  placeholder="120"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </FormField>
              <FormField label="Display order">
                <Input
                  type="number"
                  placeholder="1"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </FormField>
            </div>
            <FormField label="Description">
              <Input
                placeholder="Smooth espresso with milk and ice"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </FormField>
          </FormSection>

          <FormSection
            title="Availability"
            description="Optional time windows."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Available from">
                <Input
                  type="time"
                  value={formData.availableFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, availableFrom: e.target.value })
                  }
                />
              </FormField>
              <FormField label="Available until">
                <Input
                  type="time"
                  value={formData.availableUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, availableUntil: e.target.value })
                  }
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            title="Inventory ingredients"
            description="Link the ingredients used to produce one unit of this menu item."
          >
            <div className="space-y-4">
              {formData.inventoryLinks.map((link, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border/60 bg-background p-4"
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <FormField label="Inventory ingredient">
                      <select
                        value={link.inventoryItemId}
                        onChange={(e) =>
                          updateInventoryLink(
                            index,
                            "inventoryItemId",
                            parseInt(e.target.value),
                          )
                        }
                        className="h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm"
                      >
                        {ingredientOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} • {item.currentStock} {item.unit}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Qty per unit">
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
              className="mt-3 w-full"
              onClick={addInventoryLink}
            >
              + Add Ingredient
            </Button>
          </FormSection>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">
              {editingItem ? "Update item" : "Create item"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}
