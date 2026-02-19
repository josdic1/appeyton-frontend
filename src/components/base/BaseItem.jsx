// src/components/base/BaseItem.jsx
import { Eye, Pencil } from "lucide-react";

/**
 * BaseItem: A universal row component for data lists.
 * @param {Object} item - The raw data object.
 * @param {string} titleKey - The object key to use for the main heading.
 * @param {Array} metaFields - Array of {key, label} to show as sub-details.
 * @param {Function} onView - Callback for the "View" action.
 * @param {Function} onEdit - Callback for the "Edit" action.
 */
export function BaseItem({
  item,
  titleKey = "name",
  metaFields = [],
  onView,
  onEdit,
}) {
  return (
    <div data-ui="item" style={itemWrapperStyle}>
      <div
        data-ui="row"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        {/* Text Content */}
        <div style={textContentStyle}>
          <div data-ui="item-title" style={titleStyle}>
            {item[titleKey] || "Untitled Item"}
          </div>

          <div style={metaContainerStyle}>
            {metaFields.map((f) => (
              <div key={f.key} data-ui="item-meta" style={metaItemStyle}>
                <span style={metaLabelStyle}>{f.label}:</span>
                <span style={metaValueStyle}>{item[f.key] ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div data-ui="row" style={{ gap: 8, marginLeft: 16 }}>
          {onView && (
            <button
              type="button"
              data-ui="btn-refresh"
              onClick={onView}
              style={actionBtnStyle}
              title="View Details"
            >
              <Eye size={14} />
              <span>Inspect</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              data-ui="btn-refresh"
              onClick={onEdit}
              style={actionBtnStyle}
              title="Edit Record"
            >
              <Pencil size={14} />
              <span>Modify</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Styles (Standardized for Sterling Identity) ---

const itemWrapperStyle = {
  padding: "16px 20px",
  background: "#fff",
  border: "1px solid var(--border, #eee)",
  borderRadius: "12px",
  transition: "all 0.2s ease",
  marginBottom: "8px",
};

const textContentStyle = {
  display: "grid",
  gap: "6px",
  flex: 1,
};

const titleStyle = {
  fontSize: "1.05rem",
  fontWeight: 900,
  color: "var(--black, #000)",
  letterSpacing: "-0.5px",
};

const metaContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
};

const metaItemStyle = {
  fontSize: "0.75rem",
  display: "flex",
  gap: "4px",
  alignItems: "center",
};

const metaLabelStyle = {
  fontWeight: 800,
  textTransform: "uppercase",
  color: "#999",
  letterSpacing: "0.05em",
};

const metaValueStyle = {
  fontWeight: 700,
  color: "#666",
};

const actionBtnStyle = {
  padding: "6px 12px",
  fontSize: "0.75rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
