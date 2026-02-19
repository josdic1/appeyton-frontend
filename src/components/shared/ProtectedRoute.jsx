// src/components/shared/ProtectedRoute.jsx
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useContext } from "react";
import { ToastContext } from "../../contexts/ToastContext";

/**
 * ProtectedRoute Guard
 * 1. Blocks unauthorized access to member-only routes.
 * 2. Persists the intended destination via location state.
 * 3. Integrates with Toast system to notify on session expiry.
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const { addToast } = useContext(ToastContext);
  const location = useLocation();

  // 🛡️ Guard: Prevents redirect flicker during initial token validation
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
          Verifying Session...
        </p>
      </div>
    );
  }

  // Effect to notify user if they were redirected back to login
  // (Optional: can be triggered by your api.js interceptor instead)
  if (!user && location.pathname !== "/login") {
    // We don't trigger toast here to avoid infinite loops,
    // we let the Login page or API interceptor handle the "Why".
  }

  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
