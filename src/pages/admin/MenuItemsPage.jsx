// src/pages/admin/MenuItemsPage.jsx
import { useEffect, useState, useRef } from "react";
import { useBase } from "../../hooks/useBase";
import { BaseTable } from "../../components/base/BaseTable";
import { BaseForm } from "../../components/base/BaseForm";
import { useToastTrigger } from "../../hooks/useToast";
import { Plus, ArrowDown } from "lucide-react";

const FIELDS = [
  { name: "name", label: "Item Name", type: "text", required: true },
  {
    name: "category",
    label: "Category",
    type: "select",
    required: true,
    options: [
      { value: "appetizer", label: "Appetizer" },
      { value: "entree", label: "Entree" },
      { value: "side", label: "Side" },
      { value: "dessert", label: "Dessert" },
      { value: "beverage", label: "Beverage" },
    ],
  },
  { name: "price", label: "Price ($)", type: "number", required: true },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "is_available",
    label: "Available",
    type: "checkbox",
    defaultValue: true,
  },
];

const COLUMNS = [
  { key: "name", label: "Name", style: { fontWeight: 700 } },
  {
    key: "category",
    label: "Category",
    render: (v) => (
      <span
        style={{
          textTransform: "uppercase",
          fontSize: "0.7rem",
          fontWeight: 700,
          padding: "2px 6px",
          borderRadius: "4px",
          background: "var(--panel-2)",
          border: "1px solid var(--border)",
        }}
      >
        {v}
      </span>
    ),
  },
  {
    key: "price",
    label: "Price",
    render: (v) => (v ? `$${parseFloat(v).toFixed(2)}` : "—"),
  },
  {
    key: "is_available",
    label: "Status",
    render: (v) => (
      <span style={{ color: v ? "var(--success)" : "var(--muted)" }}>
        {v ? "● Live" : "○ Hidden"}
      </span>
    ),
  },
];

export function MenuItemsPage() {
  const { items, loading, fetchAll, create, update, remove } = useBase(
    "menu-items?available_only=false",
  );
  const { addToast } = useToastTrigger();
  const [editing, setEditing] = useState(null);

  // 1. Create a Ref for the form section
  const formRef = useRef(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 2. Scroll Helper
  const scrollToForm = () => {
    // Wait a tick for state updates if needed, then scroll
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleCreate = async (data) => {
    const result = await create(data);
    if (result.success) {
      addToast({ type: "success", title: "Created", message: "Item added" });
      fetchAll();
    } else {
      addToast({ type: "error", title: "Error", message: result.error });
    }
  };

  const handleUpdate = async (data) => {
    const result = await update(editing.id, data);
    if (result.success) {
      addToast({ type: "success", title: "Updated", message: "Item saved" });
      setEditing(null);
      fetchAll();
    } else {
      addToast({ type: "error", title: "Error", message: result.error });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this menu item?")) return;
    const result = await remove(id);
    if (result.success) {
      addToast({ type: "success", title: "Deleted", message: "Item removed" });
      fetchAll();
    } else {
      addToast({ type: "error", title: "Error", message: result.error });
    }
  };

  // Handler for the "Add New" button at top
  const handleAddNewClick = () => {
    setEditing(null); // Clear editing state
    scrollToForm(); // Scroll down
  };

  // Handler for clicking "Edit" on a row
  const handleEditClick = (item) => {
    setEditing(item);
    scrollToForm();
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            data-ui="title"
            style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
          >
            Menu Items
          </h1>
          <p data-ui="subtitle">Manage food and beverage options</p>
        </div>

        {/* 3. The "Drive me down" Button */}
        <button
          data-ui="btn"
          onClick={handleAddNewClick}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <Plus size={18} /> Add New Item{" "}
          <ArrowDown size={14} style={{ opacity: 0.6 }} />
        </button>
      </div>

      {/* Table Section */}
      <div style={{ marginBottom: "3rem" }}>
        <BaseTable
          columns={COLUMNS}
          data={items}
          loading={loading}
          onEdit={handleEditClick} // Scrolls down when clicked
          onDelete={handleDelete}
        />
      </div>

      {/* Form Section (Target of Scroll) */}
      <div
        ref={formRef}
        data-ui="card"
        style={{ padding: "2rem", borderTop: "4px solid var(--primary)" }}
      >
        <h2
          data-ui="label"
          style={{ marginBottom: "1.5rem", fontSize: "1.2rem" }}
        >
          {editing ? `Editing: ${editing.name}` : "Add New Item"}
        </h2>
        <BaseForm
          fields={FIELDS}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => {
            setEditing(null);
            // Optionally scroll back up? Usually keeping focus here is fine.
          }}
          initialData={editing}
          submitLabel={editing ? "Save Changes" : "Create Item"}
        />
      </div>
    </div>
  );
}
