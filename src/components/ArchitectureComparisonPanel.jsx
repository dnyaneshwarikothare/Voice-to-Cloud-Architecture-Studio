import React, { useState } from 'react';
import {
  Scale,
  Check,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Sparkles,
  Layers,
  ShieldCheck,
  RefreshCw,
  Server,
  Database,
  Zap,
  Info
} from 'lucide-react';
import { ArchitectureDiagram } from './ArchitectureDiagram';

export function ArchitectureComparisonPanel({
  currentArchitecture,
  scaledArchitecture,
  onGenerateScaledArchitecture,
  isGeneratingScaled,
  onApplyScaledAsCurrent,
  onSwitchView
}) {
  const currentComps = currentArchitecture?.components || [];
  const scaledComps = scaledArchitecture?.components || [];
  const hasScaled = Boolean(scaledArchitecture && scaledComps.length > 0);

  // Compute cost metrics safely
  const currentCost = currentComps.length * 28.5 + 35.0;
  const scaledCost = hasScaled ? (scaledComps.length * 34.0 + 95.0) : (currentCost * 2.2);

  const currentTypes = new Set(currentComps.map(c => c.type));
  const scaledTypes = new Set(scaledComps.map(c => c.type));

  const newlyAdded = hasScaled
    ? scaledComps.filter(sc => !currentComps.some(cc => cc.id === sc.id))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={20} color="#2563eb" />
              <span>Architecture Comparison: Current vs. Future Scaled</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Inspect side-by-side topologies, structural scaling changes, concurrency throughput, and monthly cloud cost deltas.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onGenerateScaledArchitecture && (
              <button
                className="btn btn-primary btn-sm"
                onClick={onGenerateScaledArchitecture}
                disabled={isGeneratingScaled}
                style={{ fontSize: '0.75rem', gap: '6px' }}
              >
                <Sparkles size={14} />
                <span>{isGeneratingScaled ? 'Synthesizing Future Topology...' : (hasScaled ? 'Re-Generate Scaled' : 'Generate Future Architecture')}</span>
              </button>
            )}

            {hasScaled && onApplyScaledAsCurrent && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={onApplyScaledAsCurrent}
                style={{ fontSize: '0.75rem', color: '#16a34a', borderColor: '#bbf7d0', gap: '6px' }}
              >
                <Check size={13} color="#16a34a" />
                <span>Adopt Scaled Topology as Current</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Diagram Canvases */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '14px' }}>
        {/* Left: Current Architecture */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <span className="badge badge-neutral" style={{ fontSize: '0.66rem' }}>CURRENT BASELINE</span>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {currentArchitecture?.project_name || 'Current Architecture'}
              </h4>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              {currentComps.length} active services • ${currentCost.toFixed(2)}/mo
            </span>
          </div>

          <div style={{ height: '380px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            {currentArchitecture && currentComps.length > 0 ? (
              <ArchitectureDiagram
                architecture={currentArchitecture}
                direction="TD"
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
                No components in current architecture.
              </div>
            )}
          </div>
        </div>

        {/* Right: Scaled Future Architecture */}
        <div className="card" style={{ background: hasScaled ? '#eff6ff' : '#f8fafc', border: `1px solid ${hasScaled ? '#bfdbfe' : '#e2e8f0'}`, padding: '14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <span className={`badge ${hasScaled ? 'badge-info' : 'badge-neutral'}`} style={{ fontSize: '0.66rem' }}>
                {hasScaled ? 'FUTURE SCALED (1M+ USERS)' : 'COMPARISON TARGET'}
              </span>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: hasScaled ? '#1d4ed8' : '#64748b', marginTop: '2px' }}>
                {hasScaled ? (scaledArchitecture?.project_name || 'Future Scaled Architecture') : 'Future Architecture'}
              </h4>
            </div>
            {hasScaled && (
              <span style={{ fontSize: '0.74rem', color: '#2563eb', fontWeight: 600 }}>
                {scaledComps.length} services • ${scaledCost.toFixed(2)}/mo
              </span>
            )}
          </div>

          <div style={{ height: '380px', border: `1px solid ${hasScaled ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '6px', overflow: 'hidden', background: '#ffffff' }}>
            {hasScaled ? (
              <ArchitectureDiagram
                architecture={scaledArchitecture}
                direction="TD"
              />
            ) : (
              /* REQUIRED SAFE STATE: If no second architecture available yet */
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <Sparkles size={22} color="#2563eb" />
                </div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                  No second architecture available for comparison yet.
                </h4>
                <p style={{ fontSize: '0.76rem', color: '#64748b', maxWidth: '340px', lineHeight: 1.5, margin: '0 0 14px' }}>
                  Click below to synthesize a scaled high-availability topology with load balancing, caching, and database read replicas.
                </p>
                {onGenerateScaledArchitecture && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={onGenerateScaledArchitecture}
                    disabled={isGeneratingScaled}
                    style={{ fontSize: '0.76rem', gap: '6px' }}
                  >
                    <Sparkles size={13} />
                    <span>{isGeneratingScaled ? 'Generating Future Architecture...' : 'Generate Future Architecture'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Metrics Breakdown Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 700 }}>Comparison Dimension</th>
              <th style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 700 }}>Current Architecture</th>
              <th style={{ padding: '10px 14px', color: '#1d4ed8', fontWeight: 700 }}>Future / Scaled Topology</th>
              <th style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 700 }}>Scaling Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>Component Count</td>
              <td style={{ padding: '10px 14px', color: '#334155' }}>{currentComps.length} Services</td>
              <td style={{ padding: '10px 14px', color: '#1d4ed8', fontWeight: 600 }}>
                {hasScaled ? `${scaledComps.length} Services` : 'Pending Generation'}
              </td>
              <td style={{ padding: '10px 14px', color: '#16a34a' }}>
                {hasScaled ? `+${Math.max(0, scaledComps.length - currentComps.length)} High-Availability Tiers` : 'Awaiting Scaled Blueprint'}
              </td>
            </tr>

            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>Traffic Capacity</td>
              <td style={{ padding: '10px 14px', color: '#334155' }}>~10,000 users/mo (~12 RPS)</td>
              <td style={{ padding: '10px 14px', color: '#1d4ed8', fontWeight: 600 }}>1,000,000+ users/mo (~1,200 RPS)</td>
              <td style={{ padding: '10px 14px', color: '#16a34a' }}>100x Concurrency Throughput</td>
            </tr>

            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>Estimated Cloud Cost</td>
              <td style={{ padding: '10px 14px', color: '#334155' }}>${currentCost.toFixed(2)} / month</td>
              <td style={{ padding: '10px 14px', color: '#1d4ed8', fontWeight: 600 }}>
                {hasScaled ? `$${scaledCost.toFixed(2)} / month` : '~$245.00 / month'}
              </td>
              <td style={{ padding: '10px 14px', color: '#b45309' }}>
                {hasScaled ? `+$${Math.max(0, scaledCost - currentCost).toFixed(2)} / mo` : 'Predictable ROI with Load Balancing'}
              </td>
            </tr>

            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>Load Balancing</td>
              <td style={{ padding: '10px 14px', color: currentTypes.has('loadbalancer') ? '#16a34a' : '#b45309' }}>
                {currentTypes.has('loadbalancer') ? 'Configured' : 'Single Instance (No ALB)'}
              </td>
              <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 600 }}>Multi-AZ Application Load Balancer</td>
              <td style={{ padding: '10px 14px', color: '#16a34a' }}>Zero single point of failure</td>
            </tr>

            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>Caching Layer</td>
              <td style={{ padding: '10px 14px', color: currentTypes.has('cache') ? '#16a34a' : '#b45309' }}>
                {currentTypes.has('cache') ? 'Redis Configured' : 'No Cache (Direct DB Reads)'}
              </td>
              <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 600 }}>Redis In-Memory Cluster</td>
              <td style={{ padding: '10px 14px', color: '#16a34a' }}>85%+ DB queries offloaded</td>
            </tr>

            <tr>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>Database High Availability</td>
              <td style={{ padding: '10px 14px', color: '#334155' }}>Single Primary Node</td>
              <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: 600 }}>Primary + Read Replica Pool</td>
              <td style={{ padding: '10px 14px', color: '#16a34a' }}>Isolated analytical and write queries</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Added Components List */}
      {hasScaled && newlyAdded.length > 0 && (
        <div className="card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '14px' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Services Added to Future Scaled Architecture:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {newlyAdded.map((comp) => (
              <div
                key={comp.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.74rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check size={13} color="#2563eb" />
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{comp.name}</span>
                <span style={{ color: '#64748b' }}>({comp.role || comp.type})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
