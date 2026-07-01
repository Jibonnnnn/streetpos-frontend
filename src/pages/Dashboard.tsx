import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ menuItems: 0, users: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [menuRes, usersRes] = await Promise.all([
          api.get('/menu'),
          api.get('/users')
        ]);
        setStats({
          menuItems: menuRes.data.length,
          users: usersRes.data.length
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-zinc-500 text-sm">Total Menu Items</h3>
          <p className="text-4xl font-bold mt-2">{stats.menuItems}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-zinc-500 text-sm">Active Staff</h3>
          <p className="text-4xl font-bold mt-2">{stats.users}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-zinc-500 text-sm">Welcome back!</h3>
          <p className="text-lg mt-2">Manage your café operations from here.</p>
        </div>
      </div>
    </div>
  );
}