// src/providers/ToastProvider.jsx
import { ToastContext } from "../contexts/ToastContext";
import { useToast } from "../hooks/useToast";

export function ToastProvider({ children }) {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}
