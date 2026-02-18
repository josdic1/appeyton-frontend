import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBase } from "../hooks/useBase";
import { ReservationFormModal } from "../components/reservations/ReservationFormModal";
import { ReservationDetailModal } from "../components/shared/ReservationSuite";
import {
  Clock,
  Users,
  ArrowRight,
  Utensils,
  LayoutDashboard,
  MessageCircle,
} from "lucide-react";
import { api } from "../utils/api";
import { useToastTrigger } from "../hooks/useToast";

export function HomePage() {
  const { user } = useAuth();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [editRes, setEditRes] = useState(null);
  const [selectedRes, setSelectedRes] = useState(null);
  const { items: reservations, fetchAll } = useBase("reservations");
  const { addToast } = useToastTrigger();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleEditClick = (res) => {
    setSelectedRes(null);
    setEditRes(res);
    setBookingOpen(true);
  };

  const handleCancelClick = async (id) => {
    if (!confirm("Cancel this reservation?")) return;
    try {
      await api.patch(`/api/reservations/${id}`, { status: "cancelled" });
      addToast({
        type: "success",
        title: "Cancelled",
        message: "Visit removed.",
      });
      setSelectedRes(null);
      fetchAll();
    } catch (e) {
      addToast({ type: "error", title: "Error", message: "Failed to cancel." });
    }
  };

  const now = new Date();
  const upcoming = reservations
    .filter(
      (r) => r.status !== "cancelled" && new Date(r.date + "T23:59:00") >= now,
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div style={homeGridStyle}>
      <section data-ui="card" style={heroCardStyle}>
        <div style={{ fontSize: "2.2rem", fontWeight: 900 }}>
          Welcome back, {firstName}
        </div>
        <div style={heroActionsStyle}>
          <button
            onClick={() => {
              setEditRes(null);
              setBookingOpen(true);
            }}
            data-ui="btn"
            style={{ background: "var(--success)" }}
          >
            + Book Table
          </button>
          {/* CORRECTED LINK [cite: 2026-02-18] */}
          <Link to="/menu-items">
            <button data-ui="btn" style={secondaryBtnStyle}>
              <Utensils size={18} /> Menu
            </button>
          </Link>
          <Link to="/members">
            <button data-ui="btn" style={secondaryBtnStyle}>
              <Users size={18} /> My Family
            </button>
          </Link>
        </div>
        {user?.role !== "member" && (
          <div style={staffLinkContainerStyle}>
            <Link to="/admin/daily" style={staffLinkStyle}>
              <LayoutDashboard size={16} /> Daily Command Center →
            </Link>
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section style={{ width: "min(800px, 100%)" }}>
          <div style={sectionHeaderStyle}>
            <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>
              Upcoming Visits
            </div>
            <Link to="/reservations" style={viewAllLinkStyle}>
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {upcoming.map((res) => (
              <div
                key={res.id}
                onClick={() => setSelectedRes(res)}
                style={{ cursor: "pointer" }}
              >
                <HomeReservationCard res={res} />
              </div>
            ))}
          </div>
        </section>
      )}

      <ReservationFormModal
        open={bookingOpen}
        onClose={() => {
          setBookingOpen(false);
          setEditRes(null);
          fetchAll();
        }}
        user={user}
        initialData={editRes}
      />

      {selectedRes && (
        <ReservationDetailModal
          res={selectedRes}
          onClose={() => setSelectedRes(null)}
          onEdit={() => handleEditClick(selectedRes)}
          onCancel={() => handleCancelClick(selectedRes.id)}
        />
      )}
    </div>
  );
}

function HomeReservationCard({ res }) {
  const dateStr = new Date(res.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const unreadCount = res.unread_message_count || 0;

  return (
    <div
      data-ui="card"
      style={{
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "var(--panel)",
        borderLeft: `4px solid ${res.status === "confirmed" ? "var(--success)" : "var(--warning)"}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 8,
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: "1.1rem" }}>{dateStr}</div>
          <div style={badgeStyle}>{res.meal_type}</div>
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
        <div
          style={{
            display: "flex",
            gap: 15,
            color: "var(--muted)",
            fontSize: "0.85rem",
            fontWeight: 500,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={14} /> {res.start_time}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Users size={14} /> {res.attendees?.length || 0} Guests
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontWeight: 900,
            color: "var(--orange)",
            fontSize: "0.75rem",
            textTransform: "uppercase",
          }}
        >
          {res.status}
        </div>
      </div>
    </div>
  );
}

const homeGridStyle = {
  width: "100%",
  display: "grid",
  justifyItems: "center",
  gap: 32,
  paddingBottom: 40,
};
const heroCardStyle = {
  width: "min(800px, 100%)",
  padding: "40px",
  textAlign: "center",
  background: "var(--panel)",
  borderRadius: 24,
  border: "1px solid var(--border)",
};
const heroActionsStyle = {
  display: "flex",
  gap: "14px",
  justifyContent: "center",
  marginTop: 24,
  flexWrap: "wrap",
};
const secondaryBtnStyle = {
  background: "var(--panel-2)",
  border: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
};
const staffLinkContainerStyle = {
  marginTop: "32px",
  paddingAt: "24px",
  borderTop: "1px solid var(--border)",
};
const staffLinkStyle = {
  color: "var(--muted)",
  fontSize: "0.9rem",
  textDecoration: "none",
  fontWeight: 600,
};
const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  marginBottom: 16,
};
const viewAllLinkStyle = {
  fontSize: "0.9rem",
  color: "var(--primary)",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontWeight: 700,
};
const badgeStyle = {
  fontSize: "0.65rem",
  fontWeight: 800,
  textTransform: "uppercase",
  padding: "3px 10px",
  background: "var(--panel-2)",
  borderRadius: 6,
  border: "1px solid var(--border)",
};
const notificationBadgeStyle = {
  background: "var(--primary)",
  color: "white",
  padding: "2px 8px",
  borderRadius: "12px",
  fontSize: "0.7rem",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  boxShadow: "0 4px 10px rgba(var(--primary-rgb), 0.3)",
  animation: "pulse 2s infinite",
};
