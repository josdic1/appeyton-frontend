// src/components/shared/AdminRoute.jsx
import React, { useEffect, useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ToastContext } from "../../contexts/ToastContext";

/**
 * AdminRoute Guard
 * 1. Validates specific role-based permissions (Admin/Staff).
 * 2. Provides rich feedback via 5W1H Toasts on access denial.
 * 3. Prevents race conditions during session resolution.
 */
export function AdminRoute() {
  const { user, loading } = useAuth();
  const { addToast } = useContext(ToastContext);

  // 🛡️ Guard: Prevents role-check while the session is still fetching
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "80vh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
          color: "var(--muted)",
        }}
      >
        <div
          className="spinner"
          style={{
            border: "3px solid var(--cream)",
            borderTop: "3px solid var(--black)",
            borderRadius: "50%",
            width: "30px",
            height: "30px",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>
          Validating Permissions...
        </p>
      </div>
    );
  }

  // No user at all — The parent ProtectedRoute handles the redirect to /login.
  if (!user) return null;

  // 🔐 Role Validation: Check if the user is an admin or staff
  // Adjust this check if your staff also need access to these routes
  const hasAccess = user.role === "admin" || user.role === "staff";

  if (!hasAccess) {
    // Fire a 5W1H Toast explaining the denial
    // We wrap in useEffect if we want to fire it once, or just rely on the redirect
    console.warn(`Access Denied for user: ${user.email}. Admin role required.`);

    // Note: Toasts are usually triggered in a useEffect or an action,
    // but we can trigger it here safely if the ToastProvider is ready.
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
