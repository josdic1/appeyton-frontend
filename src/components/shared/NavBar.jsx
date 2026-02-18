// src/components/shared/NavBar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToastTrigger } from "../../hooks/useToast";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";

export function NavBar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { addToast } = useToastTrigger();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    addToast({
      type: "success",
      title: "Logged out",
      message: "See you soon!",
    });
    nav("/login");
  }

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff" || isAdmin;

  return (
    <nav
      className="navbar"
      style={{
        background: "var(--black)",
        color: "var(--cream)",
        padding: "0 24px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "4px solid var(--orange)",
      }}
    >
      {/* 1. BRAND */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Link
          to="/"
          style={{
            fontSize: "1.25rem",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "var(--cream)",
            textDecoration: "none",
          }}
        >
          STERLING
        </Link>

        {/* 2. PRIMARY NAV (Members) */}
        {user && (
          <div className="desktop-nav" style={{ display: "flex", gap: 20 }}>
            <Link to="/" style={linkStyle}>
              Home
            </Link>
            <Link to="/reservations" style={linkStyle}>
              My Reservations
            </Link>
            <Link to="/members" style={linkStyle}>
              Family
            </Link>
          </div>
        )}
      </div>

      {/* 3. RIGHT SIDE ACTIONS */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {user ? (
          <>
            {/* ADMIN DROPDOWN (Only for Staff/Admin) */}
            {isStaff && (
              <div
                className="dropdown-container"
                style={{ position: "relative" }}
              >
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    ...btnStyle,
                    background: "var(--panel)",
                    color: "var(--text)",
                  }}
                >
                  Admin Access <ChevronDown size={14} />
                </button>

                {menuOpen && (
                  <div
                    style={dropdownStyle}
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <div style={dropdownHeader}>Operations</div>
                    <Link to="/admin/daily" style={dropdownLink}>
                      Daily Command
                    </Link>
                    <Link to="/ops/floor-plan" style={dropdownLink}>
                      Live Floor Plan
                    </Link>

                    {isAdmin && (
                      <>
                        <div style={dropdownHeader}>Configuration</div>
                        <Link to="/admin/users" style={dropdownLink}>
                          Manage Users
                        </Link>
                        <Link to="/admin/menu-items" style={dropdownLink}>
                          Menu Editor
                        </Link>
                        <Link to="/admin/dining-rooms" style={dropdownLink}>
                          Dining Rooms
                        </Link>
                        <Link to="/admin/permissions" style={dropdownLink}>
                          Permissions
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
              }}
            >
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <Link
            to="/login"
            style={{ ...btnStyle, background: "var(--orange)", border: "none" }}
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────
const linkStyle = {
  color: "var(--muted)",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: "0.9rem",
  transition: "color 0.2s",
};

const btnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 16px",
  borderRadius: "6px",
  fontSize: "0.85rem",
  fontWeight: 700,
  cursor: "pointer",
  border: "1px solid var(--border)",
};

const dropdownStyle = {
  position: "absolute",
  top: "120%",
  right: 0,
  width: "200px",
  background: "var(--cream)",
  border: "2px solid var(--black)",
  borderRadius: "8px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: "8px 0",
  zIndex: 100,
};

const dropdownHeader = {
  fontSize: "0.7rem",
  fontWeight: 800,
  textTransform: "uppercase",
  color: "var(--muted)",
  padding: "8px 16px 4px",
  letterSpacing: "0.05em",
};

const dropdownLink = {
  display: "block",
  padding: "8px 16px",
  color: "var(--black)",
  textDecoration: "none",
  fontSize: "0.9rem",
  fontWeight: 500,
  hover: { background: "var(--tan)" },
};
