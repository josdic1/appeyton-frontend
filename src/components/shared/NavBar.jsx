// src/components/shared/NavBar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToastTrigger } from "../../hooks/useToast";
import { api } from "../../utils/api";
import { ChevronDown, LogOut, ShieldCheck, User } from "lucide-react";

/**
 * NavBar: Global navigation and notification hub.
 * Handles role-based visibility and background polling for concierge updates.
 */
export function NavBar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { addToast } = useToastTrigger();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- NOTIFICATION POLLING ---
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheck, setLastCheck] = useState(new Date().toISOString());

  useEffect(() => {
    if (!user) return;

    // Fetch total count for the badge
    const checkUnreadCount = async () => {
      try {
        const data = await api.get("/notifications/unread-count");
        setUnreadCount(data?.count || 0);
      } catch (err) {
        // Silent fail if endpoint is missing/404
      }
    };

    // Poll for specific "Message Received" events to trigger 5W1H Toasts
    const pollMessages = async () => {
      try {
        const data = await api.get(`/notifications?unread_only=true`);
        const messages = Array.isArray(data) ? data : [];

        const newAlerts = messages.filter(
          (n) =>
            n.notification_type === "message_received" &&
            new Date(n.created_at) > new Date(lastCheck),
        );

        if (newAlerts.length > 0) {
          const latest = newAlerts[0];
          addToast({
            status: "info",
            what: "New Concierge Message",
            why:
              latest.message || "A staff member has updated your reservation.",
            how: "Open the reservation chat to reply.",
            who: "Sterling Concierge",
          });
          setLastCheck(new Date().toISOString());
          checkUnreadCount();
        }
      } catch (err) {
        // Silent fail to prevent console noise if backend routes are pending
      }
    };

    checkUnreadCount();
    const countInterval = setInterval(checkUnreadCount, 60000); // 1 min
    const toastInterval = setInterval(pollMessages, 30000); // 30 sec

    return () => {
      clearInterval(countInterval);
      clearInterval(toastInterval);
    };
  }, [user, lastCheck, addToast]);

  // Click Outside to close Admin Menu
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    addToast({
      status: "success",
      what: "Session Terminated",
      why: "You have been securely logged out of the Sterling platform.",
      how: "Authorize again to manage your reservations.",
    });
    nav("/login");
  };

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff" || isAdmin;

  return (
    <nav style={navStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <Link to="/" style={brandStyle}>
          STERLING
        </Link>

        {user && (
          <div style={{ display: "flex", gap: 24 }}>
            <Link to="/" style={linkStyle}>
              Dashboard
            </Link>
            <Link
              to="/reservations"
              style={{ ...linkStyle, position: "relative" }}
            >
              Reservations
              {unreadCount > 0 && <span style={dotStyle}>{unreadCount}</span>}
            </Link>
            <Link to="/members" style={linkStyle}>
              Household
            </Link>
            <Link to="/menu-items" style={linkStyle}>
              Menu
            </Link>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {user ? (
          <>
            {isStaff && (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    ...adminBtnStyle,
                    borderColor: menuOpen
                      ? "var(--orange, #eb5638)"
                      : "transparent",
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>Ops Portal</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: menuOpen ? "rotate(180deg)" : "none",
                      transition: "0.2s",
                    }}
                  />
                </button>

                {menuOpen && (
                  <div style={dropdownStyle}>
                    <div style={dropdownHeader}>Floor Operations</div>
                    <Link
                      to="/admin/daily"
                      style={dropdownLink}
                      onClick={() => setMenuOpen(false)}
                    >
                      Daily Command
                    </Link>
                    <Link
                      to="/ops/floor-plan"
                      style={dropdownLink}
                      onClick={() => setMenuOpen(false)}
                    >
                      Live Floor Plan
                    </Link>

                    {isAdmin && (
                      <>
                        <div style={dropdownHeader}>System Architecture</div>
                        <Link
                          to="/admin/users"
                          style={dropdownLink}
                          onClick={() => setMenuOpen(false)}
                        >
                          Users & Permissions
                        </Link>
                        <Link
                          to="/admin/dining-rooms"
                          style={dropdownLink}
                          onClick={() => setMenuOpen(false)}
                        >
                          Dining Rooms
                        </Link>
                        <Link
                          to="/admin/menu-items"
                          style={dropdownLink}
                          onClick={() => setMenuOpen(false)}
                        >
                          Menu Editor
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={userBadgeStyle}>
              <User size={14} />{" "}
              <span style={{ fontSize: "0.7rem" }}>
                {user.name?.split(" ")[0]}
              </span>
            </div>

            <button
              onClick={handleLogout}
              style={logoutBtnStyle}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link to="/login" style={loginBtnStyle}>
            Authorize
          </Link>
        )}
      </div>
    </nav>
  );
}

// --- Styles (Standardized for Sterling Identity) ---

const navStyle = {
  height: "72px",
  padding: "0 32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "#1a1a1a",
  borderBottom: "4px solid var(--orange, #eb5638)",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
};
const brandStyle = {
  color: "var(--cream, #ebe5c0)",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: "1.4rem",
  letterSpacing: "-1px",
};
const linkStyle = {
  color: "rgba(235, 229, 192, 0.7)",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const dotStyle = {
  position: "absolute",
  top: -8,
  right: -12,
  minWidth: "16px",
  height: "16px",
  borderRadius: "10px",
  background: "var(--orange, #eb5638)",
  border: "2px solid #1a1a1a",
  color: "white",
  fontSize: "0.6rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
};
const adminBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 16px",
  borderRadius: "6px",
  fontSize: "0.75rem",
  fontWeight: 900,
  cursor: "pointer",
  background: "rgba(255,255,255,0.05)",
  color: "var(--cream, #ebe5c0)",
  border: "2px solid transparent",
  transition: "all 0.2s",
  textTransform: "uppercase",
};
const dropdownStyle = {
  position: "absolute",
  top: "calc(100% + 12px)",
  right: 0,
  width: "220px",
  background: "var(--cream, #ebe5c0)",
  border: "2px solid #000",
  borderRadius: "8px",
  padding: "8px 0",
  boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
};
const dropdownHeader = {
  fontSize: "0.6rem",
  fontWeight: 900,
  textTransform: "uppercase",
  color: "rgba(0,0,0,0.3)",
  padding: "12px 16px 4px",
  letterSpacing: "0.1em",
};
const dropdownLink = {
  display: "block",
  padding: "10px 16px",
  color: "#000",
  textDecoration: "none",
  fontSize: "0.85rem",
  fontWeight: 800,
};
const logoutBtnStyle = {
  background: "none",
  border: "none",
  color: "rgba(235, 229, 192, 0.5)",
  cursor: "pointer",
  padding: "10px",
};
const loginBtnStyle = {
  background: "var(--orange, #eb5638)",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: "6px",
  fontWeight: 900,
  textDecoration: "none",
  fontSize: "0.8rem",
  textTransform: "uppercase",
};
const userBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "var(--cream, #ebe5c0)",
  opacity: 0.6,
  fontWeight: 900,
};
