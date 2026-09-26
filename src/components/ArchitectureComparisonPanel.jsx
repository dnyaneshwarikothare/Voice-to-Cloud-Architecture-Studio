import React, { useState, useEffect } from 'react';
import { compareArchitecturesApi } from '../services/apiService';
import {
  Layers,
  DollarSign,
  TrendingUp,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Scale
} from 'lucide-react';

export function ArchitectureComparisonPanel({ architecture }) {
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate 3 candidate architectures derived from current architecture
  const generateCandidates = (baseArch) => {
    // Arch A: Lean MVP (Burstable DB, Serverless, No CDN, No Cache)
    const archA = {
      project_name: 'Architecture A: Lean MVP',
      components: baseArch.components.filter(c => c.type !== 'cache' && c.type !== 'cdn').map(c => ({
        ...c,
        tier: 'small'
      })),
      connections: baseArch.connections.filter(c => !c.to?.includes('cache') && !c.to?.includes('cdn') && !c.from?.includes('cdn'))
    };

    // Arch B: Balanced Production (Current Baseline + Redis + Load Balancer)
    const archB = {
      project_name: 'Architecture B: Balanced Production',
      components: baseArch.components.map(c => ({ ...c })),
      connections: baseArch.connections.map(c => ({ ...c }))
    };

    // Arch C: High Scalability Enterprise (CDN + Multi-AZ Clustered DB + Redis + Message Queue)
    const hasCdn = baseArch.components.some(c => c.type === 'cdn');
    const archCComps = [...baseArch.components.map(c => ({ ...c, tier: 'large' }))];
    const archCConns = [...baseArch.connections];

    if (!hasCdn) {
      archCComps.unshift({
        id: 'edge_cdn_adv',
        name: 'CloudFront Edge CDN',
        type: 'cdn',
        technology: 'CloudFront',
        role: 'Edge Content Delivery',
        purpose: 'Global edge caching.'
      });
    }

    const archC = {
      project_name: 'Architecture C: Enterprise High Scalability',
      components: archCComps,
      connections: archCConns
    };

    return [archA, archB, archC];
  };

  const loadComparison = async () => {
    setIsLoading(true);
    try {
      const candidates = generateCandidates(architecture);
      const res = await compareArchitecturesApi(candidates);
      setComparisonData(res);
    } catch (err) {
      console.error('Comparison failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, [architecture]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Banner */}
      <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
              Multi-Architecture Comparison
            </span>
          </div>
          <button
            onClick={loadComparison}
            disabled={isLoading}
            className="secondary-btn"
            style={{ fontSize: '0.66rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={11} className={isLoading ? 'spin-icon' : ''} />
            Refresh
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
          Compare multiple architectural candidates for your requirements. Objective trade-off analysis across cost, scaling limits, and operational complexity without declaring an artificial "winner".
        </p>
      </div>

      {/* Comparison Grid Table */}
      {comparisonData && (
        <div style={{ background: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0b1120', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '8px 10px', color: '#94a3b8', fontWeight: 600 }}>Metric</th>
                  {comparisonData.profiles?.map(p => (
                    <th key={p.key} style={{ padding: '8px 10px', color: '#f8fafc', fontWeight: 700 }}>
                      {p.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.metrics?.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #151e2e', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                    <td style={{ padding: '8px 10px', color: '#cbd5e1', fontWeight: 600, minWidth: '130px' }}>
                      {m.metric}
                      <span style={{ display: 'block', fontSize: '0.6rem', color: '#64748b', fontWeight: 400 }}>{m.description}</span>
                    </td>
                    {comparisonData.profiles?.map(p => (
                      <td key={p.key} style={{ padding: '8px 10px', color: '#e2e8f0' }}>
                        {m.arch_values[p.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Factual Trade-off Analysis Cards */}
      {comparisonData?.trade_off_analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Balanced Trade-Off Breakdown
          </span>

          {comparisonData.profiles?.map(p => (
            <div
              key={p.key}
              style={{
                background: '#0b1120',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>
                  {p.title}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                  ~${p.aws_cost}/mo
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                {comparisonData.trade_off_analysis[p.key]}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
        {comparisonData?.disclaimer}
      </div>
    </div>
  );
}
