// src/pages/admin/MenuItemsPage.jsx
import { useEffect, useState } from "react";
import { useBase } from "../../hooks/useBase";
import { BaseTable } from "../../components/base/BaseTable";
import { BaseForm } from "../../components/base/BaseForm";
import { useToastTrigger } from "../../hooks/useToast";
import { safe } from "../../utils/safe";

const FIELDS = [
  { name: "name", label: "Item Name", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "price",
    label: "Price",
    type: "number",
    required: true,
    defaultValue: 0,
  },
  { name: "category", label: "Category", type: "text", required: true },
  {
    name: "is_available",
    label: "Available",
    type: "checkbox",
    defaultValue: true,
  },
  {
    name: "display_order",
    label: "Display Order",
    type: "number",
    defaultValue: 0,
  },
];

const COLUMNS = [
  { key: "name", label: "Item" },
  { key: "description", label: "Description" },
  { key: "price", label: "Price", render: (v) => safe.currency(v) },
  { key: "category", label: "Category", render: (v) => v || "Uncategorized" },
  { key: "display_order", label: "Order" },
  {
    key: "is_available",
    label: "Status",
    render: (v) => (
      <span
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "0.25rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          background: v ? "var(--success)" : "var(--warning)",
          color: "#fff",
        }}
      >
        {v ? "Available" : "Unavailable"}
      </span>
    ),
  },
];

export function MenuItemsPage() {
  const { items, loading, fetchAll, create, update, remove } =
    useBase("menu-items");
  const { addToast } = useToastTrigger();
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreate = async (data) => {
    const result = await create(data);
    result.success
      ? addToast({
          type: "success",
          title: "Created",
          message: "Menu item created",
        })
      : addToast({ type: "error", title: "Error", message: result.error });
  };

  const handleUpdate = async (data) => {
    const result = await update(editing.id, data);
    if (result.success) {
      addToast({
        type: "success",
        title: "Updated",
        message: "Menu item updated",
      });
      setEditing(null);
    } else {
      addToast({ type: "error", title: "Error", message: result.error });
    }
  };

  const handleDelete = async (id) => {
    const result = await remove(id);
    result.success
      ? addToast({
          type: "success",
          title: "Deleted",
          message: "Menu item deleted",
        })
      : addToast({ type: "error", title: "Error", message: result.error });
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1
          data-ui="title"
          style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
        >
          Menu Items
        </h1>
        <p data-ui="subtitle">Manage menu items, prices, and availability</p>
      </div>
      <div style={{ display: "grid", gap: "2rem" }}>
        <BaseTable
          columns={COLUMNS}
          data={items}
          loading={loading}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
        <div>
          <h2 data-ui="label" style={{ marginBottom: "1rem" }}>
            {editing ? "Edit Item" : "Add New Item"}
          </h2>
          <BaseForm
            fields={FIELDS}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={editing ? () => setEditing(null) : null}
            initialData={editing}
            submitLabel={editing ? "Update" : "Create"}
          />
        </div>
      </div>
    </div>
  );
}
