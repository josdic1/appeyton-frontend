// src/components/entities/EntityItem.jsx
import { Eye, Pencil } from "lucide-react";

export function EntityItem({ entity, onView, onEdit }) {
  return (
    <div data-ui="item">
      <div
        data-ui="row"
        style={{ justifyContent: "space-between", alignItems: "start" }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <div data-ui="item-title">{entity.name}</div>
          <div data-ui="item-meta">Category: {entity.category || "None"}</div>
        </div>

        <div data-ui="row" style={{ gap: 8 }}>
          <button
            type="button"
            data-ui="btn-refresh"
            onClick={onView}
            title="View"
          >
            <Eye size={16} />
            <span>View</span>
          </button>
          <button
            type="button"
            data-ui="btn-refresh"
            onClick={onEdit}
            title="Edit"
          >
            <Pencil size={16} />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
