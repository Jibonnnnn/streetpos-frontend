/**
 * Central role-based access for StreetPOS.
 *
 * Admin   — full system access
 * Manager — operations (menu, inventory, reports, POS) — no staff admin
 * Cashier — POS terminal + basic dashboard only
 */

export type AppRole = "Admin" | "Manager" | "Cashier";

export const ALL_ROLES: AppRole[] = ["Admin", "Manager", "Cashier"];

/** Normalize whatever the API / localStorage stored into a known role. */
export function normalizeRole(raw: string | null | undefined): AppRole | null {
  if (!raw) return null;
  const r = raw.trim().toLowerCase();
  if (r === "admin") return "Admin";
  if (r === "manager") return "Manager";
  if (r === "cashier") return "Cashier";
  // already correct casing
  if (raw === "Admin" || raw === "Manager" || raw === "Cashier") return raw;
  return null;
}

export function getStoredRole(): AppRole | null {
  return normalizeRole(localStorage.getItem("userRole"));
}

export function getStoredToken(): string | null {
  return localStorage.getItem("token") || localStorage.getItem("accessToken");
}

/** Default landing page after login (and when role is denied a page). */
export function homePathForRole(role: AppRole | null): string {
  switch (role) {
    case "Cashier":
      return "/cashier";
    case "Manager":
      return "/dashboard";
    case "Admin":
      return "/dashboard";
    default:
      return "/login";
  }
}

/** Which roles may open each app path (must stay in sync with AppRouter). */
export const ROUTE_ROLES: Record<string, AppRole[]> = {
  "/dashboard": ["Admin", "Manager", "Cashier"],
  "/cashier": ["Admin", "Manager", "Cashier"],
  "/inventory": ["Admin", "Manager"],
  "/menu": ["Admin", "Manager"],
  "/categories": ["Admin", "Manager"],
  "/promotions": ["Admin", "Manager"],
  "/addons": ["Admin", "Manager"],
  "/manager": ["Admin", "Manager"],
  "/reports": ["Admin", "Manager"],
  "/users": ["Admin"],
};

export function canAccessPath(role: AppRole | null, path: string): boolean {
  if (!role) return false;
  // exact match first
  const allowed = ROUTE_ROLES[path];
  if (allowed) return allowed.includes(role);
  // prefix match for nested paths
  const key = Object.keys(ROUTE_ROLES).find(
    (k) => path === k || path.startsWith(k + "/"),
  );
  if (key) return ROUTE_ROLES[key].includes(role);
  return false;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  Admin: "Administrator",
  Manager: "Manager",
  Cashier: "Cashier",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  Admin: "Full access — staff, menu, inventory, reports, POS",
  Manager: "Operations — menu, inventory, promotions, reports, POS",
  Cashier: "POS terminal — take orders and collect payments",
};
