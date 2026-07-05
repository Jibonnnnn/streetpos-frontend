import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Coffee, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { StatCard } from '@/components/common/StatCard';

export default function ManagerPage() {
  const [stats] = useState({
    todaySales: 1284,
    orders: 47,
    lowStock: 3,
    topItem: "Iced Latte"
  });

  useEffect(() => {
    console.log("Manager dashboard data loaded");
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Manager Dashboard" 
        description="Daily operations overview"
        actions={<Button>Generate Full Report</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Sales" 
          value={`$${stats.todaySales}`} 
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
          value={12} 
          icon={Users}
        />
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