import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, CheckCircle2, Loader2, RefreshCw, Search } from 'lucide-react';
import api from '@/lib/api';
import type { InventoryItemResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInventory = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await api.get('/inventory');
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (fetchError) {
      console.error('Failed to fetch inventory:', fetchError);
      setError('Unable to load inventory from the backend.');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return items;

    return items.filter((item) =>
      item.name.toLowerCase().includes(term) ||
      (item.description || '').toLowerCase().includes(term) ||
      item.unit.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const totalItems = items.length;
  const activeItems = items.filter((item) => item.isActive).length;
  const lowStockItems = items.filter((item) => item.isLowStock).length;
  const totalStock = items.reduce((sum, item) => sum + item.currentStock, 0);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            <Boxes className="h-3.5 w-3.5" />
            Backend inventory snapshot
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">Inventory</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Live stock levels and reorder status from your API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950/50">
          <p className="text-sm text-zinc-500">Total items</p>
          <p className="mt-3 text-3xl font-bold">{totalItems}</p>
        </div>
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950/50">
          <p className="text-sm text-zinc-500">Active items</p>
          <p className="mt-3 text-3xl font-bold">{activeItems}</p>
        </div>
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950/50">
          <p className="text-sm text-zinc-500">Low stock</p>
          <p className="mt-3 text-3xl font-bold text-orange-600">{lowStockItems}</p>
        </div>
        <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950/50">
          <p className="text-sm text-zinc-500">Units on hand</p>
          <p className="mt-3 text-3xl font-bold">{totalStock}</p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950/50 lg:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Stock list</h2>
            <p className="text-sm text-zinc-500">Items returned by the backend inventory endpoint.</p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search item, description, or unit..."
              className="pl-9 rounded-2xl"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-6 flex h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <CheckCircle2 className="h-10 w-10 text-zinc-400" />
            <p className="mt-4 text-lg font-medium">No inventory items found</p>
            <p className="text-sm text-zinc-500">
              {searchTerm ? 'Try a different search term.' : 'The backend returned an empty inventory list.'}
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-left dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-900/80">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Item</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Stock</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Reorder</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950/40">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40">
                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-zinc-950 dark:text-white">{item.name}</div>
                        {item.description ? (
                          <div className="mt-1 max-w-xl text-sm text-zinc-500 line-clamp-2">{item.description}</div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-zinc-950 dark:text-white">
                          {item.currentStock} <span className="font-normal text-zinc-500">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-zinc-600 dark:text-zinc-400">
                        <div>Point: {item.reorderPoint}</div>
                        <div>Qty: {item.reorderQuantity}</div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className={[
                          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
                        ].join(' ')}>
                          {item.isLowStock ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
                          {item.isLowStock ? 'Low stock' : 'Healthy'}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-zinc-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
