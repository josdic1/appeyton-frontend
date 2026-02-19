import React, { useEffect, useState, useMemo } from "react";
import { api } from "../../utils/api";
import { useToastTrigger } from "../../hooks/useToast";
import { safe } from "../../utils/safe";
import { ChefHat, Users, Search, Flame, Loader2 } from "lucide-react";

/**
 * DailyPage: The Operational Command Center
 * Used by staff to monitor daily arrivals and "Fire" orders to the kitchen.
 */
export function DailyPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reservations, setReservations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastTrigger();

  const fetchReservations = async () => {
    setLoading(true);
    try {
      // api.js handles /api prefix
      const data = await api.get(`/ops/reservations?date=${date}`);
      setReservations(safe.array(data));
    } catch (err) {
      // Global interceptor handles the toast, but we can log locally
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [date]);

  const selectedRes = useMemo(
    () => reservations.find((r) => r.id === selectedId),
    [reservations, selectedId],
  );

  const handleFireToKitchen = async (resId) => {
    try {
      // Updates status to 'fired' so the KDS picks it up
      await api.patch(`/reservations/${resId}`, { status: "fired" });

      addToast({
        status: "success",
        what: "Ticket Fired",
        why: "Order successfully transmitted to the kitchen display.",
        how: "The kitchen is now preparing this table's meal.",
      });

      fetchReservations();
    } catch (err) {
      addToast({
        status: "error",
        what: "Kitchen Sync Failed",
        why: err.message,
        how: "Try firing again or manually notify the kitchen staff.",
      });
    }
  };

  return (
    <div style={layoutStyle}>
      <header style={headerStyle}>
        <div>
          <h1
            style={{
              fontSize: "1.6rem",
              margin: 0,
              fontWeight: 900,
              letterSpacing: "-1px",
            }}
          >
            Daily Command Center
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
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "2px solid #000",
            }}
          />
        </div>
      </header>

      <div style={mainContentStyle}>
        {/* Sidebar: Guest List */}
        <aside style={sidebarStyle}>
          <div style={searchWrapper}>
            <Search size={14} style={searchIcon} />
            <input
              placeholder="Filter by guest name..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={searchInput}
            />
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={emptyState}>
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              reservations
                .filter((r) => {
                  const primaryName = r.attendees?.[0]?.name || "";
                  return (
                    !filter ||
                    primaryName.toLowerCase().includes(filter.toLowerCase())
                  );
                })
                .map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    style={{
                      ...resItemStyle,
                      background: selectedId === r.id ? "white" : "transparent",
                      borderLeft:
                        selectedId === r.id
                          ? "6px solid var(--black)"
                          : "6px solid transparent",
                    }}
                  >
                    <div style={resItemHeader}>
                      <span>{r.start_time?.substring(0, 5) || "??:??"}</span>
                      <span
                        style={{
                          color: r.status === "fired" ? "#f59e0b" : "#666",
                        }}
                      >
                        {r.status?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800 }}>
                      {r.attendees?.[0]?.name || "Guest"}
                    </div>
                  </div>
                ))
            )}
          </div>
        </aside>

        {/* Detail Panel */}
        <main style={{ padding: 40, overflowY: "auto", background: "white" }}>
          {selectedRes ? (
            <div style={{ maxWidth: 700 }}>
              <div style={detailHeader}>
                <div>
                  <h2
                    style={{
                      fontSize: "2.5rem",
                      margin: 0,
                      fontWeight: 900,
                      letterSpacing: "-1.5px",
                    }}
                  >
                    {selectedRes.attendees?.[0]?.name}
                  </h2>
                  <p style={{ color: "#666", fontWeight: 600, marginTop: 4 }}>
                    Table {selectedRes.table?.table_number || "TBD"} ·{" "}
                    {selectedRes.meal_type}
                  </p>
                </div>

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
                    <ChefHat size={18} /> ORDER IN PROGRESS
                  </div>
                )}
              </div>

              <div
                data-ui="card"
                style={{ padding: 24, border: "2px solid #000" }}
              >
                <h3 style={sectionLabel}>Attendee Manifest & Dietary Alerts</h3>
                {safe.array(selectedRes.attendees).map((a) => (
                  <div key={a.id} style={guestRow}>
                    <span style={{ fontWeight: 700 }}>
                      {a.name}{" "}
                      <span style={{ opacity: 0.5, fontWeight: 500 }}>
                        ({a.attendee_type})
                      </span>
                    </span>
                    {a.dietary_restrictions && (
                      <span
                        style={{
                          color: "#ef4444",
                          fontWeight: 900,
                          fontSize: "0.8rem",
                          background: "#fee2e2",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        EXCL:{" "}
                        {a.dietary_restrictions.note || a.dietary_restrictions}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={emptyState}>
              <div style={{ textAlign: "center", opacity: 0.5 }}>
                <ChefHat size={48} style={{ marginBottom: 16 }} />
                <p>Select a reservation to manage kitchen firing.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- Styles (Standardized for your Bagger Brand) ---

const layoutStyle = {
  display: "grid",
  gridTemplateRows: "auto 1fr",
  height: "calc(100vh - 64px)",
  background: "#f8f8f8",
};

const headerStyle = {
  padding: "16px 24px",
  background: "var(--cream, #fffdf5)",
  borderBottom: "2px solid #000",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const subHeaderStats = {
  display: "flex",
  gap: 16,
  marginTop: 4,
  fontSize: "0.85rem",
  color: "#666",
  fontWeight: 600,
};

const mainContentStyle = {
  display: "grid",
  gridTemplateColumns: "380px 1fr",
  overflow: "hidden",
};

const sidebarStyle = {
  borderRight: "2px solid #000",
  display: "flex",
  flexDirection: "column",
  background: "#f0f0f0",
};

const searchWrapper = {
  padding: "16px",
  borderBottom: "1px solid #ddd",
  position: "relative",
};

const searchIcon = {
  position: "absolute",
  left: "28px",
  top: "28px",
  color: "#999",
};

const searchInput = {
  width: "100%",
  padding: "10px 12px 10px 40px",
  borderRadius: 8,
  border: "1px solid #ccc",
  background: "white",
  fontWeight: 600,
};

const resItemStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #ddd",
  cursor: "pointer",
  transition: "all 0.2s",
};

const resItemHeader = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "0.75rem",
  marginBottom: 6,
  fontWeight: 900,
  letterSpacing: "0.5px",
};

const detailHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  marginBottom: 40,
};

const fireBtnStyle = {
  background: "#f97316", // Orange-600
  color: "white",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 900,
  padding: "14px 28px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const firedBadge = {
  background: "#10b981", // Green-500
  color: "white",
  padding: "14px 28px",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 900,
};

const sectionLabel = {
  fontSize: "0.75rem",
  textTransform: "uppercase",
  color: "#666",
  marginBottom: 20,
  letterSpacing: "1.5px",
  fontWeight: 800,
};

const guestRow = {
  padding: "14px 0",
  borderBottom: "1px solid #eee",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const emptyState = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#999",
};
