// src/pages/ErrorPage.jsx
import { useRouteError, useNavigate } from "react-router-dom";
import { AlertCircle, Home, RefreshCcw, ShieldAlert } from "lucide-react";

/**
 * ErrorPage: The global error boundary UI.
 * Catches 404s, API failures during routing, and component crashes.
 */
export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  // Determine error details
  const status = error?.status || 500;
  const is404 = status === 404;
  const title = is404
    ? "Page Not Found"
    : error?.statusText || "Unexpected Exception";

  const message = is404
    ? "The resource you're looking for doesn't exist or has been moved."
    : error?.message || "The application encountered a runtime error.";

  return (
    <div style={containerStyle}>
      <div data-ui="card" style={errorCardStyle}>
        <div style={headerStyle}>
          <div style={iconCircleStyle}>
            {is404 ? (
              <AlertCircle size={32} color="var(--orange, #eb5638)" />
            ) : (
              <ShieldAlert size={32} color="#ef4444" />
            )}
          </div>
          <div>
            <div style={labelStyle}>System Interruption</div>
            <h1 style={titleStyle}>
              {status} — {title}
            </h1>
          </div>
        </div>

        <div style={messageContainerStyle}>
          <div style={sectionLabelStyle}>Why this happened:</div>
          <div style={messageTextStyle}>{message}</div>
        </div>

        <div style={dividerStyle} />

        <div style={actionRowStyle}>
          <div
            style={{
              flex: 1,
              fontSize: "0.8rem",
              opacity: 0.6,
              fontWeight: 600,
            }}
          >
            If this repeats, please contact technical support.
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={secondaryBtnStyle}
            >
              <Home size={16} /> Home
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={primaryBtnStyle}
            >
              <RefreshCcw size={16} /> Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Styles (Themed for Sterling/Bagger) ---

const containerStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  background: "var(--cream, #fffdf5)",
};

const errorCardStyle = {
  width: "min(700px, 100%)",
  padding: "40px",
  background: "white",
  border: "2px solid #000",
  borderRadius: "16px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "24px",
  marginBottom: "32px",
};

const iconCircleStyle = {
  width: "64px",
  height: "64px",
  borderRadius: "50%",
  background: "#f8f8f8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #eee",
};

const labelStyle = {
  fontSize: "0.75rem",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#999",
  marginBottom: "4px",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.8rem",
  fontWeight: 900,
  letterSpacing: "-1px",
};

const messageContainerStyle = {
  background: "#fcfcfc",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #eee",
  marginBottom: "32px",
};

const sectionLabelStyle = {
  fontSize: "0.65rem",
  fontWeight: 900,
  textTransform: "uppercase",
  color: "#666",
  marginBottom: "8px",
};

const messageTextStyle = {
  fontSize: "0.95rem",
  fontWeight: 500,
  lineHeight: 1.6,
  color: "#333",
  whiteSpace: "pre-wrap",
};

const dividerStyle = {
  height: "1px",
  background: "#eee",
  marginBottom: "24px",
};

const actionRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "20px",
};

const primaryBtnStyle = {
  background: "var(--black, #000)",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: 800,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const secondaryBtnStyle = {
  background: "transparent",
  color: "#000",
  border: "1px solid #ddd",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: 800,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};
