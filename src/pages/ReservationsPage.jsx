import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBase } from "../hooks/useBase";
import { useAuth } from "../hooks/useAuth";
import { ReservationSkeleton } from "../components/reservations/ReservationSkeleton";
import { ReservationDetailModal } from "../components/shared/ReservationSuite";
import { safe } from "../utils/safe";
import {
  Calendar,
  RefreshCw,
  ChevronRight,
  Plus,
  User,
  Clock,
} from "lucide-react";
import { api } from "../utils/api";
import { useToastTrigger } from "../hooks/useToast";

export function ReservationsPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { addToast } = useToastTrigger();

  const {
    items: rawItems,
    loading,
    refreshing,
    fetchAll,
  } = useBase("reservations");

  const [selectedRes, setSelectedRes] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this visit?")) return;
    try {
      await api.patch(`/reservations/${id}`, { status: "cancelled" });
      addToast({
        status: "success",
        what: "Visit Cancelled",
        why: "The table has been released.",
      });
      setSelectedRes(null);
      fetchAll();
    } catch (err) {
      addToast({
        status: "error",
        what: "Action Failed",
        why: "Could not cancel at this time.",
      });
    }
  };

  const handleEdit = (res) => {
    nav("/reservations/new", { state: { editData: res } });
  };

  // --- DATA PROCESSING ---
  const items = safe.array(rawItems);
  const now = new Date();

  // Robust Date Resolver
  const getResDate = (r) => new Date(r.reservation_time || r.date || now);

  const upcoming = items
    .filter((r) => r.status !== "cancelled" && getResDate(r) >= now)
    .sort((a, b) => getResDate(a) - getResDate(b));

  const past = items
    .filter((r) => r.status !== "cancelled" && getResDate(r) < now)
    .sort((a, b) => getResDate(b) - getResDate(a));

  return (
    <div style={containerStyle}>
      {/* HEADER SECTION */}
      <section style={headerCardStyle}>
        <div style={headerFlex}>
          <div>
            <h1 style={titleStyle}>My Reservations</h1>
            <p style={subtitleStyle}>Member Schedule & History</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={fetchAll}
              disabled={loading}
              style={refreshBtnStyle}
              title="Refresh Schedule"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => nav("/reservations/new")}
              style={newBtnStyle}
            >
              <Plus size={18} /> New Booking
            </button>
          </div>
        </div>
      </section>

      {/* CONTENT STATE HANDLING */}
      {loading && items.length === 0 ? (
        <ReservationSkeleton count={3} />
      ) : items.length === 0 ? (
        <div style={emptyStateStyle}>
          <Calendar size={60} style={{ opacity: 0.1, marginBottom: 20 }} />
          <h3 style={{ color: "#000", fontWeight: 900 }}>NO RESERVATIONS</h3>
          <p style={{ color: "#999", fontWeight: 600 }}>
            Ready to visit the club?
          </p>
          <button
            onClick={() => nav("/reservations/new")}
            style={{ ...newBtnStyle, marginTop: 20, marginInline: "auto" }}
          >
            Book Now
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {upcoming.map((res) => (
            <ResCard
              key={res.id}
              res={res}
              onClick={() => setSelectedRes(res)}
            />
          ))}

          {past.length > 0 && (
            <div style={historyDividerStyle}>Past Visits</div>
          )}

          {past.map((res) => (
            <ResCard
              key={res.id}
              res={res}
              isPast
              onClick={() => setSelectedRes(res)}
            />
          ))}
        </div>
      )}

      {/* VIEW/EDIT MODAL */}
      {selectedRes && (
        <ReservationDetailModal
          res={selectedRes}
          onClose={() => setSelectedRes(null)}
          onEdit={() => handleEdit(selectedRes)}
          onCancel={() => handleCancel(selectedRes.id)}
        />
      )}
    </div>
  );
}

/**
 * SUB-COMPONENT: INDIVIDUAL CARD
 */
function ResCard({ res, isPast, onClick }) {
  const dateObj = new Date(res.reservation_time || res.date);

  const dateStr = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const timeStr =
    res.start_time ||
    dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const attendeeCount = res.party_size || safe.array(res.attendees).length || 0;
  const primaryGuest =
    safe.array(res.attendees).find((a) => a.is_primary)?.name || "Member";

  return (
    <div
      onClick={onClick}
      style={{
        ...cardBaseStyle,
        opacity: isPast ? 0.6 : 1,
        borderLeft: `8px solid ${isPast ? "#000" : "#eb5638"}`,
        transform: isPast ? "none" : "translateY(0)",
        boxShadow: isPast ? "none" : "6px 6px 0px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={cardHeaderStyle}>
          {dateStr} <span style={{ color: "#eb5638", margin: "0 8px" }}>•</span>{" "}
          {timeStr}
        </div>
        <div style={cardMetaStyle}>
          <div style={metaItem}>
            <User size={13} /> {primaryGuest}
          </div>
          <div style={metaItem}>
            <Clock size={13} /> {res.dining_room?.name || "Main Dining"}
          </div>
          <div style={metaItem}>{attendeeCount} Guests</div>
        </div>
      </div>

      <div
        style={{
          textAlign: "right",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <div style={statusBadgeStyle}>{res.status}</div>
        </div>
        {!isPast && <ChevronRight size={20} style={{ opacity: 0.2 }} />}
      </div>
    </div>
  );
}

// --- Styles (Sterling Identity) ---
const containerStyle = {
  maxWidth: 850,
  margin: "0 auto",
  padding: "60px 20px",
};
const headerCardStyle = {
  background: "#fff",
  border: "4px solid #000",
  boxShadow: "12px 12px 0px #000",
  padding: "40px",
  marginBottom: "40px",
};
const headerFlex = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 20,
};
const titleStyle = {
  margin: 0,
  fontSize: "2.4rem",
  fontWeight: 900,
  letterSpacing: "-1.5px",
};
const subtitleStyle = {
  margin: 0,
  fontWeight: 800,
  opacity: 0.4,
  textTransform: "uppercase",
  fontSize: "0.75rem",
  letterSpacing: "1px",
};
const newBtnStyle = {
  background: "#eb5638",
  color: "#fff",
  border: "2px solid #000",
  padding: "14px 28px",
  fontWeight: 900,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
  boxShadow: "4px 4px 0px #000",
};
const refreshBtnStyle = {
  background: "#fff",
  border: "2px solid #000",
  padding: "12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const cardBaseStyle = {
  background: "#fff",
  border: "2px solid #000",
  padding: "24px 30px",
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
};
const cardHeaderStyle = {
  fontWeight: 900,
  fontSize: "1.2rem",
  marginBottom: 8,
  display: "flex",
  alignItems: "center",
};
const cardMetaStyle = {
  fontWeight: 700,
  color: "#666",
  fontSize: "0.85rem",
  display: "flex",
  gap: 16,
  alignItems: "center",
};
const metaItem = { display: "flex", alignItems: "center", gap: 6 };
const statusBadgeStyle = {
  fontWeight: 900,
  textTransform: "uppercase",
  fontSize: "0.7rem",
  color: "#eb5638",
  letterSpacing: "1.5px",
};
const historyDividerStyle = {
  marginTop: "50px",
  marginBottom: "25px",
  fontWeight: 900,
  fontSize: "0.8rem",
  textTransform: "uppercase",
  color: "#999",
  letterSpacing: "2px",
  borderBottom: "2px solid #eee",
  paddingBottom: "12px",
};
const emptyStateStyle = {
  textAlign: "center",
  padding: "100px 0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};
