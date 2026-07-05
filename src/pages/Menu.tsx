import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { MenuItem, MenuItemInventoryLinkRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, ImageIcon } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    displayOrder: 0,
    availableFrom: '',
    availableUntil: '',
    inventoryLinks: [] as MenuItemInventoryLinkRequest[],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get('/menu');
      setMenuItems(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        category: item.category,
        price: item.price,
        displayOrder: item.displayOrder,
        availableFrom: item.availableFrom || '',
        availableUntil: item.availableUntil || '',
        inventoryLinks: item.inventoryLinks.map(link => ({
          inventoryItemId: link.inventoryItemId,
          quantityUsedPerUnit: link.quantityUsedPerUnit
        }))
      });
      setImagePreview(item.imageUrl ? `http://localhost:5032${item.imageUrl}` : null);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        price: 0,
        displayOrder: 0,
        availableFrom: '',
        availableUntil: '',
        inventoryLinks: []
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || formData.price <= 0) {
      toast.error("Name, category and price are required");
      return;
    }

    if (!formData.inventoryLinks || formData.inventoryLinks.length === 0) {
      toast.error("At least one inventory ingredient is required");
      return;
    }

    const form = new FormData();
    form.append('name', formData.name);
    form.append('category', formData.category);
    form.append('price', formData.price.toString());
    form.append('displayOrder', formData.displayOrder.toString());
    if (formData.description) form.append('description', formData.description);
    if (formData.availableFrom) form.append('availableFrom', formData.availableFrom);
    if (formData.availableUntil) form.append('availableUntil', formData.availableUntil);

    form.append('inventoryLinks', JSON.stringify(formData.inventoryLinks));

    if (imageFile) {
      form.append('image', imageFile);
    }

    try {
      if (editingItem) {
        await api.put(`/menu/${editingItem.id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Menu item updated successfully!');
      } else {
        await api.post('/menu', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Menu item created successfully!');
      }

      setShowModal(false);
      fetchMenu();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success('Menu item deactivated');
      fetchMenu();
    } catch (err) {
      toast.error('Failed to deactivate');
    }
  };

  const getImageUrl = (item: MenuItem) => {
    return item.imageUrl ? `http://localhost:5032${item.imageUrl}` : null;
  };

  if (loading) return <div className="p-8 text-center">Loading menu...</div>;

  return (
    <div className="p-8">
      <Toaster position="top-center" richColors closeButton />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Menu Management</h1>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Add New Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map(item => (
          <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border">
            <div className="h-48 bg-zinc-100 dark:bg-zinc-800 relative">
              {getImageUrl(item) ? (
                <img src={getImageUrl(item)!} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-6xl opacity-30">
                  <ImageIcon className="w-20 h-20" />
                </div>
              )}

              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-xl">{item.name}</h3>
              <p className="text-sm text-zinc-500 mt-1">{item.category} • ₱{item.price}</p>

              {item.inventoryLinks && item.inventoryLinks.length > 0 && (
                <div className="mt-3 text-xs text-zinc-500">
                  Uses: {item.inventoryLinks.map(l => l.inventoryItemName).join(', ')}
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <Button variant="outline" size="sm" onClick={() => openModal(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDeactivate(item.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg max-h-[95vh] overflow-auto">
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6">
                {editingItem ? 'Edit Menu Item' : 'New Menu Item'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Image</label>
                  <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 text-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="mx-auto max-h-48 rounded-xl" />
                    ) : (
                      <ImageIcon className="mx-auto w-16 h-16 text-zinc-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-4 block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700"
                    />
                  </div>
                </div>

                <Input
                  placeholder="Item Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Price"
                    value={formData.price || ''}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Display Order"
                    value={formData.displayOrder}
                    onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <Input
                  placeholder="Category"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                />

                <Input
                  placeholder="Description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Available From</label>
                    <Input 
                      type="time" 
                      value={formData.availableFrom} 
                      onChange={e => setFormData({...formData, availableFrom: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Available Until</label>
                    <Input 
                      type="time" 
                      value={formData.availableUntil} 
                      onChange={e => setFormData({...formData, availableUntil: e.target.value})} 
                    />
                  </div>
                </div>

                {/* Inventory Links */}
                <div>
                  <label className="block text-sm font-medium mb-3">Inventory Ingredients (Required)</label>
                  <div className="border border-zinc-200 rounded-2xl p-4 space-y-3">
                    {formData.inventoryLinks.map((link, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <Input
                          type="number"
                          placeholder="Inventory ID"
                          value={link.inventoryItemId}
                          onChange={e => {
                            const newLinks = [...formData.inventoryLinks];
                            newLinks[index].inventoryItemId = parseInt(e.target.value);
                            setFormData({ ...formData, inventoryLinks: newLinks });
                          }}
                        />
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="Qty per unit"
                          value={link.quantityUsedPerUnit}
                          onChange={e => {
                            const newLinks = [...formData.inventoryLinks];
                            newLinks[index].quantityUsedPerUnit = parseFloat(e.target.value);
                            setFormData({ ...formData, inventoryLinks: newLinks });
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newLinks = formData.inventoryLinks.filter((_, i) => i !== index);
                            setFormData({ ...formData, inventoryLinks: newLinks });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        inventoryLinks: [...formData.inventoryLinks, { inventoryItemId: 0, quantityUsedPerUnit: 1 }]
                      });
                    }}
                  >
                    + Add Ingredient
                  </Button>
                </div>

                <div className="flex gap-3 pt-6">
                  <Button type="submit" className="flex-1">
                    {editingItem ? 'Update Item' : 'Create Item'}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}