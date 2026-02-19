import { useEffect, useState } from "react";
import { useBase } from "../hooks/useBase";
import { BaseTable } from "../components/base/BaseTable";
import { BaseModal } from "../components/base/BaseModal";
import { useToastTrigger } from "../hooks/useToast";
import { safe } from "../utils/safe";
import { RefreshCw, Plus, Users, HeartPulse } from "lucide-react";

// --- Configuration ---
const RELATION_OPTIONS = [
  { value: "self", label: "Self (you)" },
  { value: "spouse", label: "Spouse / Partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "guest", label: "Guest / Friend" },
];

const DIETARY_OPTIONS = [
  { value: "", label: "None" },
  { value: "Vegetarian", label: "Vegetarian" },
  { value: "Vegan", label: "Vegan" },
  { value: "Gluten-free", label: "Gluten-free" },
  { value: "Nut allergy", label: "Nut allergy" },
  { value: "Dairy-free", label: "Dairy-free" },
];

const FORM_FIELDS = [
  { name: "name", label: "Full Name", type: "text", required: true },
  {
    name: "relation",
    label: "Relation",
    type: "select",
    options: RELATION_OPTIONS,
  },
  {
    name: "dietary_note",
    label: "Primary Dietary Restriction",
    type: "select",
    options: DIETARY_OPTIONS,
    hint: "Visible to kitchen staff when this person dines.",
  },
];

const COLUMNS = [
  {
    key: "name",
    label: "Name",
    render: (v) => <strong style={{ color: "#000" }}>{v}</strong>,
  },
  {
    key: "relation",
    label: "Relation",
    render: (v) => <span style={badgeStyle}>{v || "Guest"}</span>,
  },
  {
    key: "dietary_restrictions",
    label: "Dietary Alerts",
    render: (v) => {
      const note = !v ? "None" : typeof v === "string" ? v : v.note || "None";
      const isCritical = note !== "None";
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: isCritical ? "#ef4444" : "#666",
          }}
        >
          {isCritical && <HeartPulse size={14} />}
          <span
            style={{ fontSize: "0.875rem", fontWeight: isCritical ? 700 : 500 }}
          >
            {note}
          </span>
        </div>
      );
    },
  },
];

// --- Main Component ---
export function MembersPage() {
  const {
    items: rawItems,
    loading,
    refreshing,
    fetchAll,
    create,
    update,
    remove,
  } = useBase("members");
  const { addToast } = useToastTrigger();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const items = safe.array(rawItems);
  const isBusy = loading || refreshing;

  const handleSave = async (formData) => {
    const payload = {
      name: formData.name,
      relation: formData.relation || "guest",
      dietary_restrictions: formData.dietary_note
        ? { note: formData.dietary_note }
        : null,
    };

    const action = editing
      ? () => update(editing.id, payload)
      : () => create(payload);
    const result = await action();

    if (result.success) {
      addToast({
        status: "success",
        what: editing ? "Updated" : "Added",
        why: `${payload.name} synced.`,
      });
      setModalOpen(false);
      setEditing(null);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Header Section */}
      <section style={headerCardStyle}>
        <div style={headerRowStyle}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Users size={28} color="#f97316" />
              <h1
                style={{
                  margin: 0,
                  fontSize: "2rem",
                  fontWeight: 900,
                  color: "#000",
                }}
              >
                Family & Guests
              </h1>
            </div>
            <p style={{ margin: "4px 0 0", color: "#444", fontWeight: 600 }}>
              Manage frequent diners for faster bookings.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              style={addBtnStyle}
            >
              <Plus size={18} /> Add Member
            </button>
            <button
              onClick={fetchAll}
              disabled={isBusy}
              style={refreshBtnStyle}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section style={tableCardStyle}>
        <BaseTable
          columns={COLUMNS}
          data={items}
          loading={loading}
          onEdit={(m) => {
            setEditing(m);
            setModalOpen(true);
          }}
          onDelete={(id) => confirm("Remove member?") && remove(id)}
        />
        {items.length === 0 && !loading && (
          <div style={emptyStateStyle}>
            <h3>No members found</h3>
            <p>Click "Add Member" to get started.</p>
          </div>
        )}
      </section>

      <BaseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? `Edit ${editing.name}` : "New Family Member"}
        fields={FORM_FIELDS}
        initialData={
          editing
            ? {
                ...editing,
                dietary_note: editing.dietary_restrictions?.note || "",
              }
            : null
        }
        onSubmit={handleSave}
      />
    </div>
  );
}

// --- Styles (Forcing Legibility) ---
const containerStyle = {
  maxWidth: 1000,
  margin: "0 auto",
  padding: "40px 20px",
  display: "grid",
  gap: 24,
};
const headerCardStyle = {
  padding: "32px",
  background: "#fffdf5", // Cream
  border: "3px solid #000", // Thick black border
  borderRadius: "12px",
  boxShadow: "8px 8px 0px #000", // Brutalist Shadow
};
const tableCardStyle = {
  background: "white",
  border: "3px solid #000",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "8px 8px 0px #000",
};
const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 20,
};
const addBtnStyle = {
  background: "#000",
  color: "#fff",
  border: "none",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: 900,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
};
const refreshBtnStyle = {
  background: "#fff",
  border: "2px solid #000",
  padding: "12px",
  borderRadius: "8px",
  cursor: "pointer",
};
const badgeStyle = {
  padding: "4px 10px",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: 800,
  background: "#eee",
  border: "1px solid #000",
  color: "#000",
};
const emptyStateStyle = { textAlign: "center", padding: "40px", color: "#000" };
