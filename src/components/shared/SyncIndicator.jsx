// src/components/shared/SyncIndicator.jsx
import { useData } from "../../hooks/useData";

export function SyncIndicator() {
  const { refreshing } = useData();
  if (!refreshing) return null;

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
        <div data-ui="toast-dot" data-variant="warning" />
        <div style={{ display: "grid", gap: 2 }}>
          <div data-ui="toast-title">Syncing</div>
          <div data-ui="toast-msg">Refreshing data…</div>
        </div>
      </div>
    </div>
  );
}
