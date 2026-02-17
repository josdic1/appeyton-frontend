// src/components/shared/AdminRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div>Validating permissions...</div>;

  // 🛡️ Lock: Role must be strictly 'admin'
  if (user?.role !== "admin") {
    console.error("Access Denied: Admin role required.");
    return <Navigate to="/" replace />; // Kick them back to Home
  }

  return <Outlet />;
}
