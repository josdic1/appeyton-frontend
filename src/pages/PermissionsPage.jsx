import React, { useState, Fragment, useEffect } from "react";
import { useData } from "../hooks/useData";
import { useToastTrigger } from "../hooks/useToast";
import { api } from "../utils/api";
import {
  ShieldAlert,
  History,
  Activity,
  ShieldCheck,
  Lock,
} from "lucide-react";

// --- Configuration ---

const ENTITY_GROUPS = [
  {
    group: "Reservations",
    items: [
      { name: "Reservation", desc: "Main bookings and scheduling" },
      { name: "ReservationAttendee", desc: "Guest lists and dietary data" },
      { name: "ReservationMessage", desc: "Staff/Member internal chat" },
    ],
  },
  {
    group: "Operations",
    items: [
      { name: "MenuItem", desc: "Food and beverage inventory" },
      { name: "Order", desc: "Point-of-sale tickets" },
      { name: "DiningRoom", desc: "Physical room layouts" },
      { name: "Table", desc: "Table and seat mapping" },
    ],
  },
  {
    group: "System",
    items: [
      { name: "User", desc: "Authentication and credentials" },
      { name: "Member", desc: "Member CRM profiles" },
      { name: "AuditTrail", desc: "Security logs and history" },
    ],
  },
];

const COLORS = {
  all: { bg: "#064e3b", color: "#34d399", label: "FULL" },
  own: { bg: "#451a03", color: "#fbbf24", label: "OWN" },
  none: { bg: "#450a0a", color: "#f87171", label: "NONE" },
};

// --- Sub-Components ---

