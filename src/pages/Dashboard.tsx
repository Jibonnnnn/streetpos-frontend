import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Coffee, Users, TrendingUp, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { StatCard } from '@/components/common/StatCard';

interface Stat {
  title: string;
  value: number | string;
  icon: React.ElementType;
  change?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { title: "Menu Items", value: 0, icon: Coffee },
    { title: "Staff", value: 0, icon: Users },
    { title: "Today's Sales", value: "$1,284", icon: TrendingUp, change: "+12%" },
    { title: "Open Orders", value: 7, icon: Clock },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, usersRes] = await Promise.all([
          api.get('/menu'),
          api.get('/users')
        ]);
        setStats(prev => prev.map((s, i) => {
          if (i === 0) return { ...s, value: menuRes.data.length };
          if (i === 1) return { ...s, value: usersRes.data.length };
          return s;
        }));
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, []);

  return (
    <div>
      <PageHeader 
        title="Good afternoon, Team" 
        description="Here's what's happening at StreetPOS today" 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard
            key={i}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800">
          <p className="text-zinc-500 italic">Mock recent transactions would appear here in a full implementation.</p>
        </div>
      </div>
    </div>
  );
}