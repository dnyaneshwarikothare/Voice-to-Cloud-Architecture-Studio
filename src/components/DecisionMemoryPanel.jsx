import React, { useState, useEffect } from 'react';
import { getDecisionsApi, addDecisionApi, deleteDecisionApi } from '../services/apiService';
import {
  Bookmark,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Save,
  X
} from 'lucide-react';

export function DecisionMemoryPanel({ architecture }) {
  const [decisions, setDecisions] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  // New Decision Form State
  const [formData, setFormData] = useState({
    id: '',
    component_id: '',
    component_name: '',
    decision: '',
    reason: '',
    alternative: '',
    trade_off: '',
    version: 'v1.0'
  });

  const loadDecisions = async () => {
    try {
      const data = await getDecisionsApi();
      const comps = architecture?.components || [];
      const updated = (data || []).map(d => {
        if (!d.component_id) return d;
        const exists = comps.some(c => d.component_id.includes(c.id) || c.id.includes(d.component_id) || d.component_id.includes(c.type));
        return {
          ...d,
          status: exists ? 'active' : 'changed'
        };
      });
      setDecisions(updated);
    } catch (err) {
      console.error('Failed to load decisions:', err);
    }
  };

  useEffect(() => {
    loadDecisions();
  }, [architecture]);

  const handleSaveDecision = async (e) => {
    e.preventDefault();
    if (!formData.decision || !formData.reason) return;

    const newDec = {
      ...formData,
      id: formData.id || `adr_${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    await addDecisionApi(newDec);
    setIsAdding(false);
    setFormData({
      id: '',
      component_id: '',
      component_name: '',
      decision: '',
      reason: '',
      alternative: '',
      trade_off: '',
      version: 'v1.0'
    });
    loadDecisions();
  };

  const handleDelete = async (id) => {
    await deleteDecisionApi(id);
    loadDecisions();
  };

  const components = architecture?.components || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bookmark size={20} color="#0284c7" />
              <span>Architecture Decision Records (ADRs)</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Chronological log of structural choices, trade-offs, and technology evaluations for auditability.
            </p>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsAdding(!isAdding)}
            style={{ fontSize: '0.75rem', gap: '6px' }}
          >
            {isAdding ? <X size={13} /> : <Plus size={13} />}
            <span>{isAdding ? 'Cancel' : 'Log New ADR'}</span>
          </button>
        </div>
      </div>

      {/* Add Decision Form */}
      {isAdding && (
        <form onSubmit={handleSaveDecision} className="card" style={{ background: '#ffffff', border: '1px solid #bfdbfe', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', margin: 0 }}>
            Record Architectural Decision
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                Architectural Decision
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Adopt Redis for Session Caching"
                value={formData.decision}
                onChange={e => setFormData({ ...formData, decision: e.target.value })}
                required
                style={{ width: '100%', fontSize: '0.78rem', padding: '6px 10px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                Related Component
              </label>
              <select
                className="input"
                value={formData.component_id}
                onChange={e => {
                  const comp = components.find(c => c.id === e.target.value);
                  setFormData({
                    ...formData,
                    component_id: e.target.value,
                    component_name: comp?.name || ''
                  });
                }}
                style={{ width: '100%', fontSize: '0.78rem', padding: '6px 10px' }}
              >
                <option value="">(Global System-wide)</option>
                {components.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
              Engineering Justification / Reason
            </label>
            <textarea
              className="input"
              rows={2}
              placeholder="Why was this architecture choice made? What problem does it solve?"
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              required
              style={{ width: '100%', fontSize: '0.78rem', padding: '6px 10px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                Alternative Considered
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. In-memory Memcached"
                value={formData.alternative}
                onChange={e => setFormData({ ...formData, alternative: e.target.value })}
                style={{ width: '100%', fontSize: '0.78rem', padding: '6px 10px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '3px' }}>
                Trade-off Accepted
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Higher monthly memory cost for persistence"
                value={formData.trade_off}
                onChange={e => setFormData({ ...formData, trade_off: e.target.value })}
                style={{ width: '100%', fontSize: '0.78rem', padding: '6px 10px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAdding(false)} style={{ fontSize: '0.74rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" style={{ fontSize: '0.74rem' }}>
              <Save size={13} />
              <span>Save ADR</span>
            </button>
          </div>
        </form>
      )}

      {/* Decisions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {decisions.length === 0 ? (
          <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
            No Architectural Decision Records logged yet. Click "Log New ADR" above to record system choices.
          </div>
        ) : (
          decisions.map(d => (
            <div
              key={d.id}
              className="card"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.66rem' }}>
                    {d.version || 'v1.0'}
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{d.decision}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.64rem' }}>Active</span>
                  <button className="icon-btn" onClick={() => handleDelete(d.id)} title="Delete record">
                    <Trash2 size={13} color="#ef4444" />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.76rem', color: '#334155' }}>
                <strong>Justification:</strong> {d.reason}
              </div>

              {(d.alternative || d.trade_off) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.72rem' }}>
                  {d.alternative && <div><span style={{ color: '#64748b' }}>Alternative:</span> <strong style={{ color: '#0f172a' }}>{d.alternative}</strong></div>}
                  {d.trade_off && <div><span style={{ color: '#64748b' }}>Trade-off:</span> <strong style={{ color: '#0f172a' }}>{d.trade_off}</strong></div>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
