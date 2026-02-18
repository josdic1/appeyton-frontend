import React, { useState, useEffect } from "react";
import { api } from "../../utils/api";
import { User, Plus, Loader2 } from "lucide-react";
import { useToastTrigger } from "../../hooks/useToast";

export function OrderManager({ reservation }) {
  const [activeTab, setActiveTab] = useState(
    reservation.attendees[0]?.id || null,
  );
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { addToast } = useToastTrigger();

  useEffect(() => {
    // Calls the grouped endpoint to fix the "wall of buttons" issue [cite: 2026-02-18]
    api
      .get("/api/menu-items/grouped")
      .then((data) => {
        setMenu(data);
        setLoading(false);
      })
      .catch(() =>
        addToast({
          type: "error",
          title: "Error",
          message: "Failed to load menu.",
        }),
      );
  }, [addToast]);

  const addItemToOrder = async (item) => {
    if (!activeTab) return;
    setProcessing(true);
    try {
      await api.post(`/api/orders`, {
        reservation_id: reservation.id,
        items: [
          {
            menu_item_id: item.id,
            reservation_attendee_id: activeTab, // Link dish to specific guest [cite: 2026-02-18]
            quantity: 1,
          },
        ],
      });
      addToast({
        type: "success",
        title: "Added",
        message: `${item.name} for guest.`,
      });
    } catch (err) {
      addToast({ type: "error", title: "Order Failed", message: err.message });
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div style={centerStyle}>
        <Loader2 className="animate-spin" /> Loading Menu...
      </div>
    );

  return (
    <div style={layoutStyle}>
      <div style={sidebarStyle}>
        {reservation.attendees.map((a) => (
          <button
            key={a.id}
            onClick={() => setActiveTab(a.id)}
            style={{
              ...tabStyle,
              background: activeTab === a.id ? "var(--primary)" : "transparent",
            }}
          >
            <User size={14} /> {a.name}
          </button>
        ))}
      </div>
      <div style={menuAreaStyle}>
        {Object.entries(menu).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 24 }}>
            <h3 style={catHeader}>{category}</h3>
            <div style={menuGrid}>
              {items.map((item) => (
                <div key={item.id} style={menuCard}>
                  <div>
                    <div style={itemName}>{item.name}</div>
                    <div style={itemPrice}>${item.price}</div>
                  </div>
                  <button
                    style={addBtn}
                    disabled={processing}
                    onClick={() => addItemToOrder(item)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  gap: 20,
  height: "100%",
};
const sidebarStyle = {
  borderRight: "1px solid var(--border)",
  paddingRight: 10,
};
const menuAreaStyle = {
  overflowY: "auto",
  maxHeight: "500px",
  paddingRight: 10,
};
const menuGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 12,
};
const menuCard = {
  background: "var(--panel-2)",
  padding: 12,
  borderRadius: 10,
  border: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const catHeader = {
  fontSize: "0.65rem",
  textTransform: "uppercase",
  color: "var(--primary)",
  letterSpacing: "1px",
  marginBottom: 10,
  borderBottom: "1px solid var(--border)",
  paddingBottom: 4,
};
const itemName = { fontWeight: 700, fontSize: "0.85rem" };
const itemPrice = { fontSize: "0.8rem", color: "var(--success)" };
const addBtn = {
  background: "var(--primary)",
  border: "none",
  borderRadius: 6,
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "white",
};
const tabStyle = {
  width: "100%",
  padding: "10px 12px",
  textAlign: "left",
  border: "none",
  cursor: "pointer",
  color: "white",
  display: "flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 8,
  marginBottom: 4,
};
const centerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "200px",
  gap: 10,
  color: "var(--muted)",
};
