// src/components/base/BaseViewModal.jsx
import { useEffect } from "react";
import { X, Pencil, Trash2, Info } from "lucide-react";

/**
 * BaseViewModal: Standardized detail inspection overlay.
 * Features: Formatted rendering, accessibility guards, and direct action pivots.
 */
export function BaseViewModal({
  open,
  onClose,
  title,
  subtitle = "Record Details",
  fields = [],
  item,
  onEdit,
  onDelete,
}) {
  // Accessibility: Listen for Escape key to close
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
      style={overlayStyle}
    >
      <div data-ui="card" style={modalCardStyle}>
        {/* 1. Header Section */}
        <div data-ui="row" style={headerRowStyle}>
          <div style={{ display: "grid", gap: 4 }}>
            <div data-ui="title" style={titleStyle}>
              {title}
            </div>
            <div data-ui="subtitle" style={subtitleStyle}>
              <Info size={12} /> {subtitle}
            </div>
          </div>
          <button
            type="button"
            data-ui="btn-refresh"
            onClick={onClose}
            title="Dismiss"
          >
            <X size={16} />
            <span>Close</span>
          </button>
        </div>

        <div style={dividerWrapper}>
          <div data-ui="divider" />
        </div>

        {/* 2. Field Display Grid */}
        <div style={contentGridStyle}>
          {fields.map((f) => (
            <div key={f.key} style={detailItemStyle}>
              <div data-ui="label" style={fieldLabelStyle}>
                {f.label}
              </div>
              <div data-ui="hint" style={fieldValueStyle}>
                {f.render
                  ? f.render(item?.[f.key], item)
                  : (item?.[f.key] ?? "—")}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Action Footer */}
        <div style={footerStyle}>
          <div
            data-ui="row"
            style={{ justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}
          >
            {onEdit && (
              <button
                type="button"
                data-ui="btn-refresh"
                onClick={onEdit}
                disabled={!item?.id}
                style={editBtnStyle}
              >
                <Pencil size={16} />
                <span>Modify Record</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                data-ui="btn-refresh"
                onClick={onDelete}
                disabled={!item?.id}
                style={deleteBtnStyle}
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

// --- Styles (Bagger/Sterling Visual Identity) ---

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  background: "rgba(0,0,0,0.65)",
  backdropFilter: "blur(12px)",
  display: "grid",
  placeItems: "center",
  padding: 16,
};

const modalCardStyle = {
  width: "min(680px, 100%)",
  maxHeight: "85vh",
  overflowY: "auto",
  background: "var(--cream, #fffdf5)",
  border: "2px solid #000",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
};

const headerRowStyle = {
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "24px 24px 16px 24px",
};

const titleStyle = {
  fontSize: "1.4rem",
  fontWeight: 900,
  letterSpacing: "-0.5px",
};
const subtitleStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontWeight: 700,
};

const dividerWrapper = { padding: "0 24px" };

const contentGridStyle = {
  display: "grid",
  gap: "16px",
  padding: "24px",
};

const detailItemStyle = {
  paddingBottom: "12px",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
};

const fieldLabelStyle = {
  fontSize: "0.65rem",
  fontWeight: 900,
  textTransform: "uppercase",
  color: "#999",
  letterSpacing: "0.05em",
  marginBottom: "4px",
};

const fieldValueStyle = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "#333",
  lineHeight: 1.5,
};

const footerStyle = {
  padding: "16px 24px 24px 24px",
  marginTop: "12px",
};

const editBtnStyle = { fontWeight: 800 };
const deleteBtnStyle = { color: "var(--danger, #ef4444)", fontWeight: 800 };
