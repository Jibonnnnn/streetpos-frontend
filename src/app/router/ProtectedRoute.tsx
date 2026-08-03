import { Navigate, useLocation } from "react-router-dom";
import {
  canAccessPath,
  getStoredRole,
  getStoredToken,
  homePathForRole,
  type AppRole,
} from "@/lib/roles";

type ProtectedRouteProps = {
  children: React.ReactNode;
  /** If set, only these roles may view the page. Prefer listing roles explicitly. */
  allowedRoles?: AppRole[];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const token = getStoredToken();
  const role = getStoredRole();

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Token present but role missing/corrupt — force re-login
  if (!role) {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    return <Navigate to="/login" replace />;
  }

  // Explicit allow-list on the route
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      return <Navigate to={homePathForRole(role)} replace />;
    }
    return <>{children}</>;
  }

  // Fallback: use central route map
  if (!canAccessPath(role, location.pathname)) {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  return <>{children}</>;
}
