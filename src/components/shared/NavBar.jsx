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

  // 🛡️ Admin-only check helper
  const isAdmin = user?.role === "admin";

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
            <Link to="/menu-items" data-ui="nav-link">
              Menu Items
            </Link>
            <Link to="/dining-rooms" data-ui="nav-link">
              Dining Rooms
            </Link>

            {/* 🛡️ Authorization Layer: Only rendered for Admins */}
            {isAdmin && (
              <>
                <Link to="/users" data-ui="nav-link">
                  Users
                </Link>
                <Link to="/calendar" data-ui="nav-link">
                  Calendar
                </Link>
                <Link to="/permissions" data-ui="nav-link">
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
          <>
            <Link to="/entity/new" data-ui="nav-link">
              + New
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
