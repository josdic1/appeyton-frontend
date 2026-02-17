// src/pages/admin/DiningRoomsPage.jsx
import { useEffect, useState } from "react";
import { useBase } from "../../hooks/useBase";
import { BaseTable } from "../../components/base/BaseTable";
import { BaseForm } from "../../components/base/BaseForm";
import { useToastTrigger } from "../../hooks/useToast";

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

const DINING_ROOM_COLUMNS = [
  { key: "name", label: "Room Name" },
  { key: "capacity", label: "Capacity", render: (v) => `${v} seats` },
  { key: "display_order", label: "Order" },
  {
    key: "is_active",
    label: "Status",
    render: (v) => (
      <span
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "0.25rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          background: v ? "var(--success)" : "var(--danger)",
          color: "#fff",
        }}
      >
        {v ? "Active" : "Inactive"}
      </span>
    ),
  },
];

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
    result.success
      ? (addToast({
          type: "success",
          title: "Created",
          message: "Dining room created",
        }),
        fetchAll())
      : addToast({ type: "error", title: "Error", message: result.error });
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
    const result = await remove(id);
    result.success
      ? (addToast({
          type: "success",
          title: "Deleted",
          message: "Dining room deleted",
        }),
        fetchAll())
      : addToast({ type: "error", title: "Error", message: result.error });
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1
          data-ui="title"
          style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
        >
          Dining Rooms
        </h1>
        <p data-ui="subtitle">Manage dining room capacity and availability</p>
      </div>
      <div style={{ display: "grid", gap: "2rem" }}>
        <BaseTable
          columns={DINING_ROOM_COLUMNS}
          data={items}
          loading={loading}
          onEdit={setEditingRoom}
          onDelete={handleDelete}
        />
        <div>
          <h2 data-ui="label" style={{ marginBottom: "1rem" }}>
            {editingRoom ? "Edit Room" : "Add New Room"}
          </h2>
          <BaseForm
            fields={DINING_ROOM_FIELDS}
            onSubmit={editingRoom ? handleUpdate : handleCreate}
            onCancel={editingRoom ? () => setEditingRoom(null) : null}
            initialData={editingRoom}
            submitLabel={editingRoom ? "Update" : "Create"}
          />
        </div>
      </div>
    </div>
  );
}
