export function AuditExplorer({ log, onClose }) {
  if (!log) return null;
  const diffs = getAclDiff(log.details.old_snapshot, log.details.new_snapshot);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000
    }}>
      <div style={{
        background: '#1e293b', padding: '2rem', borderRadius: '12px', 
        width: '600px', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'white', margin: 0 }}>Change Details</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
        </div>

        {diffs.length === 0 ? (
          <p style={{ color: '#64748b' }}>No logical changes detected (likely a re-save of the same state).</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {diffs.map((d, i) => (
              <div key={i} style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #818cf8' }}>
                <div style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 'bold', marginBottom: '4px' }}>
                  {d.role.toUpperCase()} / {d.entity}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                  <span style={{ fontSize: '0.8rem' }}>{d.action}:</span>
                  <span style={{ color: '#f87171', textDecoration: 'line-through' }}>{d.oldVal}</span>
                  <span style={{ color: '#64748b' }}>&rarr;</span>
                  <span style={{ color: '#34d399' }}>{d.newVal}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}