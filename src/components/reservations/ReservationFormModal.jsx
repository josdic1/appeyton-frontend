import { useState, useEffect, useCallback } from "react";
import {
  X,
  Calendar,
  Clock,
  Home,
  Users,
  Trash2,
  ChevronRight,
  Save,
  Utensils,
} from "lucide-react";
import { api, HttpError } from "../../utils/api";
import { useToastTrigger } from "../../hooks/useToast";
import { OrderManager } from "../orders/OrderManager";

export function ReservationFormModal({ open, onClose, initialData, user }) {
  const [step, setStep] = useState(1);
  const [view, setView] = useState("booking");
  const [loading, setLoading] = useState(false);
  const [diningRooms, setDiningRooms] = useState([]);
  const [allTables, setAllTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [family, setFamily] = useState([]);
  const { addToast } = useToastTrigger();

  const [formData, setFormData] = useState({
    date: "",
    meal_type: "dinner",
    start_time: "18:00:00",
    end_time: "20:00:00",
    dining_room_id: null,
    table_id: null,
    attendees: [],
  });

  useEffect(() => {
    if (open) {
      api
        .get("/members")
        .then(setFamily)
        .catch(() => {});
      api
        .get("/dining-rooms")
        .then(setDiningRooms)
        .catch(() => {});

      if (initialData) {
        setStep(3);
        setView("booking");
        setFormData({ ...initialData });
      } else {
        setStep(1);
        setView("booking");
        setFormData({
          date: new Date().toISOString().split("T")[0],
          meal_type: "dinner",
          start_time: "18:00:00",
          end_time: "20:00:00",
          dining_room_id: null,
          table_id: null,
          attendees: [
            {
              name: user?.name || "",
              attendee_type: "self",
              dietary_restrictions: { note: "" },
            },
          ],
        });
      }
    }
  }, [initialData, open, user]);

  useEffect(() => {
    if (formData.dining_room_id) {
      const roomTables = allTables.filter(
        (t) => t.dining_room_id === parseInt(formData.dining_room_id),
      );
      setFilteredTables(roomTables);
    }
  }, [formData.dining_room_id, allTables]);

  const fetchAvailableTables = useCallback(async () => {
    setLoading(true);
    try {
      const tables = await api.get("/ops/tables");
      const bookings = await api.get(
        `/reservations/availability?date=${formData.date}`,
      );
      const bookedIds = bookings
        .filter((b) => b.meal_type === formData.meal_type)
        .map((b) => b.table_id);
      setAllTables(tables.filter((t) => !bookedIds.includes(t.id)));
      setStep(2);
    } catch (e) {
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to check availability.",
      });
    } finally {
      setLoading(false);
    }
  }, [formData.date, formData.meal_type, addToast]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.post("/reservations", formData);
      addToast({ type: "success", title: "Success", message: "Table booked!" });
      onClose();
    } catch (err) {
      addToast({ type: "error", title: "Error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h3>
            {initialData
              ? view === "booking"
                ? "Visit Management"
                : "Order Menu"
              : `New Booking: Step ${step}`}
          </h3>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24, minHeight: 400 }}>
          {view === "ordering" ? (
            <OrderManager reservation={initialData || formData} />
          ) : (
            <>
              {step === 1 && (
                <div style={stepGridStyle}>
                  <label style={lblStyle}>Select Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                  <label style={lblStyle}>Meal Service</label>
                  <select
                    value={formData.meal_type}
                    onChange={(e) =>
                      setFormData({ ...formData, meal_type: e.target.value })
                    }
                  >
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                  <button
                    onClick={fetchAvailableTables}
                    data-ui="btn"
                    style={{ marginTop: 20 }}
                  >
                    Next: Select Room <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}
                >
                  <div style={sectionLabelStyle}>Choose Dining Room</div>
                  <div style={tableGridStyle}>
                    {diningRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            dining_room_id: room.id,
                            table_id: null,
                          })
                        }
                        style={{
                          ...tableCardStyle,
                          borderColor:
                            formData.dining_room_id === room.id
                              ? "var(--primary)"
                              : "var(--border)",
                        }}
                      >
                        <Home size={16} />
                        <div>{room.name}</div>
                      </button>
                    ))}
                  </div>
                  {formData.dining_room_id && (
                    <div style={tableGridStyle}>
                      {filteredTables.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setFormData({ ...formData, table_id: t.id });
                            setStep(3);
                          }}
                          style={{
                            ...tableCardStyle,
                            borderColor:
                              formData.table_id === t.id
                                ? "var(--primary)"
                                : "var(--border)",
                          }}
                        >
                          Table {t.table_number}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div>
                  <div style={sectionLabelStyle}>Guest Manifest</div>
                  {formData.attendees.map((a, i) => (
                    <div key={i} style={guestCardStyle}>
                      <input
                        placeholder="Name"
                        value={a.name}
                        onChange={(e) => {
                          const next = [...formData.attendees];
                          next[i].name = e.target.value;
                          setFormData({ ...formData, attendees: next });
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            attendees: formData.attendees.filter(
                              (_, idx) => idx !== i,
                            ),
                          })
                        }
                        style={delBtnStyle}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        attendees: [
                          ...formData.attendees,
                          {
                            name: "",
                            attendee_type: "guest",
                            dietary_restrictions: { note: "" },
                          },
                        ],
                      })
                    }
                    data-ui="btn"
                  >
                    + Add Guest
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div style={footerStyle}>
          <div style={{ display: "flex", gap: 10 }}>
            {initialData && (
              <button
                onClick={() =>
                  setView(view === "booking" ? "ordering" : "booking")
                }
                data-ui="btn"
                style={orderBtnStyle}
              >
                <Utensils size={18} />{" "}
                {view === "booking" ? "Food Orders" : "Back to Info"}
              </button>
            )}
            {step === 3 && view === "booking" && (
              <button
                onClick={handleCreate}
                data-ui="btn"
                style={saveBtnStyle}
                disabled={loading}
              >
                <Save size={18} /> {loading ? "Saving..." : "Confirm Booking"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const orderBtnStyle = {
  background: "var(--primary)",
  color: "white",
  padding: "12px 24px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 800,
};
const saveBtnStyle = {
  flex: 1,
  background: "var(--success)",
  fontWeight: 800,
  padding: 12,
  color: "#fff",
  cursor: "pointer",
  borderRadius: 8,
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};
const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 5000,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const modalStyle = {
  background: "var(--panel)",
  width: "min(900px, 95%)",
  borderRadius: 16,
  border: "1px solid var(--border)",
  overflow: "hidden",
};
const headerStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "var(--panel-2)",
};
const closeBtnStyle = {
  background: "none",
  border: "none",
  color: "var(--muted)",
  cursor: "pointer",
};
const stepGridStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  maxWidth: 400,
  margin: "0 auto",
};
const tableGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
  gap: 10,
  marginBottom: 20,
};
const tableCardStyle = {
  padding: 12,
  background: "var(--panel-2)",
  border: "2px solid var(--border)",
  borderRadius: 10,
  cursor: "pointer",
  textAlign: "center",
};
const guestCardStyle = {
  background: "var(--panel-2)",
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
  border: "1px solid var(--border)",
  display: "flex",
  gap: 10,
  alignItems: "center",
};
const delBtnStyle = {
  background: "none",
  border: "none",
  color: "var(--danger)",
  cursor: "pointer",
};
const footerStyle = {
  padding: 16,
  borderTop: "1px solid var(--border)",
  background: "var(--panel-2)",
};
const lblStyle = {
  fontSize: "0.7rem",
  fontWeight: 800,
  color: "var(--muted)",
  textTransform: "uppercase",
};
const sectionLabelStyle = {
  fontSize: "0.65rem",
  fontWeight: 800,
  color: "var(--muted)",
  marginBottom: 8,
  textTransform: "uppercase",
};
