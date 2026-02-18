// src/components/base/BaseSkeleton.jsx
import React from "react";

export function ReservationSkeleton({ count = 3 }) {
  // Create an array of 'count' items to render multiple skeletons
  const skeletons = Array.from({ length: count });

  return (
    <div style={{ display: "grid", gap: "14px", width: "100%" }}>
      {skeletons.map((_, i) => (
        <div
          key={i}
          data-ui="card"
          style={{
            padding: "16px",
            animation: "pulse 1.5s infinite ease-in-out",
          }}
        >
          {/* Top Row: Date/Time mimic */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                height: 20,
                width: "40%",
                background: "var(--border)",
                borderRadius: 4,
              }}
            ></div>
            <div
              style={{
                height: 20,
                width: "20%",
                background: "var(--border)",
                borderRadius: 12,
              }}
            ></div>
          </div>

          {/* Middle Row: Table/Details mimic */}
          <div
            style={{
              height: 14,
              width: "60%",
              background: "var(--border-2)",
              borderRadius: 4,
              marginBottom: 8,
            }}
          ></div>

          {/* Bottom Row: Guests mimic */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div
              style={{
                height: 24,
                width: 60,
                background: "var(--border-2)",
                borderRadius: 12,
              }}
            ></div>
            <div
              style={{
                height: 24,
                width: 60,
                background: "var(--border-2)",
                borderRadius: 12,
              }}
            ></div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
