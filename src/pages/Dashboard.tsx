import { useEffect, useState } from 'react';
import { connectToDashboardHub } from '@/lib/api';
import { dashboardService } from '@/services/dashboard.service';
import { Coffee, TrendingUp, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import type { DashboardResponse, TopSellingItem } from '@/types';
import { Toaster, toast } from 'sonner';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getDashboard();
      setDashboard(res.data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard:', err);
      toast.error("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Setup real-time SignalR connection
    let isMounted = true;

    const setupRealTime = async () => {
      try {
        await connectToDashboardHub((updatedData: DashboardResponse) => {
          if (isMounted) {
            setDashboard(updatedData);
            toast.success("📡 Dashboard Updated Live", {
              description: "New data received",
              duration: 2000,
            });
          }
        });
      } catch (err) {
        console.error("SignalR connection failed:", err);
      }
    };

    setupRealTime();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading live dashboard...</p>
        </div>
      </div>
    );
  }

  const topItemsColumns = [
    { header: "Item", accessor: "name" as const },
    { header: "Qty Sold", accessor: "quantitySold" as const },
    { header: "Revenue", accessor: (item: TopSellingItem) => `₱${item.revenue.toFixed(2)}` },
  ];

  return (
    <div className="p-8 space-y-8 max-w-screen-2xl mx-auto">
      <Toaster position="top-center" richColors closeButton />

      <PageHeader 
        title="Live Operations Dashboard" 
        description="Real-time business insights • Auto-updates"
        actions={
          <button 
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-3xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Now
          </button>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Sales" 
          value={`₱${dashboard.todaySales.toFixed(2)}`} 
          icon={TrendingUp}
        />
        <StatCard 
          title="Orders Today" 
          value={dashboard.ordersToday} 
          icon={Coffee}
        />
        <StatCard 
          title="Open Orders" 
          value={dashboard.openOrders} 
          icon={Clock}
          changeColor="text-amber-600"
        />
        <StatCard 
          title="Low Stock Items" 
          value={dashboard.lowStockItems} 
          icon={AlertTriangle}
          changeColor="text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🔥 Top Selling Items <span className="text-sm font-normal text-zinc-500">(Last 7 Days)</span>
          </h2>
          <DataTable 
            data={dashboard.topSellingItems} 
            columns={topItemsColumns}
            emptyMessage="No sales recorded yet"
          />
        </div>

        {/* Live Summary */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border">
          <h2 className="text-xl font-semibold mb-6">Live Summary</h2>
          <div className="space-y-6">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-zinc-600 dark:text-zinc-400">Active Staff</span>
              <span className="text-3xl font-semibold">{dashboard.activeStaff}</span>
            </div>
            <div className="pt-4 text-xs text-zinc-500">
              Last updated: {new Date(dashboard.lastUpdated).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}