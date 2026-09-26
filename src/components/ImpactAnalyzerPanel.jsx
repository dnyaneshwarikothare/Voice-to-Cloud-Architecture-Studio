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

  const getBadgeStyle = (level) => {
    switch (level) {
      case 'CRITICAL':
        return { bg: 'rgba(244, 63, 94, 0.2)', border: '#f43f5e', text: '#fda4af' };
      case 'HIGH IMPACT':
        return { bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b', text: '#fde68a' };
      case 'MEDIUM IMPACT':
        return { bg: 'rgba(56, 189, 248, 0.2)', border: '#38bdf8', text: '#bae6fd' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', text: '#a7f3d0' };
    }
  };

  const currentBadge = getBadgeStyle(impactData?.overall_impact_level || 'LOW IMPACT');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Banner */}
      <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
              Architecture Change Impact Analyzer
            </span>
          </div>
          {impactData && (
            <span style={{
              background: currentBadge.bg,
              border: `1px solid ${currentBadge.border}`,
              color: currentBadge.text,
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {impactData.overall_impact_level}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
          Analyzes dependent services, upstream callers, and downstream bottlenecks whenever an architecture component is modified, removed, or fails.
        </p>
      </div>

      {/* Target & Action Controls */}
      <div style={{ background: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Component to Simulate
            </label>
            <select
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                runAnalysis(e.target.value, action);
              }}
              style={{ width: '100%', fontSize: '0.75rem', padding: '6px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
            >
              {components.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role || c.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Simulated Action
            </label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                runAnalysis(targetId, e.target.value);
              }}
              style={{ width: '100%', fontSize: '0.75rem', padding: '6px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
            >
              <option value="remove">Remove Component</option>
              <option value="fail">Simulate Outage / Failure</option>
              <option value="modify">Modify Tier / Specs</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => runAnalysis(targetId, action)}
          disabled={isLoading}
          className="secondary-btn"
          style={{ width: '100%', padding: '6px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <RefreshCw size={12} className={isLoading ? 'spin-icon' : ''} />
          {isLoading ? 'Re-analyzing Dependencies...' : 'Recalculate Ripple Impact'}
        </button>
      </div>

      {/* Visual Dependency Flow Graph */}
      {impactData?.dependency_graph?.length > 0 && (
        <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
            Interactive Dependency Graph
          </span>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {impactData.dependency_graph.map((node, idx) => {
              let nodeStyle = { bg: 'rgba(255, 255, 255, 0.04)', border: '#334155', text: '#cbd5e1' };
              if (node.status === 'changed') {
                nodeStyle = { bg: 'rgba(244, 63, 94, 0.2)', border: '#f43f5e', text: '#fecdd3' };
              } else if (node.status === 'critical') {
                nodeStyle = { bg: 'rgba(244, 63, 94, 0.15)', border: '#f43f5e', text: '#fda4af' };
              } else if (node.status === 'affected') {
                nodeStyle = { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fde68a' };
              }

              return (
                <div
                  key={node.id}
                  style={{
                    background: nodeStyle.bg,
                    border: `1px solid ${nodeStyle.border}`,
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.72rem',
                    color: nodeStyle.text,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '110px'
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{node.name}</span>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                    {node.role} • <b style={{ color: nodeStyle.text }}>{node.status.toUpperCase()}</b>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ripple Effect Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Identified Ripple Effects ({impactData?.affected_components?.length || 0})
        </span>

        {impactData?.affected_components?.length === 0 ? (
          <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px', textAlign: 'center', fontSize: '0.72rem', color: '#64748b' }}>
            No major downstream breaking dependencies detected for this component.
          </div>
        ) : (
          impactData?.affected_components?.map((item, idx) => {
            const bStyle = getBadgeStyle(item.impact_level);
            return (
              <div
                key={idx}
                style={{
                  background: '#0b1120',
                  border: `1px solid ${bStyle.border}44`,
                  borderLeft: `4px solid ${bStyle.border}`,
                  borderRadius: '6px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc' }}>
                    Affected: {item.affected_component_name}
                  </span>
                  <span style={{ background: bStyle.bg, color: bStyle.text, fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                    {item.impact_level}
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <b>Reason:</b> {item.reason}
                </div>

                <div style={{ fontSize: '0.72rem', color: '#fecdd3' }}>
                  <b>Expected Impact:</b> {item.expected_impact}
                </div>

                <div style={{ fontSize: '0.72rem', color: '#86efac', background: 'rgba(16, 185, 129, 0.08)', padding: '6px 8px', borderRadius: '4px' }}>
                  <b>Suggested Mitigation:</b> {item.suggested_mitigation}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
        {impactData?.disclaimer}
      </div>
    </div>
  );
}
