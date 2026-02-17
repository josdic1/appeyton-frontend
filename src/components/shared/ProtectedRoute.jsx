// src/components/shared/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 🛡️ Crucial: Don't redirect while still checking if the user is logged in
  if (loading) return <div>Checking session...</div>;

  // If no user, send them to login but remember where they tried to go
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
