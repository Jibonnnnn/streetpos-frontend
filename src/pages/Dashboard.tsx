import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgePill } from "@/components/common/BadgePill";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { ActivityLogPanel } from "@/components/dashboard/ActivityLogPanel";
import { dashboardService } from "@/services/dashboard.service";
import {
  TrendingUp,
  Coffee,
  AlertTriangle,
  ShoppingBag,
  Users,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DashboardResponse } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getDashboard();
      setData(res.data);
      setIsLive(true);
    } catch (err) {
      toast.error("Failed to load dashboard");
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const stats = [
    {
      label: "Today's Sales",
      value: `₱${(data?.todaySales ?? 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
      })}`,
      icon: TrendingUp,
      accent: "from-amber-500 to-orange-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Purchases Today",
      value: `₱${(data?.todayPurchaseCost ?? 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
      })}`,
      icon: ShoppingBag,
      accent: "from-rose-500 to-red-600",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      valueClassName: "text-red-600 dark:text-red-400",
      hint: "Restocks recorded today",
    },
    {
      label: "Orders Today",
      value: data?.ordersToday ?? 0,
      icon: Coffee,
      accent: "from-blue-500 to-cyan-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Low Stock Items",
      value: data?.lowStockItems ?? 0,
      icon: AlertTriangle,
      accent: "from-rose-500 to-red-600",
      valueClassName: "text-red-600 dark:text-red-400",
      bg: "bg-rose-50 dark:bg-rose-950/30",
    },
    {
      label: "Active Staff",
      value: data?.activeStaff ?? 0,
      icon: Users,
      accent: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Live Operations Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Real-time business insights for StreetSide Cafe
          </p>
        </div>

        <div className="flex items-center gap-3">
          <BadgePill
            tone={isLive ? "success" : "danger"}
            className="gap-1.5 px-3 py-1.5"
          >
            {isLive ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {isLive ? "Live" : "Offline"}
          </BadgePill>

          <Button
            variant="outline"
            size="sm"
            className="rounded-2xl gap-2"
            onClick={fetchDashboard}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="overflow-hidden border-border/60 bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-950/50"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent ?? "from-zinc-500 to-zinc-700"} text-white shadow-sm`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <p
                    className={`mt-2 font-heading text-3xl font-semibold tracking-tight ${stat.valueClassName ?? ""}`}
                  >
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Top Selling Items - Interactive Chart */}
        <Card className="border-border/60 bg-white/80 shadow-sm lg:col-span-3 dark:bg-zinc-950/50">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Top Selling Items
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ranked by revenue today
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {(data?.topSellingItems ?? []).length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-muted-foreground">
                No sales data yet today.
              </div>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.topSellingItems ?? []}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      tickFormatter={(value) => `₱${value}`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#3f3f46", fontSize: 13, fontWeight: 500 }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(251, 191, 36, 0.08)" }}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid #e4e4e7",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                      }}
                      formatter={(value) => {
                        const num =
                          typeof value === "number"
                            ? value
                            : Number(value) || 0;
                        return [
                          `₱${num.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}`,
                          "Revenue",
                        ];
                      }}
                      labelFormatter={(label) => String(label)}
                    />
                    <Bar dataKey="revenue" radius={[0, 10, 10, 0]} barSize={28}>
                      {(data?.topSellingItems ?? []).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? "#f59e0b" // amber-500 for #1
                              : index === 1
                                ? "#fbbf24" // amber-400
                                : "#fcd34d" // amber-300
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="border-border/60 bg-white/80 shadow-sm lg:col-span-2 dark:bg-zinc-950/50">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Activity Log
              </h2>
              <p className="text-sm text-muted-foreground">
                Logins, inventory & completed orders
              </p>
            </div>

            <ActivityLogPanel
              entries={data?.activityLog ?? []}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      {data?.lastUpdated && (
        <p className="text-center text-xs text-muted-foreground">
          Last updated{" "}
          {new Date(data.lastUpdated).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}
