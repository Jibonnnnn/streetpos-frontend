import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginForm } from "@/components/login-form";
import Layout from "@/components/layout";
import Dashboard from "@/pages/Dashboard";
import MenuPage from "@/pages/Menu";
import UsersPage from "@/pages/Users";
import ManagerPage from "@/pages/Manager";
import CashierPage from "@/pages/Cashier";

function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[]; 
}) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(userRole || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          {/* Manager Routes */}
          <Route 
            path="/manager" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <ManagerPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Cashier Routes */}
          <Route 
            path="/cashier" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Cashier']}>
                <CashierPage />
              </ProtectedRoute>
            } 
          />

          {/* Existing Admin/Manager Pages */}
          <Route 
            path="/menu" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <MenuPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <UsersPage />
              </ProtectedRoute>
            } 
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;