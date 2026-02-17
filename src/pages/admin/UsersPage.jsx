// src/pages/admin/UsersPage.jsx
import { useEffect, useState } from "react";
import { useBase } from "../../hooks/useBase";
import { BaseTable } from "../../components/base/BaseTable";
import { BaseForm } from "../../components/base/BaseForm";
import { useToastTrigger } from "../../hooks/useToast";

const FIELDS = [
  { name: "name", label: "Full Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "password", label: "Password", type: "password", required: true },
  {
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    defaultValue: "member",
    options: [
      { value: "member", label: "Member" },
      { value: "staff", label: "Staff" },
      { value: "admin", label: "Admin" },
    ],
  },
  {
    name: "membership_status",
    label: "Status",
    type: "select",
    required: true,
    defaultValue: "active",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "pending", label: "Pending" },
    ],
  },
];

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  {
    key: "role",
    label: "Role",
    render: (v) => (
      <span
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "0.25rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          background: v === "admin" ? "var(--danger)" : "var(--info)",
          color: "#fff",
          textTransform: "uppercase",
        }}
      >
        {v}
      </span>
    ),
  },
  {
    key: "membership_status",
    label: "Status",
    render: (v) => {
      const colors = {
        active: "var(--success)",
        inactive: "var(--danger)",
        pending: "var(--warning)",
      };
      return (
        <span
          style={{
            padding: "0.25rem 0.5rem",
            borderRadius: "0.25rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            background: colors[v] || "var(--border)",
            color: "#fff",
            textTransform: "capitalize",
          }}
        >
          {v}
        </span>
      );
    },
  },
  {
    key: "created_at",
    label: "Joined",
    render: (v) => (v ? new Date(v).toLocaleDateString() : "N/A"),
  },
];

export function UsersPage() {
  const { items, loading, fetchAll, create, update, remove } =
    useBase("admin/users");
  const { addToast } = useToastTrigger();
  const [editing, setEditing] = useState(null);
  const [fields, setFields] = useState(FIELDS);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    setFields(
      editing
        ? FIELDS.map((f) =>
            f.name === "password"
              ? {
                  ...f,
                  required: false,
                  label: "New Password (blank = keep current)",
                }
              : f,
          )
        : FIELDS,
    );
  }, [editing]);

  const handleCreate = async (data) => {
    const result = await create(data);
    result.success
      ? addToast({ type: "success", title: "Created", message: "User created" })
      : addToast({ type: "error", title: "Error", message: result.error });
  };

  const handleUpdate = async (data) => {
    const updateData = { ...data };
    if (!updateData.password) delete updateData.password;
    const result = await update(editing.id, updateData);
    if (result.success) {
      addToast({ type: "success", title: "Updated", message: "User updated" });
      setEditing(null);
    } else addToast({ type: "error", title: "Error", message: result.error });
  };

  const handleDelete = async (id) => {
    const result = await remove(id);
    result.success
      ? addToast({ type: "success", title: "Deleted", message: "User deleted" })
      : addToast({ type: "error", title: "Error", message: result.error });
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1
          data-ui="title"
          style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
        >
          Users & Members
        </h1>
        <p data-ui="subtitle">Manage user accounts and membership status</p>
      </div>
      <div style={{ display: "grid", gap: "2rem" }}>
        <BaseTable
          columns={COLUMNS}
          data={items}
          loading={loading}
          onEdit={(user) => {
            const { password, ...u } = user;
            setEditing(u);
          }}
          onDelete={handleDelete}
        />
        <div>
          <h2 data-ui="label" style={{ marginBottom: "1rem" }}>
            {editing ? "Edit User" : "Add New User"}
          </h2>
          <BaseForm
            fields={fields}
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
