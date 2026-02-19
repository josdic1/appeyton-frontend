// src/components/shared/AppShell.jsx
import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar.jsx";
import { ToastContainer } from "./ToastContainer.jsx";
import { SyncIndicator } from "./SyncIndicator.jsx";
import { ToastContext } from "../../contexts/ToastContext";

/**
 * AppShell: The Master Layout
 * Persists global UI elements (Nav, Toasts, Sync) across all authenticated routes.
 */
export function AppShell() {
  // Consume the toast state at the shell level to pass down to the container
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div className="app-shell" style={shellLayout}>
      {/* 1. Global Navigation */}
      <NavBar />

      {/* 2. Background Sync/Connectivity Heartbeat */}
      <SyncIndicator />

      {/* 3. Page Content Area */}
      <main className="app-main" style={mainContentStyle}>
        <Outlet />
      </main>

      {/* 4. Global Notification Layer */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

// --- Styles ---

const shellLayout = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  background: "var(--cream, #fffdf5)",
};

const mainContentStyle = {
  flex: 1,
  marginTop: "72px", // Matches NavBar height
  padding: "24px",
  width: "100%",
  maxWidth: "1400px",
  margin: "72px auto 0 auto", // Center the main content
  boxSizing: "border-box",
};
