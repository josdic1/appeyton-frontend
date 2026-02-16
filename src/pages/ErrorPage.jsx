// src/pages/ErrorPage.jsx
import { useRouteError, useNavigate } from "react-router-dom";

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const status = error?.status || 500;
  const title = error?.statusText || "UNEXPECTED_EXCEPTION";
  const message =
    error?.message ||
    "The app hit an unexpected error. Try reloading. If it repeats, check the console/network tab.";

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div data-ui="card" style={{ width: "min(820px, 100%)" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div data-ui="label">System interruption</div>
          <div data-ui="title">
            {status} — {title}
          </div>
          <div data-ui="hint" style={{ whiteSpace: "pre-wrap" }}>
            {message}
          </div>
        </div>

        <div style={{ height: 14 }} />
        <div data-ui="divider" />
        <div style={{ height: 14 }} />

        <div data-ui="row" style={{ justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            data-ui="btn-refresh"
            onClick={() => navigate("/")}
          >
            Home
          </button>
          <button
            type="button"
            data-ui="btn-refresh"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
