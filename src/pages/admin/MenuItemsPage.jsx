import { useEffect, useState, useRef } from "react";
import { useBase } from "../../hooks/useBase";
import { BaseTable } from "../../components/base/BaseTable";
import { BaseForm } from "../../components/base/BaseForm";
import { useToastTrigger } from "../../hooks/useToast";
import { safe } from "../../utils/safe";
import { Plus, ArrowDown, UtensilsCrossed } from "lucide-react";

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
    label: "Available to Guests",
    type: "checkbox",
    defaultValue: true,
  },
];

const COLUMNS = [
  {
    key: "name",
    label: "Name",
    style: { fontWeight: 900, color: "var(--black)" },
  },
  {
    key: "category",
    label: "Category",
    render: (v) => <span style={categoryBadgeStyle}>{v}</span>,
  },
  {
    key: "price",
    label: "Price",
    render: (v) => (v ? `$${parseFloat(v).toFixed(2)}` : "$0.00"),
  },
  {
    key: "is_available",
    label: "Status",
    render: (v) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 700,
          fontSize: "0.8rem",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: v ? "#10b981" : "#999",
          }}
        />
        <span style={{ color: v ? "#10b981" : "#999" }}>
          {v ? "AVAILABLE" : "HIDDEN"}
        </span>
      </div>
    ),
  },
];

export function MenuItemsPage() {
  // Path normalized: /api/menu-items
  const {
    items: rawItems,
    loading,
    fetchAll,
    create,
    update,
    remove,
  } = useBase("menu-items?available_only=false");
  const { addToast } = useToastTrigger();
  const [editing, setEditing] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const items = safe.array(rawItems);

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleCreate = async (data) => {
    const result = await create(data);
    if (result.success) {
      addToast({
        status: "success",
        what: "Item Created",
        why: `${data.name} has been added to the master menu.`,
        how: "It is now visible to guests and staff.",
      });
      fetchAll();
    } else {
      addToast({ status: "error", what: "Creation Failed", why: result.error });
    }
  };

  const handleUpdate = async (data) => {
    const result = await update(editing.id, data);
    if (result.success) {
      addToast({
        status: "success",
        what: "Item Updated",
        why: `Changes to ${data.name} have been saved.`,
        how: "All active digital menus have been synchronized.",
      });
      setEditing(null);
      fetchAll();
    } else {
      addToast({ status: "error", what: "Update Failed", why: result.error });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Permanently remove this menu item?")) return;
    const result = await remove(id);
    if (result.success) {
      addToast({
        status: "success",
        what: "Item Deleted",
        why: "The item has been removed from the database.",
        how: "This action cannot be undone.",
      });
      fetchAll();
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <UtensilsCrossed size={28} color="var(--orange)" />
            <h1
              style={{
                margin: 0,
                fontSize: "2.2rem",
                fontWeight: 900,
                letterSpacing: "-1px",
              }}
            >
              Menu Inventory
            </h1>
          </div>
          <p style={{ margin: "4px 0 0", color: "#666", fontWeight: 600 }}>
            Configure dishes and beverage availability
          </p>
        </div>

        <button
          data-ui="btn"
          onClick={() => {
            setEditing(null);
            scrollToForm();
          }}
          style={addBtnStyle}
        >
          <Plus size={18} /> Add New Item{" "}
          <ArrowDown size={14} style={{ opacity: 0.6 }} />
        </button>
      </header>

      <section data-ui="card" style={tableCardStyle}>
        <BaseTable
          columns={COLUMNS}
          data={items}
          loading={loading}
          onEdit={(item) => {
            setEditing(item);
            scrollToForm();
          }}
          onDelete={handleDelete}
        />
      </section>

      <div ref={formRef} data-ui="card" style={editorCardStyle}>
        <div style={editorHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900 }}>
            {editing ? `Editing: ${editing.name}` : "Create New Menu Item"}
          </h2>
          {editing && (
            <button onClick={() => setEditing(null)} style={cancelBtnStyle}>
              Cancel Edit
            </button>
          )}
        </div>

        <BaseForm
          fields={FIELDS}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => setEditing(null)}
          initialData={editing}
          submitLabel={editing ? "Save Changes" : "Publish to Menu"}
        />
      </div>
    </div>
  );
}

// --- Styles ---

const containerStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "40px 20px",
  display: "grid",
  gap: 32,
};
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 20,
};
const addBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "var(--black)",
  color: "white",
  padding: "12px 24px",
  borderRadius: "8px",
  border: "none",
  fontWeight: 800,
  cursor: "pointer",
};
const tableCardStyle = {
  background: "white",
  borderRadius: "16px",
  border: "1px solid #eee",
  overflow: "hidden",
};
const editorCardStyle = {
  padding: "40px",
  background: "var(--cream, #fffdf5)",
  borderRadius: "16px",
  border: "2px solid #000",
};
const editorHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
};
const cancelBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#666",
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "underline",
};
const categoryBadgeStyle = {
  textTransform: "uppercase",
  fontSize: "0.65rem",
  fontWeight: 800,
  padding: "3px 8px",
  borderRadius: "4px",
  background: "#f0f0f0",
  border: "1px solid #ddd",
  letterSpacing: "0.5px",
};
