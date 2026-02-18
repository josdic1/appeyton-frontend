import React, { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { Clock, Users, Utensils, CheckCircle } from "lucide-react";

export function KitchenDisplayPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculates minutes elapsed since the ticket hit the kitchen [cite: 2026-02-18]
  const getWaitTime = (firedAt) => {
    if (!firedAt) return "0m";
    const diff = Math.floor((new Date() - new Date(firedAt)) / 60000);
    return `${diff}m`;
  };

  const fetchActiveOrders = () => {
    api
      .get("/api/ops/orders/active")
      .then(setOrders)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return (
      <div style={{ padding: 40, color: "white" }}>
        Loading Kitchen Command...
      </div>
    );

  return (
    <div style={kdsLayout}>
      <header style={kdsHeader}>
        <h1 style={{ margin: 0, fontWeight: 900 }}>KITCHEN COMMAND</h1>
        <div style={statsStyle}>{orders.length} ACTIVE TABLES</div>
      </header>

      <div style={ticketGrid}>
        {orders.map((order) => (
          <div key={order.id} style={orderTicket}>
            <div style={ticketHeader}>
              <div style={tableNum}>
                TBL {order.reservation?.table?.table_number || "??"}
              </div>
              <div style={timeElapsed}>
                <Clock size={12} /> {getWaitTime(order.reservation?.fired_at)}
              </div>
            </div>

            <div style={guestList}>
              {order.items_by_guest.map((guestGroup) => (
                <div key={guestGroup.attendee_id} style={guestBlock}>
                  <div style={guestName}>{guestGroup.name}</div>
                  {guestGroup.items.map((item) => (
                    <div key={item.id} style={dishRow}>
                      <span>
                        {item.quantity}x {item.menu_item.name}
                      </span>
                      {item.special_instructions && (
                        <div style={instructions}>
                          !! {item.special_instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button
              style={completeBtn}
              onClick={() => {
                /* Add 'Ready' logic here */
              }}
            >
              MARK AS READY <CheckCircle size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// STYLES (Kept from your original)
const kdsLayout = {
  padding: 20,
  background: "#000",
  minHeight: "100vh",
  color: "#fff",
};
const kdsHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  borderBottom: "2px solid #333",
  paddingBottom: 15,
};
const ticketGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: 20,
};
const orderTicket = {
  background: "#1a1a1a",
  borderRadius: 12,
  border: "1px solid #333",
  display: "flex",
  flexDirection: "column",
};
const ticketHeader = {
  padding: 15,
  background: "var(--primary)",
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const tableNum = { fontSize: "1.4rem", fontWeight: 900 };
const timeElapsed = {
  fontSize: "0.8rem",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  gap: 4,
};
const guestBlock = { padding: "10px 15px", borderBottom: "1px solid #222" };
const guestName = {
  fontSize: "0.7rem",
  fontWeight: 800,
  color: "var(--primary)",
  textTransform: "uppercase",
  marginBottom: 5,
};
const dishRow = { fontSize: "1rem", fontWeight: 500, marginBottom: 4 };
const instructions = {
  fontSize: "0.75rem",
  color: "#ff9800",
  fontStyle: "italic",
  marginTop: 2,
};
const completeBtn = {
  margin: 15,
  padding: 12,
  borderRadius: 8,
  border: "none",
  background: "#2e7d32",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  gap: 8,
};
const statsStyle = {
  background: "#333",
  padding: "5px 15px",
  borderRadius: 20,
  fontSize: "0.8rem",
  fontWeight: 800,
};
