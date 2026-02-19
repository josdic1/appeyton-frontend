// src/contexts/ToastContext.js
import { createContext } from "react";

export const ToastContext = createContext({
  toasts: [],
  addToast: () => {},
  addToastFromError: () => {},
  removeToast: () => {},
});
