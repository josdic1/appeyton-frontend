import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToastTrigger } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { UserPlus } from "lucide-react";

export function SignupPage() {
  const nav = useNavigate();
  const { addToast } = useToastTrigger();
  const { signup, user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) nav("/", { replace: true });
  }, [user, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      if (!name || !email || !password) {
        addToast({
          type: "error",
          title: "Missing info",
          message: "Enter name, email, and password.",
        });
        return;
      }

      const result = await signup({ name, email, password });

      if (!result?.success) {
        addToast({
          type: "error",
          title: "Signup failed",
          message: result?.error || "Unable to create account.",
        });
        return;
      }

      addToast({
        type: "success",
        title: "Account created",
        message: "You’re in.",
      });
      nav("/", { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-ui="auth-page">
      <form data-ui="auth-form" onSubmit={onSubmit}>
        <div data-ui="auth-header">
          <div data-ui="row" style={{ justifyContent: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                setName("Josh");
                setEmail("josh@josh.com");
                setPassword("1111");
              }}
              title="Auto-fill demo credentials"
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                opacity: 0.35,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.35")}
            >
              <UserPlus size={22} stroke="var(--text-main)" strokeWidth={1.8} />
            </button>

            <div data-ui="title" style={{ fontSize: 22 }}>
              Bagger
            </div>
          </div>

          <div data-ui="auth-subtitle">Create credentials</div>
        </div>

        <div data-ui="stack">
          <input
            data-ui="input"
            type="text"
            placeholder="Name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            autoComplete="new-password"
            minLength={4}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button data-ui="btn" type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>

        <div data-ui="auth-footer">
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 900 }}>
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
