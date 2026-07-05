import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { InventoryItemResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle, Plus, Edit2 } from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Create / Edit Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemResponse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initialStock: 0,
    unit: 'pcs',
    reorderPoint: 10,
    reorderQuantity: 50
  });
  const [formLoading, setFormLoading] = useState(false);

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItemResponse | null>(null);
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setInventory(res.data || []);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      initialStock: 0,
      unit: 'pcs',
      reorderPoint: 10,
      reorderQuantity: 50
    });
    setShowFormModal(true);
  };

  const openEditModal = (item: InventoryItemResponse) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      initialStock: item.currentStock,
      unit: item.unit,
      reorderPoint: item.reorderPoint,
      reorderQuantity: item.reorderQuantity
    });
    setShowFormModal(true);
  };

  const openAdjustModal = (item: InventoryItemResponse) => {
    setSelectedItemForAdjust(item);
    setQuantityChange('');
    setReason('');
    setShowAdjustModal(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name) return;
    setFormLoading(true);

    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, formData);
      } else {
        await api.post('/inventory', formData);
      }
      alert(editingItem ? "✅ Item updated!" : "✅ Item created!");
      setShowFormModal(false);
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || "Operation failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItemForAdjust || !quantityChange || !reason) return;
    setAdjustLoading(true);

    try {
      await api.post(`/inventory/${selectedItemForAdjust.id}/adjust`, {
        quantityChange: parseFloat(quantityChange),
        reason: reason.trim()
      });
      alert("✅ Stock adjusted successfully!");
      setShowAdjustModal(false);
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to adjust stock.");
    } finally {
      setAdjustLoading(false);
    }
  };

  const filteredInventory = inventory
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(item => !showLowStockOnly || item.isLowStock);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-zinc-500">Full CRUD + Stock Control</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 w-4 h-4" /> New Item
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search items..."
          className="max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          variant={showLowStockOnly ? "default" : "outline"}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          <AlertTriangle className="mr-2 w-4 h-4" />
          Low Stock Only
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border">
          <table className="w-full">
            <thead className="bg-zinc-100 dark:bg-zinc-800 border-b">
              <tr>
                <th className="text-left p-6 font-medium">Item</th>
                <th className="text-left p-6 font-medium">Stock</th>
                <th className="text-left p-6 font-medium">Unit</th>
                <th className="text-left p-6 font-medium">Reorder Point</th>
                <th className="text-left p-6 font-medium">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="p-6">
                    <div className="font-medium">{item.name}</div>
                    {item.description && <div className="text-sm text-zinc-500">{item.description}</div>}
                  </td>
                  <td className="p-6">
                    <span className={`font-semibold ${item.isLowStock ? 'text-red-600' : ''}`}>
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="p-6">{item.unit}</td>
                  <td className="p-6">{item.reorderPoint}</td>
                  <td className="p-6">
                    {item.isLowStock ? (
                      <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full">Low Stock</span>
                    ) : (
                      <span className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">OK</span>
                    )}
                  </td>
                  <td className="p-6 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openAdjustModal(item)}>
                      Adjust
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md">
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6">
                {editingItem ? 'Edit Item' : 'New Inventory Item'}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2">Name *</label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm mb-2">Description</label>
                  <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Initial Stock</label>
                    <Input type="number" value={formData.initialStock} onChange={(e) => setFormData({...formData, initialStock: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Unit</label>
                    <Input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Reorder Point</label>
                    <Input type="number" value={formData.reorderPoint} onChange={(e) => setFormData({...formData, reorderPoint: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Reorder Quantity</label>
                    <Input type="number" value={formData.reorderQuantity} onChange={(e) => setFormData({...formData, reorderQuantity: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button onClick={handleSaveItem} disabled={formLoading} className="flex-1">
                  {formLoading && <Loader2 className="animate-spin mr-2" />}
                  {editingItem ? 'Update' : 'Create'}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowFormModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItemForAdjust && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md">
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-2">Adjust Stock</h2>
              <p className="text-zinc-500 mb-6">{selectedItemForAdjust.name}</p>

              <Input
                type="number"
                placeholder="Quantity (+ or -)"
                value={quantityChange}
                onChange={(e) => setQuantityChange(e.target.value)}
                className="mb-4"
              />
              <Input
                placeholder="Reason (Restock, Damage, etc.)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <div className="flex gap-3 mt-8">
                <Button onClick={handleAdjustStock} disabled={adjustLoading} className="flex-1">
                  Update Stock
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}