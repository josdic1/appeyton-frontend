// src/components/shared/SyncIndicator.jsx
import React from "react";
import { useData } from "../../hooks/useData";
import { useOnline } from "../../hooks/useOnline";
import { Loader2, WifiOff, RefreshCcw } from "lucide-react";

/**
 * SyncIndicator Component
 * Provides real-time feedback for background data synchronization
 * and network connectivity status.
 */
export function SyncIndicator() {
  const { refreshing, syncType } = useData();
  const isOnline = useOnline();

  // If we are online and NOT refreshing, we stay hidden.
  // If we are offline, we ALWAYS show the disconnected status.
  if (isOnline && !refreshing) return null;

  const isSecurity = syncType === "security";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "24px",
        left: "24px", // Moved to left to stay clear of ToastContainer on the right
        zIndex: 10000,
        pointerEvents: "none",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 16px",
          background: "var(--black, #1a1a1a)",
          color: "var(--cream, #ebe5c0)",
          borderRadius: "8px",
          border: "2px solid var(--black)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          pointerEvents: "auto",
        }}
      >
        {/* ICON LOGIC */}
        {!isOnline ? (
          <WifiOff size={16} color="#ef4444" />
        ) : (
          <Loader2
            size={16}
            className="animate-spin"
            style={{ animation: "spin 1s linear infinite" }}
          />
        )}

        <div style={{ display: "grid", gap: 0 }}>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: !isOnline ? "#ef4444" : "var(--orange, #eb5638)",
            }}
          >
            {!isOnline ? "Offline" : isSecurity ? "Security" : "Syncing"}
          </div>

          <div style={{ fontSize: "0.8rem", fontWeight: 600, opacity: 0.9 }}>
            {!isOnline
              ? "Reconnecting..."
              : isSecurity
                ? "Updating permissions..."
                : `Refreshing ${syncType || "data"}...`}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
