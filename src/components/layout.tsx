import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Coffee, 
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
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Cashier'] },
  { label: 'POS Terminal', href: '/cashier', icon: Coffee, roles: ['Admin', 'Manager', 'Cashier'] },
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
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <div className="w-72 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        <div className="p-8 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
              ☕
            </div>
            <div>
              <h1 className="font-semibold text-2xl tracking-tight">StreetPOS</h1>
              <p className="text-xs text-zinc-500">Café Management</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <nav className="space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all",
                    isActive 
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" 
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center text-lg">
              <UserCog className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userName}</p>
              <p className="text-xs text-zinc-500 capitalize">{userRole}</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}