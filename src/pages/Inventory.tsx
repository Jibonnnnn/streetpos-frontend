import { useState, useEffect } from 'react';
import { inventoryService } from '@/services/inventory.service';
import type { InventoryItemResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader } from '@/components/layout';
import { ModalShell } from '@/components/dialogs/ModalShell';
import { BadgePill } from '@/components/common/BadgePill';
import { FormField } from '@/components/forms/form-field';
import { FormSection } from '@/components/forms/form-section';

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
      const res = await inventoryService.getInventory();
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
      await inventoryService.createInventoryItem(formData);
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
      await inventoryService.adjustInventoryItem(selectedItem.id, adjustData);
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
      await inventoryService.deleteInventoryItem(id);
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
          <BadgePill tone="warning" className="gap-1">
            <AlertTriangle size={16} /> Low Stock
          </BadgePill>
      ) : (
          <BadgePill tone="success">In Stock</BadgePill>
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
    <div className="p-4 sm:p-6 lg:p-8">
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

      <ModalShell
        open={showModal}
        title="New Inventory Item"
        description="Add a stock item and its reorder thresholds."
        onClose={() => setShowModal(false)}
        className="max-w-2xl"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <FormSection
            title="Item details"
            description="Name the inventory item and add a short internal description."
          >
            <FormField label="Item name" description="Use the name your staff recognizes in stock counts.">
              <Input
                placeholder="Espresso beans"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </FormField>

            <FormField label="Description" description="Optional notes for suppliers or staff.">
              <Input
                placeholder="Dark roast, whole bean"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </FormField>
          </FormSection>

          <FormSection
            title="Stock rules"
            description="Set the initial stock and reorder thresholds for this item."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Initial stock" description="Starting quantity when the item is created.">
                <Input
                  type="number"
                  value={formData.initialStock}
                  onChange={e => setFormData({...formData, initialStock: parseInt(e.target.value) || 0})}
                />
              </FormField>

              <FormField label="Unit" description="pcs, bottles, bags, liters, and similar units.">
                <Input
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                />
              </FormField>

              <FormField label="Reorder point" description="Alert threshold before stock becomes critical.">
                <Input
                  type="number"
                  value={formData.reorderPoint}
                  onChange={e => setFormData({...formData, reorderPoint: parseInt(e.target.value) || 0})}
                />
              </FormField>

              <FormField label="Reorder quantity" description="Suggested amount to restock at once.">
                <Input
                  type="number"
                  value={formData.reorderQuantity}
                  onChange={e => setFormData({...formData, reorderQuantity: parseInt(e.target.value) || 0})}
                />
              </FormField>
            </div>
          </FormSection>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Create item</Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={showAdjustModal && Boolean(selectedItem)}
        title={selectedItem ? `Update Stock - ${selectedItem.name}` : "Update Stock"}
        description={selectedItem ? `Current: ${selectedItem.currentStock} ${selectedItem.unit}` : undefined}
        onClose={() => setShowAdjustModal(false)}
        className="max-w-lg"
      >
        {selectedItem ? (
          <form onSubmit={handleAdjustStock} className="space-y-5">
            <FormSection
              title="Stock adjustment"
              description="Use positive values for restocks and negative values for usage or corrections."
            >
              <FormField label="Quantity change (+ or -)" description="Example: 50, -10, or 12.5">
                <Input 
                  type="number" 
                  step="0.01"
                  value={adjustData.quantityChange} 
                  onChange={e => setAdjustData({...adjustData, quantityChange: parseFloat(e.target.value) || 0})} 
                  placeholder="50 or -10"
                  required
                />
              </FormField>

              <FormField label="Reason" description="Required for audit tracking and future stock history."
              >
                <Input 
                  placeholder="Restock, Usage, Correction..." 
                  value={adjustData.reason} 
                  onChange={e => setAdjustData({...adjustData, reason: e.target.value})} 
                  required 
                />
              </FormField>
            </FormSection>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1">Update stock</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdjustModal(false)}>Cancel</Button>
            </div>
          </form>
        ) : null}
      </ModalShell>
    </div>
  );
}