// src/components/base/BaseSkeleton.jsx
import React from "react";

/**
 * ReservationSkeleton: Mimics the look of the ReservationCard.
 * Use this in the ReservationsPage or HomePage during the loading state.
 */
export function ReservationSkeleton({ count = 3 }) {
  const skeletons = Array.from({ length: count });

  return (
    <div style={containerStyle}>
      {skeletons.map((_, i) => (
        <div key={i} data-ui="card" style={skeletonCardStyle}>
          {/* Header Row: Mimics Date and Status Pill */}
          <div style={headerRowStyle}>
            <div style={titleBoxStyle} />
            <div style={pillBoxStyle} />
          </div>

          {/* Subtitle Row: Mimics Table/Meal type */}
          <div style={subtitleBoxStyle} />

          {/* Footer Row: Mimics Attendee Badges */}
          <div style={footerRowStyle}>
            <div style={badgeBoxStyle} />
            <div style={badgeBoxStyle} />
            <div style={{ ...badgeBoxStyle, width: 40 }} />
          </div>
        </div>
      ))}

      {/* Internal Animation Definition */}
      <style>{`
        @keyframes skeleton-pulse {
          0% { background-color: var(--border-2, #eee); opacity: 1; }
          50% { background-color: var(--border, #ddd); opacity: 0.5; }
          100% { background-color: var(--border-2, #eee); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// --- Styles (Themed for Bagger/Sterling) ---

const containerStyle = {
  display: "grid",
  gap: "14px",
  width: "100%",
  maxWidth: "980px",
  margin: "0 auto",
};

const skeletonCardStyle = {
  padding: "20px",
  background: "white",
  border: "1px solid var(--border, #eee)",
  borderRadius: "12px",
  boxSizing: "border-box",
};

const pulseAnimation = {
  animation: "skeleton-pulse 1.8s infinite ease-in-out",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
};

const titleBoxStyle = {
  height: "22px",
  width: "35%",
  borderRadius: "4px",
  ...pulseAnimation,
};

const pillBoxStyle = {
  height: "24px",
  width: "80px",
  borderRadius: "20px",
  ...pulseAnimation,
};

const subtitleBoxStyle = {
  height: "14px",
  width: "55%",
  borderRadius: "4px",
  marginBottom: "18px",
  ...pulseAnimation,
};

const footerRowStyle = {
  display: "flex",
  gap: "8px",
  marginTop: "12px",
};

const badgeBoxStyle = {
  height: "26px",
  width: "65px",
  borderRadius: "6px",
  ...pulseAnimation,
};
