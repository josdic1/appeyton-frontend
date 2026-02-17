import React, { useState, Fragment, useEffect } from "react";
import { useData } from "../hooks/useData";
import { useToastTrigger } from "../hooks/useToast";

// --- Helper Components & Logic ---

const ENTITY_GROUPS = [
  {
    group: "Reservations",
    items: [
      { name: "Reservation", desc: "Main bookings" },
      { name: "ReservationAttendee", desc: "Party guest list" },
      { name: "ReservationMessage", desc: "Staff/Member chat" },
    ],
  },
  {
    group: "Operations",
    items: [
      { name: "MenuItem", desc: "Food & Drinks" },
      { name: "Order", desc: "Customer tickets" },
      { name: "OrderItem", desc: "Specific ticket items" },
      { name: "DiningRoom", desc: "Room configuration" },
      { name: "Table", desc: "Table layout" },
    ],
  },
  {
    group: "System",
    items: [
      { name: "User", desc: "Auth accounts" },
      { name: "Member", desc: "Member profiles" },
      { name: "DailyStat", desc: "Analytics" },
      { name: "AuditTrail", desc: "Logs" },
    ],
  },
];

const COLORS = {
  all: { bg: "#064e3b", color: "#34d399", label: "Full" },
  own: { bg: "#451a03", color: "#fbbf24", label: "Own" },
  none: { bg: "#450a0a", color: "#f87171", label: "None" },
};

/**
 * Audit Explorer Modal
 * Compares snapshots and shows a clean list of what actually changed.
 */
