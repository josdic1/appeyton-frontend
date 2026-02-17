// src/components/BaseTable.jsx
import { useState } from 'react';

export function BaseTable({ 
  columns, 
  data = [], 
  onEdit, 
  onDelete, 
  loading = false 
}) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (item) => {
    if (!confirm(`Delete ${item.name || item.id}?`)) return;
    setDeleting(item.id);
    await onDelete(item.id);
    setDeleting(null);
  };

  if (loading) {
    return (
      <div data-ui="skeleton">
        <div data-ui="skeleton-line" data-size="lg"></div>
        <div data-ui="skeleton-line" data-size="md"></div>
        <div data-ui="skeleton-line" data-size="lg"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div data-ui="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <div data-ui="subtitle">No items found</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--panel)' }}>
            {columns.map(col => (
              <th key={col.key} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--panel)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div data-ui="row" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                    {onEdit && (
                      <button onClick={() => onEdit(row)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700, background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text)', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                      >Edit</button>
                    )}
                    {onDelete && (
                      <button onClick={() => handleDelete(row)} disabled={deleting === row.id}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700, background: 'transparent', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', cursor: deleting === row.id ? 'not-allowed' : 'pointer', color: 'var(--danger)', opacity: deleting === row.id ? 0.5 : 1, transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { if (deleting !== row.id) { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger)'; }}
                      >{deleting === row.id ? 'Deleting...' : 'Delete'}</button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}