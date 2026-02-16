// src/components/entities/EntityForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { useData } from "../../hooks/useData";
import { useToastTrigger } from "../../hooks/useToast";

export function EntityForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToast } = useToastTrigger();

  const entityId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);

  const inEditMode = Boolean(entityId);

  const { entities = [], createEntity, updateEntity } = useData();

  const editingEntity = useMemo(() => {
    if (!inEditMode) return null;
    return (
      (Array.isArray(entities) ? entities : []).find(
        (e) => e.id === entityId,
      ) || null
    );
  }, [inEditMode, entityId, entities]);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const initial = useMemo(() => {
    if (inEditMode && editingEntity) {
      return {
        name: editingEntity.name ?? "",
        category: editingEntity.category ?? "",
      };
    }
    return {
      name: "",
      category: "",
    };
  }, [inEditMode, editingEntity]);

  const [formData, setFormData] = useState(initial);

  useEffect(() => {
    setFormData(initial);
    setErr(null);
    setSaving(false);
  }, [initial]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") nav("/entities");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: value,
    }));
  };

  const canSave = Boolean(formData.name.trim()) && !saving;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);

    if (!formData.name.trim()) return setErr("Name is required.");

    setSaving(true);
    try {
      if (inEditMode) {
        await updateEntity(entityId, formData);
        addToast({
          type: "success",
          title: "Updated",
          message: "Entity saved.",
        });
      } else {
        await createEntity(formData);
        addToast({
          type: "success",
          title: "Created",
          message: "Entity created.",
        });
      }

      nav("/entities");
    } catch (x) {
      const msg = x?.message || "Save failed.";
      setErr(msg);
      addToast({ type: "error", title: "Save failed", message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (inEditMode && !editingEntity) {
    return (
      <div
        data-ui="card"
        style={{ width: "min(980px, 100%)", margin: "0 auto" }}
      >
        <div data-ui="title">Entity not found</div>
        <div style={{ height: 10 }} />
        <button
          data-ui="btn-refresh"
          type="button"
          onClick={() => nav("/entities")}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "min(980px, 100%)", margin: "0 auto", padding: 14 }}>
      <section data-ui="card">
        <div
          data-ui="row"
          style={{ justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div data-ui="title">
              {inEditMode ? "Edit Entity" : "New Entity"}
            </div>
            <div data-ui="subtitle">Clean. Fast. Keyboard-first.</div>
          </div>

          <div data-ui="row" style={{ gap: 10 }}>
            <button
              data-ui="btn-refresh"
              type="button"
              onClick={() => nav("/entities")}
              disabled={saving}
              title="Cancel (Esc)"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div style={{ height: 14 }} />
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

          <div
            data-ui="row"
            style={{ gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}
          >
            <button
              type="button"
              data-ui="btn-refresh"
              onClick={() => nav("/entities")}
              disabled={saving}
            >
              <X size={16} />
              <span>Cancel</span>
            </button>

            <button type="submit" data-ui="btn-refresh" disabled={!canSave}>
              <Save size={16} />
              <span>
                {saving ? "Saving…" : inEditMode ? "Update" : "Create"}
              </span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
