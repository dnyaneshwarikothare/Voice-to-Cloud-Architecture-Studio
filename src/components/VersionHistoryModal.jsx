import React, { useState } from 'react';
import { History, X, Plus, GitCompare, ArrowRight, Check, Trash2, Clock } from 'lucide-react';

export function VersionHistoryModal({
  isOpen,
  onClose,
  versionHistory = [],
  onSaveVersion,
  onRestoreVersion
}) {
  const [selectedV1, setSelectedV1] = useState(0);
  const [selectedV2, setSelectedV2] = useState(versionHistory.length > 1 ? 1 : 0);
  const [isComparing, setIsComparing] = useState(false);
  const [versionNote, setVersionNote] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveVersion(versionNote.trim() || `Snapshot #${versionHistory.length + 1}`);
    setVersionNote('');
  };

  const v1 = versionHistory[selectedV1];
  const v2 = versionHistory[selectedV2];

  // Calculate diff between v1 and v2
  let added = [];
  let removed = [];
  let common = [];

  if (v1 && v2) {
    const v1CompMap = new Map(v1.architecture.components.map(c => [c.id, c]));
    const v2CompMap = new Map(v2.architecture.components.map(c => [c.id, c]));

    // Added in v2 compared to v1
    v2.architecture.components.forEach(c => {
      if (!v1CompMap.has(c.id)) {
        added.push(c);
      } else {
        common.push(c);
      }
    });

    // Removed in v2 compared to v1
    v1.architecture.components.forEach(c => {
      if (!v2CompMap.has(c.id)) {
        removed.push(c);
      }
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Architecture Version History & Comparison
            </h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Save New Version Form */}
          <form onSubmit={handleSave} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Version Note (e.g. Added Redis & CDN tier)"
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              style={{
                flex: 1,
                background: '#0b0f19',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '7px 10px',
                color: '#fff',
                fontSize: '0.78rem'
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              <Plus size={14} />
              Save Current Version
            </button>
          </form>

          {/* Version List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
            {versionHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '16px', fontSize: '0.78rem' }}>
                No versions saved yet. Click "Save Current Version" above to create your first milestone snapshot.
              </div>
            ) : (
              versionHistory.map((ver, idx) => (
                <div
                  key={ver.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.78rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                      v{idx + 1}
                    </span>
                    <span style={{ color: '#f8fafc', fontWeight: 500 }}>
                      {ver.note || 'Milestone'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      ({ver.architecture.components.length} components)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onRestoreVersion(ver)}
                      style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comparison Tool */}
          {versionHistory.length >= 2 && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GitCompare size={14} color="#818cf8" />
                  Compare Versions Diff
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={selectedV1}
                  onChange={(e) => setSelectedV1(Number(e.target.value))}
                  style={{ flex: 1, background: '#0b0f19', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '0.74rem' }}
                >
                  {versionHistory.map((v, i) => (
                    <option key={i} value={i}>Base: v{i + 1} - {v.note}</option>
                  ))}
                </select>

                <ArrowRight size={14} color="#64748b" />

                <select
                  value={selectedV2}
                  onChange={(e) => setSelectedV2(Number(e.target.value))}
                  style={{ flex: 1, background: '#0b0f19', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '6px', color: '#fff', fontSize: '0.74rem' }}
                >
                  {versionHistory.map((v, i) => (
                    <option key={i} value={i}>Compared: v{i + 1} - {v.note}</option>
                  ))}
                </select>
              </div>

              {/* Diff Output */}
              <div style={{ background: '#070b12', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ color: '#10b981', fontWeight: 600 }}>
                  + Added in v{selectedV2 + 1}: {added.length > 0 ? added.map(c => c.name).join(', ') : 'None'}
                </div>
                <div style={{ color: '#f43f5e', fontWeight: 600 }}>
                  - Removed in v{selectedV2 + 1}: {removed.length > 0 ? removed.map(c => c.name).join(', ') : 'None'}
                </div>
                <div style={{ color: '#94a3b8' }}>
                  = Unchanged: {common.map(c => c.name).join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
