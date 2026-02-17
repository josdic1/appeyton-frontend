// src/components/BaseForm.jsx
import { useState, useEffect } from "react";

export function BaseForm({
  fields,
  onSubmit,
  onCancel,
  initialData = null,
  submitLabel = "Save",
}) {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const defaults = {};
      fields.forEach((field) => {
        if (field.defaultValue !== undefined)
          defaults[field.name] = field.defaultValue;
      });
      setFormData(defaults);
    }
  }, [initialData, fields]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName])
      setErrors((prev) => ({ ...prev, [fieldName]: null }));
  };

  const validate = () => {
    const newErrors = {};
    fields.forEach((field) => {
      if (field.required && !formData[field.name])
        newErrors[field.name] = `${field.label} is required`;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
      if (!initialData) setFormData({});
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.name] ?? "";
    const error = errors[field.name];
    const commonStyle = {
      width: "100%",
      padding: "0.75rem",
      fontSize: "0.875rem",
      background: "var(--panel)",
      border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
      borderRadius: "var(--radius-sm)",
      color: "var(--text)",
      outline: "none",
      transition: "border-color 0.2s",
    };
    const commonProps = {
      value,
      onChange: (e) => handleChange(field.name, e.target.value),
      disabled: submitting,
      style: commonStyle,
    };

    switch (field.type) {
      case "textarea":
        return <textarea {...commonProps} rows={4} />;
      case "select":
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              disabled={submitting}
            />
            <span style={{ fontSize: "0.875rem" }}>{field.label}</span>
          </label>
        );
      default:
        return <input {...commonProps} type={field.type || "text"} />;
    }
  };

  return (
    <form onSubmit={handleSubmit} data-ui="card">
      <div data-ui="stack">
        {fields.map((field) => (
          <div key={field.name}>
            {field.type !== "checkbox" && (
              <label
                data-ui="label"
                style={{ display: "block", marginBottom: "0.5rem" }}
              >
                {field.label}
                {field.required && (
                  <span style={{ color: "var(--danger)" }}> *</span>
                )}
              </label>
            )}
            {renderField(field)}
            {errors[field.name] && (
              <div
                style={{
                  color: "var(--danger)",
                  fontSize: "0.75rem",
                  marginTop: "0.25rem",
                }}
              >
                {errors[field.name]}
              </div>
            )}
          </div>
        ))}
        <div data-ui="row" style={{ gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            data-ui="btn"
            type="submit"
            disabled={submitting}
            style={{ flex: 1 }}
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                color: "var(--text)",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
