import { useState, useEffect } from "react";
import { api } from "../../utils/api";
import { safe } from "../../utils/safe";
import {
  User,
  Plus,
  Loader2,
  Utensils,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useToastTrigger } from "../../hooks/useToast";

/**
 * OrderManager: Sterling Seat-Based Ordering Interface.
 * Maps menu items directly to reservation_attendee_id (the "seat").
 */
export function OrderManager({ reservation }) {
  const [activeTab, setActiveTab] = useState(null);
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { addToast } = useToastTrigger();

  // 1. Defend against missing reservation data
  if (!reservation || !reservation.id) {
    return (
      <div style={centerStyle}>
        <AlertCircle size={32} color="#eb5638" />
        <span style={{ fontWeight: 900 }}>RESERVATION DATA MISSING</span>
      </div>
    );
  }

  // 2. Initial Setup: Select first guest and load menu
  useEffect(() => {
    // Default to first guest if nothing is selected
    if (reservation?.attendees?.length > 0 && !activeTab) {
      setActiveTab(reservation.attendees[0].id);
    }

    const fetchMenu = async () => {
      try {
        const res = await api.get("/menu-items/grouped");
        // API standardization: handle { data: [...] } or direct arrays
        const rawMenu = res.data?.data || res.data || res;
        setMenu(rawMenu || {});
      } catch (err) {
        console.error("Menu fetch error:", err);
        addToast({
          status: "error",
          what: "Menu Sync Failed",
          why: "Check server connection.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [reservation, activeTab, addToast]);

  // 3. Post order to backend
  const addItemToOrder = async (item) => {
    if (!activeTab) {
      return addToast({
        status: "error",
        what: "Seat Missing",
        why: "Please select a guest first.",
      });
    }

    setProcessing(true);
    const activeGuest = reservation.attendees.find((a) => a.id === activeTab);

    try {
      // POST payload matches typical REST relationship requirements
      await api.post(`/orders`, {
        reservation_id: reservation.id,
        items: [
          {
            menu_item_id: item.id,
            reservation_attendee_id: activeTab,
            quantity: 1,
          },
        ],
      });

      addToast({
        status: "success",
        what: "Kitchen Notified",
        why: `${item.name} added for ${activeGuest?.name || "Guest"}.`,
      });
    } catch (err) {
      console.error("Order error:", err.response?.data);
      addToast({
        status: "error",
        what: "Order Failed",
        why: "Server could not process item.",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div style={centerStyle}>
        <Loader2 className="animate-spin" size={32} />
        <span style={{ fontWeight: 900, textTransform: "uppercase" }}>
          Hailing Digital Menu...
        </span>
      </div>
    );

  return (
    <div style={layoutStyle}>
      {/* SEAT SELECTION SIDEBAR */}
      <aside style={sidebarStyle}>
        <div style={sidebarLabel}>GUEST SEATS</div>
        {safe.array(reservation?.attendees).map((a) => (
          <button
            key={a.id}
            onClick={() => setActiveTab(a.id)}
            style={{
              ...tabStyle,
              background: activeTab === a.id ? "#000" : "transparent",
              color: activeTab === a.id ? "#fff" : "#000",
              border:
                activeTab === a.id ? "2px solid #000" : "2px solid transparent",
            }}
          >
            <User size={14} />
            <span style={nameTruncate}>{a.name}</span>
            {activeTab === a.id && (
              <CheckCircle size={12} style={{ marginLeft: "auto" }} />
            )}
          </button>
        ))}
      </aside>

      {/* MENU GRID */}
      <div style={menuAreaStyle}>
        {Object.entries(menu).length === 0 ? (
          <div style={centerStyle}>
            Kitchen is currently closed or menu is empty.
          </div>
        ) : (
          Object.entries(menu).map(([category, items]) => (
            <section key={category} style={{ marginBottom: 48 }}>
              <h3 style={catHeaderStyle}>
                <Utensils size={14} /> {category}
              </h3>
              <div style={menuGridStyle}>
                {safe.array(items).map((item) => (
                  <div key={item.id} style={menuCardStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={itemNameStyle}>{item.name}</div>
                      <div style={itemPriceStyle}>
                        ${parseFloat(item.price).toFixed(2)}
                      </div>
                    </div>
                    <button
                      style={addBtnStyle}
                      disabled={processing}
                      onClick={() => addItemToOrder(item)}
                      aria-label={`Order ${item.name}`}
                    >
                      {processing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Plus size={18} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

// --- Styles (Sterling Neo-Brutalist Standards) ---

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "220px 1fr",
  gap: 40,
  height: "100%",
  minHeight: "500px",
};
const sidebarStyle = {
  borderRight: "2px solid #000",
  paddingRight: 20,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const sidebarLabel = {
  fontSize: "0.65rem",
  fontWeight: 900,
  color: "#999",
  letterSpacing: "2px",
  marginBottom: 12,
};
const menuAreaStyle = {
  overflowY: "auto",
  maxHeight: "650px",
  paddingRight: 15,
};
const menuGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 20,
};

const menuCardStyle = {
  background: "#fff",
  padding: "20px",
  border: "2px solid #000",
  boxShadow: "4px 4px 0px #000",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  transition: "transform 0.1s ease",
};

const catHeaderStyle = {
  fontSize: "0.85rem",
  textTransform: "uppercase",
  color: "#eb5638",
  letterSpacing: "2px",
  marginBottom: 20,
  borderBottom: "4px solid #000",
  paddingBottom: 8,
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 900,
};

const itemNameStyle = { fontWeight: 900, fontSize: "0.95rem" };
const itemPriceStyle = {
  fontSize: "0.85rem",
  color: "#666",
  fontWeight: 700,
  marginTop: 4,
};

const addBtnStyle = {
  background: "#000",
  border: "none",
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#fff",
};

const tabStyle = {
  width: "100%",
  padding: "14px",
  textAlign: "left",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 12,
  fontWeight: 900,
  fontSize: "0.75rem",
  textTransform: "uppercase",
};

const nameTruncate = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const centerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "300px",
  gap: 16,
};
