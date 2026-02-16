// src/components/entities/EntityViewModal.jsx
import { useEffect } from "react";
import { X, Pencil, Trash2 } from "lucide-react";

export function EntityViewModal({ open, onClose, entity, onEdit, onDelete }) {
  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div data-ui="card" style={{ width: "min(720px, 100%)" }}>
        <div
          data-ui="row"
          style={{ justifyContent: "space-between", alignItems: "start" }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div data-ui="title">{entity?.name || "Entity"}</div>
            <div data-ui="subtitle">Category: {entity?.category || "None"}</div>
          </div>

          <button type="button" data-ui="btn-refresh" onClick={onClose}>
            <X size={16} />
            <span>Close</span>
          </button>
        </div>

        <div style={{ height: 12 }} />
        <div data-ui="divider" />
        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gap: 12 }}>
          <div data-ui="item">
            <div data-ui="label">Name</div>
            <div data-ui="hint">{entity?.name || "—"}</div>
          </div>

          <div data-ui="item">
            <div data-ui="label">Category</div>
            <div data-ui="hint">{entity?.category || "—"}</div>
          </div>

          <div
            data-ui="row"
            style={{ justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}
          >
            <button
              type="button"
              data-ui="btn-refresh"
              onClick={onEdit}
              disabled={!entity?.id}
            >
              <Pencil size={16} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              data-ui="btn-refresh"
              onClick={onDelete}
              disabled={!entity?.id}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
