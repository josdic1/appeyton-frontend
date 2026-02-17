// src/components/base/BaseViewModal.jsx
import { useEffect } from "react";
import { X, Pencil, Trash2 } from "lucide-react";

export function BaseViewModal({
  open,
  onClose,
  title,
  subtitle,
  fields = [],
  item,
  onEdit,
  onDelete,
}) {
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
            <div data-ui="title">{title}</div>
            {subtitle && <div data-ui="subtitle">{subtitle}</div>}
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
          {fields.map((f) => (
            <div key={f.key} data-ui="item">
              <div data-ui="label">{f.label}</div>
              <div data-ui="hint">
                {f.render
                  ? f.render(item?.[f.key], item)
                  : (item?.[f.key] ?? "—")}
              </div>
            </div>
          ))}

          <div
            data-ui="row"
            style={{ justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}
          >
            {onEdit && (
              <button
                type="button"
                data-ui="btn-refresh"
                onClick={onEdit}
                disabled={!item?.id}
              >
                <Pencil size={16} />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                data-ui="btn-refresh"
                onClick={onDelete}
                disabled={!item?.id}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
