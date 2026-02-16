// src/components/entities/EntityModal.jsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useData } from "../../hooks/useData";
import { useToastTrigger } from "../../hooks/useToast";

export function EntityModal({ open, onClose, mode, entity }) {
  const { createEntity, updateEntity } = useData();
  const { addToast } = useToastTrigger();

  const inEditMode = mode === "edit" && entity?.id;

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
  });

  useEffect(() => {
    if (!open) return;

    const newInitial = inEditMode && entity
      ? {
          name: entity.name ?? "",
          category: entity.category ?? "",
        }
      : {
          name: "",
          category: "",
        };

    setFormData(newInitial);
    setErr(null);
    setSaving(false);
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const canSave = Boolean(formData.name.trim()) && !saving;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);

    if (!formData.name.trim()) return setErr("Name is required.");

    setSaving(true);
    try {
      if (inEditMode) {
        await updateEntity(entity.id, formData);
        addToast({
          type: "success",
          title: "Updated",
          message: "Entity updated.",
        });
      } else {
        await createEntity(formData);
        addToast({
          type: "success",
          title: "Created",
          message: "Entity created.",
        });
      }
      onClose?.();
    } catch (x) {
      const msg = x?.message || "Save failed.";
      setErr(msg);
      addToast({ type: "error", title: "Save failed", message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div data-ui="card" style={{ width: "min(720px, 100%)" }}>
        <div
          data-ui="row"
          style={{ justifyContent: "space-between", alignItems: "start" }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div data-ui="title">{inEditMode ? "Edit Entity" : "New Entity"}</div>
            <div data-ui="subtitle">Clean. Fast. Keyboard-first.</div>
          </div>

          <button
            type="button"
            data-ui="btn-refresh"
            onClick={onClose}
            disabled={saving}
            title="Close"
          >
            <X size={16} />
            <span>Close</span>
          </button>
        </div>

        <div style={{ height: 12 }} />
        <div data-ui="divider" />
        <div style={{ height: 12 }} />

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span data-ui="label">Name</span>
            <input
              data-ui="input"
              name="name"
              value={formData.name}
              onChange={onChange}
              disabled={saving}
              placeholder="Entity name"
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span data-ui="label">Category</span>
            <input
              data-ui="input"
              name="category"
              value={formData.category}
              onChange={onChange}
              disabled={saving}
              placeholder="Optional category"
            />
          </label>

          {err ? (
            <div data-ui="empty">
              <div data-ui="empty-title">Fix this</div>
              <div data-ui="hint">{err}</div>
            </div>
          ) : null}

          <div data-ui="row" style={{ justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              data-ui="btn-refresh"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button type="submit" data-ui="btn-refresh" disabled={!canSave}>
              {saving ? "Saving…" : inEditMode ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}