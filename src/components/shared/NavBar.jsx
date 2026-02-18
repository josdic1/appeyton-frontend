// src/components/shared/NavBar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToastTrigger } from "../../hooks/useToast";
import { api } from "../../utils/api";
import { ChevronDown, LogOut } from "lucide-react";

export function NavBar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { addToast } = useToastTrigger();
  const [menuOpen, setMenuOpen] = useState(false);

  // ── NOTIFICATION STATES ──
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheck, setLastCheck] = useState(new Date().toISOString());

  useEffect(() => {
    if (!user) return;

    // 1. Light check for the orange dot count
    const checkUnreadCount = async () => {
      try {
        const data = await api.get("/api/notifications/unread-count");
        setUnreadCount(data.count || 0);
      } catch (err) {
        console.error("Failed to fetch notification count", err);
      }
    };

    // 2. Poll for new messages to trigger Toasts
    const pollMessages = async () => {
      try {
        const data = await api.get(`/api/notifications?unread_only=true`);

        const newMessages = data.filter(
          (n) =>
            n.notification_type === "message_received" &&
            new Date(n.created_at) > new Date(lastCheck),
        );

        if (newMessages.length > 0) {
          addToast({
            type: "info",
            title: "New Message",
            message: newMessages[0].message,
          });
          setLastCheck(new Date().toISOString());
          checkUnreadCount(); // Refresh dot immediately after toast
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    checkUnreadCount();
    const countInterval = setInterval(checkUnreadCount, 60000); // 60s for dot
    const toastInterval = setInterval(pollMessages, 30000); // 30s for toast alerts

    return () => {
      clearInterval(countInterval);
      clearInterval(toastInterval);
    };
  }, [user, lastCheck, addToast]);

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
    <nav className="navbar" style={navStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Link to="/" style={brandStyle}>
          STERLING
        </Link>

        {user && (
          <div className="desktop-nav" style={{ display: "flex", gap: 20 }}>
            <Link to="/" style={linkStyle}>
              Home
            </Link>

            <Link
              to="/reservations"
              style={{ ...linkStyle, position: "relative" }}
            >
              My Reservations
              {unreadCount > 0 && <span style={dotStyle} />}
            </Link>

            <Link to="/members" style={linkStyle}>
              Family
            </Link>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {user ? (
          <>
            {isStaff && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={adminBtnStyle}
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
            <button onClick={handleLogout} style={logoutBtnStyle}>
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <Link to="/login" style={loginBtnStyle}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

// ── STYLES ──
const navStyle = {
  background: "var(--black)",
  color: "var(--cream)",
  padding: "0 24px",
  height: "64px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "4px solid var(--orange)",
};
const brandStyle = {
  fontSize: "1.25rem",
  fontWeight: 900,
  letterSpacing: "-0.03em",
  color: "var(--cream)",
  textDecoration: "none",
};
const linkStyle = {
  color: "var(--muted)",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: "0.9rem",
};
const dotStyle = {
  position: "absolute",
  top: -4,
  right: -8,
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "var(--orange)",
  border: "2px solid var(--black)",
};
const adminBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 16px",
  borderRadius: "6px",
  fontSize: "0.85rem",
  fontWeight: 700,
  cursor: "pointer",
  border: "1px solid var(--border)",
  background: "var(--panel)",
  color: "var(--text)",
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
};
const logoutBtnStyle = {
  background: "transparent",
  border: "none",
  color: "var(--muted)",
  cursor: "pointer",
};
const loginBtnStyle = {
  padding: "8px 16px",
  borderRadius: "6px",
  fontSize: "0.85rem",
  fontWeight: 700,
  cursor: "pointer",
  background: "var(--orange)",
  border: "none",
  color: "var(--cream)",
  textDecoration: "none",
};
