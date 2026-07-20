import { useEffect, useMemo, useState } from 'react';
import { connectToDashboardHub, disconnectFromDashboardHub } from '@/lib/api';
import { dashboardService } from '@/services/dashboard.service';
import {
  Coffee,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  Users,
  Flame,
  Radio,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { StatCard } from '@/components/common/StatCard';
import { BadgePill } from '@/components/common/BadgePill';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActivityLogPanel } from '@/components/dashboard/ActivityLogPanel';
import type { DashboardResponse, ActivityLogEntry } from '@/types';
import { toast } from 'sonner';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const rankStyles = [
  'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300',
  'bg-orange-500/15 text-orange-600 dark:text-orange-300',
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur-sm dark:bg-zinc-900/95">
      <p className="mb-1 font-medium tracking-tight">{label}</p>
      <p className="text-muted-foreground">
        Revenue: <span className="font-semibold text-foreground">₱{Number(payload[0].value).toFixed(2)}</span>
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityErrored, setActivityErrored] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getDashboard();
      setDashboard(res.data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard:', err);
      toast.error('Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    try {
      setActivityLoading(true);
      setActivityErrored(false);
      const res = await dashboardService.getActivityLog(20);
      setActivityLog(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // Expected until the backend ships GET /dashboard/activity-log
      console.error('Failed to fetch activity log:', err);
      setActivityErrored(true);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchActivityLog();

    let isMounted = true;

    const setupRealTime = async () => {
      try {
        await connectToDashboardHub((updatedData: DashboardResponse) => {
          if (isMounted) {
            setDashboard(updatedData);
            setIsLive(true);
            toast.success('📡 Dashboard Updated Live', {
              description: 'New data received',
              duration: 2000,
            });
          }
        });
      } catch (err) {
        console.error('SignalR connection failed:', err);
      }
    };

    setupRealTime();

    return () => {
      isMounted = false;
      void disconnectFromDashboardHub();
    };
  }, []);

  const chartData = useMemo(() => {
    if (!dashboard) return [];
    return [...dashboard.topSellingItems]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
      .map((item) => ({
        name: item.name.length > 12 ? `${item.name.slice(0, 12)}…` : item.name,
        revenue: item.revenue,
      }));
  }, [dashboard]);

  const rankedTopItems = useMemo(() => {
    if (!dashboard) return [];
    return [...dashboard.topSellingItems].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [dashboard]);

  const maxQty = useMemo(
    () => Math.max(1, ...rankedTopItems.map((item) => item.quantitySold)),
    [rankedTopItems],
  );

  if (loading || !dashboard) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
      <PageHeader
        title="Live Operations Dashboard"
        description="Real-time business insights"
        actions={
          <div className="flex items-center gap-3">
            <BadgePill tone={isLive ? 'success' : 'neutral'} className="gap-1.5">
              <Radio className={`h-3 w-3 ${isLive ? 'animate-pulse' : ''}`} />
              {isLive ? 'Live' : 'Connecting'}
            </BadgePill>
            <Button variant="outline" className="gap-2 rounded-3xl" onClick={fetchDashboard}>
              <RefreshCw className="h-4 w-4" /> Refresh Now
            </Button>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Today's Sales" value={`₱${dashboard.todaySales.toFixed(2)}`} icon={TrendingUp} />
        <StatCard title="Orders Today" value={dashboard.ordersToday} icon={Coffee} />
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
        <StatCard title="Active Staff" value={dashboard.activeStaff} icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Revenue chart */}
        <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-900/75 lg:col-span-3">
          <CardContent className="p-6 md:p-7">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-tight">Revenue by item</h2>
                <p className="text-sm text-muted-foreground">Top 6 sellers, ranked by revenue</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                <Flame className="h-4 w-4" />
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
                No sales recorded yet
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="fill-muted-foreground"
                      width={48}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(217,119,6,0.06)' }} />
                    <Bar dataKey="revenue" radius={[10, 10, 0, 0]} fill="#d97706" maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log — inventory changes, time clock, purchases */}
        <ActivityLogPanel entries={activityLog} loading={activityLoading} errored={activityErrored} />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
        Last updated: {new Date(dashboard.lastUpdated).toLocaleString()}
      </div>

      {/* Top Selling ranked list */}
      <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-900/75">
        <CardContent className="p-6 md:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-tight">Top selling items</h2>
              <p className="text-sm text-muted-foreground">Last 7 days, ranked by revenue</p>
            </div>
          </div>

          {rankedTopItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 py-12 text-center text-sm text-muted-foreground">
              No sales recorded yet
            </div>
          ) : (
            <div className="space-y-3">
              {rankedTopItems.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center gap-4 rounded-2xl border border-border/60 bg-zinc-50 p-4 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-zinc-950/50"
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${rankStyles[index] ?? 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400'}`}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-medium tracking-tight">{item.name}</p>
                      <p className="whitespace-nowrap font-semibold">₱{item.revenue.toFixed(2)}</p>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600"
                        style={{ width: `${(item.quantitySold / maxQty) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{item.quantitySold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}