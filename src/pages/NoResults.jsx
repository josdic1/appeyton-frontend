// src/components/shared/NoResults.jsx
import React from "react";
import { SearchX, FilterX, Inbox } from "lucide-react";

/**
 * NoResults: A standardized empty state component.
 * @param {string} title - The main heading (e.g., "No Guests Found")
 * @param {string} hint - Clear instructions on what to do next.
 * @param {string} type - 'search', 'filter', or 'data' to change the icon.
 * @param {ReactNode} action - Optional button or link (e.g., <button>Clear Filters</button>)
 */
export function NoResults({
  title = "No results found",
  hint = "Try adjusting your filters or search terms.",
  type = "search",
  action = null,
}) {
  // Select icon based on type
  const Icon =
    type === "search" ? SearchX : type === "filter" ? FilterX : Inbox;

  return (
    <div style={containerStyle} data-ui="no-results">
      <div style={iconWrapperStyle}>
        <Icon size={48} strokeWidth={1.5} color="var(--muted, #9a9578)" />
      </div>

      <div style={textContainerStyle}>
        <h3 style={titleStyle}>{title}</h3>
        <p style={hintStyle}>{hint}</p>
      </div>

      {action && <div style={actionWrapperStyle}>{action}</div>}
    </div>
  );
}

// --- Styles (Sterling/Bagger Branding) ---

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "60px 20px",
  textAlign: "center",
  background: "transparent",
};

const iconWrapperStyle = {
  marginBottom: "20px",
  opacity: 0.5,
};

const textContainerStyle = {
  maxWidth: "320px",
  marginBottom: "24px",
};

const titleStyle = {
  margin: "0 0 8px 0",
  fontSize: "1.2rem",
  fontWeight: 900,
  color: "var(--black, #000)",
  letterSpacing: "-0.5px",
};

const hintStyle = {
  margin: 0,
  fontSize: "0.9rem",
  fontWeight: 600,
  lineHeight: 1.5,
  color: "var(--muted, #9a9578)",
};

const actionWrapperStyle = {
  marginTop: "8px",
};
