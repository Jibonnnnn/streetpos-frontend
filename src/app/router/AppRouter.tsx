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

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginForm />} />

        {/* All protected pages inside AppLayout (sidebar) */}
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
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
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Manager"]}>
                <ManagerPage />
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
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Reports outside layout if needed */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}