import { useEffect, useState, type ElementType } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Coffee, 
  Boxes,
  Users, 
  BarChart3, 
  UserCog, 
  LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Cashier'] },
  { label: 'POS Terminal', href: '/cashier', icon: Coffee, roles: ['Admin', 'Manager', 'Cashier'] },
  { label: 'Inventory', href: '/inventory', icon: Boxes, roles: ['Admin', 'Manager'] },
  { label: 'Menu Management', href: '/menu', icon: Coffee, roles: ['Admin', 'Manager'] },
  { label: 'Manager Hub', href: '/manager', icon: BarChart3, roles: ['Admin', 'Manager'] },
  { label: 'Staff Management', href: '/users', icon: Users, roles: ['Admin'] },
];

export default function Layout() {
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    const name = localStorage.getItem('fullName') || 'User';
    setUserRole(role);
    setUserName(name);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.08),_transparent_24%),linear-gradient(180deg,_#fafafa_0%,_#f4f4f5_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#09090b_0%,_#111113_100%)]">
      {/* Sidebar */}
      <div className="w-80 border-r border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-950/70 flex flex-col">
        <div className="p-8 border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-lg shadow-amber-500/20">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl backdrop-blur-sm">
              ☕
            </div>
            <div>
              <h1 className="font-semibold text-2xl tracking-tight">StreetPOS</h1>
              <p className="text-xs text-white/80">Café Management</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto">
          <nav className="space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-3xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ease-out",
                    isActive 
                      ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/10 dark:bg-white dark:text-zinc-950" 
                      : "text-zinc-600 hover:-translate-y-0.5 hover:bg-zinc-100/80 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/70 dark:hover:text-white"
                  )}
                >
                  <span className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition-colors",
                    isActive
                      ? "bg-white/15"
                      : "bg-zinc-100 text-zinc-500 group-hover:bg-white group-hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:bg-zinc-800 dark:group-hover:text-white"
                  )}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-5 border-t border-zinc-200/80 dark:border-zinc-800 mt-auto">
          <div className="mb-4 rounded-3xl border border-zinc-200/80 bg-white/70 p-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-zinc-900 to-zinc-700 text-white rounded-2xl flex items-center justify-center shadow-sm dark:from-white dark:to-zinc-300 dark:text-zinc-950">
                <UserCog className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{userName}</p>
                <p className="text-xs text-zinc-500 capitalize">{userRole}</p>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 rounded-2xl border-zinc-200/80 bg-white/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6 md:p-10">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/50 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}