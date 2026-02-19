import { useEffect, useState, useCallback } from "react";
import { useBase } from "../../hooks/useBase";
import { BaseForm } from "../../components/base/BaseForm";
import { useToastTrigger } from "../../hooks/useToast";
import { api } from "../../utils/api";
import { safe } from "../../utils/safe";
import {
  RefreshCw,
  MapPin,
  Grid,
  Trash2,
  Edit3,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const DINING_ROOM_FIELDS = [
  { name: "name", label: "Room Name", type: "text", required: true },
  { name: "is_active", label: "Active", type: "checkbox", defaultValue: true },
  {
    name: "display_order",
    label: "Display Order",
    type: "number",
    defaultValue: 0,
  },
];

const TABLE_FIELDS = [
  { name: "table_number", label: "Table #", type: "number", required: true },
  { name: "seat_count", label: "Seats", type: "number", required: true },
  {
    name: "position_x",
    label: "X Position (px)",
    type: "number",
    defaultValue: 50,
  },
  {
    name: "position_y",
    label: "Y Position (px)",
    type: "number",
    defaultValue: 50,
  },
];

// ── Table Management Logic ──────────────────────────────
function RoomTables({ room, onTableChange }) {
  const [tables, setTables] = useState([]);
  const [editingTable, setEditingTable] = useState(null);
  const [addingTable, setAddingTable] = useState(false);
  const { addToast } = useToastTrigger();

  const loadTables = useCallback(async () => {
    try {
      // api.js handles /api prefix
      const data = await api.get(`/ops/tables`);
      const filtered = safe
        .array(data)
        .filter((t) => t.dining_room_id === room.id);
      setTables(filtered);
    } catch {
      setTables([]);
    }
  }, [room.id]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const handleCreate = async (data) => {
    try {
      await api.post(`/ops/tables`, { ...data, dining_room_id: room.id });
      addToast({
        status: "success",
        what: "Table Added",
        why: `Table ${data.table_number} is now registered in ${room.name}.`,
        how: "It will now appear on the live floor plan.",
      });
      setAddingTable(false);
      loadTables();
      onTableChange();
    } catch (err) {
      addToast({ status: "error", what: "Creation Failed", why: err.message });
    }
  };

  const handleUpdate = async (data) => {
    try {
      await api.patch(`/ops/tables/${editingTable.id}`, data);
      addToast({
        status: "success",
        what: "Table Updated",
        why: "Coordinates and seating updated.",
      });
      setEditingTable(null);
      loadTables();
      onTableChange();
    } catch (err) {
      addToast({ status: "error", what: "Update Failed", why: err.message });
    }
  };

  const handleDelete = async (tableId) => {
    if (!confirm("Remove this table? This will affect the floor plan layout."))
      return;
    try {
      await api.delete(`/ops/tables/${tableId}`);
      addToast({
        status: "success",
        what: "Table Removed",
        why: "Table deleted from room inventory.",
      });
      loadTables();
      onTableChange();
    } catch (err) {
      addToast({ status: "error", what: "Deletion Failed", why: err.message });
    }
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ display: "grid", gap: "10px", marginBottom: "1rem" }}>
        {tables
          .sort((a, b) => a.table_number - b.table_number)
          .map((table) => (
            <div key={table.id} data-ui="card" style={tableItemStyle}>
              {editingTable?.id === table.id ? (
                <div style={{ flex: 1, padding: "10px" }}>
                  <BaseForm
                    fields={TABLE_FIELDS}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditingTable(null)}
                    initialData={editingTable}
                    submitLabel="Save Changes"
                  />
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      alignItems: "center",
                    }}
                  >
                    <div style={tableBadgeStyle}>{table.table_number}</div>
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        {table.seat_count} Seats
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#666" }}>
                        Coords: {table.position_x}x, {table.position_y}y
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setEditingTable(table)}
                      style={smallBtnStyle}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(table.id)}
                      style={{ ...smallBtnStyle, color: "#ef4444" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
      </div>

      {addingTable ? (
        <div
          data-ui="card"
          style={{ padding: "20px", border: "1px dashed #000" }}
        >
          <h4 style={{ margin: "0 0 15px 0" }}>New Table for {room.name}</h4>
          <BaseForm
            fields={TABLE_FIELDS}
            onSubmit={handleCreate}
            onCancel={() => setAddingTable(false)}
            submitLabel="Add Table"
          />
        </div>
      ) : (
        <button
          data-ui="btn"
          onClick={() => setAddingTable(true)}
          style={addTableBtnStyle}
        >
          + Add Table to Room
        </button>
      )}
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────
export function DiningRoomsPage() {
  const {
    items: rawRooms,
    loading,
    fetchAll,
  } = useBase("dining-rooms?active_only=false");
  const { create, update, remove } = useBase("admin/dining-rooms");
  const { addToast } = useToastTrigger();
  const [editingRoom, setEditingRoom] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  const items = safe.array(rawRooms);

  const handleCreate = async (data) => {
    const result = await create(data);
    if (result.success) {
      addToast({
        status: "success",
        what: "Room Created",
        why: `${data.name} is now available for booking.`,
      });
      fetchAll();
    }
  };

  const handleUpdate = async (data) => {
    const result = await update(editingRoom.id, data);
    if (result.success) {
      addToast({
        status: "success",
        what: "Room Updated",
        why: "Changes saved to the room configuration.",
      });
      setEditingRoom(null);
      fetchAll();
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Grid size={28} color="var(--orange)" />
            <h1 style={{ margin: 0, fontSize: "2.2rem", fontWeight: 900 }}>
              Dining Rooms
            </h1>
          </div>
          <p style={{ margin: "4px 0 0", color: "#666", fontWeight: 600 }}>
            Manage physical spaces and table coordinates
          </p>
        </div>
        <button
          data-ui="btn-refresh"
          onClick={fetchAll}
          disabled={loading}
          style={refreshBtnStyle}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div style={{ display: "grid", gap: "16px", marginBottom: "40px" }}>
        {items.map((room) => (
          <div key={room.id} data-ui="card" style={roomCardStyle}>
            <div style={roomHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                <button
                  style={toggleBtnStyle}
                  onClick={() =>
                    setExpandedId(expandedId === room.id ? null : room.id)
                  }
                >
                  {expandedId === room.id ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>
                <div>
                  <div style={{ fontWeight: 900, fontSize: "1.1rem" }}>
                    {room.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#666" }}>
                    Order: {room.display_order} •{" "}
                    {room.is_active ? "ACTIVE" : "INACTIVE"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setEditingRoom(room)}
                  style={actionBtnStyle}
                >
                  Edit
                </button>
                <button
                  onClick={() => {}}
                  style={{ ...actionBtnStyle, color: "#ef4444" }}
                >
                  Delete
                </button>
              </div>
            </div>

            {expandedId === room.id && (
              <div style={expandedContentStyle}>
                <RoomTables room={room} onTableChange={fetchAll} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div data-ui="card" style={editorCardStyle}>
        <h2
          style={{ margin: "0 0 20px 0", fontSize: "1.3rem", fontWeight: 900 }}
        >
          {editingRoom ? `Edit: ${editingRoom.name}` : "Create New Dining Room"}
        </h2>
        <BaseForm
          fields={DINING_ROOM_FIELDS}
          onSubmit={editingRoom ? handleUpdate : handleCreate}
          onCancel={editingRoom ? () => setEditingRoom(null) : null}
          initialData={editingRoom}
          submitLabel={editingRoom ? "Save Changes" : "Create Room"}
        />
      </div>
    </div>
  );
}

// --- Styles ---

const containerStyle = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "40px 20px",
};
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "32px",
};
const refreshBtnStyle = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};
const roomCardStyle = {
  background: "white",
  borderRadius: "12px",
  border: "1px solid #eee",
  overflow: "hidden",
};
const roomHeaderStyle = {
  padding: "16px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #f5f5f5",
};
const toggleBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
};
const actionBtnStyle = {
  background: "transparent",
  border: "1px solid #ddd",
  padding: "4px 12px",
  borderRadius: "6px",
  fontSize: "0.8rem",
  fontWeight: 700,
  cursor: "pointer",
};
const expandedContentStyle = {
  padding: "0 20px 20px 50px",
  borderLeft: "4px solid #f0f0f0",
};
const tableItemStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  background: "#f9f9f9",
  borderRadius: "8px",
};
const tableBadgeStyle = {
  width: 36,
  height: 36,
  background: "var(--black)",
  color: "white",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: "0.9rem",
};
const smallBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "4px",
};
const addTableBtnStyle = {
  marginTop: "12px",
  background: "white",
  border: "1px dashed #000",
  padding: "8px 16px",
  borderRadius: "8px",
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
};
const editorCardStyle = {
  padding: "32px",
  background: "var(--cream)",
  borderRadius: "16px",
  border: "2px solid #000",
};
