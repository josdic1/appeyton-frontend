// src/components/base/BaseModal.jsx
import { useEffect } from "react";
import { X } from "lucide-react";
import { BaseForm } from "./BaseForm";

export function BaseModal({ open, onClose, title, subtitle, fields, initialData, onSubmit, submitLabel = "Save" }) {
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
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
        display: "grid", placeItems: "center", padding: 16,
      }}
    >
      <div data-ui="card" style={{ width: "min(720px, 100%)" }}>
        <div data-ui="row" style={{ justifyContent: "space-between", alignItems: "start" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div data-ui="title">{title}</div>
            {subtitle && <div data-ui="subtitle">{subtitle}</div>}
          </div>
          <button type="button" data-ui="btn-refresh" onClick={onClose} title="Close">
            <X size={16} /><span>Close</span>
          </button>
        </div>

        <div style={{ height: 12 }} />
        <div data-ui="divider" />
        <div style={{ height: 12 }} />

        <BaseForm
          fields={fields}
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel={submitLabel}
        />
      </div>
    </div>
  );
}