function AuditExplorer({ log, onClose }) {
  if (!log) return null;

  const diffs = [];
  const oldAcl = log.details?.old_snapshot || {};
  const newAcl = log.details?.new_snapshot || {};

  // Simple diffing engine
  Object.keys(newAcl).forEach((role) => {
    Object.keys(newAcl[role]).forEach((entity) => {
      Object.keys(newAcl[role][entity]).forEach((action) => {
        const o = oldAcl?.[role]?.[entity]?.[action];
        const n = newAcl[role][entity][action];
        if (o !== n) diffs.push({ role, entity, action, o: o || "none", n });
      });
    });
  });

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0 }}>Diff Explorer</h3>
          <button onClick={onClose} style={closeBtnStyle}>
            &times;
          </button>
        </div>
        <div style={{ padding: "20px" }}>
          {diffs.length > 0 ? (
            diffs.map((d, i) => (
              <div key={i} style={diffRowStyle}>
                <div style={diffPathStyle}>
                  {d.role} › {d.entity} › {d.action}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{ color: "#f87171", textDecoration: "line-through" }}
                  >
                    {d.o}
                  </span>
                  <span style={{ color: "#34d399", fontWeight: 900 }}>
                    {d.n}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ opacity: 0.5 }}>No logical changes detected.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export function PermissionsPage() {
  const [acl, setAcl] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeRole, setActiveRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const { setRefreshing, setSyncType } = useData();
  const { addToast } = useToastTrigger();

  const syncSecurity = async () => {
    try {
      const [aclRes, logsRes] = await Promise.all([
        api.get("/admin/permissions/matrix"),
        api.get("/admin/permissions/history"),
      ]);
      setAcl(aclRes);
      setLogs(logsRes || []);
    } catch (err) {
      addToast({
        status: "error",
        what: "Sync Failed",
        why: "Security server unreachable.",
      });
    }
  };

  useEffect(() => {
    syncSecurity();
  }, []);

  const cycle = (entity, action) => {
    const sequence = { all: "own", own: "none", none: "all" };
    const current = acl[activeRole][entity][action];
    const updated = { ...acl };
    updated[activeRole][entity][action] = sequence[current];
    setAcl(updated);
  };

  const saveLive = async () => {
    setSaving(true);
    setSyncType("security");
    setRefreshing(true);

    try {
      await api.post("/admin/permissions/matrix", acl);
      await syncSecurity();
      addToast({
        status: "success",
        what: "Matrix Deployed",
        why: "System-wide permissions have been updated.",
        how: "Users will see these changes on their next data refresh.",
      });
    } catch (err) {
      addToast({
        status: "error",
        what: "Deployment Failed",
        why: err.message,
      });
    } finally {
      setSaving(false);
      setRefreshing(false);
      setSyncType(null);
    }
  };

  if (!acl)
    return (
      <div style={loadingPageStyle}>
        <Activity className="animate-spin" /> Fetching Security Matrix...
      </div>
    );

  return (
    <div style={pageContainerStyle}>
      <header style={headerStyle}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Lock size={24} color="#818cf8" />
            <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900 }}>
              SECURITY KERNEL
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.5 }}>
            Audit-enforced access control list
          </p>
        </div>
        <button onClick={saveLive} disabled={saving} style={saveBtnStyle}>
          {saving ? "DEPLOYING..." : "DEPLOY CHANGES"}
        </button>
      </header>

      {/* Role Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["member", "staff", "admin"].map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            style={{
              ...tabStyle,
              background: activeRole === role ? "#818cf8" : "transparent",
              color: activeRole === role ? "#0f172a" : "#94a3b8",
            }}
          >
            {role.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Matrix */}
      <table style={tableStyle}>
        <thead>
          <tr style={tableHeaderStyle}>
            <th style={{ textAlign: "left", padding: "12px 20px" }}>ENTITY</th>
            <th>READ</th>
            <th>WRITE</th>
            <th>DELETE</th>
          </tr>
        </thead>
        <tbody>
          {ENTITY_GROUPS.map((group) => (
            <Fragment key={group.group}>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                <td colSpan={4} style={groupLabelStyle}>
                  {group.group}
                </td>
              </tr>
              {group.items.map((item) => (
                <tr key={item.name} style={rowStyle}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 800, color: "white" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: "0.65rem", opacity: 0.5 }}>
                      {item.desc}
                    </div>
                  </td>
                  {["read", "write", "delete"].map((action) => {
                    const val = acl[activeRole][item.name]?.[action] || "none";
                    return (
                      <td key={action} style={{ textAlign: "center" }}>
                        <button
                          onClick={() => cycle(item.name, action)}
                          style={{
                            ...cellBtnStyle,
                            background: COLORS[val].bg,
                            color: COLORS[val].color,
                            borderColor: COLORS[val].color,
                          }}
                        >
                          {COLORS[val].label}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>

      {/* Audit Log */}
      <section style={{ marginTop: 40 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <History size={18} />
          <h3 style={{ margin: 0, fontSize: "0.9rem" }}>DEPLOYMENT HISTORY</h3>
        </div>
        <div style={logContainerStyle}>
          {logs.map((log) => (
            <div key={log.id} style={logRowStyle}>
              <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
                <div style={logBadgeStyle}>ID {log.id}</div>
                <div style={{ fontWeight: 700 }}>
                  {new Date(log.created_at).toLocaleString()}
                </div>
                <div style={{ opacity: 0.5 }}>
                  User #{log.user_id} performed {log.action}
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(log)}
                style={exploreBtnStyle}
              >
                EXPLORE DIFF
              </button>
            </div>
          ))}
        </div>
      </section>

      {selectedLog && (
        <AuditExplorer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

// --- Styles ---

const pageContainerStyle = {
  minHeight: "100vh",
  background: "#0f172a",
  color: "#cbd5e1",
  padding: "40px",
  fontFamily: "'JetBrains Mono', monospace",
};
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "32px",
  alignItems: "center",
};
const saveBtnStyle = {
  background: "#818cf8",
  color: "#0f172a",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  fontWeight: 900,
  cursor: "pointer",
};
const tabStyle = {
  padding: "8px 16px",
  border: "1px solid #334155",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: "0.75rem",
};
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#1e293b",
  borderRadius: "8px",
  overflow: "hidden",
};
const tableHeaderStyle = {
  background: "#020617",
  fontSize: "0.6rem",
  color: "#64748b",
  textTransform: "uppercase",
};
const groupLabelStyle = {
  padding: "8px 20px",
  fontSize: "0.65rem",
  fontWeight: 900,
  color: "#818cf8",
  letterSpacing: "1px",
};
const rowStyle = { borderBottom: "1px solid #334155" };
const cellBtnStyle = {
  border: "1px solid",
  padding: "4px 10px",
  borderRadius: "4px",
  fontSize: "0.6rem",
  fontWeight: 900,
  cursor: "pointer",
  minWidth: "60px",
};
const logContainerStyle = {
  background: "#1e293b",
  borderRadius: "8px",
  border: "1px solid #334155",
};
const logRowStyle = {
  padding: "12px 20px",
  borderBottom: "1px solid #334155",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "0.8rem",
};
const logBadgeStyle = {
  background: "#334155",
  padding: "2px 6px",
  borderRadius: "4px",
  fontSize: "0.65rem",
};
const exploreBtnStyle = {
  background: "transparent",
  border: "1px solid #334155",
  color: "#818cf8",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.6rem",
  fontWeight: 900,
  cursor: "pointer",
};
const loadingPageStyle = {
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0f172a",
  color: "white",
  gap: 15,
};

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  zIndex: 11000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const modalContentStyle = {
  background: "#1e293b",
  borderRadius: "12px",
  width: "500px",
  border: "1px solid #334155",
  color: "white",
};
const modalHeaderStyle = {
  padding: "15px 20px",
  borderBottom: "1px solid #334155",
  display: "flex",
  justifyContent: "space-between",
};
const closeBtnStyle = {
  background: "none",
  border: "none",
  color: "white",
  fontSize: "1.5rem",
  cursor: "pointer",
};
const diffRowStyle = {
  background: "#0f172a",
  padding: "12px",
  borderRadius: "6px",
  marginBottom: "8px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const diffPathStyle = {
  fontSize: "0.7rem",
  color: "#818cf8",
  fontWeight: 900,
  textTransform: "uppercase",
};
