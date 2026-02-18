// src/pages/ops/FloorPlanPage.jsx
//
// Floor plan for Sterling Catering ops/staff view.
// - Circular tables with orbit seat bubbles
// - Click SEAT → context panel: name, type, dietary, order, action buttons
// - Click TABLE → context panel: table summary, full party list
// - "View Full Reservation" → ReservationModal (party + orders + edit dietary)
// - "Edit Order / Add Order" → OrderEditorModal (menu picker per attendee)
// - Empty seat → SeatAssignModal (pick unassigned attendee)
// - Date picker (defaults today), room tabs, live clock, guest search
// - Attendees come from reservation.attendees[] (nested, no extra fetch)
// - Orders loaded per-reservation via GET /api/orders/by-reservation/{id}
// - 8s polling

import React, { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../../utils/api";

// ─── Brand tokens ──────────────────────────────────────────────
const C = {
  orange: "#eb5638",
  black: "#2b2b2b",
  cream: "#ebe5c0",
  tan: "#e6e0b8",
  border: "#d4cea3",
  muted: "#9a9578",
  dim: "#7a7660",
  success: "#5a8a5a",
};

// ─── Helpers ──────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtClock = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
const resLabel = (id) => `#RES-${String(id).padStart(3, "0")}`;
const initials = (name) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";
const fmtDietary = (d) => {
  if (!d) return "None";
  if (typeof d === "string") return d;
  return d.note || Object.values(d).filter(Boolean).join(", ") || "None";
};

// ─── Seat orbit position ──────────────────────────────────────
function seatPos(i, total, r = 118) {
  const a = (i / total) * 2 * Math.PI - Math.PI / 2;
  return {
    position: "absolute",
    top: `calc(50% + ${Math.sin(a) * r}px - 37px)`,
    left: `calc(50% + ${Math.cos(a) * r}px - 37px)`,
  };
}

// ─── Shared atoms ─────────────────────────────────────────────
const uLabel = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: C.dim,
  marginBottom: "0.375rem",
};
const uValue = {
  fontSize: "0.9375rem",
  padding: "0.625rem",
  background: C.tan,
  borderLeft: `3px solid ${C.orange}`,
  borderRadius: "0.375rem",
  color: C.black,
};
const uBtn = (bg, brd, color = C.cream) => ({
  width: "100%",
  padding: "0.75rem",
  marginTop: "0.625rem",
  background: bg,
  color,
  border: `2px solid ${brd}`,
  borderRadius: "0.375rem",
  fontWeight: 700,
  fontSize: "0.8125rem",
  cursor: "pointer",
  textTransform: "uppercase",
  letterSpacing: "0.025em",
  transition: "all 0.15s",
});

// ═══════════════════════════════════════════════════════════════
// RESERVATION DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
const DIETARY_OPTS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Halal",
  "Kosher",
  "Nut allergy",
  "Dairy-free",
];

