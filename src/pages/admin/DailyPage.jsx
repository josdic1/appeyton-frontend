import React, { useEffect, useState, useMemo } from "react";
import { api } from "../../utils/api";
import { useToastTrigger } from "../../hooks/useToast";
import {
  Printer,
  ChefHat,
  Users,
  AlertCircle,
  Search,
  Clock,
  MapPin,
  Flame,
} from "lucide-react";

export function DailyPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reservations, setReservations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastTrigger();

  const fetchReservations = () => {
    setLoading(true);
    api
      .get(`/api/ops/reservations?date=${date}`)
      .then((data) => setReservations(data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReservations();
  }, [date]);

  const selectedRes = useMemo(
    () => reservations.find((r) => r.id === selectedId),
    [reservations, selectedId],
  );

  // ── THE FIRE LOGIC ──
  const handleFireToKitchen = async (resId) => {
    try {
      // Updates status to 'fired' so the KDS picks it up [cite: 2026-02-18]
      await api.patch(`/api/reservations/${resId}`, { status: "fired" });
      addToast({
        type: "success",
        title: "Order Fired",
        message: "Ticket sent to Kitchen Display System.",
      });
      fetchReservations(); // Refresh list to show updated status [cite: 2026-02-18]
    } catch (err) {
      addToast({ type: "error", title: "Fire Failed", message: err.message });
    }
  };

  return (
    <div style={layoutStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "1.5rem", margin: 0, fontWeight: 800 }}>
            Daily Command
          </h1>
          <div style={subHeaderStats}>
            <span>
              <Users size={14} /> {reservations.length} Bookings Today
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            data-ui="input"
          />
        </div>
      </header>

      <div style={mainContentStyle}>
        {/* Sidebar */}
        <aside style={sidebarStyle}>
          <div style={searchWrapper}>
            <Search size={14} style={searchIcon} />
            <input
              placeholder="Search guest..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={searchInput}
            />
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {reservations
              .filter(
                (r) =>
                  !filter ||
                  r.attendees[0]?.name
                    .toLowerCase()
                    .includes(filter.toLowerCase()),
              )
              .map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{
                    ...resItemStyle,
                    background:
                      selectedId === r.id ? "var(--panel)" : "transparent",
                    borderLeft:
                      selectedId === r.id
                        ? "4px solid var(--primary)"
                        : "4px solid transparent",
                  }}
                >
                  <div style={resItemHeader}>
                    <span>{r.start_time.substring(0, 5)}</span>
                    <span
                      style={{
                        color:
                          r.status === "fired" ? "var(--orange)" : "inherit",
                      }}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700 }}>{r.attendees[0]?.name}</div>
                </div>
              ))}
          </div>
        </aside>

        {/* Detail Panel */}
        <main style={{ padding: 40, overflowY: "auto" }}>
          {selectedRes ? (
            <div style={{ maxWidth: 700 }}>
              <div style={detailHeader}>
                <div>
                  <h2 style={{ fontSize: "2rem", margin: 0 }}>
                    {selectedRes.attendees[0]?.name}
                  </h2>
                  <p style={{ color: "var(--muted)" }}>
                    Table {selectedRes.table?.table_number || "TBD"} ·{" "}
                    {selectedRes.meal_type}
                  </p>
                </div>

                {/* FIRE BUTTON: Only show if confirmed and not already fired [cite: 2026-02-18] */}
                {selectedRes.status === "confirmed" && (
                  <button
                    onClick={() => handleFireToKitchen(selectedRes.id)}
                    data-ui="btn"
                    style={fireBtnStyle}
                  >
                    <Flame size={18} /> FIRE TO KITCHEN
                  </button>
                )}

                {selectedRes.status === "fired" && (
                  <div style={firedBadge}>
                    <ChefHat size={18} /> IN PROGRESS
                  </div>
                )}
              </div>

              <div data-ui="card" style={{ padding: 24 }}>
                <h3 style={sectionLabel}>Guest List & Dietary Notes</h3>
                {selectedRes.attendees.map((a) => (
                  <div key={a.id} style={guestRow}>
                    <span>
                      {a.name} ({a.attendee_type})
                    </span>
                    {a.dietary_restrictions && (
                      <span style={{ color: "var(--danger)", fontWeight: 800 }}>
                        {a.dietary_restrictions.note}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={emptyState}>
              Select a reservation to manage kitchen firing.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// STYLES
const layoutStyle = {
  display: "grid",
  gridTemplateRows: "auto 1fr",
  height: "calc(100vh - 64px)",
  background: "var(--bg)",
};
const headerStyle = {
  padding: "16px 24px",
  background: "var(--panel)",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const subHeaderStats = {
  display: "flex",
  gap: 16,
  marginTop: 4,
  fontSize: "0.85rem",
  color: "var(--muted)",
};
const mainContentStyle = {
  display: "grid",
  gridTemplateColumns: "350px 1fr",
  overflow: "hidden",
};
const sidebarStyle = {
  borderRight: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  background: "var(--panel-2)",
};
const searchWrapper = {
  padding: 12,
  borderBottom: "1px solid var(--border)",
  position: "relative",
};
const searchIcon = {
  position: "absolute",
  left: 22,
  top: 24,
  color: "var(--muted)",
};
const searchInput = {
  width: "100%",
  padding: "8px 10px 8px 32px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--bg)",
};
const resItemStyle = {
  padding: 16,
  borderBottom: "1px solid var(--border)",
  cursor: "pointer",
};
const resItemHeader = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "0.75rem",
  marginBottom: 4,
  fontWeight: 800,
};
const detailHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  marginBottom: 32,
};
const fireBtnStyle = {
  background: "var(--orange)",
  color: "white",
  display: "flex",
  gap: 8,
  fontWeight: 900,
  padding: "12px 20px",
};
const firedBadge = {
  background: "var(--success)",
  color: "white",
  padding: "12px 20px",
  borderRadius: 8,
  display: "flex",
  gap: 8,
  fontWeight: 900,
};
const sectionLabel = {
  fontSize: "0.7rem",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 16,
  letterSpacing: "1px",
};
const guestRow = {
  padding: "12px 0",
  borderBottom: "1px solid var(--border-2)",
  display: "flex",
  justifyContent: "space-between",
};
const emptyState = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--muted)",
};
