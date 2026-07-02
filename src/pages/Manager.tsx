import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Coffee, AlertTriangle } from 'lucide-react';

export default function ManagerPage() {
  const [stats] = useState({
    todaySales: 1284,
    orders: 47,
    lowStock: 3,
    topItem: "Iced Latte"
  });

  useEffect(() => {
    // In real app, fetch from /reports or dedicated endpoints
    console.log("Manager dashboard data loaded");
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Daily operations overview</p>
        </div>
        <Button>Generate Full Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-10 h-10 text-emerald-600" />
              <span className="text-emerald-600 text-sm font-medium">+18% from yesterday</span>
            </div>
            <p className="text-5xl font-semibold mt-6">${stats.todaySales}</p>
            <p className="text-sm text-zinc-500 mt-1">Today's Sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <Coffee className="w-10 h-10 text-amber-600" />
            </div>
            <p className="text-5xl font-semibold mt-6">{stats.orders}</p>
            <p className="text-sm text-zinc-500 mt-1">Orders Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-10 h-10 text-orange-600" />
            </div>
            <p className="text-5xl font-semibold mt-6 text-orange-600">{stats.lowStock}</p>
            <p className="text-sm text-zinc-500 mt-1">Low Stock Items</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <Users className="w-10 h-10 text-violet-600" />
            </div>
            <p className="text-5xl font-semibold mt-6">12</p>
            <p className="text-sm text-zinc-500 mt-1">Active Staff</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-8">
            <h3 className="font-semibold mb-4">Top Selling Items</h3>
            <p className="text-2xl">{stats.topItem}</p>
            <p className="text-sm text-zinc-500">42 sold today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => window.location.href = '/menu'}>Manage Menu</Button>
              <Button variant="outline">View Inventory</Button>
              <Button variant="outline">Staff Schedule</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}