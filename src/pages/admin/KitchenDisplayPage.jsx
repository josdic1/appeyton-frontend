import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../utils/api";
import { safe } from "../../utils/safe";
import { useToastTrigger } from "../../hooks/useToast";
import { Clock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

/**
 * KitchenDisplayPage (KDS)
 * Real-time dashboard for kitchen staff to manage active prep tickets.
 */
export function KitchenDisplayPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastTrigger();

  // Polling logic for real-time updates
  const fetchActiveOrders = useCallback(async () => {
    try {
      const data = await api.get("/ops/orders/active");
      setOrders(safe.array(data));
    } catch (err) {
      console.error("KDS Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 15000); // Snappier 15s refresh
    return () => clearInterval(interval);
  }, [fetchActiveOrders]);

  const handleMarkReady = async (orderId, tableNum) => {
    try {
      await api.patch(`/orders/${orderId}`, { status: "ready" });

      addToast({
        status: "success",
        what: `Table ${tableNum} Ready`,
        why: "The kitchen has finished prep for this order.",
        how: "A notification has been sent to the floor staff for pickup.",
        who: "Kitchen Command",
      });

      // Optimistic UI update: remove from active list immediately
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      addToast({ status: "error", what: "Update Failed", why: err.message });
    }
  };

  const getWaitTimeData = (firedAt) => {
    if (!firedAt) return { mins: 0, color: "#fff" };
    const mins = Math.floor((new Date() - new Date(firedAt)) / 60000);
    let color = "#fff";
    if (mins > 15) color = "#f97316"; // Warning
    if (mins > 25) color = "#ef4444"; // Critical
    return { mins, color };
  };

  if (loading && orders.length === 0) {
    return (
      <div style={loadingContainer}>
        <Loader2 className="animate-spin" size={48} />
        <h2 style={{ marginTop: 20 }}>Initializing Kitchen Command...</h2>
      </div>
    );
  }

  return (
    <div style={kdsLayout}>
      <header style={kdsHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <h1
            style={{
              margin: 0,
              fontWeight: 900,
              fontSize: "2rem",
              letterSpacing: "-1.5px",
            }}
          >
            KITCHEN COMMAND
          </h1>
          <div style={statsBadge}>{orders.length} ACTIVE TICKETS</div>
        </div>
        <div style={clockStyle}>
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </header>

      <div style={ticketGrid}>
        {orders.length === 0 ? (
          <div style={emptyKDSStyle}>KITCHEN CLEAR — NO ACTIVE ORDERS</div>
        ) : (
          orders.map((order) => {
            const waitData = getWaitTimeData(order.reservation?.fired_at);
            const tableNum = order.reservation?.table?.table_number || "??";

            return (
              <div
                key={order.id}
                style={{
                  ...orderTicket,
                  borderColor: waitData.mins > 20 ? "#ef4444" : "#333",
                }}
              >
                <div
                  style={{
                    ...ticketHeader,
                    background:
                      waitData.color === "#fff" ? "#eb5638" : waitData.color,
                  }}
                >
                  <div style={tableNumStyle}>TBL {tableNum}</div>
                  <div
                    style={{
                      ...timeElapsed,
                      color: waitData.color === "#fff" ? "#fff" : "#000",
                    }}
                  >
                    <Clock size={16} strokeWidth={3} /> {waitData.mins}m
                  </div>
                </div>

                <div style={guestListScroll}>
                  {safe.array(order.items_by_guest).map((guestGroup) => (
                    <div key={guestGroup.attendee_id} style={guestBlock}>
                      <div style={guestNameStyle}>{guestGroup.name}</div>
                      {safe.array(guestGroup.items).map((item) => (
                        <div key={item.id} style={dishRow}>
                          <span style={qtyStyle}>{item.quantity}x</span>
                          <span style={itemNameStyle}>
                            {item.menu_item?.name}
                          </span>
                          {item.special_instructions && (
                            <div style={instructionBox}>
                              <AlertTriangle size={12} />{" "}
                              {item.special_instructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <button
                  style={completeBtn}
                  onClick={() => handleMarkReady(order.id, tableNum)}
                >
                  MARK READY <CheckCircle size={18} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- Styles ---

const kdsLayout = {
  padding: 25,
  background: "#000",
  minHeight: "100vh",
  color: "#fff",
  fontFamily: "system-ui, sans-serif",
};
const kdsHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 30,
  borderBottom: "4px solid #222",
  paddingBottom: 20,
};
const statsBadge = {
  background: "#333",
  padding: "6px 16px",
  borderRadius: "4px",
  fontSize: "0.9rem",
  fontWeight: 900,
};
const clockStyle = { fontSize: "1.5rem", fontWeight: 900, opacity: 0.5 };
const ticketGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: 25,
  alignItems: "start",
};
const orderTicket = {
  background: "#111",
  borderRadius: 12,
  border: "2px solid #333",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
};
const ticketHeader = {
  padding: "15px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  transition: "background 0.5s",
};
const tableNumStyle = { fontSize: "1.8rem", fontWeight: 900, color: "#fff" };
const timeElapsed = {
  fontSize: "1.2rem",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  gap: 6,
};
const guestListScroll = { flex: 1, maxHeight: "500px", overflowY: "auto" };
const guestBlock = { padding: "15px 20px", borderBottom: "1px solid #222" };
const guestNameStyle = {
  fontSize: "0.75rem",
  fontWeight: 900,
  color: "#eb5638",
  textTransform: "uppercase",
  marginBottom: 8,
  letterSpacing: "1px",
};
const dishRow = {
  marginBottom: 12,
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: 10,
  alignItems: "start",
};
const qtyStyle = {
  fontWeight: 900,
  fontSize: "1.1rem",
  color: "#fff",
  background: "#333",
  padding: "2px 6px",
  borderRadius: "4px",
};
const itemNameStyle = { fontSize: "1.1rem", fontWeight: 600, color: "#ddd" };
const instructionBox = {
  gridColumn: "2",
  fontSize: "0.85rem",
  color: "#f97316",
  fontWeight: 700,
  marginTop: 4,
  display: "flex",
  alignItems: "center",
  gap: 5,
  background: "rgba(249, 115, 22, 0.1)",
  padding: "4px 8px",
  borderRadius: "4px",
};
const completeBtn = {
  margin: 20,
  padding: 18,
  borderRadius: 8,
  border: "none",
  background: "#16a34a",
  color: "#fff",
  fontWeight: 900,
  fontSize: "1rem",
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  gap: 10,
  textTransform: "uppercase",
};
const emptyKDSStyle = {
  gridColumn: "1 / -1",
  textAlign: "center",
  padding: "100px",
  fontSize: "2rem",
  fontWeight: 900,
  opacity: 0.2,
  letterSpacing: "4px",
};
const loadingContainer = {
  height: "100vh",
  background: "#000",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
};
