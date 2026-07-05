import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { InventoryItemResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/layout';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemResponse | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initialStock: 0,
    unit: 'pcs',
    reorderPoint: 10,
    reorderQuantity: 50,
  });

  const [adjustData, setAdjustData] = useState({
    quantityChange: 0,
    reason: '',
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setInventory(res.data || []);
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openCreateModal = () => {
    setSelectedItem(null);
    setFormData({ name: '', description: '', initialStock: 0, unit: 'pcs', reorderPoint: 10, reorderQuantity: 50 });
    setShowModal(true);
  };

  const openAdjustModal = (item: InventoryItemResponse) => {
    setSelectedItem(item);
    setAdjustData({ quantityChange: 0, reason: '' });
    setShowAdjustModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory', formData);
      toast.success('Inventory item created successfully!');
      setShowModal(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create item');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !adjustData.reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    try {
      await api.post(`/inventory/${selectedItem.id}/adjust`, adjustData);
      toast.success('Stock updated successfully!');
      setShowAdjustModal(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this inventory item?')) return;

    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Inventory item deleted successfully');
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete item. It may be linked to menu items.');
    }
  };

  const columns = [
    { header: "Item Name", accessor: "name" as const },
    { header: "Unit", accessor: "unit" as const },
    { header: "Current Stock", accessor: "currentStock" as const },
    { header: "Reorder Point", accessor: "reorderPoint" as const },
    { 
      header: "Status", 
      accessor: (item: InventoryItemResponse) => item.isLowStock ? (
        <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
          <AlertTriangle size={16} /> Low Stock
        </span>
      ) : (
        <span className="text-emerald-600 text-sm">In Stock</span>
      )
    },
  ];

  const actions = (item: InventoryItemResponse) => (
    <div className="flex gap-2 justify-end">
      <Button variant="outline" size="sm" onClick={() => openAdjustModal(item)}>
        Update Stock
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-red-600 hover:bg-red-50" 
        onClick={() => handleDelete(item.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="p-8">
      <Toaster position="top-center" richColors closeButton />

      <PageHeader 
        title="Inventory Management" 
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" /> New Item
          </Button>
        }
      />

      <DataTable 
        data={inventory}
        columns={columns}
        loading={loading}
        actions={actions}
        emptyMessage="No inventory items found."
      />

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md">
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6">New Inventory Item</h2>
              <form onSubmit={handleCreate} className="space-y-6">
                <Input placeholder="Name *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <Input placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Initial Stock</label>
                    <Input type="number" value={formData.initialStock} onChange={e => setFormData({...formData, initialStock: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Unit</label>
                    <Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Reorder Point</label>
                    <Input type="number" value={formData.reorderPoint} onChange={e => setFormData({...formData, reorderPoint: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Reorder Quantity</label>
                    <Input type="number" value={formData.reorderQuantity} onChange={e => setFormData({...formData, reorderQuantity: parseInt(e.target.value) || 0})} />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">Create</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md">
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6">Update Stock - {selectedItem.name}</h2>
              <p className="mb-6">Current: <span className="font-semibold">{selectedItem.currentStock} {selectedItem.unit}</span></p>

              <form onSubmit={handleAdjustStock} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity Change (+ or -)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={adjustData.quantityChange} 
                    onChange={e => setAdjustData({...adjustData, quantityChange: parseFloat(e.target.value) || 0})} 
                    placeholder="50 or -10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reason</label>
                  <Input 
                    placeholder="Restock, Usage, Correction..." 
                    value={adjustData.reason} 
                    onChange={e => setAdjustData({...adjustData, reason: e.target.value})} 
                    required 
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">Update Stock</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdjustModal(false)}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}