import React from "react";
import { ShieldAlert, RotateCcw } from "lucide-react";

/**
 * ErrorBoundary: A safety wrapper for the component tree.
 * Prevents the "White Screen of Death" by catching JS runtime errors.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to your analytics or console for debugging
    console.error("CRITICAL_UI_CRASH:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={errorContainerStyle}>
          <div data-ui="card" style={errorCardStyle}>
            <div style={iconWrapperStyle}>
              <ShieldAlert size={48} color="#ef4444" strokeWidth={2} />
            </div>

            <h1 style={titleStyle}>Application Fault</h1>
            <p style={messageStyle}>
              A runtime exception occurred in this view. The error has been
              logged for the developers.
            </p>

            <div style={detailsBoxStyle}>
              <code>{this.state.error?.toString() || "Unknown Error"}</code>
            </div>

            <button
              data-ui="btn"
              style={recoveryBtnStyle}
              onClick={() => (window.location.href = "/")}
            >
              <RotateCcw size={18} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Styles (Sterling/Bagger Branding) ---

const errorContainerStyle = {
  minHeight: "80vh",
  display: "grid",
  placeItems: "center",
  padding: "20px",
  background: "var(--cream, #fffdf5)",
};

const errorCardStyle = {
  width: "min(500px, 100%)",
  padding: "40px",
  textAlign: "center",
  background: "white",
  border: "2px solid #000",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
};

const iconWrapperStyle = {
  marginBottom: "20px",
  display: "flex",
  justifyContent: "center",
};

const titleStyle = {
  fontSize: "1.8rem",
  fontWeight: 900,
  margin: "0 0 10px 0",
  letterSpacing: "-1px",
};

const messageStyle = {
  color: "#666",
  fontWeight: 600,
  fontSize: "0.95rem",
  lineHeight: 1.5,
  marginBottom: "24px",
};

const detailsBoxStyle = {
  background: "#f8f8f8",
  padding: "15px",
  borderRadius: "8px",
  fontSize: "0.75rem",
  color: "#999",
  textAlign: "left",
  marginBottom: "32px",
  border: "1px solid #eee",
  fontFamily: "monospace",
  overflowX: "auto",
};

const recoveryBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  width: "100%",
  padding: "14px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: 800,
  cursor: "pointer",
};
