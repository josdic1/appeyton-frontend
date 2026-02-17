// src/components/base/BaseItem.jsx
import { Eye, Pencil } from "lucide-react";

export function BaseItem({ item, titleKey = "name", metaFields = [], onView, onEdit }) {
  return (
    <div data-ui="item">
      <div data-ui="row" style={{ justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div data-ui="item-title">{item[titleKey]}</div>
          {metaFields.map((f) => (
            <div key={f.key} data-ui="item-meta">
              {f.label}: {item[f.key] ?? "None"}
            </div>
          ))}
        </div>
        <div data-ui="row" style={{ gap: 8 }}>
          {onView && (
            <button type="button" data-ui="btn-refresh" onClick={onView} title="View">
              <Eye size={16} /><span>View</span>
            </button>
          )}
          {onEdit && (
            <button type="button" data-ui="btn-refresh" onClick={onEdit} title="Edit">
              <Pencil size={16} /><span>Edit</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}