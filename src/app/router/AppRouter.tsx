import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "@/app/layouts/app-layout";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import InventoryPage from "@/pages/Inventory";
import MenuPage from "@/pages/Menu";
import UsersPage from "@/pages/Users";
import ManagerPage from "@/pages/Manager";
import CashierPage from "@/pages/Cashier";
import LandingPage from "@/pages/LandingPage";
import { LoginForm } from "@/components/login-form";
import ReportsPage from "@/pages/Reports";
import CategoriesPage from "@/pages/Categories";
import PromotionsPage from "@/pages/Promotions";
import AddonsPage from "@/pages/Addons";
import { getStoredRole, getStoredToken, homePathForRole } from "@/lib/roles";

function CatchAllRedirect() {
  const token = getStoredToken();
  const role = getStoredRole();
  if (!token || !role) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForRole(role)} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginForm />} />

        {/* Authenticated app shell */}
        <Route element={<AppLayout />}>
          {/* All roles */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager", "Cashier"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashier"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager", "Cashier"]}>
                <CashierPage />
              </ProtectedRoute>
            }
          />

          {/* Admin + Manager */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/menu"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                <MenuPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotions"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                <PromotionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addons"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                <AddonsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                <ManagerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin only */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Unknown → role home (or login) */}
        <Route path="*" element={<CatchAllRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