function AuditExplorer({ log, onClose }) {
  if (!log) return null;

  const getAclDiff = (oldAcl, newAcl) => {
    const diffs = [];
    if (!oldAcl || !newAcl) return diffs;

    for (const role in newAcl) {
      for (const entity in newAcl[role]) {
        for (const action in newAcl[role][entity]) {
          const oldVal = oldAcl?.[role]?.[entity]?.[action];
          const newVal = newAcl[role][entity][action];
          if (oldVal !== newVal) {
            diffs.push({
              role,
              entity,
              action,
              oldVal: oldVal || "none",
              newVal,
            });
          }
        }
      }
    }
    return diffs;
  };

  const diffs = getAclDiff(
    log.details?.old_snapshot,
    log.details?.new_snapshot,
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 11000,
      }}
    >
      <div
        style={{
          background: "#1e293b",
          padding: "2rem",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflowY: "auto",
          border: "1px solid #334155",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ color: "white", margin: 0, fontSize: "1.2rem" }}>
              Change Explorer
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.75rem", margin: 0 }}>
              Log ID: {log.id}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "1.5rem",
            }}
          >
            &times;
          </button>
        </div>

        {diffs.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>
            No logical differences detected in this save.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {diffs.map((d, i) => (
              <div
                key={i}
                style={{
                  background: "#0f172a",
                  padding: "1rem",
                  borderRadius: "6px",
                  borderLeft: "4px solid #818cf8",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#818cf8",
                    fontWeight: "bold",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  {d.role} › {d.entity}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    color: "white",
                  }}
                >
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    {d.action}:
                  </span>
                  <span
                    style={{
                      color: "#f87171",
                      textDecoration: "line-through",
                      fontSize: "0.8rem",
                    }}
                  >
                    {d.oldVal}
                  </span>
                  <span style={{ color: "#64748b" }}>&rarr;</span>
                  <span
                    style={{
                      color: "#34d399",
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                    }}
                  >
                    {d.newVal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Page Component ---

export function PermissionsPage() {
  const [acl, setAcl] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeRole, setActiveRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const { setRefreshing, setSyncType } = useData();
  const { addToast } = useToastTrigger();

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [aclRes, logsRes] = await Promise.all([
        fetch("http://localhost:8080/api/admin/permissions/matrix", {
          headers,
        }),
        fetch("http://localhost:8080/api/admin/permissions/history", {
          headers,
        }),
      ]);

      if (aclRes.ok) setAcl(await aclRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
    } catch (err) {
      console.error("Failed to sync with backend", err);
      addToast({
        type: "error",
        title: "Sync Error",
        message: "Could not fetch security data.",
      });
    }
  };

  useEffect(() => {
    fetchData();
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
      const res = await fetch(
        "http://localhost:8080/api/admin/permissions/matrix",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(acl),
        },
      );

      if (res.ok) {
        await fetchData();
        addToast({
          type: "success",
          title: "Matrix Updated",
          message: "Permissions saved and audit log created.",
        });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to save");
      }
    } catch (err) {
      console.error(err);
      addToast({ type: "error", title: "Update Failed", message: err.message });
    } finally {
      setSaving(false);
      setRefreshing(false);
      setSyncType(null);
    }
  };

  if (!acl) {
    return (
      <div
        style={{
          padding: "2rem",
          color: "white",
          background: "#0f172a",
          minHeight: "100vh",
        }}
      >
        Loading security matrix...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#cbd5e1",
        padding: "2rem",
        fontFamily: "monospace",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "2rem",
          borderBottom: "1px solid #334155",
          paddingBottom: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.25rem", color: "white", margin: 0 }}>
            LIVE ACL MANAGER
          </h1>
          <p style={{ fontSize: "0.7rem", color: "#64748b" }}>
            Audit-enabled security dashboard
          </p>
        </div>
        <button
          onClick={saveLive}
          disabled={saving}
          style={{
            background: saving ? "#334155" : "#818cf8",
            color: "#0f172a",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: saving ? "not-allowed" : "pointer",
            border: "none",
            transition: "all 0.2s",
          }}
        >
          {saving ? "SAVING..." : "SAVE TO BACKEND"}
        </button>
      </header>

      {/* Role Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        {["member", "staff", "admin"].map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            style={{
              padding: "0.6rem 1rem",
              background: activeRole === role ? "#818cf8" : "transparent",
              color: activeRole === role ? "#0f172a" : "#cbd5e1",
              border: "1px solid #334155",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {role.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Matrix Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#1e293b",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#0f172a",
              color: "#64748b",
              fontSize: "0.65rem",
            }}
          >
            <th style={{ padding: "1rem", textAlign: "left" }}>ENTITY</th>
            <th style={{ padding: "1rem" }}>READ</th>
            <th style={{ padding: "1rem" }}>WRITE</th>
            <th style={{ padding: "1rem" }}>DELETE</th>
          </tr>
        </thead>
        <tbody>
          {ENTITY_GROUPS.map((group) => (
            <Fragment key={group.group}>
              <tr style={{ background: "#161e2e" }}>
                <td
                  colSpan={4}
                  style={{
                    padding: "0.5rem 1rem",
                    color: "#818cf8",
                    fontSize: "0.6rem",
                    fontWeight: "bold",
                  }}
                >
                  {group.group.toUpperCase()}
                </td>
              </tr>
              {group.items.map((item) => (
                <tr
                  key={item.name}
                  style={{ borderBottom: "1px solid #334155" }}
                >
                  <td style={{ padding: "1rem" }}>
                    <div style={{ color: "white", fontWeight: "bold" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#64748b" }}>
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
                            background: COLORS[val].bg,
                            color: COLORS[val].color,
                            border: `1px solid ${COLORS[val].color}44`,
                            padding: "4px 10px",
                            borderRadius: "4px",
                            fontSize: "0.65rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            width: "65px",
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

      {/* Security Audit Section */}
      <div style={{ marginTop: "3rem" }}>
        <h3 style={{ color: "white", fontSize: "1rem", marginBottom: "1rem" }}>
          RECENT SECURITY CHANGES
        </h3>
        <div
          style={{
            background: "#1e293b",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #334155",
          }}
        >
          {logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  borderBottom: "1px solid #334155",
                  padding: "0.8rem 0",
                  fontSize: "0.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ color: "#818cf8", fontWeight: "bold" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                  <span style={{ color: "#64748b" }}> — </span>
                  <strong style={{ color: "white" }}>
                    User #{log.user_id}
                  </strong>
                  <span style={{ color: "#94a3b8" }}> performed </span>
                  <span style={{ color: "#fbbf24", fontWeight: "bold" }}>
                    {log.action}
                  </span>
                </div>
                <div
                  style={{ display: "flex", gap: "1rem", alignItems: "center" }}
                >
                  <button
                    onClick={() => setSelectedLog(log)}
                    style={{
                      background: "transparent",
                      border: "1px solid #334155",
                      color: "#94a3b8",
                      fontSize: "0.6rem",
                      padding: "2px 8px",
                      cursor: "pointer",
                      borderRadius: "2px",
                    }}
                  >
                    EXPLORE DIFF
                  </button>
                  <div style={{ color: "#64748b", fontSize: "0.65rem" }}>
                    {log.ip_address || "unknown ip"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{ color: "#64748b", textAlign: "center", padding: "1rem" }}
            >
              No activity recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* --- Modals --- */}
      {selectedLog && (
        <AuditExplorer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
