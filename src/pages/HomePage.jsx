import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBase } from "../hooks/useBase"; // Import data fetcher
import { ReservationFormModal } from "../components/reservations/ReservationFormModal";
import { Clock, MapPin, Users, ArrowRight } from "lucide-react"; // Icons for the cards

export function HomePage() {
  const { user } = useAuth();
  const [bookingOpen, setBookingOpen] = useState(false);

  // 1. Fetch reservations on mount
  const { items: reservations, fetchAll } = useBase("reservations");

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 2. Filter & Sort: Active, Upcoming Reservations
  const now = new Date();
  const upcoming = reservations
    .filter(
      (r) =>
        r.status !== "cancelled" && new Date(r.date + "T" + "23:59:00") >= now,
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3); // Limit to top 3 for the homepage

  // 3. Safe Name Logic
  const firstName = user?.name ? user.name.split(" ")[0] : "";

  return (
    <div
      data-ui="home"
      style={{
        width: "100%",
        display: "grid",
        justifyItems: "center",
        gap: 20,
      }}
    >
      {/* ── WELCOME SECTION ── */}
      <section data-ui="card" style={{ width: "min(980px, 100%)" }}>
        <div data-ui="title">Welcome{firstName ? `, ${firstName}` : ""}</div>
        <div style={{ height: 10 }} />
        <div data-ui="subtitle">Sterling Catering · Member Portal</div>

        <div style={{ height: 14 }} />
        <div data-ui="divider" />
        <div style={{ height: 14 }} />

        <div data-ui="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            data-ui="btn"
            onClick={() => setBookingOpen(true)}
            style={{ background: "var(--success)" }}
          >
            + Make a Reservation
          </button>

          <Link to="/reservations/new">
            <button
              type="button"
              data-ui="btn"
              style={{
                background: "transparent",
                border: "1px solid var(--border-2)",
                color: "var(--text)",
              }}
            >
              Reservation Form ↗
            </button>
          </Link>

          <Link to="/ops/floor-plan">
            <button type="button" data-ui="btn-refresh">
              <span>Floor Plan</span>
            </button>
          </Link>

          <Link to="/dining-rooms">
            <button type="button" data-ui="btn-refresh">
              <span>Dining Rooms</span>
            </button>
          </Link>
        </div>
      </section>

      {/* ── UPCOMING RESERVATIONS CARDS ── */}
      {upcoming.length > 0 && (
        <section style={{ width: "min(980px, 100%)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              padding: "0 4px",
            }}
          >
            <div
              data-ui="subtitle"
              style={{ fontSize: "1.1rem", color: "var(--text)" }}
            >
              Your Upcoming Reservations
            </div>
            <Link
              to="/reservations"
              style={{
                fontSize: "0.9rem",
                color: "var(--primary)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 600,
              }}
            >
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {upcoming.map((res) => (
              <HomeReservationCard key={res.id} res={res} />
            ))}
          </div>
        </section>
      )}

      <ReservationFormModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        user={user}
      />
    </div>
  );
}

// ── Inline Component for Homepage Cards ──
function HomeReservationCard({ res }) {
  const dateObj = new Date(res.date);
  const dateStr = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      data-ui="card"
      style={{
        padding: "16px",
        borderLeft: "4px solid var(--primary)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        background: "var(--panel)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{dateStr}</div>
          <div
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              background: "var(--panel-2)",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              border: "1px solid var(--border)",
            }}
          >
            {res.meal_type}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            color: "var(--muted)",
            fontSize: "0.9rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={15} /> {res.start_time}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <MapPin size={15} /> Table {res.table?.table_number || "TBD"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Users size={15} /> {res.party_size || res.attendees?.length || "?"}{" "}
            ppl
          </div>
        </div>
      </div>

      <div>
        <span
          style={{
            color:
              res.status === "confirmed" ? "var(--success)" : "var(--warning)",
            fontWeight: 700,
            fontSize: "0.85rem",
            textTransform: "capitalize",
          }}
        >
          {res.status}
        </span>
      </div>
    </div>
  );
}
