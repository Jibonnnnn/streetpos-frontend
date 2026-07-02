import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Coffee, Users, TrendingUp, Clock } from 'lucide-react';

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
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Good afternoon, Team</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Here's what's happening at StreetPOS today</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <stat.icon className="w-9 h-9 text-amber-600" />
              {stat.change && <span className="text-emerald-600 text-sm font-medium">{stat.change}</span>}
            </div>
            <p className="text-5xl font-semibold mt-8 mb-1">{stat.value}</p>
            <p className="text-sm text-zinc-500">{stat.title}</p>
          </div>
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