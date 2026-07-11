import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Coffee, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { StatCard } from '@/components/common/StatCard';
import { BadgePill } from '@/components/common/BadgePill';
import { dashboardService } from '@/services/dashboard.service';
import { toast } from 'sonner';

export default function ManagerPage() {
  const [stats, setStats] = useState({
    todaySales: 0,
    orders: 0,
    lowStock: 0,
    activeStaff: 0,
    topItem: "Loading..."
  });
  const [, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardService.getDashboard();
      const data = res.data;

      setStats({
        todaySales: data.todaySales || 0,
        orders: data.ordersToday || 0,
        lowStock: data.lowStockItems || 0,
        activeStaff: data.activeStaff || 0,
        topItem: data.topSellingItems?.[0]?.name || "No sales yet"
      });
    } catch (err) {
      toast.error("Could not load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Manager Dashboard" 
        description="Daily operations overview with live performance, staffing, and inventory signals."
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={fetchDashboard}>
              <Sparkles className="h-4 w-4" />
              Refresh Insights
            </Button>
            <Button onClick={() => window.location.href = '/reports'}>
              Generate Full Report
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          title="Today's Sales" 
          value={`₱${stats.todaySales.toLocaleString()}`} 
          icon={TrendingUp}
          change="+18% from yesterday"
        />
        <StatCard 
          title="Orders Today" 
          value={stats.orders} 
          icon={Coffee}
        />
        <StatCard 
          title="Low Stock Items" 
          value={stats.lowStock} 
          icon={AlertTriangle}
          changeColor="text-orange-600"
        />
        <StatCard 
          title="Active Staff" 
          value={stats.activeStaff} 
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-900/75">
          <CardContent className="p-5 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-heading text-xl font-semibold">Top Selling Items</h3>
                <p className="text-sm text-muted-foreground">Best performer in the current day</p>
              </div>
              <BadgePill tone="success">Live</BadgePill>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:from-zinc-800 dark:to-zinc-900">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Featured item</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{stats.topItem}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-900/75">
          <CardContent className="p-5 sm:p-8">
            <h3 className="font-heading text-xl font-semibold">Quick Actions</h3>
            <p className="mt-2 text-sm text-muted-foreground">Jump into the most common manager workflows.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="justify-between" onClick={() => window.location.href = '/menu'}>
                Manage Menu
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between" onClick={() => window.location.href = '/inventory'}>
                View Inventory
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between">
                Staff Schedule
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="justify-between" onClick={() => window.location.href = '/reports'}>
                Open Reports
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}