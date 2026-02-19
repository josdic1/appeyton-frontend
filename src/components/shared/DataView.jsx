// src/components/shared/DataView.jsx
import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useData } from "../../hooks/useData";
import { Database, ShieldCheck, User, HardDrive } from "lucide-react";

/**
 * DataView: A developer-only inspection utility.
 * Displays the current state of Auth and Data contexts for debugging.
 */
export function DataView() {
  const { user, token } = useAuth();
  const { items, refreshing, syncType } = useData();

  // Helper to safely stringify data for display
  const formatJSON = (data) => JSON.stringify(data, null, 2);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Data copied to clipboard for debugging.");
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Database size={28} color="var(--orange)" />
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900 }}>
            State Explorer
          </h1>
        </div>
        <div style={badgeStyle(refreshing)}>
          {refreshing ? `Syncing ${syncType}...` : "Idle / Synced"}
        </div>
      </header>

      <div style={gridStyle}>
        {/* 1. Identity State */}
        <section data-ui="card" style={sectionStyle}>
          <div style={sectionHeader}>
            <User size={18} /> <h3>Identity Context</h3>
          </div>
          <div style={controlsRow}>
            <button
              onClick={() => copyToClipboard(formatJSON(user))}
              style={smallBtn}
            >
              Copy User JSON
            </button>
          </div>
          <pre style={preStyle}>
            {formatJSON(user || { message: "No user authenticated" })}
          </pre>

          <div style={{ marginTop: 20 }}>
            <div style={sectionHeader}>
              <ShieldCheck size={18} /> <h3>Active Token</h3>
            </div>
            <code style={tokenCodeStyle}>
              {token ? `${token.substring(0, 30)}...` : "None"}
            </code>
          </div>
        </section>

        {/* 2. Collection State */}
        <section data-ui="card" style={sectionStyle}>
          <div style={sectionHeader}>
            <HardDrive size={18} /> <h3>Data Collection</h3>
          </div>
          <div style={controlsRow}>
            <span style={{ fontSize: "0.8rem", fontWeight: 800 }}>
              {items?.length || 0} items in memory
            </span>
            <button
              onClick={() => copyToClipboard(formatJSON(items))}
              style={smallBtn}
            >
              Copy Items JSON
            </button>
          </div>
          <pre style={preStyle}>{formatJSON(items || [])}</pre>
        </section>
      </div>
    </div>
  );
}

// --- Styles (Themed for Bagger Dev Experience) ---

const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "40px 20px",
};
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "32px",
};
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
};
const sectionStyle = {
  padding: "24px",
  background: "white",
  border: "2px solid #000",
  borderRadius: "12px",
  overflow: "hidden",
};
const sectionHeader = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: "15px",
};
const preStyle = {
  background: "#1a1a1a",
  color: "#34d399",
  padding: "15px",
  borderRadius: "8px",
  fontSize: "0.8rem",
  overflowX: "auto",
  maxHeight: "400px",
  border: "1px solid #333",
  fontFamily: "'JetBrains Mono', monospace",
};
const controlsRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
};
const smallBtn = {
  background: "#eee",
  border: "1px solid #ccc",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.7rem",
  cursor: "pointer",
  fontWeight: 700,
};
const tokenCodeStyle = {
  display: "block",
  background: "#f0f0f0",
  padding: "10px",
  borderRadius: "4px",
  fontSize: "0.75rem",
  wordBreak: "break-all",
  opacity: 0.7,
};
const badgeStyle = (refreshing) => ({
  background: refreshing ? "var(--orange)" : "#10b981",
  color: "white",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "0.8rem",
  fontWeight: 900,
});
