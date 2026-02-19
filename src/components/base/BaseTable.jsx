// src/components/base/BaseTable.jsx
import { useState } from "react";
import { Loader2, Trash2, Edit3, Check, X as CancelIcon } from "lucide-react";

/**
 * BaseTable: Optimized for high-density admin views.
 * Features: Inline confirmation, custom renderers, and hover-intent states.
 */
export function BaseTable({
  columns,
  data = [],
  onEdit,
  onDelete,
  loading = false,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const handleConfirm = async (id) => {
    setConfirmId(null);
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div style={loadingWrapperStyle}>
        <Loader2 className="animate-spin" size={32} color="var(--muted)" />
        <p style={{ fontWeight: 700, marginTop: 12 }}>Syncing Ledger...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={emptyStateStyle}>
        <div data-ui="subtitle">No records found in this category.</div>
      </div>
    );
  }

  return (
    <div style={tableContainerStyle}>
      <table style={tableElementStyle}>
        <thead>
          <tr style={theadRowStyle}>
            {columns.map((col) => (
              <th key={col.key} style={thStyle}>
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th style={thActionStyle}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} style={trStyle}>
              {columns.map((col) => (
                <td key={col.key} style={tdStyle}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}

              {(onEdit || onDelete) && (
                <td style={tdActionStyle}>
                  {confirmId === row.id ? (
                    /* TWO-STEP CONFIRMATION UI */
                    <div style={inlineConfirmGroup}>
                      <span style={sureTextStyle}>Confirm Delete?</span>
                      <button
                        onClick={() => handleConfirm(row.id)}
                        style={confirmYesBtn}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        style={confirmNoBtn}
                      >
                        <CancelIcon size={14} />
                      </button>
                    </div>
                  ) : (
                    /* DEFAULT ACTION BUTTONS */
                    <div style={btnGroupStyle}>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          style={editBtnStyle}
                        >
                          <Edit3 size={14} /> <span>Edit</span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => setConfirmId(row.id)}
                          disabled={deletingId === row.id}
                          style={deleteBtnStyle}
                        >
                          {deletingId === row.id ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <>
                              <Trash2 size={14} /> <span>Delete</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Styles (Themed for Sterling Identity) ---

const tableContainerStyle = {
  overflowX: "auto",
  background: "#fff",
  borderRadius: "12px",
  border: "2px solid #000",
};
const tableElementStyle = { width: "100%", borderCollapse: "collapse" };
const theadRowStyle = { background: "#f8f8f8", borderBottom: "2px solid #000" };

const thStyle = {
  padding: "16px",
  textAlign: "left",
  fontSize: "0.7rem",
  fontWeight: 900,
  textTransform: "uppercase",
  color: "#999",
  letterSpacing: "0.1em",
};
const thActionStyle = { ...thStyle, textAlign: "right" };

const trStyle = {
  borderBottom: "1px solid #eee",
  transition: "background 0.2s",
};
const tdStyle = {
  padding: "16px",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#333",
};
const tdActionStyle = { padding: "16px", textAlign: "right" };

const btnGroupStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
};
const editBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  background: "transparent",
  border: "1px solid #ddd",
  borderRadius: "6px",
  fontSize: "0.75rem",
  fontWeight: 800,
  cursor: "pointer",
};
const deleteBtnStyle = {
  ...editBtnStyle,
  color: "var(--danger, #ef4444)",
  borderColor: "rgba(239,68,68,0.2)",
};

const inlineConfirmGroup = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "6px",
  alignItems: "center",
  animation: "fadeIn 0.2s ease",
};
const sureTextStyle = {
  fontSize: "0.7rem",
  fontWeight: 900,
  color: "var(--danger)",
  textTransform: "uppercase",
  marginRight: 8,
};
const confirmYesBtn = {
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "6px",
  cursor: "pointer",
};
const confirmNoBtn = {
  background: "#eee",
  color: "#000",
  border: "none",
  borderRadius: "4px",
  padding: "6px",
  cursor: "pointer",
};

const loadingWrapperStyle = {
  textAlign: "center",
  padding: "60px",
  background: "#fff",
  borderRadius: "12px",
  border: "2px solid #000",
};
const emptyStateStyle = { textAlign: "center", padding: "40px", color: "#999" };
