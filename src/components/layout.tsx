import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home, Menu, Users, Coffee } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: Home, path: "/dashboard" },
  { label: "Menu", icon: Menu, path: "/menu" },
  { label: "Users", icon: Users, path: "/users", adminOnly: true },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem('userRole');
  const fullName = localStorage.getItem('fullName');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <Coffee className="w-8 h-8 text-violet-600" />
            <div>
              <h1 className="font-bold text-xl">StreetPOS</h1>
              <p className="text-xs text-zinc-500">Café Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              if (item.adminOnly && userRole !== 'Admin') return null;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-violet-100 text-violet-700" 
                        : "hover:bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              👤
            </div>
            <div>
              <p className="font-medium text-sm">{fullName}</p>
              <p className="text-xs text-zinc-500">{userRole}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}