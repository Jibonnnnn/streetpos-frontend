// src/pages/Categories.tsx
import { useState, useEffect } from "react";
import { categoryService } from "@/services/category.service";
import { menuService } from "@/services/menu.service";
import type { Category, MenuItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/layout";
import { ModalShell } from "@/components/dialogs/ModalShell";
import { BadgePill } from "@/components/common/BadgePill";
import { FormField } from "@/components/forms/form-field";
import { FormSection } from "@/components/forms/form-section";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItemsByCategory, setMenuItemsByCategory] = useState<Record<number, MenuItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedCategoryMenus, setSelectedCategoryMenus] = useState<MenuItem[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    displayOrder: 0,
  });

  const fetchCategories = async () => {
  try {
    setLoading(true);
    
    // 1. Fetch categories first
    const catRes = await categoryService.getAll();
    const cats = catRes.data || [];
    setCategories(cats);

    // 2. Fetch all menu items
    const menuRes = await menuService.getMenu();
    const menus: MenuItem[] = menuRes.data || [];

    // 3. Group menus by categoryId (reliable, matches backend contract)
    const grouped: Record<number, MenuItem[]> = {};

    cats.forEach((cat) => {
      grouped[cat.id] = menus.filter((menu: MenuItem) => menu.categoryId === cat.id);
    });

    setMenuItemsByCategory(grouped);
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Failed to load categories");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

// Load categories on component mount
useEffect(() => {
  fetchCategories();
}, []);

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        displayOrder: category.displayOrder,
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", description: "", displayOrder: 0 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !formData.name.trim()) return;

    setSubmitting(true);
    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, formData);
        toast.success("Category updated successfully!");
      } else {
        await categoryService.create(formData);
        toast.success("Category created successfully!");
      }
      setShowModal(false);
      await fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Deactivate this category?")) return;
    try {
      await categoryService.deactivate(id);
      toast.success("Category deactivated");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to deactivate category");
    }
  };

  const viewMenus = async (category: Category) => {
    setSelectedCategoryName(category.name);
    try {
      const res = await menuService.getMenu();
      // Explicitly type the menu item to avoid implicit any
      const filtered = (res.data || []).filter((m: MenuItem) => m.categoryId === category.id);
      setSelectedCategoryMenus(filtered);
      setShowMenuModal(true);
    } catch (err) {
      toast.error("Failed to load menu items");
    }
  };
  const columns = [
    { header: "Name", accessor: "name" as const },
    { 
      header: "Description", 
      accessor: (cat: Category) => cat.description || "-" 
    },
    { 
  header: "Menus", 
  accessor: (cat: Category) => {
    const count = menuItemsByCategory[cat.id]?.length || 0;
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => viewMenus(cat)}
        className="text-xs hover:bg-amber-50"
      >
        <Eye className="w-3 h-3 mr-1" />
        {count} items
      </Button>
    );
  }

    },
    {
      header: "Status",
      accessor: (cat: Category) => (
        <BadgePill tone={cat.isActive ? "success" : "danger"}>
          {cat.isActive ? "Active" : "Inactive"}
        </BadgePill>
      ),
    },
  ];

  const actions = (category: Category) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => openModal(category)}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDeactivate(category.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Category Management"
        description="Organize your menu with categories. Changes will reflect instantly in Menu Management."
        actions={
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" /> New Category
          </Button>
        }
      />

      <DataTable
        data={categories}
        columns={columns}
        loading={loading}
        actions={actions}
        emptyMessage="No categories yet. Create your first one above."
      />

      {/* Category Form Modal - unchanged */}
      <ModalShell
        open={showModal}
        title={editingCategory ? "Edit Category" : "New Category"}
        description="Categories help customers and staff quickly find menu items."
        onClose={() => setShowModal(false)}
        className="max-w-md"
      >
        {/* Form content remains the same */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection title="Category Information">
            <FormField label="Category Name">
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </FormField>
            <FormField label="Description">
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </FormField>
            <FormField label="Display Order">
              <Input type="number" value={formData.displayOrder} onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} />
            </FormField>
          </FormSection>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Saving..." : editingCategory ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </ModalShell>

      {/* New: Menu Items Modal */}
      <ModalShell
        open={showMenuModal}
        title={`Menus in ${selectedCategoryName}`}
        description={`${selectedCategoryMenus.length} items`}
        onClose={() => setShowMenuModal(false)}
        className="max-w-2xl"
      >
        <div className="max-h-[60vh] overflow-auto space-y-3 pr-2">
          {selectedCategoryMenus.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No menu items in this category yet.</p>
          ) : (
            selectedCategoryMenus.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-2xl border p-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-xl overflow-hidden">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">₱{item.price}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ModalShell>
    </div>
  );
}