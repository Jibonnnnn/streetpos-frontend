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
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  parent?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Admin", "Manager", "Cashier"] },
  { label: "POS Terminal", href: "/cashier", icon: Coffee, roles: ["Admin", "Manager", "Cashier"] },
  { label: "Inventory", href: "/inventory", icon: Boxes, roles: ["Admin", "Manager"] },

  { label: "Menu Management", href: "/menu", icon: Coffee, roles: ["Admin", "Manager"] },
  
  // ← Sub-button under Menu Management
  { 
    label: "Categories", 
    href: "/categories", 
    icon: Tags, 
    roles: ["Admin", "Manager"],
    parent: "Menu Management" 
  },

  { label: "Manager Hub", href: "/manager", icon: BarChart3, roles: ["Admin", "Manager"] },
  { label: "Staff Management", href: "/users", icon: Users, roles: ["Admin"] },
];

const roleAccent: Record<string, string> = {
  Admin: "from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300",
  Manager: "from-amber-500 to-orange-600",
  Cashier: "from-blue-500 to-cyan-600",
};

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

function NavLinks({
  filteredNavItems,
  activePath,
  onNavigate,
  isCollapsed,
}: {
  filteredNavItems: NavItem[];
  activePath: string;
  onNavigate?: () => void;
  isCollapsed?: boolean;
}) {
  const mainItems = filteredNavItems.filter((item) => !item.parent);
  const subItemsMap = new Map<string, NavItem[]>();

  // Group sub-items by their parent
  filteredNavItems.forEach((item) => {
    if (item.parent) {
      if (!subItemsMap.has(item.parent)) {
        subItemsMap.set(item.parent, []);
      }
      subItemsMap.get(item.parent)!.push(item);
    }
  });

  if (isCollapsed) {
    // Collapsed sidebar - show all as icons with tooltips
    return (
      <nav className="flex flex-col items-center gap-3">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className="group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200"
              aria-label={item.label}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-x-[calc(100%+8px)] -translate-y-1/2 rounded-full bg-amber-500" />
              )}
              <span
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
                  isActive
                    ? "bg-zinc-950 text-white shadow-lg"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>

              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-xl bg-zinc-950 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-all group-hover:opacity-100 dark:bg-white dark:text-zinc-950 z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // Expanded sidebar with sub-items
  return (
    <nav className="space-y-1">
      {mainItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePath === item.href;
        const subs = subItemsMap.get(item.label) || [];

        return (
          <div key={item.href}>
            {/* Main Item */}
            <Link
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-3xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-zinc-950 text-white shadow-lg"
                  : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/70 dark:hover:text-white"
              )}
            >
              {isActive && (
                <span className="absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-amber-500" />
              )}
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 group-hover:bg-white dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:bg-zinc-800">
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">{item.label}</span>
            </Link>

            {/* Sub-items (indented) */}
            {subs.length > 0 && (
              <div className="ml-8 mt-1 space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                {subs.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = activePath === sub.href;

                  return (
                    <Link
                      key={sub.href}
                      to={sub.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm transition-all",
                        isSubActive
                          ? "bg-amber-100 font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      )}
                    >
                      <SubIcon className="h-4 w-4" />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || ""),
  );

  const accentClass = roleAccent[user?.role ?? ""] ?? "from-zinc-900 to-zinc-700";

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.08),_transparent_24%),linear-gradient(180deg,_#fafafa_0%,_#f4f4f5_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,_#09090b_0%,_#111113_100%)] lg:flex">
      {/* Collapsible Sidebar */}
      <aside
        className={cn(
          "hidden flex-col border-r border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-950/70 lg:flex transition-all duration-300",
          isSidebarCollapsed ? "w-20" : "w-80"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-zinc-200/80 dark:border-zinc-800",
            isSidebarCollapsed ? "flex-col gap-4 p-4" : "justify-between p-6 md:p-8",
          )}
        >
          <div className={cn("flex items-center gap-3", isSidebarCollapsed && "flex-col gap-0")}>
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <img
                src="/StreetSidePhoto.png"
                alt="StreetSide Cafe"
                className="h-10 w-10 object-contain"
              />
            </div>

            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">StreetSide Cafe</h1>
                <p className="-mt-0.5 text-xs text-amber-600/80 dark:text-amber-500">POS System</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="h-9 w-9 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        <div className={cn("flex-1 overflow-y-auto", isSidebarCollapsed ? "px-3 py-6" : "p-4 md:p-5")}>
          <NavLinks
            filteredNavItems={filteredNavItems}
            activePath={location.pathname}
            isCollapsed={isSidebarCollapsed}
          />
        </div>

        <div
          className={cn(
            "mt-auto border-t border-zinc-200/80 dark:border-zinc-800",
            isSidebarCollapsed ? "flex flex-col items-center gap-3 p-4" : "p-5",
          )}
        >
          {!isSidebarCollapsed && (
            <div className="mb-4 rounded-3xl border border-zinc-200/80 bg-white/70 p-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm dark:text-zinc-950",
                    accentClass,
                  )}
                >
                  <UserCog className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{user?.fullName || "User"}</p>
                  <p className="text-xs capitalize text-zinc-500">{user?.role}</p>
                </div>
              </div>
            </div>
          )}

          {isSidebarCollapsed ? (
            <div className="group relative">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm dark:text-zinc-950",
                  accentClass,
                )}
              >
                <UserCog className="h-4 w-4" />
              </div>
              <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl bg-zinc-950 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 dark:bg-white dark:text-zinc-950 z-50">
                {user?.fullName || "User"} · {user?.role}
              </span>
            </div>
          ) : null}

          {isSidebarCollapsed ? (
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-2xl border-zinc-200/80 bg-white/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 rounded-2xl border-zinc-200/80 bg-white/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
              <img
                src="/StreetSidePhoto.jpg"
                alt="StreetSide Cafe"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold tracking-tight">StreetSide Cafe</p>
              <p className="text-xs text-muted-foreground">POS System</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-2xl border-zinc-200/80 bg-white/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
            onClick={() => setIsMobileNavOpen((current) => !current)}
            aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileNavOpen}
            aria-controls="mobile-navigation"
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <main className="p-4 sm:p-5 md:p-6 lg:p-10">
          <div className="mx-auto max-w-7xl rounded-[1.5rem] border border-white/60 bg-white/70 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/50 sm:rounded-[2rem] sm:p-5 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" id="mobile-navigation">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close navigation overlay"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[86vw] max-w-sm flex-col border-r border-white/60 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-zinc-950">
            {/* Mobile Header */}
            <div className="border-b border-zinc-200/80 p-5 dark:border-zinc-800">
              <div className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-lg shadow-amber-500/20">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white/15">
                  <img
                    src="/StreetSidePhoto.jpg"
                    alt="StreetSide Cafe"
                    className="h-9 w-9 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">StreetSide Cafe</h1>
                  <p className="text-xs text-white/80">POS System</p>
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
              <div className="mb-3 flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm dark:text-zinc-950",
                    accentClass,
                  )}
                >
                  <UserCog className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user?.fullName || "User"}</p>
                  <p className="text-xs capitalize text-zinc-500">{user?.role}</p>
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
      )}
    </div>
  );
}