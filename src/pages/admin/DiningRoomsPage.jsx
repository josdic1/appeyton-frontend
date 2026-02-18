// src/pages/admin/DiningRoomsPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useBase } from "../../hooks/useBase";
import { BaseForm } from "../../components/base/BaseForm";
import { useToastTrigger } from "../../hooks/useToast";
import { api } from "../../utils/api";
import { RefreshCw } from "lucide-react";

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

// UPDATED: Added X/Y fields so you can position tables for the floor plan
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

// ── Inline table list for a single room ──────────────────────────────
function RoomTables({ room, onTableChange }) {
  const [tables, setTables] = useState([]);
  const [editingTable, setEditingTable] = useState(null);
  const [addingTable, setAddingTable] = useState(false);
  const { addToast } = useToastTrigger();

  const loadTables = useCallback(async () => {
    try {
      const data = await api.get(`/api/admin/tables`);
      // Filter client-side for simplicity, or add query param in backend
      setTables((data || []).filter((t) => t.dining_room_id === room.id));
    } catch {
      setTables([]);
    }
  }, [room.id]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const handleCreate = async (data) => {
    try {
      await api.post(`/api/admin/tables`, { ...data, dining_room_id: room.id });
      addToast({
        type: "success",
        title: "Created",
        message: `Table ${data.table_number} added`,
      });
      setAddingTable(false);
      loadTables();
      onTableChange(); // Refresh parent stats
    } catch (err) {
      addToast({ type: "error", title: "Error", message: err.message });
    }
  };

  const handleUpdate = async (data) => {
    try {
      await api.patch(`/api/admin/tables/${editingTable.id}`, data);
      addToast({ type: "success", title: "Updated", message: "Table updated" });
      setEditingTable(null);
      loadTables();
      onTableChange();
    } catch (err) {
      addToast({ type: "error", title: "Error", message: err.message });
    }
  };

  const handleDelete = async (tableId) => {
    if (!confirm("Delete this table?")) return;
    try {
      await api.delete(`/api/admin/tables/${tableId}`);
      addToast({ type: "success", title: "Deleted", message: "Table removed" });
      loadTables();
      onTableChange();
    } catch (err) {
      addToast({ type: "error", title: "Error", message: err.message });
    }
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      {tables.length === 0 && !addingTable && (
        <p
          data-ui="subtitle"
          style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}
        >
          No tables yet
        </p>
      )}

      {tables.length > 0 && (
        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
          {tables
            .sort((a, b) => a.table_number - b.table_number)
            .map((table) => (
              <div
                key={table.id}
                data-ui="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 1rem",
                  gap: "1rem",
                  background: "var(--panel-2)",
                }}
              >
                {editingTable?.id === table.id ? (
                  <div style={{ flex: 1 }}>
                    <BaseForm
                      fields={TABLE_FIELDS}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditingTable(null)}
                      initialData={editingTable}
                      submitLabel="Save"
                    />
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        gap: "1.5rem",
                        alignItems: "center",
                      }}
                    >
                      <span data-ui="label" style={{ fontWeight: 700 }}>
                        Table {table.table_number}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          data-ui="subtitle"
                          style={{ fontSize: "0.85rem" }}
                        >
                          {table.seat_count} seats
                        </span>
                        <span
                          data-ui="subtitle"
                          style={{ fontSize: "0.7rem", opacity: 0.7 }}
                        >
                          Pos: {table.position_x},{table.position_y}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        data-ui="btn-ghost"
                        onClick={() => setEditingTable(table)}
                        style={{
                          fontSize: "0.8rem",
                          padding: "0.25rem 0.75rem",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        data-ui="btn-danger"
                        onClick={() => handleDelete(table.id)}
                        style={{
                          fontSize: "0.8rem",
                          padding: "0.25rem 0.75rem",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      )}

      {addingTable ? (
        <div data-ui="card" style={{ padding: "1rem" }}>
          <h4 data-ui="label" style={{ marginBottom: "0.75rem" }}>
            New Table
          </h4>
          <BaseForm
            fields={TABLE_FIELDS}
            onSubmit={handleCreate}
            onCancel={() => setAddingTable(false)}
            submitLabel="Add Table"
          />
        </div>
      ) : (
        <button
          data-ui="btn-ghost"
          onClick={() => setAddingTable(true)}
          style={{ fontSize: "0.85rem" }}
        >
          + Add Table
        </button>
      )}
    </div>
  );
}

// ── Room card ────────────────────────────────────────────────────────
function RoomCard({ room, onEdit, onDelete, onTableChange }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div data-ui="card" style={{ padding: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flex: 1,
          }}
        >
          <button
            data-ui="btn-ghost"
            onClick={() => setExpanded((v) => !v)}
            style={{
              fontSize: "1rem",
              padding: "0.25rem 0.5rem",
              minWidth: 32,
            }}
          >
            {expanded ? "▾" : "▸"}
          </button>
          <div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <span
                data-ui="label"
                style={{ fontWeight: 700, fontSize: "1.05rem" }}
              >
                {room.name}
              </span>
              <span
                style={{
                  padding: "0.2rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  background: room.is_active
                    ? "var(--success)"
                    : "var(--danger)",
                  color: "#fff",
                  textTransform: "uppercase",
                }}
              >
                {room.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {/* Show rough capacity based on seed data, though real calc happens in backend usually */}
            <span data-ui="subtitle" style={{ fontSize: "0.82rem" }}>
              Display Order: {room.display_order}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            data-ui="btn-ghost"
            onClick={() => onEdit(room)}
            style={{ fontSize: "0.8rem", padding: "0.25rem 0.75rem" }}
          >
            Edit Room
          </button>
          <button
            data-ui="btn-danger"
            onClick={() => onDelete(room.id)}
            style={{ fontSize: "0.8rem", padding: "0.25rem 0.75rem" }}
          >
            Delete
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: "1rem",
            paddingLeft: "2.5rem",
            borderLeft: "2px solid var(--border)",
          }}
        >
          <RoomTables room={room} onTableChange={onTableChange} />
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────
export function DiningRoomsPage() {
  const { items, loading, fetchAll } = useBase(
    "dining-rooms?active_only=false",
  );
  const { create, update, remove } = useBase("admin/dining-rooms");
  const { addToast } = useToastTrigger();
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreate = async (data) => {
    const result = await create(data);
    if (result.success) {
      addToast({
        type: "success",
        title: "Created",
        message: "Dining room created",
      });
      fetchAll();
    } else {
      addToast({ type: "error", title: "Error", message: result.error });
    }
  };

  const handleUpdate = async (data) => {
    const result = await update(editingRoom.id, data);
    if (result.success) {
      addToast({
        type: "success",
        title: "Updated",
        message: "Dining room updated",
      });
      setEditingRoom(null);
      fetchAll();
    } else {
      addToast({ type: "error", title: "Error", message: result.error });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this entire room and its tables?")) return;
    const result = await remove(id);
    if (result.success) {
      addToast({
        type: "success",
        title: "Deleted",
        message: "Dining room deleted",
      });
      fetchAll();
    } else {
      addToast({ type: "error", title: "Error", message: result.error });
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            data-ui="title"
            style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
          >
            Dining Rooms
          </h1>
          <p data-ui="subtitle">
            Manage rooms, tables, and floor plan coordinates
          </p>
        </div>
        <button data-ui="btn-ghost" onClick={fetchAll} disabled={loading}>
          <RefreshCw size={18} />
        </button>
      </div>

      <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
        {loading && <p data-ui="subtitle">Loading...</p>}
        {!loading && items.length === 0 && (
          <p data-ui="subtitle">No dining rooms yet. Add one below.</p>
        )}
        {items.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onEdit={setEditingRoom}
            onDelete={handleDelete}
            onTableChange={fetchAll}
          />
        ))}
      </div>

      <div data-ui="card" style={{ padding: "1.5rem" }}>
        <h2 data-ui="label" style={{ marginBottom: "1rem" }}>
          {editingRoom ? `Edit: ${editingRoom.name}` : "Add New Room"}
        </h2>
        <BaseForm
          fields={DINING_ROOM_FIELDS}
          onSubmit={editingRoom ? handleUpdate : handleCreate}
          onCancel={editingRoom ? () => setEditingRoom(null) : null}
          initialData={editingRoom}
          submitLabel={editingRoom ? "Update" : "Create Room"}
        />
      </div>
    </div>
  );
}