function ReservationModal({
  res,
  order,
  menuItems,
  onClose,
  onOpenOrderEditor,
  onRefresh,
}) {
  const [editIdx, setEditIdx] = useState(null);
  const [editDiet, setEditDiet] = useState("");
  const [saving, setSaving] = useState(false);

  // Admin Move Table State
  const [isMoving, setIsMoving] = useState(false);
  const [newTableId, setNewTableId] = useState("");
  const [availableTables, setAvailableTables] = useState([]);

  if (!res) return null;
  const attendees = res.attendees || [];

  // Helper to load tables for the "Move" dropdown
  const loadMoveTables = async () => {
    try {
      // If we know the room ID, fetch tables for it. Fallback to all tables if needed.
      const roomId = res.table?.dining_room_id || 1;
      const data = await api.get(`/api/dining-rooms/${roomId}/tables`);
      setAvailableTables(data || []);
    } catch (e) {
      console.error("Failed to load tables for move:", e);
    }
  };

  const handleMoveTable = async () => {
    if (!newTableId) return;
    setSaving(true);
    try {
      await api.patch(`/api/reservations/${res.id}`, {
        table_id: parseInt(newTableId),
      });
      await onRefresh();
      setIsMoving(false);
    } catch (e) {
      alert("Failed to move table: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveGuest = async (attendeeId) => {
    if (!confirm("Remove this guest from the reservation?")) return;
    try {
      await api.delete(`/api/reservation-attendees/${attendeeId}`);
      await onRefresh();
    } catch (e) {
      alert("Error removing guest");
    }
  };

  const orderItemsFor = (attId) =>
    (order?.items || []).filter((i) => i.reservation_attendee_id === attId);

  const orderText = (attId) => {
    const items = orderItemsFor(attId);
    if (!items.length) return "—";
    return items
      .map((i) => {
        const mi = menuItems.find((m) => m.id === i.menu_item_id);
        const nm = mi?.name || i.menu_item_name || `Item #${i.menu_item_id}`;
        return i.quantity > 1 ? `${nm} ×${i.quantity}` : nm;
      })
      .join(", ");
  };

  const fmtDietary = (d) => {
    if (!d) return "None";
    if (typeof d === "string") return d;
    return d.note || Object.values(d).filter(Boolean).join(", ") || "None";
  };

  const startEdit = (att, idx) => {
    setEditIdx(idx);
    setEditDiet(fmtDietary(att.dietary_restrictions));
  };

  const saveEdit = async (att) => {
    setSaving(true);
    try {
      const val = editDiet && editDiet !== "None" ? { note: editDiet } : null;
      await api.patch(`/api/reservation-attendees/${att.id}`, {
        dietary_restrictions: val,
      });
      await onRefresh();
      setEditIdx(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const confirmRes = async () => {
    await api.patch(`/api/reservations/${res.id}`, { status: "confirmed" });
    await onRefresh();
  };

  const cancelRes = async () => {
    if (!confirm("Cancel this reservation?")) return;
    await api.patch(`/api/reservations/${res.id}`, { status: "cancelled" });
    await onRefresh();
    onClose();
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(43,43,43,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: C.cream,
          border: `3px solid ${C.black}`,
          borderRadius: "0.75rem",
          width: "min(900px,100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem 2rem",
            borderBottom: `2px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: C.tan,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
            Reservation Details
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: C.black,
              color: C.cream,
              border: "none",
              cursor: "pointer",
              fontSize: "1.25rem",
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "2rem" }}>
          {/* ── ADMIN ACTIONS: MOVE TABLE ── */}
          <div
            style={{
              marginBottom: "2rem",
              padding: "1rem",
              border: `2px dashed ${C.border}`,
              borderRadius: "0.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={uLabel}>Current Table</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                  {res.table?.table_number
                    ? `Table ${res.table.table_number}`
                    : "Unassigned"}
                </div>
              </div>
              {!isMoving ? (
                <button
                  onClick={() => {
                    setIsMoving(true);
                    loadMoveTables();
                  }}
                  style={{
                    padding: "6px 12px",
                    background: C.black,
                    color: C.cream,
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Move Table
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    onChange={(e) => setNewTableId(e.target.value)}
                    style={{ padding: 6, borderRadius: 4 }}
                  >
                    <option value="">Select new table...</option>
                    {availableTables.map((t) => (
                      <option
                        key={t.id}
                        value={t.id}
                        disabled={t.id === res.table_id}
                      >
                        Table {t.table_number} ({t.seat_count} seats)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleMoveTable}
                    disabled={!newTableId}
                    style={{
                      padding: "6px 12px",
                      background: C.orange,
                      color: C.cream,
                      borderRadius: 4,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsMoving(false)}
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      border: "1px solid " + C.muted,
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "1.25rem",
              marginBottom: "2rem",
            }}
          >
            {[
              ["Reservation ID", resLabel(res.id)],
              [
                "Guest Name",
                attendees.find((a) => a.attendee_type === "member")?.name ||
                  "—",
              ],
              [
                "Status",
                res.status.charAt(0).toUpperCase() + res.status.slice(1),
              ],
              [
                "Date",
                typeof res.date === "string"
                  ? res.date
                  : new Date(res.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }),
              ],
              ["Time", `${res.start_time} – ${res.end_time}`],
              ["Party Size", attendees.length],
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <label style={uLabel}>{lbl}</label>
                <div style={uValue}>{val}</div>
              </div>
            ))}
          </div>

          {/* Party & Orders table */}
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.8125rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "1rem",
              paddingBottom: "0.5rem",
              borderBottom: `2px solid ${C.border}`,
            }}
          >
            Party Members &amp; Orders
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "2rem",
              border: `2px solid ${C.black}`,
              borderRadius: "0.5rem",
              overflow: "hidden",
            }}
          >
            <thead style={{ background: C.black }}>
              <tr>
                {["Name", "Type", "Order", "Dietary", "Action"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.75rem 1rem",
                      textAlign: "left",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: C.cream,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendees.map((att, idx) => (
                <React.Fragment key={att.id || idx}>
                  <tr
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: idx % 2 === 0 ? "transparent" : C.tan,
                    }}
                  >
                    <td style={{ padding: "1rem", fontWeight: 600 }}>
                      {att.name}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                      {att.attendee_type === "member" ? "Member" : "Guest"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        fontSize: "0.875rem",
                        color: C.dim,
                      }}
                    >
                      {orderText(att.id)}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                      {fmtDietary(att.dietary_restrictions)}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span
                          onClick={() => onOpenOrderEditor(att)}
                          style={{
                            color: C.orange,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {orderText(att.id) === "—" ? "Add Order" : "Edit"}
                        </span>
                        <span style={{ color: C.muted }}>·</span>
                        <span
                          onClick={() =>
                            editIdx === idx
                              ? setEditIdx(null)
                              : startEdit(att, idx)
                          }
                          style={{
                            color: C.dim,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          {editIdx === idx ? "Cancel" : "Dietary"}
                        </span>

                        {/* ADMIN REMOVE GUEST */}
                        <span style={{ color: C.muted }}>·</span>
                        <button
                          onClick={() => handleRemoveGuest(att.id)}
                          title="Remove Guest"
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "red",
                            fontWeight: 900,
                            fontSize: "1rem",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editIdx === idx && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: "0 1rem 1rem 1rem",
                          background: C.tan,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <select
                            value={editDiet}
                            onChange={(e) => setEditDiet(e.target.value)}
                            style={{
                              flex: 1,
                              padding: "0.5rem 0.75rem",
                              border: `2px solid ${C.orange}`,
                              borderRadius: "0.375rem",
                              background: C.cream,
                              fontFamily: "inherit",
                              fontSize: "0.875rem",
                            }}
                          >
                            {DIETARY_OPTS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => saveEdit(att)}
                            disabled={saving}
                            style={{
                              padding: "0.5rem 1.25rem",
                              background: C.orange,
                              color: C.cream,
                              border: "none",
                              borderRadius: "0.375rem",
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: "0.875rem",
                            }}
                          >
                            {saving ? "…" : "Save"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Messages (read-only) */}
          {res.messages?.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.75rem",
                  paddingBottom: "0.5rem",
                  borderBottom: `2px solid ${C.border}`,
                }}
              >
                Messages
              </div>
              {res.messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    background: C.tan,
                    borderLeft: `3px solid ${C.orange}`,
                    padding: "0.75rem 1rem",
                    borderRadius: "0.375rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.8125rem" }}>
                      {msg.author_name || "Staff"}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: C.muted }}>
                      {new Date(msg.created_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.875rem" }}>{msg.content}</div>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {res.notes && (
            <div style={{ marginBottom: "2rem" }}>
              <label style={uLabel}>Notes</label>
              <div style={{ ...uValue, fontSize: "0.875rem", lineHeight: 1.5 }}>
                {res.notes}
              </div>
            </div>
          )}

          {/* Status actions */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {res.status !== "confirmed" && (
              <button
                onClick={confirmRes}
                style={{ ...uBtn(C.success, C.success), flex: 1, marginTop: 0 }}
              >
                ✓ Confirm Reservation
              </button>
            )}
            {res.status !== "cancelled" && (
              <button
                onClick={cancelRes}
                style={{
                  ...uBtn("transparent", C.orange, C.orange),
                  flex: 1,
                  marginTop: 0,
                }}
              >
                Cancel Reservation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ORDER EDITOR MODAL
// ═══════════════════════════════════════════════════════════════
function OrderEditorModal({
  reservation,
  attendee,
  existingOrder,
  menuItems,
  onClose,
  onRefresh,
}) {
  const [cart, setCart] = useState([]);
  const [cat, setCat] = useState("all");
  const [saving, setSave] = useState(false);

  // Pre-fill cart from existing order items for this attendee
  useEffect(() => {
    if (!existingOrder?.items || !attendee) {
      setCart([]);
      return;
    }
    const mine = existingOrder.items
      .filter((i) => i.reservation_attendee_id === attendee.id)
      .map((i) => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        special_instructions: i.special_instructions || "",
      }));
    setCart(mine);
  }, [existingOrder, attendee?.id]);

  const cats = [
    "all",
    ...new Set(menuItems.filter((m) => m.is_available).map((m) => m.category)),
  ];
  const visible = menuItems.filter(
    (m) => m.is_available && (cat === "all" || m.category === cat),
  );

  const addItem = (mi) =>
    setCart((prev) => {
      const ex = prev.find((c) => c.menu_item_id === mi.id);
      return ex
        ? prev.map((c) =>
            c.menu_item_id === mi.id ? { ...c, quantity: c.quantity + 1 } : c,
          )
        : [
            ...prev,
            { menu_item_id: mi.id, quantity: 1, special_instructions: "" },
          ];
    });
  const removeItem = (id) =>
    setCart((prev) => prev.filter((c) => c.menu_item_id !== id));
  const setQty = (id, q) =>
    q < 1
      ? removeItem(id)
      : setCart((prev) =>
          prev.map((c) => (c.menu_item_id === id ? { ...c, quantity: q } : c)),
        );

  const save = async () => {
    if (!cart.length) return;
    setSave(true);
    try {
      await api.post("/api/orders", {
        reservation_id: reservation.id,
        items: cart.map((c) => ({
          menu_item_id: c.menu_item_id,
          reservation_attendee_id: attendee.id,
          quantity: c.quantity,
          special_instructions: c.special_instructions || null,
        })),
      });
      await onRefresh();
      onClose();
    } catch (e) {
      console.error("Order save error:", e);
    } finally {
      setSave(false);
    }
  };

  const total = cart.reduce((s, c) => {
    const mi = menuItems.find((m) => m.id === c.menu_item_id);
    return s + parseFloat(mi?.price || 0) * c.quantity;
  }, 0);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(43,43,43,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: C.cream,
          border: `3px solid ${C.black}`,
          borderRadius: "0.75rem",
          width: "min(760px,100%)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "1.5rem 2rem",
            borderBottom: `2px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: C.tan,
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 0.125rem 0",
                fontSize: "1.125rem",
                fontWeight: 800,
              }}
            >
              Order for {attendee?.name}
            </h2>
            <div style={{ fontSize: "0.75rem", color: C.muted }}>
              {resLabel(reservation.id)} · {reservation.meal_type} ·{" "}
              {reservation.date}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: C.black,
              color: C.cream,
              border: "none",
              cursor: "pointer",
              fontSize: "1.25rem",
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: "1.5rem",
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: "1.5rem",
          }}
        >
          {/* Menu */}
          <div>
            {/* Category tabs */}
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: "1rem",
              }}
            >
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    background: cat === c ? C.orange : C.border,
                    color: cat === c ? C.cream : C.black,
                    border: `1px solid ${cat === c ? C.orange : C.muted}`,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "capitalize",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {menuItems.filter((m) => m.is_available).length === 0 ? (
              <div
                style={{
                  color: C.muted,
                  textAlign: "center",
                  padding: "3rem 0",
                  fontSize: "0.875rem",
                }}
              >
                No menu items available. Add some in Admin → Menu Items.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {visible.map((mi) => {
                  const inCart = cart.find((c) => c.menu_item_id === mi.id);
                  return (
                    <div
                      key={mi.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.375rem",
                        border: `1px solid ${inCart ? C.orange : C.border}`,
                        background: inCart ? "rgba(235,86,56,0.06)" : C.tan,
                        transition: "all 0.15s",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                          {mi.name}
                        </div>
                        {mi.description && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: C.muted,
                              marginTop: 2,
                            }}
                          >
                            {mi.description}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: C.orange,
                            fontWeight: 700,
                            marginTop: 2,
                          }}
                        >
                          ${parseFloat(mi.price).toFixed(2)}
                        </div>
                      </div>
                      {inCart ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <button
                            onClick={() => setQty(mi.id, inCart.quantity - 1)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              border: `1px solid ${C.border}`,
                              background: C.cream,
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: 16,
                              lineHeight: 1,
                            }}
                          >
                            −
                          </button>
                          <span
                            style={{
                              fontWeight: 700,
                              minWidth: 20,
                              textAlign: "center",
                            }}
                          >
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => setQty(mi.id, inCart.quantity + 1)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              border: `1px solid ${C.border}`,
                              background: C.cream,
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: 16,
                              lineHeight: 1,
                            }}
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(mi.id)}
                            style={{
                              marginLeft: 2,
                              color: C.orange,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: 18,
                              lineHeight: 1,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addItem(mi)}
                          style={{
                            padding: "0.375rem 0.875rem",
                            background: C.black,
                            color: C.cream,
                            border: "none",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart sidebar */}
          <div
            style={{
              borderLeft: `2px solid ${C.border}`,
              paddingLeft: "1.5rem",
            }}
          >
            <label style={uLabel}>Current Order</label>
            {cart.length === 0 ? (
              <div
                style={{
                  color: C.muted,
                  fontSize: "0.875rem",
                  textAlign: "center",
                  padding: "2rem 0",
                }}
              >
                Nothing selected yet
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gap: 8, marginBottom: "1rem" }}>
                  {cart.map((c) => {
                    const mi = menuItems.find((m) => m.id === c.menu_item_id);
                    return (
                      <div
                        key={c.menu_item_id}
                        style={{
                          background: C.tan,
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.375rem",
                          borderLeft: `3px solid ${C.orange}`,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "0.8125rem" }}>
                          {mi?.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: C.muted }}>
                          ×{c.quantity} · $
                          {(parseFloat(mi?.price || 0) * c.quantity).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 8,
                    marginBottom: "1rem",
                  }}
                >
                  Total: ${total.toFixed(2)}
                </div>
              </>
            )}
            <button
              onClick={save}
              disabled={saving || !cart.length}
              style={uBtn(
                cart.length ? C.orange : C.muted,
                cart.length ? C.orange : C.muted,
              )}
            >
              {saving ? "Saving…" : "Save Order"}
            </button>
            <button
              onClick={onClose}
              style={uBtn("transparent", C.muted, C.black)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SEAT ASSIGNMENT MODAL
// ═══════════════════════════════════════════════════════════════
function SeatAssignModal({ seat, unassigned, onClose, onRefresh }) {
  const [saving, setSave] = useState(false);

  const assign = async (attId) => {
    setSave(true);
    try {
      await api.patch(`/api/reservation-attendees/${attId}`, {
        seat_id: seat.id,
      });
      await onRefresh();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSave(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(43,43,43,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: C.cream,
          border: `3px solid ${C.black}`,
          borderRadius: "0.75rem",
          width: "min(400px,100%)",
          padding: "1.5rem",
        }}
      >
        <h2
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "1.125rem",
            fontWeight: 800,
          }}
        >
          Seat {seat?.seat_number}
        </h2>
        <p
          style={{
            margin: "0 0 1.5rem 0",
            color: C.muted,
            fontSize: "0.875rem",
          }}
        >
          {unassigned?.length
            ? "Select who sits here:"
            : "All attendees from today's reservation are already seated."}
        </p>
        <div style={{ display: "grid", gap: 8, marginBottom: "1rem" }}>
          {(unassigned || []).map((att) => (
            <button
              key={att.id}
              onClick={() => assign(att.id)}
              disabled={saving}
              style={{
                padding: "0.875rem 1rem",
                textAlign: "left",
                cursor: "pointer",
                background: C.tan,
                borderRadius: "0.5rem",
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: C.black,
                border: `2px solid ${C.border}`,
                borderLeft: `4px solid ${att.attendee_type === "member" ? C.success : C.orange}`,
              }}
            >
              {att.name}
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 400,
                  color: C.muted,
                  marginLeft: 8,
                }}
              >
                {att.attendee_type}
              </span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={uBtn("transparent", C.muted, C.black)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT PANEL
// ═══════════════════════════════════════════════════════════════
function CtxField({ label, value }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={uLabel}>{label}</label>
      <div style={uValue}>{value ?? "—"}</div>
    </div>
  );
}

function ContextPanel({
  sel,
  reservations,
  orders,
  seats,
  onViewRes,
  onEditOrder,
  onSeatSomeone,
}) {
  if (!sel)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem 1rem",
          color: C.muted,
          fontSize: "0.875rem",
          lineHeight: 1.6,
        }}
      >
        Click a seat or table
        <br />
        to view details
      </div>
    );

  const { type, table, seat, attendee } = sel;

  // Find the reservation for this table (already date-filtered)
  const res = reservations.find(
    (r) => r.table_id === table?.id && r.status !== "cancelled",
  );
  const order = res ? orders.find((o) => o.reservation_id === res.id) : null;

  // ── OCCUPIED SEAT ──
  if (type === "seat" && attendee) {
    const myItems = (order?.items || []).filter(
      (i) => i.reservation_attendee_id === attendee.id,
    );
    const orderTxt = myItems.length
      ? myItems
          .map((i) => {
            const mi = i.menu_item_name || `Item #${i.menu_item_id}`;
            return i.quantity > 1 ? `${mi} ×${i.quantity}` : mi;
          })
          .join(", ")
      : null;

    return (
      <div>
        <CtxField label="Name" value={attendee.name} />
        <CtxField
          label="Type"
          value={attendee.attendee_type === "member" ? "Member" : "Guest"}
        />
        <CtxField
          label="Dietary"
          value={fmtDietary(attendee.dietary_restrictions)}
        />

        {orderTxt ? (
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={uLabel}>Current Order</label>
            <div style={{ ...uValue, fontSize: "0.8125rem", lineHeight: 1.5 }}>
              {orderTxt}
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.25rem 0.625rem",
                  border: `1px solid ${C.success}`,
                  color: C.success,
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderRadius: "0.375rem",
                }}
              >
                Complete ✓
              </span>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={uLabel}>Current Order</label>
            <div
              style={{
                ...uValue,
                fontSize: "0.8125rem",
                color: C.muted,
                fontStyle: "italic",
              }}
            >
              No order yet
            </div>
          </div>
        )}

        {res && (
          <button
            onClick={() => onViewRes(res)}
            style={uBtn(C.orange, C.orange)}
          >
            View Full Reservation
          </button>
        )}
        <button
          onClick={() => res && onEditOrder(attendee, res, order)}
          style={uBtn("transparent", C.black, C.black)}
        >
          {orderTxt ? "Edit Order" : "Add Order"}
        </button>
      </div>
    );
  }

  // ── EMPTY SEAT ──
  if (type === "seat" && !attendee) {
    if (!res)
      return (
        <div
          style={{
            color: C.muted,
            fontSize: "0.875rem",
            textAlign: "center",
            padding: "2rem 0",
          }}
        >
          No reservation at this table today.
        </div>
      );
    const unassigned = (res.attendees || []).filter((a) => !a.seat_id);
    return (
      <div>
        <div
          style={{ color: C.dim, fontSize: "0.875rem", marginBottom: "1.5rem" }}
        >
          <strong>Seat {seat?.seat_number}</strong> is empty.
          {unassigned.length > 0
            ? " Someone from today's reservation still needs to be seated."
            : " All party members are seated."}
        </div>
        {unassigned.length > 0 && (
          <button
            onClick={() => onSeatSomeone(seat, res, unassigned)}
            style={uBtn(C.orange, C.orange)}
          >
            Seat Someone Here
          </button>
        )}
        {res && (
          <button
            onClick={() => onViewRes(res)}
            style={uBtn("transparent", C.black, C.black)}
          >
            View Full Reservation
          </button>
        )}
      </div>
    );
  }

  // ── TABLE VIEW ──
  if (type === "table") {
    const tableSeats = seats.filter((s) => s.table_id === table.id);
    const resAtts = res ? res.attendees || [] : [];
    const seatedCount = resAtts.filter((a) => a.seat_id).length;

    return (
      <div>
        <CtxField label="Table" value={`Table ${table.table_number}`} />
        <CtxField label="Capacity" value={`${table.seat_count} seats`} />
        <CtxField
          label="Occupied"
          value={`${seatedCount} / ${table.seat_count}`}
        />
        {res && (
          <>
            <CtxField label="Reservation" value={resLabel(res.id)} />
            <CtxField label="Meal" value={res.meal_type} />
            <CtxField label="Status" value={res.status} />
          </>
        )}

        {resAtts.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={uLabel}>Party ({resAtts.length})</label>
            {resAtts.map((a) => (
              <div
                key={a.id}
                style={{
                  marginBottom: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  background: C.tan,
                  borderRadius: "0.375rem",
                  borderLeft: `3px solid ${a.attendee_type === "member" ? C.success : C.orange}`,
                  fontSize: "0.8125rem",
                }}
              >
                <span style={{ fontWeight: 700 }}>{a.name}</span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    color: C.muted,
                    marginLeft: 8,
                  }}
                >
                  {a.seat_id ? "seated" : "not seated"}
                </span>
              </div>
            ))}
          </div>
        )}

        {res && (
          <button
            onClick={() => onViewRes(res)}
            style={uBtn(C.orange, C.orange)}
          >
            View Full Reservation
          </button>
        )}
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export function FloorPlanPage() {
  const [rooms, setRooms] = useState([]);
  const [tables, setTables] = useState([]);
  const [seats, setSeats] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(todayStr());
  const [clock, setClock] = useState(fmtClock());
  const [loading, setLoading] = useState(true);

  // Modals
  const [resModal, setResModal] = useState(null); // full reservation object
  const [orderModal, setOrderModal] = useState(null); // { attendee, reservation, existingOrder }
  const [seatModal, setSeatModal] = useState(null); // { seat, reservation, unassigned }

  const activeRoomRef = useRef(activeRoom);
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(fmtClock()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load all floor data
  const loadAll = useCallback(async () => {
    try {
      // Parallel: rooms, tables, seats, today's reservations (with attendees nested), menu
      const [r, t, s, res, mi] = await Promise.all([
        api.get("/api/dining-rooms"),
        api.get("/api/admin/tables"),
        api.get("/api/ops/seats"),
        api.get(`/api/ops/reservations?date=${date}`),
        api.get("/api/menu-items?available_only=true"),
      ]);

      setRooms(r || []);
      setTables(t || []);
      setSeats(s || []);
      setMenuItems(mi || []);

      const todayRes = res || [];
      setReservations(todayRes);

      if (!activeRoomRef.current && r?.length) setActiveRoom(r[0].id);

      // Load orders per reservation.
      if (todayRes.length) {
        const token =
          localStorage.getItem("token") ||
          sessionStorage.getItem("token") ||
          "";
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const results = await Promise.all(
          todayRes.map((rv) =>
            fetch(`/api/orders/by-reservation/${rv.id}`, { headers })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
          ),
        );
        setOrders(results.filter(Boolean));
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error("FloorPlan loadAll error:", e);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    setLoading(true);
    loadAll();
    const inv = setInterval(loadAll, 8000);
    return () => clearInterval(inv);
  }, [loadAll]);

  // ── Derived ─────────────────────────────────────────────────
  const roomTables = tables.filter((t) => t.dining_room_id === activeRoom);

  // All attendees for a table: from the reservation's nested attendees array
  const resForTable = (tableId) =>
    reservations.find(
      (r) => r.table_id === tableId && r.status !== "cancelled",
    );

  // Attendees seated at a table: match seat_id to our seats list
  const seatedAtTable = (tableId) => {
    const res = resForTable(tableId);
    if (!res) return [];
    const tableSeats = seats
      .filter((s) => s.table_id === tableId)
      .map((s) => s.id);
    return (res.attendees || []).filter((a) => tableSeats.includes(a.seat_id));
  };

  const orderForRes = (resId) => orders.find((o) => o.reservation_id === resId);

  const roomStat = (roomId) => {
    const rt = tables.filter((t) => t.dining_room_id === roomId);
    const cap = rt.reduce((s, t) => s + (t.seat_count || 0), 0);
    const occ = rt.reduce((s, t) => s + seatedAtTable(t.id).length, 0);
    return { cap, occ };
  };

  const tableMatchesSearch = (tableId) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const res = resForTable(tableId);
    return (res?.attendees || []).some((a) =>
      a.name?.toLowerCase().includes(q),
    );
  };

  const isSearching = !!search.trim();

  if (loading)
    return (
      <div
        style={{
          background: C.cream,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.muted,
        }}
      >
        Loading floor plan…
      </div>
    );

  return (
    <div
      style={{
        background: C.cream,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        color: C.black,
        fontFamily: "'Inter', -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          background: C.black,
          padding: "1rem 1.5rem",
          borderBottom: `3px solid ${C.orange}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ width: 100 }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <h1
            style={{
              color: C.cream,
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "-0.025em",
            }}
          >
            Sterling Catering
          </h1>
          <p
            style={{
              color: C.muted,
              fontSize: "0.75rem",
              margin: 0,
              letterSpacing: "0.05em",
            }}
          >
            RESERVATION MANAGEMENT
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSelected(null);
            }}
            style={{
              padding: "0.4rem 0.75rem",
              background: "#3d3b33",
              color: C.cream,
              border: "1px solid #5a574a",
              borderRadius: "0.375rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              colorScheme: "dark",
            }}
          />
          <input
            type="text"
            placeholder="Search guest…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "0.4rem 0.75rem",
              background: "#3d3b33",
              color: C.cream,
              border: "1px solid #5a574a",
              borderRadius: "0.375rem",
              fontSize: "0.75rem",
              outline: "none",
              width: 160,
            }}
          />
          <div
            style={{
              padding: "0.5rem 1rem",
              background: C.orange,
              color: C.cream,
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              fontFamily: "monospace",
              letterSpacing: "0.05em",
            }}
          >
            {clock}
          </div>
        </div>
      </div>

      {/* MAIN: Tables + Context */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "1.5rem",
          padding: "1.5rem 1.5rem 0 1.5rem",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Left: table grid + room tabs */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            minHeight: 0,
          }}
        >
          {/* Tables */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "2rem",
              alignContent: "start",
              background: C.cream,
              border: `2px solid ${C.black}`,
              borderRadius: "0.75rem",
            }}
          >
            {roomTables.length === 0 && (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "4rem",
                  color: C.muted,
                }}
              >
                No tables in this room.
              </div>
            )}

            {roomTables.map((table) => {
              const tableSeats = seats.filter((s) => s.table_id === table.id);
              const res = resForTable(table.id);
              const tSeated = seatedAtTable(table.id);
              const matches = tableMatchesSearch(table.id);
              const isSelTbl =
                selected?.type === "table" && selected?.table?.id === table.id;

              // Seat slots: real Seat records or virtual placeholders
              const seatSlots =
                tableSeats.length > 0
                  ? tableSeats
                  : Array.from({ length: table.seat_count }, (_, i) => ({
                      id: `v-${table.id}-${i}`,
                      seat_number: i + 1,
                      _virtual: true,
                      table_id: table.id,
                    }));

              return (
                <div
                  key={table.id}
                  style={{
                    position: "relative",
                    minHeight: 280,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: C.tan,
                    borderRadius: "0.75rem",
                    padding: "1.5rem",
                    border: `2px solid ${isSelTbl ? C.orange : C.border}`,
                    opacity: isSearching && !matches ? 0.15 : 1,
                    filter: isSearching && !matches ? "blur(1px)" : "none",
                    transform: isSelTbl ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Table circle */}
                  <div
                    onClick={() => setSelected({ type: "table", table })}
                    style={{
                      width: 180,
                      height: 180,
                      borderRadius: "50%",
                      cursor: "pointer",
                      zIndex: 2,
                      position: "relative",
                      background: C.black,
                      border: `4px solid ${C.orange}`,
                      boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.cream,
                      transition: "transform 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    {res && (
                      <span
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 4,
                          background: C.orange,
                          borderRadius: "0.375rem",
                          padding: "0.15rem 0.4rem",
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          color: C.cream,
                          letterSpacing: "0.025em",
                        }}
                      >
                        {resLabel(res.id)}
                      </span>
                    )}
                    <strong style={{ fontSize: "1.375rem", fontWeight: 800 }}>
                      TABLE {table.table_number}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        opacity: 0.85,
                        marginTop: "0.25rem",
                      }}
                    >
                      {tSeated.length} / {table.seat_count} Occupied
                    </span>
                  </div>

                  {/* Seat bubbles */}
                  {seatSlots.map((seat, i) => {
                    // Find attendee seated here
                    const att = seat._virtual
                      ? null
                      : (res?.attendees || []).find(
                          (a) => Number(a.seat_id) === Number(seat.id),
                        );
                    const isMatch =
                      isSearching &&
                      att?.name?.toLowerCase().includes(search.toLowerCase());
                    const isSelSeat =
                      selected?.type === "seat" &&
                      !seat._virtual &&
                      selected?.seat?.id === seat.id;
                    const bg = att
                      ? att.attendee_type === "member"
                        ? C.success
                        : C.orange
                      : "rgba(255,255,255,0.8)";

                    return (
                      <div
                        key={seat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected({
                            type: "seat",
                            table,
                            seat: seat._virtual ? null : seat,
                            attendee: att || null,
                          });
                        }}
                        style={{
                          ...seatPos(i, seatSlots.length),
                          width: 75,
                          height: 75,
                          borderRadius: "50%",
                          cursor: "pointer",
                          zIndex: 10,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          background: bg,
                          color: att ? C.cream : C.black,
                          border: `3px solid ${isSelSeat ? C.orange : C.black}`,
                          boxShadow: isMatch
                            ? "0 0 0 3px gold, 0 4px 8px rgba(0,0,0,0.2)"
                            : "0 2px 4px rgba(0,0,0,0.15)",
                          transform: isMatch ? "scale(1.2)" : "scale(1)",
                          transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                          fontWeight: 700,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = isMatch
                            ? "scale(1.2)"
                            : "scale(1)";
                        }}
                      >
                        {att ? (
                          <>
                            <span style={{ fontSize: "0.75rem" }}>
                              {initials(att.name)}
                            </span>
                            <span style={{ fontSize: "0.5rem", opacity: 0.9 }}>
                              ✓
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: "0.75rem", opacity: 0.4 }}>
                            {seat.seat_number}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Room tabs */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-end",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: C.dim,
                alignSelf: "center",
                marginRight: "0.25rem",
              }}
            >
              Rooms
            </span>
            {rooms.map((room) => {
              const { cap, occ } = roomStat(room.id);
              const active = activeRoom === room.id;
              return (
                <div
                  key={room.id}
                  onClick={() => {
                    setActiveRoom(room.id);
                    setSelected(null);
                  }}
                  style={{
                    padding: "0.875rem 1.25rem",
                    minWidth: 130,
                    cursor: "pointer",
                    background: active ? C.orange : C.border,
                    border: `2px solid ${active ? C.orange : C.muted}`,
                    borderRadius: "0.5rem 0.5rem 0 0",
                    color: active ? C.cream : C.black,
                    transform: active ? "translateY(-4px)" : "translateY(0)",
                    transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                    userSelect: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!active)
                      e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                    {room.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      opacity: 0.75,
                      marginTop: "0.125rem",
                    }}
                  >
                    {cap} Cap · {occ} Occ
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Context Panel */}
        <div
          style={{
            background: C.cream,
            border: `2px solid ${C.black}`,
            borderRadius: "0.75rem",
            padding: "1.5rem",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: C.dim,
              marginBottom: "1.5rem",
              paddingBottom: "0.75rem",
              borderBottom: `2px solid ${C.border}`,
            }}
          >
            {selected?.type === "seat" && selected?.attendee
              ? "Seat Details"
              : selected?.type === "table"
                ? "Table Details"
                : "Context"}
          </div>
          <ContextPanel
            sel={selected}
            reservations={reservations}
            orders={orders}
            seats={seats}
            onViewRes={(res) => setResModal(res)}
            onEditOrder={(att, res, order) =>
              setOrderModal({
                attendee: att,
                reservation: res,
                existingOrder: order,
              })
            }
            onSeatSomeone={(seat, res, unassigned) =>
              setSeatModal({ seat, reservation: res, unassigned })
            }
          />
        </div>
      </div>

      {/* MODALS */}
      {resModal && (
        <ReservationModal
          res={resModal}
          order={orderForRes(resModal.id)}
          menuItems={menuItems}
          onClose={() => setResModal(null)}
          onOpenOrderEditor={(att) => {
            const order = orderForRes(resModal.id);
            setResModal(null);
            setOrderModal({
              attendee: att,
              reservation: resModal,
              existingOrder: order,
            });
          }}
          onRefresh={async () => {
            await loadAll();
            // Refresh the resModal data from updated reservations state
            setResModal((prev) => {
              if (!prev) return null;
              return reservations.find((r) => r.id === prev.id) || prev;
            });
          }}
        />
      )}

      {orderModal && (
        <OrderEditorModal
          reservation={orderModal.reservation}
          attendee={orderModal.attendee}
          existingOrder={orderModal.existingOrder}
          menuItems={menuItems}
          onClose={() => setOrderModal(null)}
          onRefresh={loadAll}
        />
      )}

      {seatModal && (
        <SeatAssignModal
          seat={seatModal.seat}
          unassigned={seatModal.unassigned}
          onClose={() => setSeatModal(null)}
          onRefresh={loadAll}
        />
      )}
    </div>
  );
}
