import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search, Upload, Image as ImageIcon } from 'lucide-react';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    availableFrom: '',
    availableUntil: '',
  });

  // Predefined categories
  const categories = ['Coffee', 'Non-Coffee', 'Tea', 'Pastry', 'Breakfast', 'Sandwich', 'Dessert', 'Other'];

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    let result = [...menuItems];
    if (searchTerm) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'All') {
      result = result.filter(item => item.category === selectedCategory);
    }
    setFilteredItems(result);
  }, [menuItems, searchTerm, selectedCategory]);

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu');
      setMenuItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        category: item.category,
        price: item.price,
        availableFrom: item.availableFrom ? item.availableFrom.slice(0, 5) : '',
        availableUntil: item.availableUntil ? item.availableUntil.slice(0, 5) : '',
      });
      setImagePreview(item.imageUrl || null);
    } else {
      setEditingItem(null);
      setFormData({ 
        name: '', 
        description: '', 
        category: '', 
        price: 0, 
        availableFrom: '', 
        availableUntil: '' 
      });
      setImagePreview(null);
    }
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('description', formData.description || '');
      form.append('category', formData.category);
      form.append('price', formData.price.toString());
      
      if (formData.availableFrom) form.append('availableFrom', formData.availableFrom);
      if (formData.availableUntil) form.append('availableUntil', formData.availableUntil);

      if (selectedFile) {
        form.append('imageFile', selectedFile);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editingItem) {
        await api.put(`/menu/${editingItem.id}`, form, config);
      } else {
        await api.post('/menu', form, config);
      }

      fetchMenu();
      setShowModal(false);
      setImagePreview(null);
      setSelectedFile(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      fetchMenu();
    } catch (err) {
      alert('Failed to deactivate');
    }
  };

  const getImageUrl = (item: MenuItem): string | null => {
    if (!item.imageUrl) return null;
    if (item.imageUrl.startsWith('http')) return item.imageUrl;
    return `http://localhost:5032${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}`;
  };

  if (loading) return <div className="p-8 text-center">Loading menu items...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Menu Management</h1>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Add New Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
          <Input 
            placeholder="Search menu items..." 
            className="pl-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 rounded-2xl border border-input bg-background text-sm"
        >
          <option value="All">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800">
            <div className="h-48 bg-zinc-100 dark:bg-zinc-800 relative">
              {item.imageUrl ? (
                <img 
                  src={getImageUrl(item)!} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
                  <ImageIcon className="w-20 h-20 text-zinc-400" />
                </div>
              )}

              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <p className="text-sm text-zinc-500 mt-1">{item.category}</p>
              <p className="text-2xl font-bold mt-3">₱{item.price.toFixed(2)}</p>

              {item.availableFrom && (
                <p className="text-xs text-zinc-500 mt-2">
                  {item.availableFrom} - {item.availableUntil}
                </p>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Item Image</label>
                  <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 text-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="mx-auto max-h-48 rounded-xl object-cover" />
                    ) : (
                      <Upload className="w-12 h-12 mx-auto text-zinc-400" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="mt-4 block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                  </div>
                </div>

                <Input 
                  placeholder="Item Name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 rounded-2xl border border-input bg-background"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price (₱)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-zinc-500 font-medium">₱</span>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} 
                      className="pl-8"
                      required 
                    />
                  </div>
                </div>

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

                <Input 
                  placeholder="Description (optional)" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />

                <div className="flex gap-3 pt-4">
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