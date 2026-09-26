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
  FileText
} from 'lucide-react';

export function DecisionMemoryPanel({ architecture }) {
  const [decisions, setDecisions] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
      // Check if linked components still exist or have changed in active architecture
      const comps = architecture?.components || [];
      const updated = data.map(d => {
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
    setEditingId(null);
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

  const handleStartEdit = (d) => {
    setFormData(d);
    setEditingId(d.id);
    setIsAdding(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Banner */}
      <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bookmark size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
              Architecture Decision Memory (ADR)
            </span>
          </div>
          <button
            onClick={() => {
              setFormData({
                id: '',
                component_id: architecture?.components?.[0]?.id || '',
                component_name: architecture?.components?.[0]?.name || '',
                decision: '',
                reason: '',
                alternative: '',
                trade_off: '',
                version: 'v1.0'
              });
              setIsAdding(!isAdding);
            }}
            className="primary-btn"
            style={{ fontSize: '0.68rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={12} />
            {isAdding ? 'Cancel' : 'Record Decision'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
          Preserve architectural reasoning, alternatives rejected, and explicit trade-offs. The system alerts you if an underlying component decision is replaced or invalidated.
        </p>
      </div>

      {/* Add / Edit Form Modal/Drawer */}
      {isAdding && (
        <form onSubmit={handleSaveDecision} style={{ background: '#070b14', border: '1px solid #38bdf8', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8' }}>
            {editingId ? 'Edit Decision Record' : 'Record New Architecture Decision'}
          </span>

          <div>
            <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
              Architectural Decision
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Adopt PostgreSQL as Primary Relational Store"
              value={formData.decision}
              onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
              style={{ width: '100%', fontSize: '0.74rem', padding: '5px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
              Linked Component
            </label>
            <select
              value={formData.component_id}
              onChange={(e) => {
                const comp = architecture?.components?.find(c => c.id === e.target.value);
                setFormData({
                  ...formData,
                  component_id: e.target.value,
                  component_name: comp?.name || e.target.value
                });
              }}
              style={{ width: '100%', fontSize: '0.74rem', padding: '5px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
            >
              <option value="">General Architecture</option>
              {architecture?.components?.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.role || c.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
              Why / Rationale
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g., Requires ACID transaction semantics and strict relational integrity."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              style={{ width: '100%', fontSize: '0.74rem', padding: '5px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                Alternative Considered
              </label>
              <input
                type="text"
                placeholder="e.g., MongoDB Document Store"
                value={formData.alternative}
                onChange={(e) => setFormData({ ...formData, alternative: e.target.value })}
                style={{ width: '100%', fontSize: '0.74rem', padding: '5px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>
                Trade-Off
              </label>
              <input
                type="text"
                placeholder="e.g., Strict schema vs flexible documents"
                value={formData.trade_off}
                onChange={(e) => setFormData({ ...formData, trade_off: e.target.value })}
                style={{ width: '100%', fontSize: '0.74rem', padding: '5px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="secondary-btn"
              style={{ fontSize: '0.68rem', padding: '4px 10px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              style={{ fontSize: '0.68rem', padding: '4px 12px' }}
            >
              Save Decision
            </button>
          </div>
        </form>
      )}

      {/* Decisions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {decisions.map((d) => {
          const isChanged = d.status === 'changed';
          return (
            <div
              key={d.id}
              style={{
                background: '#0b1120',
                border: isChanged ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #1e293b',
                borderLeft: isChanged ? '4px solid #f59e0b' : '4px solid #10b981',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                    {d.decision}
                  </span>
                  {isChanged ? (
                    <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fde68a', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={11} color="#f59e0b" />
                      THIS DECISION HAS CHANGED
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#86efac', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={11} color="#10b981" />
                      ACTIVE
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => handleStartEdit(d)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '3px' }}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '3px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {isChanged && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.68rem', color: '#fde68a' }}>
                  ⚠️ The component linked to this decision ({d.component_name || d.component_id}) was modified, replaced, or removed from the active canvas.
                </div>
              )}

              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                <b>Reason:</b> {d.reason}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.68rem', color: '#94a3b8', background: '#070b14', padding: '6px 8px', borderRadius: '4px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Alternative Considered:</span>
                  <span style={{ color: '#cbd5e1' }}>{d.alternative || 'None recorded'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Trade-Off Accepted:</span>
                  <span style={{ color: '#cbd5e1' }}>{d.trade_off || 'None recorded'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
