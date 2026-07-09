import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Coffee,
  Boxes,
  Users,
  BarChart3,
  UserCog,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Admin", "Manager", "Cashier"] },
  { label: "POS Terminal", href: "/cashier", icon: Coffee, roles: ["Admin", "Manager", "Cashier"] },
  { label: "Inventory", href: "/inventory", icon: Boxes, roles: ["Admin", "Manager"] },
  { label: "Menu Management", href: "/menu", icon: Coffee, roles: ["Admin", "Manager"] },
  { label: "Manager Hub", href: "/manager", icon: BarChart3, roles: ["Admin", "Manager"] },
  { label: "Staff Management", href: "/users", icon: Users, roles: ["Admin"] },
];

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

function NavLinks({
  filteredNavItems,
  activePath,
  onNavigate,
}: {
  filteredNavItems: NavItem[];
  activePath: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-2">
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePath === item.href;

        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-3xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ease-out",
              isActive
                ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/10 dark:bg-white dark:text-zinc-950"
                : "text-zinc-600 hover:-translate-y-0.5 hover:bg-zinc-100/80 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/70 dark:hover:text-white",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-2xl transition-colors",
                isActive
                  ? "bg-white/15"
                  : "bg-zinc-100 text-zinc-500 group-hover:bg-white group-hover:text-zinc-950 dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:bg-zinc-800 dark:group-hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || ""),
  );

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.08),_transparent_24%),linear-gradient(180deg,_#fafafa_0%,_#f4f4f5_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#09090b_0%,_#111113_100%)] lg:flex">
      <aside className="hidden w-80 flex-col border-r border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-950/70 lg:flex">
        <div className="border-b border-zinc-200/80 p-6 md:p-8 dark:border-zinc-800">
          <div className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-lg shadow-amber-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur-sm">
              ☕
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">StreetPOS</h1>
              <p className="text-xs text-white/80">Café Management</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          <NavLinks filteredNavItems={filteredNavItems} activePath={location.pathname} />
        </div>

        <div className="mt-auto border-t border-zinc-200/80 p-5 dark:border-zinc-800">
          <div className="mb-4 rounded-3xl border border-zinc-200/80 bg-white/70 p-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white shadow-sm dark:from-white dark:to-zinc-300 dark:text-zinc-950">
                <UserCog className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user?.fullName || "User"}</p>
                <p className="text-xs capitalize text-zinc-500">{user?.role}</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start gap-2 rounded-2xl border-zinc-200/80 bg-white/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-semibold tracking-tight">StreetPOS</p>
            <p className="text-xs text-muted-foreground">Café Management</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-2xl border-zinc-200/80 bg-white/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
            aria-expanded={isMobileNavOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileNavOpen((current) => !current)}
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle navigation</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <main className="p-4 sm:p-5 md:p-6 lg:p-10">
          <div className="mx-auto max-w-7xl rounded-[1.5rem] border border-white/60 bg-white/70 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/50 sm:rounded-[2rem] sm:p-5 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" id="mobile-navigation">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[86vw] max-w-sm flex-col border-r border-white/60 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-zinc-950">
            <div className="border-b border-zinc-200/80 p-5 dark:border-zinc-800">
              <div className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-lg shadow-amber-500/20">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl backdrop-blur-sm">
                  ☕
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">StreetPOS</h1>
                  <p className="text-xs text-white/80">Café Management</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <NavLinks
                filteredNavItems={filteredNavItems}
                activePath={location.pathname}
                onNavigate={() => setIsMobileNavOpen(false)}
              />
            </div>

            <div className="border-t border-zinc-200/80 p-4 dark:border-zinc-800">
              <div className="mb-4 rounded-3xl border border-zinc-200/80 bg-white/70 p-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white shadow-sm dark:from-white dark:to-zinc-300 dark:text-zinc-950">
                    <UserCog className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{user?.fullName || "User"}</p>
                    <p className="text-xs capitalize text-zinc-500">{user?.role}</p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-2xl border-zinc-200/80 bg-white/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}