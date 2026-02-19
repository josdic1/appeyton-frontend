import React, { useState, useCallback, useEffect } from "react";
import { ToastContext } from "../contexts/ToastContext";

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast) => {
      const id = Date.now();
      // Ensure we don't spam the same message
      setToasts((prev) => {
        const isDuplicate = prev.some(
          (t) => t.title === toast.title && t.description === toast.description,
        );
        if (isDuplicate) return prev;
        return [...prev, { ...toast, id }];
      });

      // Auto-remove after 6 seconds given the extra 5W1H text
      setTimeout(() => removeToast(id), 6000);
    },
    [removeToast],
  );

  const addToastFromError = useCallback(
    (error) => {
      // DRILLING FIX: Check if the error details are nested in the new api.js wrapper
      const data = error.data?.data || error.data;

      if (data && data.what) {
        // Handle the specialized 5W1H Backend Response
        addToast({
          status: data.status || "error",
          title: data.what,
          description: data.why,
          who: data.who,
          how: data.how,
          when: data.when,
          where: data.where,
          actions: data.actions || [],
        });
      } else {
        // Fallback for standard errors, 401s, or 500s
        addToast({
          status: "error",
          title: "System Alert",
          description: error.message || "An unexpected error occurred.",
          how:
            error.status === 401
              ? "Please log in again."
              : "Try refreshing the page.",
        });
      }
    },
    [addToast],
  );

  /**
   * Global Event Listener
   * This allows api.js to do:
   * window.dispatchEvent(new CustomEvent("api-error", { detail: { error } }));
   */
  useEffect(() => {
    const handleGlobalError = (event) => {
      if (event.detail && event.detail.error) {
        addToastFromError(event.detail.error);
      }
    };

    window.addEventListener("api-error", handleGlobalError);
    return () => window.removeEventListener("api-error", handleGlobalError);
  }, [addToastFromError]);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, addToastFromError, removeToast }}
    >
      {children}
    </ToastContext.Provider>
  );
}
