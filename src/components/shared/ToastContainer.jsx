// src/components/shared/ToastContainer.jsx
import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "80px", // Below navbar
        right: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: 9999,
        pointerEvents: "none", // Let clicks pass through gaps
      }}
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation frame
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onRemove, 300); // Wait for exit animation
    }, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const icons = {
    success: <CheckCircle size={20} color="#10b981" />,
    error: <AlertCircle size={20} color="#ef4444" />,
    info: <Info size={20} color="#3b82f6" />,
  };

  const borderColors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
  };

  return (
    <div
      style={{
        pointerEvents: "auto",
        background: "var(--cream)", // Use your brand cream
        color: "var(--black)",
        minWidth: "300px",
        padding: "16px",
        borderRadius: "8px",
        border: `2px solid var(--black)`,
        borderLeft: `6px solid ${borderColors[toast.type] || "var(--black)"}`,
        boxShadow: "0 8px 20px rgba(0,0,0,0.15)", // Deep shadow
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: visible ? "translateX(0)" : "translateX(120%)", // Slide in/out
        opacity: visible ? 1 : 0,
      }}
    >
      <div style={{ marginTop: 2 }}>{icons[toast.type] || icons.info}</div>
      <div style={{ flex: 1 }}>
        <div
          style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: "2px" }}
        >
          {toast.title}
        </div>
        <div
          style={{
            fontSize: "0.85rem",
            color: "var(--muted)",
            lineHeight: 1.4,
          }}
        >
          {toast.message}
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
