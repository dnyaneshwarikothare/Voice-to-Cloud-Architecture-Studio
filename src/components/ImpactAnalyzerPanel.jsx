import React, { useState, useEffect } from 'react';
import { analyzeImpactApi } from '../services/apiService';
import {
  GitCommit,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Layers,
  Activity,
  Cpu,
  Database
} from 'lucide-react';

export function ImpactAnalyzerPanel({ architecture }) {
  const components = architecture?.components || [];
  const defaultTarget = components.find(c => c.type === 'cache' || /redis/i.test(c.name))?.id || (components[0]?.id || '');

  const [targetId, setTargetId] = useState(defaultTarget);
  const [action, setAction] = useState('remove');
  const [isLoading, setIsLoading] = useState(false);
  const [impactData, setImpactData] = useState(null);

  const runAnalysis = async (selectedTarget = targetId, selectedAction = action) => {
    setIsLoading(true);
    try {
      const data = await analyzeImpactApi(architecture, selectedAction, selectedTarget);
      setImpactData(data);
    } catch (err) {
      console.error('Impact analysis failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (components.length > 0) {
      const currentExists = components.some(c => c.id === targetId);
      const effectiveTarget = currentExists ? targetId : components[0].id;
      if (!currentExists) setTargetId(effectiveTarget);
      runAnalysis(effectiveTarget, action);
    }
  }, [architecture]);

  const targetComp = components.find(c => c.id === targetId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#0284c7" />
              <span>Architectural Impact &amp; Dependency Analyzer</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Predict the downstream ripple effects before removing or modifying components in your system topology.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '14px' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Target Component
            </label>
            <select
              className="input"
              value={targetId}
              onChange={e => {
                setTargetId(e.target.value);
                runAnalysis(e.target.value, action);
              }}
              style={{ width: '100%', fontSize: '0.78rem', padding: '6px 10px' }}
            >
              {components.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Simulated Mutation Action
            </label>
            <select
              className="input"
              value={action}
              onChange={e => {
                setAction(e.target.value);
                runAnalysis(targetId, e.target.value);
              }}
              style={{ width: '100%', fontSize: '0.78rem', padding: '6px 10px' }}
            >
              <option value="remove">Remove Component from Architecture</option>
              <option value="modify">Modify Tier / Re-architect</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analysis Result */}
      {impactData && (
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
              Impact Assessment for: <code style={{ color: '#2563eb' }}>{targetComp?.name}</code>
            </span>
            <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
              {impactData.overall_impact_level || 'MEDIUM IMPACT'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>AFFECTED CALLERS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {impactData.affected_callers?.length || 0} upstream services
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                {impactData.affected_callers?.join(', ') || 'No inbound dependencies'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>SEVERED CONNECTIONS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {impactData.broken_connections_count || 0} active links
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Network edges requiring rerouting
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>HEALTH SCORE DELTA</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                {impactData.estimated_health_delta || '-15 pts'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Resilience impact if removed
              </div>
            </div>
          </div>

          {impactData.warnings && impactData.warnings.length > 0 && (
            <div style={{ marginTop: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px', fontSize: '0.75rem', color: '#92400e' }}>
              <strong>Architecture Warnings:</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                {impactData.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
