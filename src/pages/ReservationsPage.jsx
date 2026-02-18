// src/pages/ReservationsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBase } from "../hooks/useBase";
import { ReservationSkeleton } from "../components/reservations/ReservationSkeleton";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  RefreshCw,
  X,
} from "lucide-react";
import { api } from "../utils/api";
import { useToastTrigger } from "../hooks/useToast";

export function ReservationsPage() {
  const { items, loading, refreshing, fetchAll } = useBase("reservations");
  const [selectedRes, setSelectedRes] = useState(null); // Tracks which reservation is clicked
  const { addToast } = useToastTrigger();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;

    const result = await api.patch(`/api/reservations/${id}`, {
      status: "cancelled",
    });
    if (result.error) {
      addToast({ type: "error", title: "Error", message: result.error });
    } else {
      addToast({
        type: "success",
        title: "Cancelled",
        message: "Reservation cancelled.",
      });
      setSelectedRes(null);
      fetchAll();
    }
  };

  const now = new Date();

  // Sort: Upcoming first (nearest date), then Past (newest date)
  const upcoming = items
    .filter(
      (r) =>
        r.status !== "cancelled" && new Date(r.date + "T" + "23:59:00") >= now,
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const past = items
    .filter(
      (r) =>
        r.status !== "cancelled" && new Date(r.date + "T" + "23:59:00") < now,
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div
      data-ui="home"
      style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 20 }}
    >
      {/* Header */}
      <section data-ui="card">
        <div
          data-ui="row"
          style={{ justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <div>
            <div data-ui="title">My Reservations</div>
            <div data-ui="subtitle">Upcoming bookings and past visits</div>
          </div>
          <div data-ui="row" style={{ gap: 10 }}>
            <button
              data-ui="btn-refresh"
              onClick={fetchAll}
              disabled={loading || refreshing}
            >
              <RefreshCw size={16} data-spin={refreshing ? "true" : "false"} />
            </button>
            <Link to="/reservations/new" data-ui="btn">
              <Plus size={16} /> New Reservation
            </Link>
          </div>
        </div>
      </section>

      {/* Loading Skeleton */}
      {loading && items.length === 0 && (
        <section data-ui="card">
          <ReservationSkeleton count={2} />
        </section>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--muted)",
          }}
        >
          <Calendar size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <div>You don't have any reservations yet.</div>
          <Link
            to="/reservations/new"
            style={{
              color: "var(--primary)",
              fontWeight: 700,
              marginTop: 8,
              display: "inline-block",
            }}
          >
            Book a table now →
          </Link>
        </div>
      )}

      {/* Upcoming List */}
      {!loading && upcoming.length > 0 && (
        <div style={{ display: "grid", gap: 16 }}>
          <div data-ui="subtitle" style={{ marginLeft: 4 }}>
            Upcoming
          </div>
          {upcoming.map((res) => (
            <ReservationCard
              key={res.id}
              res={res}
              onClick={() => setSelectedRes(res)}
            />
          ))}
        </div>
      )}

      {/* Past List */}
      {!loading && past.length > 0 && (
        <div style={{ display: "grid", gap: 16, marginTop: 10 }}>
          <div data-ui="subtitle" style={{ marginLeft: 4 }}>
            Past History
          </div>
          {past.map((res) => (
            <ReservationCard
              key={res.id}
              res={res}
              isPast
              onClick={() => setSelectedRes(res)}
            />
          ))}
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selectedRes && (
        <ReservationDetailModal
          res={selectedRes}
          onClose={() => setSelectedRes(null)}
          onCancelRes={() => handleCancel(selectedRes.id)}
        />
      )}
    </div>
  );
}

function ReservationCard({ res, isPast, onClick }) {
  // Format Date: "Fri, Oct 14"
  const dateObj = new Date(res.date);
  const dateStr = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Party Size
  const partySize = res.attendees
    ? res.attendees.length
    : res.party_size || "?";

  return (
    <div
      onClick={onClick}
      data-ui="card"
      style={{
        padding: 16,
        opacity: isPast ? 0.7 : 1,
        borderLeft: isPast
          ? "4px solid var(--border)"
          : "4px solid var(--primary)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        cursor: "pointer", // Make it look clickable
        transition: "transform 0.1s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{dateStr}</div>
          <div data-ui="pill" data-variant="info">
            {res.meal_type}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            color: "var(--muted)",
            fontSize: "0.9rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={14} /> {res.start_time}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Users size={14} /> {partySize} people
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={14} /> Table {res.table?.table_number || "TBD"}
          </div>
        </div>
      </div>

      {/* Status or Actions */}
      <div style={{ textAlign: "right" }}>
        {res.status === "confirmed" ? (
          <span
            style={{
              color: "var(--success)",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            Confirmed ✓
          </span>
        ) : (
          <span
            style={{
              color: "var(--warning)",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            {res.status}
          </span>
        )}
      </div>
    </div>
  );
}

// ── NEW COMPONENT: DETAIL MODAL ──
function ReservationDetailModal({ res, onClose, onCancelRes }) {
  const isPast = new Date(res.date) < new Date();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--panel)",
          width: "min(500px, 100%)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--panel-2)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
            Reservation Details
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {/* Key Info */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                }}
              >
                Date
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                {res.date}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                }}
              >
                Time
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                {res.start_time} - {res.end_time}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                }}
              >
                Table
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                {res.table?.table_number
                  ? `Table ${res.table.table_number}`
                  : "Unassigned"}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                }}
              >
                Status
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color:
                    res.status === "confirmed"
                      ? "var(--success)"
                      : "var(--text)",
                }}
              >
                {res.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Guests */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Guest List
            </div>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
              }}
            >
              {res.attendees.map((att, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--border-2)",
                    background: "var(--panel-2)",
                    fontSize: "0.9rem",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {att.name}{" "}
                    <span style={{ opacity: 0.5, fontSize: "0.8em" }}>
                      ({att.attendee_type})
                    </span>
                  </span>
                  {att.dietary_restrictions && (
                    <span
                      style={{ color: "var(--warning)", fontSize: "0.8em" }}
                    >
                      {att.dietary_restrictions.note || "Dietary notes"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {!isPast && res.status !== "cancelled" && (
            <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
              {/* To edit, we usually cancel and rebook in simple systems, 
                                 or you can add a route to '/reservations/edit/:id' later */}
              <button
                onClick={onCancelRes}
                data-ui="btn-danger"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Cancel Reservation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
