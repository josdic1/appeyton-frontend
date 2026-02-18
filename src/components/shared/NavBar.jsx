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

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff" || isAdmin;

  return (
    <div data-ui="navbar">
      <div data-ui="nav-left">
        <Link to="/" data-ui="brand" style={{ textDecoration: "none" }}>
          APP
        </Link>
        {user && (
          <>
            {/* Common Links */}
            <Link to="/" data-ui="nav-link">
              Home
            </Link>
            <Link to="/reservations" data-ui="nav-link">
              Reservations
            </Link>
            <Link to="/members" data-ui="nav-link">
              My Family
            </Link>
            <Link to="/calendar" data-ui="nav-link">
              Calendar
            </Link>

            {/* Staff / Ops Links */}
            {isStaff && (
              <Link to="/ops/floor-plan" data-ui="nav-link">
                Floor Plan
              </Link>
            )}

            {/* Admin Links */}
            {isAdmin && (
              <>
                <div
                  style={{
                    width: 1,
                    height: 20,
                    background: "var(--border)",
                    margin: "0 8px",
                  }}
                ></div>

                <Link to="/admin/daily" data-ui="nav-link">
                  Daily
                </Link>
                <Link to="/admin/users" data-ui="nav-link">
                  Users
                </Link>
                <Link to="/admin/menu-items" data-ui="nav-link">
                  Menu
                </Link>
                <Link to="/admin/dining-rooms" data-ui="nav-link">
                  Dining Rooms
                </Link>
                <Link to="/admin/permissions" data-ui="nav-link">
                  Permissions
                </Link>
              </>
            )}
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
          <button
            type="button"
            data-ui="btn"
            style={{ width: "auto" }}
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
