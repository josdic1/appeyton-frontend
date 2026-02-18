// src/pages/MembersPage.jsx
// Manage family members under the logged-in user's account.
// Uses BasePage pattern: BaseTable + BaseModal + BaseForm.
// Members are stored in /api/members and represent people
// who can be added as attendees to reservations.
//
// Fields: name, relation (Spouse, Child, Parent, Sibling, Guest),
//         dietary_restrictions (freetext note)

import { useEffect, useState } from "react";
import { useBase } from "../hooks/useBase";
import { BaseTable } from "../components/base/BaseTable";
import { BaseModal } from "../components/base/BaseModal";
import { useToastTrigger } from "../hooks/useToast";
import { RefreshCw, Plus, Users } from "lucide-react";

const RELATION_OPTIONS = [
  { value: "self", label: "Self (you)" },
  { value: "spouse", label: "Spouse / Partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "guest", label: "Guest / Friend" },
  { value: "other", label: "Other" },
];

const DIETARY_OPTIONS = [
  { value: "", label: "None" },
  { value: "Vegetarian", label: "Vegetarian" },
  { value: "Vegan", label: "Vegan" },
  { value: "Gluten-free", label: "Gluten-free" },
  { value: "Halal", label: "Halal" },
  { value: "Kosher", label: "Kosher" },
  { value: "Nut allergy", label: "Nut allergy" },
  { value: "Dairy-free", label: "Dairy-free" },
];

const FORM_FIELDS = [
  {
    name: "name",
    label: "Full Name",
    type: "text",
    required: true,
  },
  {
    name: "relation",
    label: "Relation",
    type: "select",
    required: false,
    options: RELATION_OPTIONS,
    placeholder: "Select relation…",
  },
  {
    name: "dietary_note",
    label: "Dietary Restrictions",
    type: "select",
    required: false,
    options: DIETARY_OPTIONS,
    hint: "Used to inform kitchen staff when they dine with you",
  },
];

const COLUMNS = [
  { key: "name", label: "Name" },
  {
    key: "relation",
    label: "Relation",
    render: (v) => (
      <span
        style={{
          padding: "0.2rem 0.5rem",
          borderRadius: "0.25rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          background: "var(--panel)",
          border: "1px solid var(--border)",
          textTransform: "capitalize",
          color: "var(--text)",
        }}
      >
        {v || "—"}
      </span>
    ),
  },
  {
    key: "dietary_restrictions",
    label: "Dietary",
    render: (v) => {
      const note = !v
        ? "None"
        : typeof v === "string"
          ? v
          : v.note || Object.values(v).join(", ");
      return (
        <span
          style={{
            color: note === "None" ? "var(--muted)" : "var(--text)",
            fontSize: "0.875rem",
          }}
        >
          {note}
        </span>
      );
    },
  },
  {
    key: "created_at",
    label: "Added",
    render: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
  },
];

export function MembersPage() {
  const { items, loading, refreshing, fetchAll, create, update, remove } =
    useBase("members");
  const { addToast } = useToastTrigger();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // member object or null

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const isBusy = loading || refreshing;

  // Flatten dietary_restrictions.note → dietary_note for the form
  const toFormData = (member) => ({
    ...member,
    dietary_note: member?.dietary_restrictions?.note || "",
  });

  // Pack dietary_note back into dietary_restrictions before saving
  const fromFormData = (formData) => ({
    name: formData.name,
    relation: formData.relation || null,
    dietary_restrictions: formData.dietary_note
      ? { note: formData.dietary_note }
      : null,
  });

  const handleSave = async (formData) => {
    const payload = fromFormData(formData);
    if (editing) {
      const result = await update(editing.id, payload);
      result.success
        ? addToast({
            type: "success",
            title: "Updated",
            message: `${payload.name} updated`,
          })
        : addToast({ type: "error", title: "Error", message: result.error });
    } else {
      const result = await create(payload);
      result.success
        ? addToast({
            type: "success",
            title: "Added",
            message: `${payload.name} added to your family`,
          })
        : addToast({ type: "error", title: "Error", message: result.error });
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleEdit = (member) => {
    setEditing(member);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await remove(id);
    result.success
      ? addToast({
          type: "success",
          title: "Removed",
          message: "Family member removed",
        })
      : addToast({ type: "error", title: "Error", message: result.error });
  };

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <div
      data-ui="home"
      style={{
        width: "100%",
        display: "grid",
        justifyItems: "center",
        gap: 14,
      }}
    >
      {/* Header */}
      <section data-ui="card" style={{ width: "min(980px, 100%)" }}>
        <div
          data-ui="row"
          style={{ justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div data-ui="row" style={{ gap: 10 }}>
              <Users size={20} style={{ color: "var(--primary)" }} />
              <div data-ui="title">Family Members</div>
            </div>
            <div data-ui="subtitle">
              People you can add to your reservations as attendees
            </div>
          </div>
          <div data-ui="row" style={{ gap: 10 }}>
            <div
              data-ui="pill"
              data-variant={
                loading ? "info" : refreshing ? "warning" : "success"
              }
            >
              {loading
                ? "Loading…"
                : refreshing
                  ? "Syncing…"
                  : `${items.length} member${items.length !== 1 ? "s" : ""}`}
            </div>
            <button data-ui="btn-refresh" onClick={fetchAll} disabled={isBusy}>
              <RefreshCw size={16} data-spin={refreshing ? "true" : "false"} />
              <span>Refresh</span>
            </button>
            <button data-ui="btn-refresh" onClick={openNew} disabled={isBusy}>
              <Plus size={16} />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {items.length === 0 && !loading && (
          <div style={{ marginTop: "1.5rem" }}>
            <div data-ui="divider" />
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                color: "var(--muted)",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👨‍👩‍👧‍👦</div>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
                No family members yet
              </div>
              <div style={{ fontSize: "0.875rem" }}>
                Add your family members so you can quickly select them when
                booking a reservation.
              </div>
              <button
                data-ui="btn"
                onClick={openNew}
                style={{
                  marginTop: "1rem",
                  width: "auto",
                  paddingLeft: "2rem",
                  paddingRight: "2rem",
                }}
              >
                + Add your first member
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Table */}
      {items.length > 0 && (
        <section data-ui="card" style={{ width: "min(980px, 100%)" }}>
          <BaseTable
            columns={COLUMNS}
            data={items}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </section>
      )}

      {/* Modal */}
      <BaseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? `Edit ${editing.name}` : "Add Family Member"}
        subtitle={
          editing
            ? "Update this person's details"
            : "Add someone to your household or guest list"
        }
        fields={FORM_FIELDS}
        initialData={editing ? toFormData(editing) : null}
        onSubmit={handleSave}
        submitLabel={editing ? "Save Changes" : "Add Member"}
      />
    </div>
  );
}
