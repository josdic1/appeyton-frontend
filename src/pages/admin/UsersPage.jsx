import { useEffect, useState, useMemo } from "react";
import { useBase } from "../../hooks/useBase";
import { BaseTable } from "../../components/base/BaseTable";
import { BaseForm } from "../../components/base/BaseForm";
import { useToastTrigger } from "../../hooks/useToast";
import { safe } from "../../utils/safe";
import { Users, ShieldAlert, UserCheck, Shield } from "lucide-react";

const BASE_FIELDS = [
  { name: "name", label: "Full Name", type: "text", required: true },
  { name: "email", label: "Email Address", type: "email", required: true },
  { name: "password", label: "Password", type: "password", required: true },
  {
    name: "role",
    label: "Access Role",
    type: "select",
    required: true,
    options: [
      { value: "member", label: "Member" },
      { value: "staff", label: "Staff" },
      { value: "admin", label: "Administrator" },
    ],
  },
  {
    name: "membership_status",
    label: "Account Status",
    type: "select",
    required: true,
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "pending", label: "Pending Verification" },
    ],
  },
];

const COLUMNS = [
  {
    key: "name",
    label: "User",
    style: { fontWeight: 900, color: "var(--black)" },
  },
  { key: "email", label: "Email", style: { fontSize: "0.85rem" } },
  {
    key: "role",
    label: "Role",
    render: (v) => {
      const isAdmin = v === "admin";
      return (
        <span
          style={{
            ...badgeBase,
            background: isAdmin ? "#ef4444" : "#3b82f6",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {isAdmin ? <Shield size={10} /> : <Users size={10} />}{" "}
          {v.toUpperCase()}
        </span>
      );
    },
  },
  {
    key: "membership_status",
    label: "Status",
    render: (v) => {
      const colorMap = {
        active: "#10b981",
        inactive: "#666",
        pending: "#f59e0b",
      };
      return (
        <span
          style={{
            color: colorMap[v] || "#666",
            fontWeight: 800,
            fontSize: "0.75rem",
            textTransform: "uppercase",
          }}
        >
          ● {v}
        </span>
      );
    },
  },
];

export function UsersPage() {
  const {
    items: rawItems,
    loading,
    fetchAll,
    create,
    update,
    remove,
  } = useBase("users");
  const { addToast } = useToastTrigger();
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const items = safe.array(rawItems);

  // Dynamic fields: Don't require password when editing an existing user
  const fields = useMemo(() => {
    return BASE_FIELDS.map((f) => {
      if (f.name === "password" && editing) {
        return {
          ...f,
          required: false,
          label: "New Password (Optional)",
          hint: "Leave blank to keep current password.",
        };
      }
      return f;
    });
  }, [editing]);

  const handleCreate = async (data) => {
    const result = await create(data);
    if (result.success) {
      addToast({
        status: "success",
        what: "Account Created",
        why: `The credentials for ${data.name} are now active.`,
        how: "The user can now log in with the assigned role.",
      });
      fetchAll();
    } else {
      addToast({ status: "error", what: "Creation Failed", why: result.error });
    }
  };

  const handleUpdate = async (data) => {
    // Scrub empty password so we don't overwrite with a blank string
    const payload = { ...data };
    if (!payload.password) delete payload.password;

    const result = await update(editing.id, payload);
    if (result.success) {
      addToast({
        status: "success",
        what: "User Updated",
        why: `Profile for ${data.name} was successfully modified.`,
        how: "Permissions or credentials have been synced system-wide.",
      });
      setEditing(null);
      fetchAll();
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm("Permanently delete this user account? This cannot be undone.")
    )
      return;
    const result = await remove(id);
    if (result.success) {
      addToast({
        status: "success",
        what: "User Deleted",
        why: "The account has been purged from the system.",
      });
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <UserCheck size={32} color="var(--orange)" />
            <h1
              style={{
                margin: 0,
                fontSize: "2.4rem",
                fontWeight: 900,
                letterSpacing: "-1.5px",
              }}
            >
              Directory
            </h1>
          </div>
          <p style={{ margin: "4px 0 0", color: "#666", fontWeight: 600 }}>
            Manage authentication accounts and system roles
          </p>
        </div>
      </header>

      <div style={contentGridStyle}>
        <section data-ui="card" style={tableCardStyle}>
          <BaseTable
            columns={COLUMNS}
            data={items}
            loading={loading}
            onEdit={(u) => setEditing(u)}
            onDelete={handleDelete}
          />
        </section>

        <section data-ui="card" style={editorCardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <ShieldAlert size={20} color="var(--orange)" />
            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900 }}>
              {editing ? `Modify: ${editing.name}` : "Provision Account"}
            </h2>
          </div>

          <BaseForm
            fields={fields}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={editing ? () => setEditing(null) : null}
            initialData={editing}
            submitLabel={editing ? "Update Permissions" : "Create Account"}
          />
        </section>
      </div>
    </div>
  );
}

// --- Styles ---

const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "40px 20px",
};
const headerStyle = { marginBottom: "40px" };
const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 400px",
  gap: "32px",
  alignItems: "start",
};
const tableCardStyle = {
  background: "white",
  borderRadius: "16px",
  border: "1px solid #eee",
  overflow: "hidden",
};
const editorCardStyle = {
  padding: "32px",
  background: "var(--cream)",
  borderRadius: "16px",
  border: "2px solid #000",
};
const badgeBase = {
  padding: "3px 8px",
  borderRadius: "4px",
  fontSize: "0.65rem",
  fontWeight: 900,
  color: "white",
};
