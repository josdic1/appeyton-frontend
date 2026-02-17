// src/components/shared/SyncIndicator.jsx
import { useData } from "../../hooks/useData";

export function SyncIndicator() {
  const { refreshing, syncType } = useData(); // Assume useData now tracks the 'type' of sync
  if (!refreshing) return null;

  // Determine if this is a standard refresh or a security update
  const isSecurity = syncType === "security";

  return (
    <div
      role="status"
      aria-live="polite"
      data-ui="sync-indicator"
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 10000,
        pointerEvents: "none",
      }}
    >
      <div data-ui="toast">
        <div
          data-ui="toast-dot"
          data-variant={isSecurity ? "info" : "warning"}
        />
        <div style={{ display: "grid", gap: 2 }}>
          <div data-ui="toast-title">
            {isSecurity ? "Security Update" : "Syncing"}
          </div>
          <div data-ui="toast-msg">
            {isSecurity ? "Applying new permissions..." : "Refreshing data…"}
          </div>
        </div>
      </div>
    </div>
  );
}
