import { useState, useEffect } from "react";
import { X, ChefHat, MessageSquare, Send, Lock, ArrowLeft } from "lucide-react";
import { api } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { OrderManager } from "../orders/OrderManager"; // Standard path

// ── SUB-COMPONENT: RESERVATION CHAT ──
export function ReservationChat({ res }) {
  const { user } = useAuth();
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState([]);
  const [isInternal, setIsInternal] = useState(false);
  const isStaff = user.role !== "member";

  const loadHistory = () =>
    api.get(`/api/reservation-messages/${res.id}`).then(setHistory);
  useEffect(() => {
    loadHistory();
  }, [res.id]);

  const send = async () => {
    if (!msg.trim()) return;
    await api.post(`/api/reservation-messages/${res.id}`, {
      message: msg,
      is_internal: isInternal,
    });
    setMsg("");
    setIsInternal(false);
    loadHistory();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "400px" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {history.map((m) => (
          <div
            key={m.id}
            style={{
              textAlign: m.sender_user_id === user.id ? "right" : "left",
              marginBottom: 12,
            }}
          >
            <div style={chatNameStyle}>
              {m.sender_user_id === user.id ? "You" : m.sender?.name || "Staff"}{" "}
              {m.is_internal && "🔒"}
            </div>
            <div
              style={{
                ...chatBubbleStyle,
                background: m.is_internal
                  ? "rgba(255,165,0,0.1)"
                  : m.sender_user_id === user.id
                    ? "var(--primary)"
                    : "var(--panel-2)",
                border: m.is_internal ? "1px solid var(--orange)" : "none",
                color:
                  m.sender_user_id === user.id && !m.is_internal
                    ? "white"
                    : "var(--text)",
              }}
            >
              {m.message}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        {isStaff && (
          <label style={internalToggleStyle}>
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            <Lock size={12} /> Staff Only Note
          </label>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            data-ui="input"
            placeholder="Message staff..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && send()}
          />
          <button
            onClick={send}
            data-ui="btn"
            style={{ background: "var(--primary)", color: "white" }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN EXPORT: DETAIL MODAL ──
export function ReservationDetailModal({ res, onClose, onEdit, onCancel }) {
  const [view, setView] = useState("details");

  if (!res) return null;

  const primaryName =
    res.attendees?.find((a) => a.attendee_type === "self")?.name ||
    res.attendees?.[0]?.name ||
    "Guest";

  return (
    <div
      style={modalOverlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <div style={{ fontWeight: 800 }}>
            {view === "details"
              ? "Visit Management"
              : view === "order"
                ? "Menu Selection"
                : "Messages"}
          </div>
          <button onClick={onClose} style={closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24, minHeight: "450px" }}>
          {view === "details" && (
            <>
              <div style={gridStyle}>
                <div>
                  <div style={lblStyle}>Primary</div>
                  <div style={valStyle}>{primaryName}</div>
                </div>
                <div>
                  <div style={lblStyle}>Table</div>
                  <div style={valStyle}>{res.table?.table_number || "TBD"}</div>
                </div>
                <div>
                  <div style={lblStyle}>Status</div>
                  <div style={{ ...valStyle, color: "var(--success)" }}>
                    {res.status?.toUpperCase()}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={manifestHeader}>
                  <div style={lblStyle}>Guest Manifest</div>
                  <button onClick={onEdit} style={textBtnStyle}>
                    + Edit Party
                  </button>
                </div>
                <div style={guestListStyle}>
                  {res.attendees?.map((att, i) => (
                    <div key={i} style={guestRowStyle}>
                      {att.name}{" "}
                      <small style={{ opacity: 0.5 }}>
                        ({att.attendee_type})
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              <div style={actionRow}>
                <button
                  onClick={() => setView("order")}
                  data-ui="btn"
                  style={foodBtn}
                >
                  <ChefHat size={16} /> Food
                </button>
                <button
                  onClick={() => setView("chat")}
                  data-ui="btn"
                  style={chatBtn}
                >
                  <MessageSquare size={16} /> Chat
                </button>
                <button onClick={onCancel} data-ui="btn-danger">
                  Cancel
                </button>
              </div>
            </>
          )}

          {view === "order" && (
            <div style={{ height: "100%" }}>
              <button
                onClick={() => setView("details")}
                style={{ ...textBtnStyle, marginBottom: 15 }}
              >
                <ArrowLeft size={14} /> Back to Details
              </button>
              <OrderManager reservation={res} />
            </div>
          )}

          {view === "chat" && (
            <div>
              <button
                onClick={() => setView("details")}
                style={{ ...textBtnStyle, marginBottom: 15 }}
              >
                <ArrowLeft size={14} /> Back to Details
              </button>
              <ReservationChat res={res} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── STYLES ──
const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 6000,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(5px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const modalContentStyle = {
  background: "var(--panel)",
  width: "min(950px, 95%)",
  borderRadius: 20,
  border: "1px solid var(--border)",
  overflow: "hidden",
};
const modalHeaderStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "var(--panel-2)",
};
const chatNameStyle = {
  fontSize: "0.65rem",
  color: "var(--muted)",
  fontWeight: 800,
  marginBottom: 2,
};
const chatBubbleStyle = {
  padding: "8px 14px",
  borderRadius: 12,
  display: "inline-block",
  maxWidth: "85%",
};
const internalToggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: "0.7rem",
  marginBottom: 8,
  color: "var(--orange)",
  cursor: "pointer",
  fontWeight: 800,
};
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 20,
  marginBottom: 24,
};
const lblStyle = {
  fontSize: "0.65rem",
  fontWeight: 900,
  color: "var(--muted)",
  textTransform: "uppercase",
};
const valStyle = { fontSize: "1rem", fontWeight: 700 };
const guestListStyle = {
  border: "1px solid var(--border)",
  borderRadius: 10,
  overflow: "hidden",
};
const guestRowStyle = {
  padding: "10px 14px",
  borderBottom: "1px solid var(--border-2)",
  background: "var(--panel-2)",
  fontSize: "0.9rem",
};
const actionRow = { display: "flex", gap: 10 };
const foodBtn = {
  background: "var(--orange)",
  color: "white",
  flex: 1,
  display: "flex",
  gap: 8,
  justifyContent: "center",
};
const chatBtn = {
  background: "var(--panel-2)",
  border: "1px solid var(--border)",
  flex: 1,
  display: "flex",
  gap: 8,
  justifyContent: "center",
};
const textBtnStyle = {
  background: "none",
  border: "none",
  color: "var(--primary)",
  fontWeight: 800,
  fontSize: "0.75rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 5,
};
const manifestHeader = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 8,
};
const closeBtn = {
  background: "none",
  border: "none",
  color: "var(--muted)",
  cursor: "pointer",
};
