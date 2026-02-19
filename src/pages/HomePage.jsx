import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBase } from "../hooks/useBase";
import { ReservationDetailModal } from "../components/shared/ReservationSuite";
import { safe } from "../utils/safe";
import {
  Clock,
  Users,
  ArrowRight,
  Utensils,
  LayoutDashboard,
  MessageCircle,
  CalendarPlus,
} from "lucide-react";
import { api } from "../utils/api";
import { useToastTrigger } from "../hooks/useToast";

/**
 * HomePage: Cleaned of all Modal-based booking logic.
 * Now acts as a high-level dashboard that routes to dedicated pages.
 */
export function HomePage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { addToast } = useToastTrigger();
  const { items: rawReservations, fetchAll, loading } = useBase("reservations");

  const [selectedRes, setSelectedRes] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /**
   * Handle Cancellation
   */
  const handleCancelClick = async (id) => {
    if (!confirm("Are you sure you want to cancel this visit?")) return;
    try {
      await api.patch(`/reservations/${id}`, { status: "cancelled" });
      addToast({ status: "success", what: "Visit Cancelled" });
      setSelectedRes(null);
      fetchAll();
    } catch (e) {
      addToast({ status: "error", what: "Cancellation Failed" });
    }
  };

  // Logic: Filter and sort upcoming visits
  const now = new Date();
  const upcoming = safe
    .array(rawReservations)
    .filter(
      (r) =>
        r.status !== "cancelled" &&
        new Date(r.reservation_time || r.date) >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.reservation_time || a.date) -
        new Date(b.reservation_time || b.date),
    )
    .slice(0, 3);

  const firstName = user?.name?.split(" ")[0] || "Member";

  return (
    <div style={homeGridStyle}>
      {/* 1. Hero Section */}
      <section style={heroCardStyle}>
        <div style={welcomeTextStyle}>Welcome back, {firstName}</div>

        <div style={heroActionsStyle}>
          {/* ✅ FIXED: No more modal. Routes directly to the clean form page */}
          <button
            onClick={() => nav("/reservations/new")}
            style={primaryBtnStyle}
          >
            <CalendarPlus size={20} /> Book Table
          </button>

          <Link to="/menu-items" style={{ textDecoration: "none" }}>
            <button style={secondaryBtnStyle}>
              <Utensils size={18} /> Menu
            </button>
          </Link>

          <Link to="/members" style={{ textDecoration: "none" }}>
            <button style={secondaryBtnStyle}>
              <Users size={18} /> My Family
            </button>
          </Link>
        </div>

        {/* 2. Admin Quick Link */}
        {(user?.role === "admin" || user?.role === "staff") && (
          <div style={staffLinkContainerStyle}>
            <Link to="/admin/daily" style={staffLinkStyle}>
              <LayoutDashboard size={16} /> Daily Command Center →
            </Link>
          </div>
        )}
      </section>

      {/* 3. Upcoming Visits List */}
      <section style={{ width: "min(800px, 100%)" }}>
        <div style={sectionHeaderStyle}>
          <div
            style={{
              fontWeight: 900,
              fontSize: "1.2rem",
              textTransform: "uppercase",
            }}
          >
            Your Next Visits
          </div>
          <Link to="/reservations" style={viewAllLinkStyle}>
            View Schedule <ArrowRight size={16} />
          </Link>
        </div>

        {loading && upcoming.length === 0 ? (
          <div style={emptyCardStyle}>Syncing your schedule...</div>
        ) : upcoming.length === 0 ? (
          <div style={emptyCardStyle}>
            No upcoming visits. Ready for a night at the club?
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {upcoming.map((res) => (
              <HomeReservationCard
                key={res.id}
                res={res}
                onClick={() => setSelectedRes(res)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Detail Modal (For Viewing/Chatting/Ordering Only) */}
      {selectedRes && (
        <ReservationDetailModal
          res={selectedRes}
          onClose={() => setSelectedRes(null)}
          onEdit={() =>
            nav("/reservations/new", { state: { editData: selectedRes } })
          }
          onCancel={() => handleCancelClick(selectedRes.id)}
        />
      )}
    </div>
  );
}

/**
 * Sub-component for individual Reservation Cards
 */
function HomeReservationCard({ res, onClick }) {
  const dateObj = new Date(res.reservation_time || res.date);
  const dateStr = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr =
    res.start_time ||
    dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const unreadCount = res.unread_message_count || 0;

  return (
    <div onClick={onClick} style={resCardStyle(res.status === "confirmed")}>
      <div style={{ flex: 1 }}>
        <div style={resCardHeaderStyle}>
          <span style={{ fontWeight: 900 }}>{dateStr}</span>
          <span style={dotStyle}>•</span>
          <span>{timeStr}</span>

          {unreadCount > 0 && (
            <div style={notificationBadgeStyle}>
              <MessageCircle
                size={10}
                fill="white"
                style={{ marginRight: 4 }}
              />
              {unreadCount}
            </div>
          )}
        </div>

        <div style={resCardMetaStyle}>
          {res.dining_room?.name || "Main Dining"} •{" "}
          {res.party_size || res.attendees?.length} Guests
        </div>
      </div>

      <div style={statusWrapperStyle}>
        <div style={statusLabelStyle}>{res.status}</div>
        <ChevronRight size={18} opacity={0.2} />
      </div>
    </div>
  );
}

// Reusable Chevron for the card
const ChevronRight = ({ size, opacity }) => (
  <svg
    width={size}
    height={size}
    style={{ opacity }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

// --- Styles (Sterling Neo-Brutalist) ---

const homeGridStyle = {
  width: "100%",
  display: "grid",
  justifyItems: "center",
  gap: 40,
  paddingBottom: 60,
};
const heroCardStyle = {
  width: "min(800px, 100%)",
  padding: "60px 40px",
  textAlign: "center",
  background: "#fff",
  border: "4px solid #000",
  boxShadow: "12px 12px 0px #000",
};
const welcomeTextStyle = {
  fontSize: "2.8rem",
  fontWeight: 900,
  letterSpacing: "-2px",
  marginBottom: 10,
};
const heroActionsStyle = {
  display: "flex",
  gap: "16px",
  justifyContent: "center",
  marginTop: 40,
  flexWrap: "wrap",
};
const primaryBtnStyle = {
  background: "#eb5638",
  color: "#fff",
  border: "2px solid #000",
  padding: "16px 32px",
  fontWeight: 900,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
  boxShadow: "4px 4px 0px #000",
};
const secondaryBtnStyle = {
  background: "#fff",
  border: "2px solid #000",
  padding: "16px 32px",
  fontWeight: 900,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
  boxShadow: "4px 4px 0px #000",
};
const staffLinkContainerStyle = {
  marginTop: "40px",
  paddingTop: "30px",
  borderTop: "2px solid #eee",
};
const staffLinkStyle = {
  color: "#000",
  fontSize: "0.85rem",
  textDecoration: "none",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  textTransform: "uppercase",
};
const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};
const viewAllLinkStyle = {
  fontSize: "0.85rem",
  color: "#000",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontWeight: 900,
  textTransform: "uppercase",
};
const emptyCardStyle = {
  padding: "40px",
  textAlign: "center",
  border: "2px dashed #ccc",
  fontWeight: 700,
  color: "#999",
};
const dotStyle = { color: "#eb5638", padding: "0 8px" };

const resCardStyle = (isConfirmed) => ({
  padding: "24px 30px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#fff",
  border: "2px solid #000",
  borderLeft: `8px solid ${isConfirmed ? "#10b981" : "#eb5638"}`,
  cursor: "pointer",
  boxShadow: "6px 6px 0px rgba(0,0,0,0.05)",
});

const resCardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  fontSize: "1.1rem",
  marginBottom: 6,
};
const resCardMetaStyle = { color: "#666", fontSize: "0.9rem", fontWeight: 700 };
const statusWrapperStyle = {
  textAlign: "right",
  display: "flex",
  alignItems: "center",
  gap: 15,
};
const statusLabelStyle = {
  fontWeight: 900,
  color: "#eb5638",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "1px",
};
const notificationBadgeStyle = {
  background: "#000",
  color: "white",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "0.7rem",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  marginLeft: 12,
};
