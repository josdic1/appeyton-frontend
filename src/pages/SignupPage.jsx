// src/pages/SignupPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToastTrigger } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { UserPlus, ShieldPlus } from "lucide-react";

export function SignupPage() {
  const nav = useNavigate();
  const { addToast } = useToastTrigger();
  const { signup, user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) nav("/", { replace: true });
  }, [user, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    // 1. Validation
    if (!name || !email || !password) {
      addToast({
        status: "warning",
        what: "Incomplete Form",
        why: "We need your name, email, and a password to create your account.",
        how: "Please fill in all fields before clicking Create.",
      });
      return;
    }

    setSubmitting(true);
    try {
      // 2. Call Signup (AuthProvider handles the subsequent Login)
      const result = await signup({ name, email, password });

      if (!result?.success) {
        addToast({
          status: "error",
          what: "Registration Failed",
          why:
            result?.error ||
            "This email might already be registered or the server is unavailable.",
          how: "Try a different email address or contact support if the issue persists.",
          who: "User Service",
        });
        return;
      }

      // 3. Success
      addToast({
        status: "success",
        what: "Account Created",
        why: "Your credentials have been securely stored.",
        how: "Taking you to your dashboard now...",
      });

      nav("/", { replace: true });
    } catch (err) {
      console.error("Signup exception:", err);
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
            {/* DEV ONLY: Autofill Helper (Stripped in production) */}
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => {
                  setName("Josh Test");
                  setEmail("josh@test.com");
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
                  opacity: 0.35,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.35")}
              >
                <UserPlus
                  size={22}
                  stroke="var(--text-main)"
                  strokeWidth={1.8}
                />
              </button>
            )}

            <div
              data-ui="title"
              style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px" }}
            >
              Bagger
            </div>
          </div>

          <div data-ui="auth-subtitle">Create your secure credentials</div>
        </div>

        <div data-ui="stack" style={{ marginTop: 24 }}>
          <input
            data-ui="input"
            type="text"
            placeholder="Full Name"
            autoComplete="name"
            value={name}
            disabled={submitting}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            data-ui="input"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={email}
            disabled={submitting}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            data-ui="input"
            type="password"
            placeholder="Password (min. 4 characters)"
            autoComplete="new-password"
            minLength={4}
            value={password}
            disabled={submitting}
            onChange={(e) => setPassword(e.target.value)}
          />

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
              "Processing..."
            ) : (
              <>
                <ShieldPlus size={18} />
                Create Account
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
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "var(--accent)",
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
