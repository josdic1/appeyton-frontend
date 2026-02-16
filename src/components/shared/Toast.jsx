export default function Toast({ toast, onClose }) {
  const { id, type = "info", title, message } = toast;

  return (
    <div className="toast" role="status" aria-live="polite">
      <div className={`toast-dot ${type}`} />
      <div>
        {title ? <div className="toast-title">{title}</div> : null}
        {message ? <div className="toast-msg">{message}</div> : null}
      </div>
      <button
        className="toast-close"
        onClick={() => onClose(id)}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
