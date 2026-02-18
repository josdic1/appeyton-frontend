// src/components/shared/AdminRoute.jsx
// FIX #6: Previous version checked loading for the spinner but still fell through
// to the role check while user was null, causing an instant redirect to "/" before
// the session had a chance to resolve. Now: loading → spinner, no user → let
// ProtectedRoute (parent) handle it, wrong role → redirect to home.
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function AdminRoute() {
  const { user, loading } = useAuth();

  // Still checking session — don't redirect yet
  if (loading) return <div>Validating permissions...</div>;

  // No user at all — ProtectedRoute above us handles this redirect to /login.
  // We return null here to avoid double-redirecting.
  if (!user) return null;

  // User is authenticated but not an admin — send back to home
  if (user.role !== "admin") {
    console.error("Access Denied: Admin role required.");
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
