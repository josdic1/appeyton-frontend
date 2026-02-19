// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import { DataProvider } from "./providers/DataProvider";
import { ToastProvider } from "./providers/ToastProvider";
import { ErrorBoundary } from "./components/shared/ErrorBoundary"; // Add this
import { routes } from "./routes";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Wrap EVERYTHING here */}
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <RouterProvider router={routes} />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
