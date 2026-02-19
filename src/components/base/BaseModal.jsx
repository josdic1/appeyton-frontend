// src/components/base/BaseModal.jsx
import { useEffect } from "react";
import { X } from "lucide-react";
import { BaseForm } from "./BaseForm";

/**
 * BaseModal: A standardized overlay for data entry and configuration.
 * Features: Accessibility guards, Backdrop dismissal, and Reactive field bridging.
 */
export function BaseModal({
  open,
  onClose,
  title,
  subtitle,
  fields,
  initialData,
  onSubmit,
  submitLabel = "Save Changes",
  onFieldChange, // Crucial for cascading dropdown logic
}) {
  // Accessibility: Handle Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(e) => {
        // Only close if clicking the actual backdrop, not the card
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={overlayStyle}
    >
      <div data-ui="card" style={modalCardStyle}>
        {/* Header Section */}
        <div style={headerRowStyle}>
          <div style={{ display: "grid", gap: 4 }}>
            <h2 id="modal-title" data-ui="title" style={{ margin: 0 }}>
              {title}
            </h2>
            {subtitle && <div data-ui="subtitle">{subtitle}</div>}
          </div>
          <button
            type="button"
            data-ui="btn-refresh"
            onClick={onClose}
            aria-label="Close Modal"
          >
            <X size={16} />
            <span>Dismiss</span>
          </button>
        </div>

        <div style={dividerWrapperStyle}>
          <div data-ui="divider" />
        </div>

        {/* Content Section: Delegated to BaseForm */}
        <div style={formContentStyle}>
          <BaseForm
            fields={fields}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitLabel={submitLabel}
            onFieldChange={onFieldChange}
          />
        </div>
      </div>
    </div>
  );
}

// --- Styles (Standardized for Sterling Identity) ---

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(0, 0, 0, 0.65)", // Slightly darker for better focus
  backdropFilter: "blur(10px)",
  display: "grid",
  placeItems: "center",
  padding: "20px",
};

const modalCardStyle = {
  width: "min(680px, 100%)",
  maxHeight: "85vh",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  background: "var(--cream, #fffdf5)",
  border: "2px solid #000",
  boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "24px 24px 16px 24px",
};

const dividerWrapperStyle = {
  padding: "0 24px",
  marginBottom: "16px",
};

const formContentStyle = {
  padding: "0 24px 24px 24px",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
};
