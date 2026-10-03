import React, { useState } from 'react';
import { History, Plus, GitCompare, ArrowRight, Check, Clock, Layers, DollarSign, RotateCcw, Sparkles } from 'lucide-react';

export function VersionHistoryPanel({
  versionHistory = [],
  onSaveVersion,
  onRestoreVersion,
  currentArchitecture
}) {
  const [versionNote, setVersionNote] = useState('');
  const [selectedV1, setSelectedV1] = useState(0);
  const [selectedV2, setSelectedV2] = useState(versionHistory.length > 1 ? 1 : 0);

  const handleSave = (e) => {
    e.preventDefault();
    if (!onSaveVersion) return;
    onSaveVersion(versionNote.trim() || `Version ${versionHistory.length + 1}: Checkpoint`);
    setVersionNote('');
  };

  const v1 = versionHistory[selectedV1];
  const v2 = versionHistory[selectedV2];

  // Calculate detailed diff between selected versions
  let added = [];
  let removed = [];
  let techChanged = [];

  if (v1?.architecture && v2?.architecture) {
    const v1Comps = v1.architecture.components || [];
    const v2Comps = v2.architecture.components || [];

    const v1Map = new Map(v1Comps.map(c => [c.id, c]));
    const v2Map = new Map(v2Comps.map(c => [c.id, c]));

    // Added in v2 compared to v1
    v2Comps.forEach(c => {
      if (!v1Map.has(c.id)) {
        added.push(c);
      } else {
        const orig = v1Map.get(c.id);
        if (orig.technology !== c.technology && c.technology) {
          techChanged.push({ name: c.name, from: orig.technology || 'Default', to: c.technology });
        }
      }
    });

    // Removed in v2 compared to v1
    v1Comps.forEach(c => {
      if (!v2Map.has(c.id)) {
        removed.push(c);
      }
    });
  }

  const v1Cost = (v1?.architecture?.components?.length || 0) * 28.5 + 35.0;
  const v2Cost = (v2?.architecture?.components?.length || 0) * 28.5 + 35.0;
  const costDelta = v2Cost - v1Cost;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Banner */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="#2563eb" />
              <span>Architecture Version History & Milestone Snapshots</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px' }}>
              Snapshot current architecture iterations, track component additions and removals, compare cost deltas, and roll back safely.
            </p>
          </div>

          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
            {versionHistory.length} Saved Milestones
          </span>
        </div>
      </div>

      {/* Snapshot Creation Form */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Create New Milestone Snapshot
        </div>
        <form onSubmit={handleSave} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-custom"
            placeholder="Snapshot note (e.g. Added Redis Cache & Multi-AZ Load Balancer)..."
            value={versionNote}
            onChange={(e) => setVersionNote(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
            <Plus size={14} />
            <span>Save Version Snapshot</span>
          </button>
        </form>
      </div>

      {/* Version List Cards */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
          Milestone Timeline
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {versionHistory.map((ver, idx) => {
            const compCount = ver.architecture?.components?.length || 0;
            const approxCost = compCount * 28.5 + 35.0;

            return (
              <div
                key={ver.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.66rem' }}>
                      Version {idx + 1}
                    </span>
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{ver.note || `Snapshot ${idx + 1}`}</strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
                    {compCount} components • ~${approxCost.toFixed(2)}/mo • {ver.timestamp ? new Date(ver.timestamp).toLocaleString() : 'Saved'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onRestoreVersion && onRestoreVersion(ver)}
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                    title="Restore this version without deleting other snapshots"
                  >
                    <RotateCcw size={12} />
                    <span>Restore Version</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone Comparison Inspector */}
      {versionHistory.length >= 2 && (
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitCompare size={15} color="#2563eb" />
            <span>Compare Any Two Versions</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label className="form-label">Base Version (Before)</label>
              <select
                className="select-custom"
                value={selectedV1}
                onChange={(e) => setSelectedV1(Number(e.target.value))}
              >
                {versionHistory.map((v, i) => (
                  <option key={i} value={i}>Version {i + 1}: {v.note || 'Snapshot'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Target Version (After)</label>
              <select
                className="select-custom"
                value={selectedV2}
                onChange={(e) => setSelectedV2(Number(e.target.value))}
              >
                {versionHistory.map((v, i) => (
                  <option key={i} value={i}>Version {i + 1}: {v.note || 'Snapshot'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Diffs Summary */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', fontSize: '0.74rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Cost Impact:</span>
              <strong style={{ color: costDelta > 0 ? '#b45309' : (costDelta < 0 ? '#16a34a' : '#64748b') }}>
                {costDelta > 0 ? `+$${costDelta.toFixed(2)}/mo` : (costDelta < 0 ? `-$${Math.abs(costDelta).toFixed(2)}/mo` : 'No cost change')}
              </strong>
            </div>

            {/* Added components */}
            <div style={{ marginBottom: '6px' }}>
              <strong style={{ color: '#15803d' }}>+ Components Added ({added.length}):</strong>
              {added.length === 0 ? <span style={{ color: '#64748b', marginLeft: '6px' }}>None</span> : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {added.map(c => (
                    <span key={c.id} style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                      + {c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Removed components */}
            <div>
              <strong style={{ color: '#b91c1c' }}>- Components Removed ({removed.length}):</strong>
              {removed.length === 0 ? <span style={{ color: '#64748b', marginLeft: '6px' }}>None</span> : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {removed.map(c => (
                    <span key={c.id} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                      - {c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
