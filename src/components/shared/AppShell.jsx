// src/components/shared/AppShell.jsx
// CRITICAL FIX: ToastContainer was receiving no props, so toasts never displayed.
// It must consume the ToastContext to get toasts[] and removeToast.
import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar.jsx";
import { ToastContainer } from "./ToastContainer.jsx";
import { SyncIndicator } from "./SyncIndicator.jsx";
import { ToastContext } from "../../contexts/ToastContext";

export function AppShell() {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div className="app-shell">
      <NavBar />
      <SyncIndicator />
      <main className="app-main">
        <Outlet />
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
