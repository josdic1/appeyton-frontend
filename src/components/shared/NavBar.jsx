// src/components/shared/NavBar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToastTrigger } from "../../hooks/useToast";

export function NavBar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { addToast } = useToastTrigger();

  function handleLogout() {
    logout();
    addToast({
      type: "success",
      title: "Logged out",
      message: "Session cleared.",
    });
    nav("/login", { replace: true });
  }

  return (
    <div data-ui="navbar">
      <div data-ui="nav-left">
        <Link to="/" data-ui="brand" style={{ textDecoration: "none" }}>
          // APP
        </Link>

        {user && (
          <>
            <Link to="/" data-ui="nav-link">
              Home
            </Link>
            <Link to="/entities" data-ui="nav-link">
              Entities
            </Link>
          </>
        )}
      </div>

      <div data-ui="nav-right">
        {!user ? (
          <>
            <Link to="/login" data-ui="nav-link">
              Login
            </Link>
            <Link to="/signup" data-ui="nav-link">
              Signup
            </Link>
          </>
        ) : (
          <>
            <Link to="/entity/new" data-ui="nav-link">
              + Entity
            </Link>

            <button
              type="button"
              data-ui="btn"
              style={{ width: "auto" }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
