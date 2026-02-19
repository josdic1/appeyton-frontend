import { useCallback, useContext, useState } from "react";
import { ToastContext } from "../contexts/ToastContext";

/**
 * HOOK 1: useToast
 * Used at the root level (usually in ToastProvider) to manage the global queue.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  /**
   * adds a toast and schedules its removal.
   * Supports the 5W1H schema: what, why, who, where, when, how.
   */
  const addToast = useCallback((payload) => {
    const id = Date.now() + Math.random();

    // Determine duration:
    // Instructional toasts (with a "how") stay longer (8s)
    // Success/Info stay for 4s
    const defaultDuration = payload?.how ? 8000 : 4000;
    const duration = payload?.duration ?? defaultDuration;

    const next = {
      id,
      status: payload?.status ?? "info", // Maps to your Lucide icons (success, error, info, warning)
      title: payload?.title ?? payload?.what ?? "Notification",
      description:
        payload?.description ?? payload?.why ?? payload?.message ?? "",
      who: payload?.who,
      how: payload?.how,
      where: payload?.where,
      when: payload?.when,
      duration,
    };

    setToasts((prev) => [...prev, next]);

    if (duration > 0) {
      setTimeout(() => {
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
 * Usage: const { addToast } = useToastTrigger();
 */
export function useToastTrigger() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToastTrigger must be used within ToastContext.Provider",
    );
  }

  return context;
}
