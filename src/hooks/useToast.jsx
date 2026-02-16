import { useCallback, useContext, useState } from "react";
import { ToastContext } from "../contexts/ToastContext";

/**
 * HOOK 1: useToast
 * Used ONCE at the app root level to manage the notification state.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const duration = toast?.duration ?? 3000;

    const next = {
      id,
      type: toast?.type ?? "info", // e.g., 'success', 'error', 'warning'
      title: toast?.title ?? "Notice",
      message: toast?.message ?? "",
      duration,
    };

    setToasts((prev) => [...prev, next]);

    if (duration > 0) {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

/**
 * HOOK 2: useToastTrigger
 * Used by ANY component to fire off a toast notification.
 */
export function useToastTrigger() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      "useToastTrigger must be used within ToastContext.Provider",
    );
  }
  return ctx; // Returns { addToast }
}
