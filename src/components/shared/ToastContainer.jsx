import { useEffect, useState, useContext } from "react";
import { X, CheckCircle, AlertCircle, Info, HelpCircle } from "lucide-react";
import { ToastContext } from "../../contexts/ToastContext";

export function ToastContainer() {
  const { toasts, removeToast } = useContext(ToastContext);

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

  // Destructure 5W1H properties with fallbacks to your original schema
  const {
    status = "info",
    title,
    description, // The "Why"
    how,
    who,
    where,
    message, // Original fallback
  } = toast;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    // Toasts with instructions ("how") stay longer (8s), others 5s
    const duration = how ? 8000 : 5000;

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onRemove, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [onRemove, how]);

  const icons = {
    success: <CheckCircle size={20} color="#10b981" />,
    error: <AlertCircle size={20} color="#ef4444" />,
    info: <Info size={20} color="#3b82f6" />,
    warning: <HelpCircle size={20} color="#f59e0b" />,
  };

  const borderColors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
    warning: "#f59e0b",
  };

  return (
    <div
      style={{
        pointerEvents: "auto",
        background: "var(--cream, #fffdf5)",
        color: "var(--black, #000)",
        minWidth: "320px",
        maxWidth: "400px",
        padding: "16px",
        borderRadius: "8px",
        border: `2px solid var(--black, #000)`,
        borderLeft: `8px solid ${borderColors[status] || "var(--black, #000)"}`,
        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: visible ? "translateX(0)" : "translateX(120%)",
        opacity: visible ? 1 : 0,
      }}
    >
      <div style={{ marginTop: 2 }}>{icons[status] || icons.info}</div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 900,
            fontSize: "1rem",
            marginBottom: "4px",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>

        {/* The "Why" Section */}
        <div
          style={{
            fontSize: "0.85rem",
            color: "var(--black)",
            lineHeight: 1.4,
            marginBottom: how ? "8px" : "0",
          }}
        >
          {description || message}
        </div>

        {/* The "How" Section - Highlighted Action Requirement */}
        {how && (
          <div
            style={{
              marginTop: "8px",
              padding: "8px",
              background: "rgba(0,0,0,0.05)",
              borderRadius: "4px",
              fontSize: "0.8rem",
              borderLeft: "2px solid currentColor",
            }}
          >
            <strong
              style={{
                display: "block",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Action Required
            </strong>
            {how}
          </div>
        )}

        {/* Meta info for internal/context tracking */}
        {(who || where) && (
          <div
            style={{
              marginTop: "8px",
              fontSize: "0.7rem",
              opacity: 0.5,
              fontStyle: "italic",
            }}
          >
            {who && `Source: ${who}`} {where && `• Location: ${where}`}
          </div>
        )}
      </div>

      <button
        onClick={() => setVisible(false)}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--muted, #666)",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
