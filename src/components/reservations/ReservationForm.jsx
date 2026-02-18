// src/components/reservations/ReservationForm.jsx
import { useState, useEffect } from "react";
import { api } from "../../utils/api";
import { X, RotateCcw } from "lucide-react"; // Import icons for better UX

// Hours of Operation
const MEAL_TYPES = [
  { value: "lunch", label: "Lunch", start: "11:00", end: "15:00" },
  { value: "dinner", label: "Dinner", start: "15:00", end: "19:00" },
];

const DIETARY_OPTIONS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Halal",
  "Kosher",
  "Nut allergy",
  "Dairy-free",
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ── Step progress bar ──────────────────────────────────────────
function Steps({ current, total }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 3,
            flex: 1,
            borderRadius: 2,
            background: i < current ? "var(--primary)" : "var(--border)",
            transition: "background 0.2s",
          }}
        />
      ))}
    </div>
  );
}

// ── Single attendee row (Fixed: Unlocked & Clearable) ─────────
function AttendeeRow({
  attendee,
  index,
  isFirst,
  onChange,
  onRemove,
  onClear,
}) {
  // Only lock if it's a saved member ID AND it's not the user editing the first row
  // We explicitly ALLOW editing even if it's a member_id, so you can fix typos.
  // We only disable if you strictly want to prevent changing saved member names.
  // Current decision: UNLOCKED to solve "asking for name" bug.
  const isLocked = false;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto",
        gap: 8,
        padding: "10px 12px",
        background: "var(--panel-2)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        alignItems: "end",
      }}
    >
      <div>
        <div style={microLabel}>
          {isFirst ? "Primary Guest (You)" : `Guest ${index}`}
        </div>
        <input
          data-ui="input"
          style={{
            padding: "8px 10px",
            width: "100%",
            background: isLocked ? "var(--panel)" : "var(--bg)",
            opacity: isLocked ? 0.7 : 1,
            cursor: isLocked ? "default" : "text",
          }}
          placeholder={isFirst ? "Your full name" : "Guest name"}
          value={attendee.name}
          disabled={isLocked}
          onChange={(e) => onChange(index - 1, "name", e.target.value)}
        />
      </div>
      <div>
        <div style={microLabel}>Dietary</div>
        <select
          data-ui="input"
          style={{ padding: "8px 10px", width: "100%" }}
          value={attendee.dietary_restrictions?.note || "None"}
          onChange={(e) =>
            onChange(
              index - 1,
              "dietary_restrictions",
              e.target.value === "None" ? null : { note: e.target.value },
            )
          }
        >
          {DIETARY_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {/* Actions: Clear for First Row, Remove for Others */}
      {isFirst ? (
        <button
          type="button"
          onClick={() => onClear(index - 1)}
          title="Clear this slot"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            borderRadius: "var(--radius-sm)",
            height: "35px",
            width: "35px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 1,
          }}
        >
          <RotateCcw size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onRemove(index - 1)}
          title="Remove guest"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--danger)",
            borderRadius: "var(--radius-sm)",
            height: "35px",
            width: "35px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 1,
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ── Table card ─────────────────────────────────────────────────
function TableCard({ table, selected, onSelect, takenTables }) {
  const isTaken = takenTables.includes(table.id);
  const isSelected = selected?.id === table.id;
  return (
    <button
      type="button"
      disabled={isTaken}
      onClick={() => !isTaken && onSelect(table)}
      style={{
        padding: 14,
        borderRadius: "var(--radius-sm)",
        textAlign: "left",
        cursor: isTaken ? "not-allowed" : "pointer",
        border: `2px solid ${isSelected ? "var(--primary)" : isTaken ? "var(--border)" : "var(--border-2)"}`,
        background: isSelected
          ? "rgba(43,108,176,0.15)"
          : isTaken
            ? "transparent"
            : "var(--panel-2)",
        opacity: isTaken ? 0.4 : 1,
        transition: "all 0.15s",
        color: "var(--text)",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
        Table {table.table_number}
        {isSelected && (
          <span style={{ marginLeft: 8, color: "var(--primary)" }}>✓</span>
        )}
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>
        {table.seat_count} seats
      </div>
      {isTaken && (
        <div
          style={{
            fontSize: 11,
            color: "var(--danger)",
            marginTop: 4,
            fontWeight: 700,
          }}
        >
          Unavailable
        </div>
      )}
    </button>
  );
}

// ── Summary row ────────────────────────────────────────────────
function SummaryRow({ label, value }) {
  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
    >
      <span style={{ color: "var(--muted)", minWidth: 80 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>
        {value || "—"}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
export function ReservationForm({
  onSubmit,
  onCancel,
  submitting,
  error,
  user,
}) {
  const [step, setStep] = useState(1);

  // Step 1
  const [date, setDate] = useState(todayStr());
  const [mealType, setMealType] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState([]);

  // Step 2
  const [tables, setTables] = useState([]);
  const [takenTables, setTakenTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loadingTables, setLoadingTables] = useState(false);

  // Step 3
  const [members, setMembers] = useState([]);
  const [attendees, setAttendees] = useState([
    {
      name: user?.name || "",
      attendee_type: "member",
      dietary_restrictions: null,
      member_id: user?.id,
      tempId: "self",
    },
  ]);

  // Step 4
  const [notes, setNotes] = useState("");

  // Sync user name if it loads late
  useEffect(() => {
    if (user?.name && attendees[0].tempId === "self" && !attendees[0].name) {
      setAttendees((prev) => [
        { ...prev[0], name: user.name, member_id: user.id },
        ...prev.slice(1),
      ]);
    }
  }, [user]);

  // Load rooms and members
  useEffect(() => {
    // Rooms
    api
      .get("/api/dining-rooms") // Use public endpoint
      .then((data) => {
        if (Array.isArray(data)) setRooms(data);
      })
      .catch(() => {});

    // Members
    api
      .get("/api/members")
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
      })
      .catch(() => console.error("Failed to load members"));
  }, []);

  // Load tables
  useEffect(() => {
    if (step !== 2 || !date || !mealType || !roomId) return;
    setLoadingTables(true);
    setSelectedTable(null);
    Promise.all([
      // Use the public endpoints we created
      api.get(`/api/dining-rooms/${roomId}/tables`),
      api.get(`/api/reservations/availability?date=${date}`),
    ])
      .then(([tableData, resData]) => {
        setTables(Array.isArray(tableData) ? tableData : []);
        const taken = (Array.isArray(resData) ? resData : [])
          .filter((r) => r.meal_type === mealType && r.status !== "cancelled")
          .map((r) => r.table_id);
        setTakenTables(taken);
      })
      .catch(() => setTables([]))
      .finally(() => setLoadingTables(false));
  }, [step, date, mealType, roomId]);

  // Attendee helpers
  const updateAttendee = (i, field, value) =>
    setAttendees((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)),
    );

  const addGuest = () => {
    // Fallback to 4 if table isn't selected yet, to prevent button hiding
    const capacity = selectedTable?.seat_count || 4;
    if (attendees.length < capacity) {
      setAttendees((prev) => [
        ...prev,
        {
          name: "",
          attendee_type: "guest",
          dietary_restrictions: null,
          tempId: Date.now(),
        },
      ]);
    }
  };

  const addMember = (member) => {
    const capacity = selectedTable?.seat_count || 4;

    // If the FIRST row is empty/default, replace it
    if (attendees.length === 1 && !attendees[0].name) {
      setAttendees([
        {
          name: member.name,
          attendee_type: member.relation
            ? member.relation.toLowerCase()
            : "member",
          dietary_restrictions: member.dietary_restrictions,
          member_id: member.id,
          tempId: `member-${member.id}`,
        },
      ]);
      return;
    }

    if (attendees.length >= capacity) return;
    if (attendees.find((a) => a.member_id === member.id)) return;

    setAttendees((prev) => [
      ...prev,
      {
        name: member.name,
        attendee_type: member.relation
          ? member.relation.toLowerCase()
          : "guest",
        dietary_restrictions: member.dietary_restrictions,
        member_id: member.id,
        tempId: `member-${member.id}`,
      },
    ]);
  };

  const removeGuest = (i) =>
    setAttendees((prev) => prev.filter((_, idx) => idx !== i));

  // Clears the first row without deleting it
  const clearFirstRow = () => {
    setAttendees((prev) => [
      {
        name: "",
        attendee_type: "guest",
        dietary_restrictions: null,
        member_id: null,
        tempId: "self",
      },
      ...prev.slice(1),
    ]);
  };

  // Validation
  const step1Valid = date && mealType && roomId;
  const step2Valid = !!selectedTable;
  const step3Valid = attendees.every((a) => a.name.trim().length > 0);

  const mealConfig = MEAL_TYPES.find((m) => m.value === mealType);
  const selectedRoom = rooms.find((r) => r.id === Number(roomId));

  const totalSeats = selectedTable?.seat_count || 4; // Default to 4 to show UI
  const remainingSeats = totalSeats - attendees.length;

  const handleSubmit = () => {
    // eslint-disable-next-line no-unused-vars
    const cleanAttendees = attendees.map(({ tempId, ...rest }) => rest);

    onSubmit(
      {
        dining_room_id: Number(roomId),
        table_id: selectedTable.id,
        date,
        meal_type: mealType,
        start_time: mealConfig?.start || "18:00",
        end_time: mealConfig?.end || "21:00",
        notes: notes.trim() || null,
      },
      cleanAttendees,
    );
  };

  return (
    <div>
      <Steps current={step} total={4} />

      {/* ── STEP 1: When & Where ── */}
      {step === 1 && (
        <div data-ui="stack">
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
            When & Where
          </div>
          <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 8 }}>
            Pick your date, meal, and room.
          </div>

          <div>
            <label style={labelStyle}>Date</label>
            <input
              data-ui="input"
              type="date"
              min={todayStr()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Meal Service</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {MEAL_TYPES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMealType(m.value)}
                  style={{
                    padding: 12,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    border: `2px solid ${mealType === m.value ? "var(--primary)" : "var(--border)"}`,
                    background:
                      mealType === m.value
                        ? "rgba(43,108,176,0.15)"
                        : "var(--panel-2)",
                    color: "var(--text)",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    {m.start} – {m.end}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Dining Room</label>
            <select
              data-ui="input"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            >
              <option value="">Select a room…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div style={navStyle}>
            <button
              type="button"
              data-ui="btn"
              style={{ background: "var(--border)", color: "var(--text)" }}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              data-ui="btn"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
            >
              Choose Table →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Table Picker ── */}
      {step === 2 && (
        <div data-ui="stack">
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
            Pick a Table
          </div>
          <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 8 }}>
            {selectedRoom?.name} · {date} · {mealConfig?.label}
          </div>

          {loadingTables ? (
            <div
              style={{
                color: "var(--muted)",
                padding: "2rem 0",
                textAlign: "center",
              }}
            >
              Loading availability…
            </div>
          ) : tables.length === 0 ? (
            <div
              style={{
                color: "var(--muted)",
                padding: "2rem 0",
                textAlign: "center",
              }}
            >
              No tables in this room.
            </div>
          ) : (
            <>
              <div
                style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}
              >
                {tables.length - takenTables.length} of {tables.length}{" "}
                available
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {tables.map((t) => (
                  <TableCard
                    key={t.id}
                    table={t}
                    selected={selectedTable}
                    onSelect={setSelectedTable}
                    takenTables={takenTables}
                  />
                ))}
              </div>
            </>
          )}

          <div style={navStyle}>
            <button
              type="button"
              data-ui="btn"
              style={{ background: "var(--border)", color: "var(--text)" }}
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
            <button
              type="button"
              data-ui="btn"
              disabled={!step2Valid}
              onClick={() => setStep(3)}
            >
              Add Party →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Party ── */}
      {step === 3 && (
        <div data-ui="stack">
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
            Your Party
          </div>
          <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 8 }}>
            Table {selectedTable?.table_number} · {attendees.length} /{" "}
            {totalSeats} seats filled.
          </div>

          {/* Quick Add Members Section */}
          {members.length > 0 && remainingSeats > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Quick Add from Family</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {members.map((m) => {
                  const isAdded = attendees.some((a) => a.member_id === m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={isAdded}
                      onClick={() => addMember(m)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        fontSize: "0.8rem",
                        borderRadius: "20px",
                        border: `1px solid ${isAdded ? "var(--border)" : "var(--primary)"}`,
                        background: isAdded ? "var(--panel-2)" : "transparent",
                        color: isAdded ? "var(--muted)" : "var(--primary)",
                        cursor: isAdded ? "default" : "pointer",
                        opacity: isAdded ? 0.6 : 1,
                      }}
                    >
                      <span>{isAdded ? "✓" : "+"}</span>
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {attendees.map((a, i) => (
              <AttendeeRow
                key={a.tempId}
                attendee={a}
                index={i + 1}
                isFirst={i === 0}
                onChange={updateAttendee}
                onRemove={removeGuest}
                onClear={clearFirstRow} // Pass the clear handler
              />
            ))}
          </div>

          {remainingSeats > 0 && (
            <button
              type="button"
              onClick={addGuest}
              style={{
                background: "transparent",
                border: "1px dashed var(--border-2)",
                color: "var(--muted)",
                borderRadius: "var(--radius-sm)",
                padding: 10,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                marginTop: 8,
              }}
            >
              + Add Guest (Manual Entry)
            </button>
          )}

          <div style={navStyle}>
            <button
              type="button"
              data-ui="btn"
              style={{ background: "var(--border)", color: "var(--text)" }}
              onClick={() => setStep(2)}
            >
              ← Back
            </button>
            <button
              type="button"
              data-ui="btn"
              disabled={!step3Valid}
              onClick={() => setStep(4)}
            >
              Review →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Review & Book ── */}
      {step === 4 && (
        <div data-ui="stack">
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
            Review & Book
          </div>

          <div
            style={{
              background: "var(--panel-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "14px 16px",
              display: "grid",
              gap: 8,
            }}
          >
            <SummaryRow label="Date" value={date} />
            <SummaryRow label="Meal" value={mealConfig?.label} />
            <SummaryRow label="Room" value={selectedRoom?.name} />
            <SummaryRow
              label="Table"
              value={`Table ${selectedTable?.table_number} (${selectedTable?.seat_count} seats)`}
            />
            <SummaryRow
              label="Party"
              value={`${attendees.length} ${attendees.length === 1 ? "person" : "people"}`}
            />
            {attendees.map((a, i) => (
              <SummaryRow
                key={i}
                label={i === 0 ? "  You" : `  Guest ${i}`}
                value={`${a.name}${a.dietary_restrictions?.note ? ` · ${a.dietary_restrictions.note}` : ""}`}
              />
            ))}
          </div>

          <div>
            <label style={labelStyle}>Notes for staff (optional)</label>
            <textarea
              data-ui="input"
              rows={3}
              placeholder="Anniversary, accessibility needs…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 12px",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div style={navStyle}>
            <button
              type="button"
              data-ui="btn"
              style={{ background: "var(--border)", color: "var(--text)" }}
              onClick={() => setStep(3)}
            >
              ← Back
            </button>
            <button
              type="button"
              data-ui="btn"
              disabled={submitting}
              onClick={handleSubmit}
              style={{ background: submitting ? undefined : "var(--success)" }}
            >
              {submitting ? "Booking…" : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--muted)",
  marginBottom: 6,
};
const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  marginTop: 8,
};
const microLabel = {
  fontSize: 11,
  color: "var(--muted)",
  marginBottom: 4,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
