// src/pages/LoginPage.jsx
// FIX #5: Demo credential autofill is now guarded by import.meta.env.DEV.
// It only renders in local development. In any production or staging build
// (where VITE_NODE_ENV !== development) the button is completely absent from the DOM.
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToastTrigger } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { GlobeLock, Aperture } from "lucide-react";

export function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { addToast } = useToastTrigger();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    if (!email || !password) {
      addToast({
        type: "error",
        title: "Missing info",
        message: "Enter email and password.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await login({ email, password });

      if (!result.success) {
        addToast({
          type: "error",
          title: result.status === 403 ? "Access denied" : "Login failed",
          message: result.error || "Invalid credentials",
        });
        return;
      }

      addToast({
        type: "success",
        title: "Welcome back",
        message: "Logged in.",
      });
      const dest = location.state?.from || "/";
      nav(dest, { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-ui="auth-page">
      <form data-ui="auth-form" onSubmit={onSubmit}>
        <div data-ui="auth-header">
          <div data-ui="row" style={{ justifyContent: "center", gap: 10 }}>
            {/* DEV ONLY: autofill button stripped from production builds */}
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => {
                  setEmail("josh@josh.com");
                  setPassword("1111");
                }}
                title="Auto-fill dev credentials"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <GlobeLock
                  size={22}
                  stroke="var(--text-main)"
                  strokeWidth={1.8}
                />
              </button>
            )}
            {/* App name or logo could go here */}
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => {
                  setEmail("j@j.com");
                  setPassword("1111");
                }}
                title="Auto-fill dev credentials"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Aperture
                  size={22}
                  stroke="var(--text-main)"
                  strokeWidth={1.8}
                />
              </button>
            )}
            <div data-ui="title" style={{ fontSize: 22 }}>
              Bagger
            </div>
          </div>
          <div data-ui="auth-subtitle">Authenticate session</div>
        </div>

        <div data-ui="stack">
          <input
            data-ui="input"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            data-ui="input"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button data-ui="btn" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Authorize"}
          </button>
        </div>

        <div data-ui="auth-footer">
          New here?{" "}
          <Link
            to="/signup"
            style={{ color: "var(--accent)", fontWeight: 900 }}
          >
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}
