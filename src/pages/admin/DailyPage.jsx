// src/pages/admin/DailyPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { api } from "../../utils/api";
import {
  Calendar,
  Users,
  Utensils,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  StickyNote,
  MapPin,
  Printer,
  ChefHat,
} from "lucide-react";

// ─── HELPER: PRINT KITCHEN CHIT ─────────────────────────────────────
const printKitchenTicket = (res) => {
  const win = window.open("", "", "width=400,height=600");

  // Basic receipt HTML structure
  const html = `
    <html>
      <head>
        <title>Kitchen Ticket #${res.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; width: 300px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .h1 { font-size: 1.5rem; font-weight: 900; margin: 0; }
          .meta { font-size: 1.1rem; font-weight: 700; margin: 5px 0; display: flex; justify-content: space-between; }
          .item { display: flex; margin-bottom: 8px; font-size: 1.1rem; }
          .qty { font-weight: 900; width: 40px; }
          .name { font-weight: 700; flex: 1; }
          .mods { font-size: 0.9rem; font-style: italic; margin-left: 40px; }
          .notes { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: 700; }
          @media print { @page { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="h1">TABLE ${res.table ? res.table.table_number : "TBD"}</div>
          <div>${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="meta">
          <span>Chk #${res.id}</span>
          <span>${res.attendees.length} gs</span>
        </div>
        <div class="meta">
          <span>Server: Staff</span> 
        </div>
        <hr/>
        <div id="items">
          ${res.attendees
            .map((att) => {
              // Mocking items if no real order exists yet for demo
              const diet = att.dietary_restrictions
                ? `(Dietary: ${att.dietary_restrictions.note || "Yes"})`
                : "";
              return `
               <div class="item">
                 <div class="qty">1</div>
                 <div class="name">Guest: ${att.name} ${diet}</div>
               </div>
             `;
            })
            .join("")}
        </div>
        ${res.notes ? `<div class="notes">NOTES: ${res.notes}</div>` : ""}
      </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 250);
};

// ─── HELPER COMPONENTS ──────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div
      className="stat-card"
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px",
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: `${color}20`,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={24} />
      </div>
      <div>
        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--muted)",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1 }}>
          {value}
        </div>
        {sub && (
          <div
            style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 4 }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    confirmed: "var(--success)",
    seated: "var(--primary)",
    cancelled: "var(--danger)",
    pending: "var(--warning)",
  };
  return (
    <span
      style={{
        fontSize: "0.7rem",
        fontWeight: 800,
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: "12px",
        background: `${colors[status] || "gray"}20`,
        color: colors[status] || "gray",
        border: `1px solid ${colors[status] || "gray"}40`,
      }}
    >
      {status}
    </span>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────

export function DailyPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("");

  // ── Fetch Data ─────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/ops/reservations?date=${date}`);
      setReservations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  // ── Computed Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = reservations.filter((r) => r.status !== "cancelled");
    const totalCovers = active.reduce(
      (acc, r) => acc + (r.party_size || r.attendees.length),
      0,
    );
    const members = active.filter((r) =>
      r.attendees.some((a) => a.attendee_type === "member"),
    ).length;
    const dietaryCount = active.reduce(
      (acc, r) =>
        acc + r.attendees.filter((a) => a.dietary_restrictions).length,
      0,
    );

    // Group by hour for "Pacing" graph
    const pacing = {};
    active.forEach((r) => {
      const hour = r.start_time.split(":")[0];
      pacing[hour] = (pacing[hour] || 0) + (r.party_size || r.attendees.length);
    });

    return { totalCovers, members, dietaryCount, pacing, count: active.length };
  }, [reservations]);

  const selectedRes = reservations.find((r) => r.id === selectedId);

  // ── Handlers ───────────────────────────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;
    await api.patch(`/api/reservations/${id}`, { status: newStatus });
    loadData();
  };

  const handleNoteUpdate = async (id, newNote) => {
    await api.patch(`/api/reservations/${id}`, { notes: newNote });
    loadData();
  };

  return (
    <>
      {/* ── CSS FOR PRINTING ── */}
      <style>{`
        @media print {
          /* Hide UI Chrome */
          [data-ui="navbar"], [data-ui="btn-refresh"], .no-print, input, textarea { display: none !important; }
          
          /* Reset Layout for Paper */
          body, #root, .app-shell, .app-main { 
            height: auto !important; 
            overflow: visible !important; 
            display: block !important;
            background: white !important;
            color: black !important;
          }
          
          /* Hide the Right Column (Detail View) on Summary Print */
          .detail-view { display: none !important; }
          
          /* Expand the List View to Full Width */
          .list-view { 
            width: 100% !important; 
            border: none !important;
            overflow: visible !important;
          }

          /* Stat Cards Styling Fix for Print */
          .stat-card { border: 1px solid #000 !important; box-shadow: none !important; }
          
          /* Ensure text is black */
          * { color: #000 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div
        style={{
          height: "calc(100vh - 60px)",
          display: "grid",
          gridTemplateRows: "auto 1fr",
          background: "var(--bg)",
          overflow: "hidden",
        }}
      >
        {/* ── HEADER & STATS ── */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--panel)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h1 data-ui="title" style={{ fontSize: "1.8rem" }}>
                Daily Command Center
              </h1>
              <div data-ui="subtitle">
                Operations overview for{" "}
                {new Date(date).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }} className="no-print">
              {/* DATE PICKER */}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-ui="input"
                style={{ padding: "8px 12px", fontSize: "1rem" }}
              />
              {/* PRINT BUTTON */}
              <button
                onClick={() => window.print()}
                data-ui="btn"
                style={{
                  background: "var(--black)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Printer size={16} /> Print Briefing
              </button>
              {/* REFRESH BUTTON */}
              <button onClick={loadData} data-ui="btn-refresh">
                <Clock size={16} /> Refresh
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <StatCard
              label="Total Covers"
              value={stats.totalCovers}
              sub={`${stats.count} Active Reservations`}
              icon={Users}
              color="#3b82f6"
            />
            <StatCard
              label="Member Tables"
              value={stats.members}
              sub={`${Math.round((stats.members / stats.count || 0) * 100)}% of total`}
              icon={Utensils}
              color="#10b981"
            />
            <StatCard
              label="Dietary Alerts"
              value={stats.dietaryCount}
              sub="Special handling req."
              icon={AlertCircle}
              color="#ef4444"
            />

            {/* Pacing Graph */}
            <div
              style={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                flex: 2,
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Covers Pacing (Guests / Hr)
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  height: "100%",
                  gap: "4px",
                }}
              >
                {[
                  "11",
                  "12",
                  "13",
                  "14",
                  "15",
                  "16",
                  "17",
                  "18",
                  "19",
                  "20",
                  "21",
                ].map((hour) => {
                  const count = stats.pacing[hour] || 0;
                  const height = Math.min(100, (count / 20) * 100);
                  return (
                    <div
                      key={hour}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          background:
                            count > 0 ? "var(--primary)" : "var(--border)",
                          height: `${Math.max(4, height)}%`,
                          borderRadius: "2px",
                          opacity: count > 0 ? 1 : 0.3,
                        }}
                      />
                      <div
                        style={{ fontSize: "0.6rem", color: "var(--muted)" }}
                      >
                        {hour}:00
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "350px 1fr",
            overflow: "hidden",
          }}
        >
          {/* ── LEFT: RESERVATION LIST (Prints Full Width) ── */}
          <div
            className="list-view"
            style={{
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "var(--panel-2)",
            }}
          >
            <div
              className="no-print"
              style={{
                padding: "12px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: 10,
                    color: "var(--muted)",
                  }}
                />
                <input
                  placeholder="Search guest name..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px 8px 34px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {reservations
                .filter(
                  (r) =>
                    !filter ||
                    r.attendees.some((a) =>
                      a.name.toLowerCase().includes(filter.toLowerCase()),
                    ) ||
                    r.id.toString().includes(filter),
                )
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((r) => {
                  const mainGuest =
                    r.attendees.find((a) => a.attendee_type === "member") ||
                    r.attendees[0];
                  const hasDietary = r.attendees.some(
                    (a) => a.dietary_restrictions,
                  );
                  const isActive = selectedId === r.id;

                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        background: isActive ? "var(--panel)" : "transparent",
                        borderLeft: isActive
                          ? "4px solid var(--primary)"
                          : "4px solid transparent",
                        pageBreakInside: "avoid", // Keeps rows together when printing
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                          {r.start_time}
                        </span>
                        <div className="no-print">
                          <StatusBadge status={r.status} />
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text)",
                          marginBottom: 4,
                        }}
                      >
                        {mainGuest?.name || "Unknown Guest"}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          fontSize: "0.85rem",
                          color: "var(--muted)",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Users size={14} /> {r.attendees.length} ppl
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <MapPin size={14} />{" "}
                          {r.table
                            ? `Table ${r.table.table_number}`
                            : "Unassigned"}
                        </span>
                        {hasDietary && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              color: "var(--danger)",
                            }}
                          >
                            <AlertCircle size={14} /> Dietary
                          </span>
                        )}
                      </div>
                      {/* Only visible on print to show notes inline */}
                      {r.notes && (
                        <div
                          style={{
                            display: "none",
                            fontStyle: "italic",
                            marginTop: 8,
                            fontSize: "0.8rem",
                          }}
                          className="print-show"
                        >
                          Note: {r.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ── RIGHT: DETAIL EDITOR (Hidden on Print) ── */}
          <div
            className="detail-view"
            style={{
              overflowY: "auto",
              padding: "24px",
              background: "var(--bg)",
            }}
          >
            {selectedRes ? (
              <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                {/* Toolbar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "24px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      {selectedRes.attendees[0]?.name}
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        color: "var(--muted)",
                      }}
                    >
                      <span
                        style={{
                          background: "var(--panel)",
                          padding: "4px 8px",
                          borderRadius: 4,
                          border: "1px solid var(--border)",
                        }}
                      >
                        #{selectedRes.id}
                      </span>
                      <span>•</span>
                      <span>{selectedRes.meal_type.toUpperCase()}</span>
                      <span>•</span>
                      <span>
                        {selectedRes.start_time} - {selectedRes.end_time}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => printKitchenTicket(selectedRes)}
                      data-ui="btn"
                      style={{
                        background: "var(--black)",
                        color: "white",
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <ChefHat size={16} /> Send to Kitchen
                    </button>

                    {selectedRes.status !== "confirmed" && (
                      <button
                        onClick={() =>
                          handleStatusChange(selectedRes.id, "confirmed")
                        }
                        data-ui="btn"
                        style={{ background: "var(--success)" }}
                      >
                        Confirm
                      </button>
                    )}
                    {selectedRes.status !== "cancelled" && (
                      <button
                        onClick={() =>
                          handleStatusChange(selectedRes.id, "cancelled")
                        }
                        data-ui="btn-danger"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid Layout */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "24px",
                  }}
                >
                  {/* Column 1: Notes & Guests */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    {/* Notes Card */}
                    <div data-ui="card" style={{ padding: "20px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 12,
                          color: "var(--muted)",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          textTransform: "uppercase",
                        }}
                      >
                        <StickyNote size={16} /> Operation Notes
                      </div>
                      <textarea
                        defaultValue={selectedRes.notes || ""}
                        onBlur={(e) =>
                          handleNoteUpdate(selectedRes.id, e.target.value)
                        }
                        placeholder="Add notes for the staff (e.g. Anniversary, High Chair needed)..."
                        style={{
                          width: "100%",
                          minHeight: "100px",
                          padding: "12px",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          fontSize: "0.95rem",
                          lineHeight: 1.5,
                          resize: "vertical",
                        }}
                      />
                    </div>

                    {/* Guest List */}
                    <div data-ui="card">
                      <div
                        style={{
                          padding: "16px 20px",
                          borderBottom: "1px solid var(--border)",
                          background: "var(--panel-2)",
                          fontWeight: 700,
                        }}
                      >
                        Guest Manifest ({selectedRes.attendees.length})
                      </div>
                      {selectedRes.attendees.map((att, i) => (
                        <div
                          key={att.id}
                          style={{
                            padding: "12px 20px",
                            borderBottom: "1px solid var(--border-2)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600 }}>{att.name}</div>
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--muted)",
                              }}
                            >
                              {att.attendee_type}
                            </div>
                          </div>
                          {att.dietary_restrictions ? (
                            <div
                              style={{
                                color: "var(--danger)",
                                background: "#fee2e2",
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: "0.8rem",
                                fontWeight: 600,
                              }}
                            >
                              {typeof att.dietary_restrictions === "string"
                                ? att.dietary_restrictions
                                : att.dietary_restrictions.note}
                            </div>
                          ) : (
                            <span
                              style={{
                                color: "var(--muted)",
                                fontSize: "0.8rem",
                              }}
                            >
                              No dietary info
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Meta Info */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    <div data-ui="card" style={{ padding: "20px" }}>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--muted)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          marginBottom: 12,
                        }}
                      >
                        Assignment
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>
                          Table
                        </div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                          {selectedRes.table
                            ? selectedRes.table.table_number
                            : "None"}
                        </div>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>
                          Room
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {selectedRes.dining_room?.name || "Main Hall"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                }}
              >
                <div
                  style={{
                    background: "var(--panel)",
                    padding: "40px",
                    borderRadius: "50%",
                    marginBottom: "20px",
                  }}
                >
                  <Utensils size={64} opacity={0.2} />
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                  Select a reservation
                </div>
                <p>
                  Click on a booking from the left to view details and manage
                  it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
