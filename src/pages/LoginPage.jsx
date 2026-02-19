// src/pages/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToastTrigger } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { GlobeLock, Aperture, ShieldCheck } from "lucide-react";

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

    // Local validation
    if (!email || !password) {
      addToast({
        status: "warning",
        what: "Missing Information",
        why: "Email and password are required to authorize your session.",
        how: "Please fill out both fields and try again.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await login({ email, password });

      if (!result.success) {
        // If the backend sent 5W1H data in result.data, addToastFromError would handle it,
        // but here we manually trigger a specific Login failure toast.
        addToast({
          status: "error",
          what:
            result.status === 403 ? "Access Denied" : "Authorization Failed",
          why:
            result.error ||
            "The credentials provided do not match our records.",
          how: "Check your spelling or contact an admin to reset your password.",
          who: "Identity Provider",
        });
        return;
      }

      // Success logic
      addToast({
        status: "success",
        what: "Welcome back",
        why: "Your session has been successfully authorized.",
        how: "Redirecting you to your workspace now...",
      });

      // Navigate to the page they were trying to reach, or Home
      const dest = location.state?.from?.pathname || "/";
      nav(dest, { replace: true });
    } catch (err) {
      // General catch-all for network issues
      console.error("Login crash:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-ui="auth-page">
      <form data-ui="auth-form" onSubmit={onSubmit}>
        <div data-ui="auth-header">
          <div
            data-ui="row"
            style={{ justifyContent: "center", gap: 10, alignItems: "center" }}
          >
            {/* DEV ONLY: Autofill Helpers */}
            {import.meta.env.DEV && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("josh@josh.com");
                    setPassword("1111");
                  }}
                  title="Auto-fill Admin"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <GlobeLock
                    size={22}
                    stroke="var(--text-main)"
                    strokeWidth={1.8}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("j@j.com");
                    setPassword("1111");
                  }}
                  title="Auto-fill Staff"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Aperture
                    size={22}
                    stroke="var(--text-main)"
                    strokeWidth={1.8}
                  />
                </button>
              </div>
            )}

            <div
              data-ui="title"
              style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px" }}
            >
              Bagger
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("josh@josh.com");
                    setPassword("1111");
                  }}
                  title="Auto-fill Admin"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <GlobeLock
                    size={22}
                    stroke="var(--text-main)"
                    strokeWidth={1.8}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("j@j.com");
                    setPassword("1111");
                  }}
                  title="Auto-fill Staff"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Aperture
                    size={22}
                    stroke="var(--text-main)"
                    strokeWidth={1.8}
                  />
                </button>
              </div>
          </div>
          <div data-ui="auth-subtitle">Identity & Access Management</div>
        </div>

        <div data-ui="stack" style={{ marginTop: 24 }}>
          <div data-ui="input-group">
            <input
              data-ui="input"
              type="email"
              placeholder="Email address"
              autoComplete="email"
              value={email}
              disabled={submitting}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div data-ui="input-group">
            <input
              data-ui="input"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              disabled={submitting}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <button
            data-ui="btn"
            type="submit"
            disabled={submitting}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 12,
            }}
          >
            {submitting ? (
              "Verifying..."
            ) : (
              <>
                <ShieldCheck size={18} />
                Authorize
              </>
            )}
          </button>
        </div>

        <div
          data-ui="auth-footer"
          style={{
            marginTop: 32,
            textAlign: "center",
            fontSize: "0.9rem",
            opacity: 0.8,
          }}
        >
          New to the platform?{" "}
          <Link
            to="/signup"
            style={{
              color: "var(--accent)",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}
