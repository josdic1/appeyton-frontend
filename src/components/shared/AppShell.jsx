// src/components/shared/AppShell.jsx
import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar.jsx";
import { ToastContainer } from "./ToastContainer.jsx";
import { SyncIndicator } from "./SyncIndicator.jsx";

export function AppShell() {
  return (
    <div className="app-shell">
      <NavBar />
      <SyncIndicator />
      <main className="app-main">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}
