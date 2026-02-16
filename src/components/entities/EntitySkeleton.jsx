// src/components/entities/EntitySkeleton.jsx
export function EntitySkeleton() {
  return (
    <div data-ui="item">
      <div data-ui="row" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 6, flex: 1 }}>
          <div
            data-ui="skeleton"
            style={{ width: "45%", height: 18, borderRadius: 6 }}
          />
          <div
            data-ui="skeleton"
            style={{ width: "30%", height: 12, borderRadius: 6 }}
          />
        </div>
        <div data-ui="row" style={{ gap: 8 }}>
          <div
            data-ui="skeleton"
            style={{ width: 70, height: 34, borderRadius: 999 }}
          />
          <div
            data-ui="skeleton"
            style={{ width: 70, height: 34, borderRadius: 999 }}
          />
        </div>
      </div>
    </div>
  );
}