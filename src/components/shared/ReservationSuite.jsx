import { useState, useEffect } from "react";
import {
  X,
  ChefHat,
  MessageSquare,
  Send,
  Lock,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { api } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { OrderManager } from "../orders/OrderManager";
import { safe } from "../../utils/safe";

/**
 * SUB-COMPONENT: RESERVATION CHAT
 * Standardizes messaging between members and staff.
 */
export function ReservationChat({ res }) {
  const { user } = useAuth();
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState([]);
  const [isInternal, setIsInternal] = useState(false);
  const isStaff = user?.role === "staff" || user?.role === "admin";

  const loadHistory = async () => {
    if (!res?.id) return;
    try {
      const response = await api.get(`/reservation-messages/${res.id}`);
      // Handle standard API wrapper if present
      const data = response.data?.data || response.data;
      setHistory(safe.array(data));
    } catch (err) {
      console.error("Chat sync failed:", err);
    }
  };

  useEffect(() => {
    loadHistory();
    const poll = setInterval(loadHistory, 10000);
    return () => clearInterval(poll);
  }, [res?.id]);

  const send = async () => {
    if (!msg.trim()) return;
    try {
      await api.post(`/reservation-messages/${res.id}`, {
        message: msg,
        is_internal: isInternal,
      });
      setMsg("");
      setIsInternal(false);
      loadHistory();
    } catch (err) {
      console.error("Message send failed");
    }
  };

  return (
    <div style={chatWrapperStyle}>
      <div style={messageListStyle}>
        {history.map((m) => {
          const isOwn = m.sender_user_id === user?.id;
          return (
            <div
              key={m.id}
              style={{ textAlign: isOwn ? "right" : "left", marginBottom: 16 }}
            >
              <div style={chatNameStyle}>
                {isOwn ? "You" : m.sender?.name || "Staff"}
                {m.is_internal && <Lock size={10} style={{ marginLeft: 4 }} />}
              </div>
              <div
                style={{
                  ...chatBubbleStyle,
                  background: m.is_internal
                    ? "rgba(235, 86, 56, 0.1)"
                    : isOwn
                      ? "#000"
                      : "#f5f5f5",
                  border: m.is_internal
                    ? "1px dashed #eb5638"
                    : "1px solid transparent",
                  color: isOwn && !m.is_internal ? "white" : "#000",
                }}
              >
                {m.message}
              </div>
            </div>
          );
        })}
      </div>

      <div style={inputAreaStyle}>
        {isStaff && (
          <label style={internalToggleStyle}>
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            <ShieldAlert size={12} /> Internal Note
          </label>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={inputFieldStyle}
            placeholder={
              isInternal ? "Add staff note..." : "Message concierge..."
            }
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send} style={sendBtnStyle}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MAIN EXPORT: RESERVATION DETAIL MODAL
 * A multi-view suite for guest management and communication.
 */
export function ReservationDetailModal({ res, onClose, onEdit, onCancel }) {
  const [view, setView] = useState("details");
  if (!res) return null;

  const attendees = safe.array(res.attendees);
  const primaryName =
    attendees.find((a) => a.is_primary)?.name || attendees[0]?.name || "Member";

  return (
    <div
      style={modalOverlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <div
            style={{
              fontWeight: 900,
              fontSize: "1.1rem",
              textTransform: "uppercase",
            }}
          >
            {view === "details"
              ? "Overview"
              : view === "order"
                ? "Menu"
                : "Chat"}
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 32, minHeight: "500px" }}>
          {view === "details" && (
            <div style={{ animation: "fadeIn 0.2s ease" }}>
              <div style={summaryGridStyle}>
                <div style={summaryItemStyle}>
                  <div style={lblStyle}>Member</div>
                  <div style={valStyle}>{primaryName}</div>
                </div>
                <div style={summaryItemStyle}>
                  <div style={lblStyle}>Table</div>
                  <div style={valStyle}>{res.table?.table_number || "TBD"}</div>
                </div>
                <div style={summaryItemStyle}>
                  <div style={lblStyle}>Status</div>
                  <div style={{ ...valStyle, color: "#eb5638" }}>
                    {res.status?.toUpperCase()}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <div style={manifestHeaderStyle}>
                  <div style={lblStyle}>
                    Party Manifest ({attendees.length})
                  </div>
                  <button onClick={onEdit} style={textBtnStyle}>
                    + Edit Guests
                  </button>
                </div>
                <div style={guestListStyle}>
                  {attendees.map((att, i) => (
                    <div key={att.id || i} style={guestRowStyle}>
                      <span style={{ fontWeight: 700 }}>{att.name}</span>
                      <span style={typeBadgeStyle}>{att.attendee_type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={actionRowStyle}>
                <button onClick={() => setView("order")} style={foodBtnStyle}>
                  <ChefHat size={18} /> Order Food
                </button>
                <button onClick={() => setView("chat")} style={chatBtnStyle}>
                  <MessageSquare size={18} /> Chat
                </button>
                <button onClick={onCancel} style={cancelBtnStyle}>
                  Cancel Visit
                </button>
              </div>
            </div>
          )}

          {view === "order" && (
            <div style={viewTransitionStyle}>
              <button onClick={() => setView("details")} style={backBtnStyle}>
                <ArrowLeft size={16} /> Back
              </button>
              <OrderManager reservation={res} />
            </div>
          )}

          {view === "chat" && (
            <div style={viewTransitionStyle}>
              <button onClick={() => setView("details")} style={backBtnStyle}>
                <ArrowLeft size={16} /> Back
              </button>
              <ReservationChat res={res} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Styles (Standardized for Sterling Identity) ---
const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 6000,
  background: "rgba(0,0,0,0.8)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const modalContentStyle = {
  background: "#fff",
  width: "min(800px, 95%)",
  borderRadius: 0,
  border: "4px solid #000",
  overflow: "hidden",
  boxShadow: "20px 20px 0px rgba(0,0,0,0.2)",
};
const modalHeaderStyle = {
  padding: "20px 32px",
  borderBottom: "2px solid #000",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const chatWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  height: "400px",
};
const messageListStyle = { flex: 1, overflowY: "auto", padding: "10px" };
const inputAreaStyle = { borderTop: "2px solid #000", paddingTop: 16 };
const inputFieldStyle = {
  flex: 1,
  padding: "12px",
  border: "2px solid #000",
  fontWeight: 700,
};
const chatNameStyle = {
  fontSize: "0.6rem",
  fontWeight: 900,
  textTransform: "uppercase",
  marginBottom: 4,
};
const chatBubbleStyle = {
  padding: "10px 16px",
  borderRadius: "4px",
  display: "inline-block",
  maxWidth: "85%",
  fontSize: "0.9rem",
  fontWeight: 600,
};
const internalToggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: "0.7rem",
  marginBottom: 10,
  color: "#eb5638",
  fontWeight: 900,
  cursor: "pointer",
};
const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 16,
  marginBottom: 32,
};
const summaryItemStyle = { border: "2px solid #000", padding: "16px" };
const lblStyle = {
  fontSize: "0.6rem",
  fontWeight: 900,
  textTransform: "uppercase",
  color: "#999",
};
const valStyle = { fontSize: "1rem", fontWeight: 900, marginTop: 4 };
const manifestHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};
const guestListStyle = { border: "2px solid #000" };
const guestRowStyle = {
  padding: "12px 20px",
  borderBottom: "1px solid #eee",
  display: "flex",
  justifyContent: "space-between",
};
const typeBadgeStyle = {
  fontSize: "0.6rem",
  fontWeight: 900,
  textTransform: "uppercase",
  opacity: 0.4,
};
const actionRowStyle = { display: "flex", gap: 12, marginTop: 24 };
const foodBtnStyle = {
  background: "#eb5638",
  color: "white",
  flex: 1,
  padding: "16px",
  border: "none",
  fontWeight: 900,
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  gap: 8,
};
const chatBtnStyle = {
  background: "#000",
  color: "white",
  flex: 1,
  padding: "16px",
  border: "none",
  fontWeight: 900,
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  gap: 8,
};
const cancelBtnStyle = {
  background: "none",
  color: "#ff4444",
  border: "none",
  fontWeight: 900,
  cursor: "pointer",
};
const textBtnStyle = {
  background: "none",
  border: "none",
  color: "#eb5638",
  fontWeight: 900,
  fontSize: "0.75rem",
  cursor: "pointer",
};
const backBtnStyle = {
  background: "none",
  border: "none",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginBottom: 15,
  cursor: "pointer",
};
const closeBtnStyle = { background: "none", border: "none", cursor: "pointer" };
const viewTransitionStyle = { animation: "fadeIn 0.3s ease" };
const sendBtnStyle = {
  background: "#000",
  color: "#fff",
  border: "none",
  width: "50px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
