// src/components/shared/ToastContainer.jsx
import { X } from "lucide-react";

export function ToastContainer({ toasts = [], removeToast }) {
  if (!toasts.length) return null;

  return (
    <div data-ui="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} data-ui="toast">
          <div data-ui="toast-dot" data-variant={t.type || "info"} />
          <div style={{ display: "grid", gap: 2 }}>
            <div data-ui="toast-title">{t.title || "Notice"}</div>
            <div data-ui="toast-msg">{t.message || ""}</div>
          </div>

          <button
            type="button"
            data-ui="toast-close"
            onClick={() => removeToast?.(t.id)}
            aria-label="Dismiss"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
