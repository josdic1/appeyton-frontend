import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../utils/api";
import { safe } from "../../utils/safe";
import { useToastTrigger } from "../../hooks/useToast";
import {
  Users,
  ChefHat,
  MapPin,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react";

// --- Design Tokens ---
const C = {
  orange: "#eb5638",
  black: "#2b2b2b",
  cream: "#ebe5c0",
  tan: "#e6e0b8",
  border: "#d4cea3",
  muted: "#9a9578",
  success: "#5a8a5a",
  danger: "#ef4444",
};

/**
 * Calculates seat position based on index and total seats.
 * Maps guest bubbles in an orbit around the central table.
 */
function seatPos(i, total, r = 110) {
  const a = (i / total) * 2 * Math.PI - Math.PI / 2;
  return {
    position: "absolute",
    top: `calc(50% + ${Math.sin(a) * r}px - 32px)`,
    left: `calc(50% + ${Math.cos(a) * r}px - 32px)`,
  };
}

// --- Modals ---

function SeatAssignModal({ seat, unassigned, onClose, onRefresh }) {
  const { addToast } = useToastTrigger();

  const assign = async (attId) => {
    try {
      await api.patch(`/reservation-attendees/${attId}`, { seat_id: seat.id });
      addToast({
        status: "success",
        what: "Guest Seated",
        why: `Assigned to Seat ${seat.seat_number}.`,
        how: "The table layout has been updated for all staff.",
      });
      await onRefresh();
      onClose();
    } catch (e) {
      addToast({ status: "error", what: "Seating Failed", why: e.message });
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={assignCardStyle} onClick={(e) => e.stopPropagation()}>
        <h3
          style={{ margin: "0 0 20px 0", textAlign: "center", fontWeight: 900 }}
        >
          Seat {seat?.seat_number}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {unassigned.length > 0 ? (
            unassigned.map((att) => (
              <button
                key={att.id}
                onClick={() => assign(att.id)}
                style={actionBtnStyle}
              >
                {att.name}
              </button>
            ))
          ) : (
            <p style={{ textAlign: "center", opacity: 0.5, padding: "20px" }}>
              No unseated guests in this party.
            </p>
          )}
          <button onClick={onClose} style={cancelBtnStyle}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export function FloorPlanPage() {
  const { addToast } = useToastTrigger();
  const [rooms, setRooms] = useState([]);
  const [tables, setTables] = useState([]);
  const [seats, setSeats] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [seatModal, setSeatModal] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [r, t, s, res] = await Promise.all([
        api.get("/dining-rooms"),
        api.get("/ops/tables"),
        api.get("/ops/seats"),
        api.get(`/ops/reservations?date=${date}`),
      ]);

      setRooms(safe.array(r));
      setTables(safe.array(t));
      setSeats(safe.array(s));
      setReservations(safe.array(res));

      if (!activeRoom && r?.length) setActiveRoom(r[0].id);
    } catch (e) {
      console.error("FloorPlan Sync Error");
    } finally {
      setLoading(false);
    }
  }, [date, activeRoom]);

  useEffect(() => {
    loadAll();
    const inv = setInterval(loadAll, 15000); // 15s Heartbeat
    return () => clearInterval(inv);
  }, [loadAll]);

  const currentTables = tables.filter((t) => t.dining_room_id === activeRoom);

  if (loading)
    return (
      <div style={loadingPageStyle}>
        <RefreshCw className="animate-spin" /> Map Initializing...
      </div>
    );

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <h1 style={{ margin: 0, fontWeight: 900, fontSize: "1.5rem" }}>
            MAP_VIEW
          </h1>
          <nav style={{ display: "flex", gap: 8 }}>
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                style={{
                  ...roomTabStyle,
                  background: activeRoom === room.id ? C.black : "transparent",
                  color: activeRoom === room.id ? C.cream : C.black,
                }}
              >
                {room.name.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />
      </header>

      <div style={layoutGridStyle}>
        <main style={floorGridStyle}>
          {currentTables.map((table) => {
            const res = reservations.find(
              (r) => r.table_id === table.id && r.status !== "cancelled",
            );
            const tableSeats = seats.filter((s) => s.table_id === table.id);

            return (
              <div key={table.id} style={tableWrapperStyle}>
                {/* Table Core */}
                <div
                  onClick={() => setSelected({ type: "table", table, res })}
                  style={{
                    ...centerTableStyle,
                    borderColor: res ? C.orange : C.black,
                    transform:
                      selected?.table?.id === table.id
                        ? "scale(1.05)"
                        : "scale(1)",
                  }}
                >
                  <span style={tableLabelStyle}>TBL</span>
                  <span style={tableNumStyle}>{table.table_number}</span>
                  {res && <div style={resIndicatorStyle} />}
                </div>

                {/* Seat Satellite Orbit */}
                {tableSeats.map((seat, i) => {
                  const guest = res?.attendees?.find(
                    (a) => Number(a.seat_id) === Number(seat.id),
                  );
                  return (
                    <div
                      key={seat.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!guest && res) {
                          setSeatModal({
                            seat,
                            unassigned: res.attendees.filter((a) => !a.seat_id),
                          });
                        } else if (guest) {
                          setSelected({
                            type: "seat",
                            table,
                            seat,
                            guest,
                            res,
                          });
                        }
                      }}
                      style={{
                        ...seatPos(i, tableSeats.length),
                        ...seatBubbleStyle,
                        background: guest
                          ? guest.attendee_type === "self"
                            ? C.black
                            : C.orange
                          : "white",
                        color: guest ? "white" : C.black,
                      }}
                    >
                      {guest ? guest.name[0] : seat.seat_number}
                      {guest?.dietary_restrictions && (
                        <div style={dietaryDotStyle} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </main>

        <aside style={sidebarStyle}>
          {selected ? (
            <div style={{ animation: "fadeIn 0.2s ease" }}>
              <div style={sideHeaderStyle}>
                <h3 style={{ margin: 0, fontWeight: 900 }}>
                  {selected.type === "seat" ? "GUEST_INFO" : "TABLE_INFO"}
                </h3>
                <button onClick={() => setSelected(null)} style={closeBtnStyle}>
                  ×
                </button>
              </div>

              <div style={infoCardStyle}>
                {selected.type === "seat" && selected.guest ? (
                  <>
                    <label style={labelStyle}>Guest Name</label>
                    <div style={valueStyle}>{selected.guest.name}</div>

                    {selected.guest.dietary_restrictions && (
                      <div style={dietaryAlertStyle}>
                        <AlertTriangle size={14} />{" "}
                        {selected.guest.dietary_restrictions.note ||
                          "Allergy Alert"}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <label style={labelStyle}>Capacity</label>
                    <div style={valueStyle}>
                      {selected.table.seat_count} Seats
                    </div>
                    <label style={labelStyle}>Current Party</label>
                    <div style={valueStyle}>
                      {selected.res ? selected.res.attendees[0].name : "Vacant"}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={emptySidebarStyle}>
              <MapPin size={48} opacity={0.1} />
              <p>Select a table or seat to view manifest</p>
            </div>
          )}
        </aside>
      </div>

      {seatModal && (
        <SeatAssignModal
          {...seatModal}
          onClose={() => setSeatModal(null)}
          onRefresh={loadAll}
        />
      )}
    </div>
  );
}

// --- Styles ---

const pageStyle = {
  height: "100vh",
  background: C.cream,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
const headerStyle = {
  padding: "20px 32px",
  background: "white",
  borderBottom: `2px solid ${C.black}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const layoutGridStyle = {
  flex: 1,
  display: "grid",
  gridTemplateColumns: "1fr 380px",
  overflow: "hidden",
};
const floorGridStyle = {
  padding: "60px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "60px",
  overflowY: "auto",
};
const sidebarStyle = {
  background: "white",
  borderLeft: `2px solid ${C.black}`,
  padding: "32px",
};
const tableWrapperStyle = {
  position: "relative",
  height: "300px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const centerTableStyle = {
  width: 140,
  height: 140,
  borderRadius: "50%",
  background: C.black,
  color: C.cream,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "4px solid",
  transition: "0.2s",
};
const tableLabelStyle = { fontSize: "0.6rem", fontWeight: 900, opacity: 0.5 };
const tableNumStyle = { fontSize: "2rem", fontWeight: 900, lineHeight: 1 };
const resIndicatorStyle = {
  width: 8,
  height: 8,
  background: C.orange,
  borderRadius: "50%",
  marginTop: 8,
};
const seatBubbleStyle = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  border: `2px solid ${C.black}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontWeight: 900,
  zIndex: 5,
  transition: "0.2s",
};
const dietaryDotStyle = {
  position: "absolute",
  top: -2,
  right: -2,
  width: 16,
  height: 16,
  background: C.danger,
  borderRadius: "50%",
  border: "2px solid white",
};
const roomTabStyle = {
  padding: "6px 14px",
  borderRadius: "4px",
  border: `1px solid ${C.black}`,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "0.7rem",
};
const inputStyle = {
  padding: "8px 12px",
  borderRadius: "6px",
  border: `2px solid ${C.black}`,
  fontWeight: 800,
  fontFamily: "monospace",
};
const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  zIndex: 2000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(4px)",
};
const assignCardStyle = {
  background: "white",
  padding: "40px",
  borderRadius: "16px",
  border: `2px solid ${C.black}`,
  width: "350px",
};
const actionBtnStyle = {
  width: "100%",
  padding: "14px",
  background: C.tan,
  border: "1px solid #000",
  borderRadius: "8px",
  fontWeight: 900,
  cursor: "pointer",
  marginBottom: 8,
};
const cancelBtnStyle = {
  width: "100%",
  background: "none",
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  opacity: 0.5,
  marginTop: 10,
};
const infoCardStyle = {
  padding: "24px",
  background: C.tan,
  borderRadius: "16px",
  border: `1px solid ${C.border}`,
};
const labelStyle = {
  fontSize: "0.6rem",
  fontWeight: 900,
  color: "#999",
  textTransform: "uppercase",
  marginBottom: 4,
  display: "block",
};
const valueStyle = { fontSize: "1.2rem", fontWeight: 900, marginBottom: 20 };
const dietaryAlertStyle = {
  background: "#fee2e2",
  color: "#b91c1c",
  padding: "12px",
  borderRadius: "8px",
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: "0.85rem",
};
const loadingPageStyle = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: C.cream,
  gap: 20,
  fontWeight: 900,
};
const sideHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 24,
  borderBottom: "2px solid #eee",
  paddingBottom: 15,
};
const closeBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "1.5rem",
  fontWeight: 900,
  cursor: "pointer",
};
const emptySidebarStyle = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.2,
  fontWeight: 900,
};
