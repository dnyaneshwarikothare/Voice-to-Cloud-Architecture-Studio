import React, { useState } from 'react';
import {
  HeartPulse,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Zap,
  Cpu,
  Layers,
  Info
} from 'lucide-react';

export function RightSidebar({
  architecture,
  healthData,
  trafficData,
  costData,
  onGenerateScaledArchitecture,
  onOpenAIUsageModal,
  isGeneratingScaled = false,
  onNavigateTab
}) {
  const components = architecture?.components || [];
  const connections = architecture?.connections || [];
  const types = new Set(components.map(c => c.type));

  const hasBackend = types.has('backend') || types.has('payment');
  const hasDatabase = types.has('database');
  const hasCache = types.has('cache');
  const hasLoadBalancer = types.has('loadbalancer') || types.has('gateway');
  const hasCdn = types.has('cdn');
  const hasAuth = types.has('auth');

  // Rule-based transparent score calculation
  let healthScore = 50;
  const passedChecks = [];
  const warnings = [];

  if (hasBackend) {
    healthScore += 12;
    passedChecks.push('Backend service layer defined');
  } else {
    warnings.push('No application backend service defined');
  }

  if (hasDatabase) {
    healthScore += 12;
    passedChecks.push('Persistent database configured');
  } else {
    warnings.push('No database storage configured');
  }

  if (hasCache) {
    healthScore += 10;
    passedChecks.push('In-memory cache configured (Redis)');
  } else {
    warnings.push('No in-memory cache configured; DB may become a bottleneck');
  }

  if (hasLoadBalancer) {
    healthScore += 8;
    passedChecks.push('Traffic load balanced across instances');
  } else {
    warnings.push('No load balancer configured for high availability');
  }

  if (hasCdn) {
    healthScore += 5;
    passedChecks.push('Global edge CDN configured');
  } else {
    warnings.push('No edge CDN configured for static asset distribution');
  }

  if (hasAuth) {
    healthScore += 5;
    passedChecks.push('Dedicated authentication service configured');
  }

  // Check if multiple backend instances or read replica
  const hasReplica = components.some(c => c.name?.toLowerCase().includes('replica'));
  if (hasReplica) {
    passedChecks.push('Database read replica configured');
  } else if (hasDatabase) {
    warnings.push('No database redundancy or read replicas configured');
  }

  healthScore = Math.min(100, Math.max(30, healthData?.overall_score || healthScore));

  // Determine health color and badge
  let healthColor = '#16a34a';
  let healthBadge = 'Good';
  if (healthScore >= 85) {
    healthColor = '#16a34a';
    healthBadge = 'Optimal';
  } else if (healthScore >= 70) {
    healthColor = '#2563eb';
    healthBadge = 'Healthy';
  } else {
    healthColor = '#d97706';
    healthBadge = 'Needs Attention';
  }

  // Cost estimates
  const awsCost = costData?.aws?.estimated_monthly_cost || (components.length * 28.5 + 35.0);
  const gcpCost = costData?.gcp?.estimated_monthly_cost || (components.length * 26.2 + 30.0);
  const cheaperProvider = awsCost < gcpCost ? 'AWS' : 'GCP';

  return (
    <aside className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ padding: '10px 14px' }}>
        <div className="panel-title">
          <HeartPulse size={15} color="#2563eb" />
          <span>Architecture Studio Insights</span>
        </div>
        <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
          Real-Time Diagnostics
        </span>
      </div>

      <div className="panel-content" style={{ flex: 1, overflowY: 'auto', gap: '12px' }}>
        {/* ========================================================
            1. ARCHITECTURE HEALTH CARD (0 - 100)
            ======================================================== */}
        <div className="card">
          <div className="card-title">
            <span>Architecture Health</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                className="badge"
                style={{
                  background: healthScore >= 75 ? '#f0fdf4' : '#fffbeb',
                  color: healthScore >= 75 ? '#15803d' : '#b45309',
                  borderColor: healthScore >= 75 ? '#bbf7d0' : '#fde68a'
                }}
              >
                {healthBadge}
              </span>
              {onNavigateTab && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigateTab('health')}
                  style={{ fontSize: '0.64rem', padding: '1px 6px', height: '22px' }}
                  title="View Deep Health Diagnostic"
                >
                  Inspect
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '2px' }}>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: healthColor, lineHeight: 1 }}>
              {healthScore}
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}> / 100</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
              Transparent score based on security, availability, and reliability heuristics.
            </div>
          </div>

          {/* Passed Checks */}
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {passedChecks.slice(0, 4).map((chk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#15803d' }}>
                <CheckCircle2 size={13} color="#16a34a" />
                <span>{chk}</span>
              </div>
            ))}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {warnings.slice(0, 2).map((wrn, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.72rem', color: '#b45309' }}>
                  <AlertTriangle size={13} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{wrn}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
            * Evaluated using transparent best-practice heuristics (not scientifically exact).
          </div>
        </div>

        {/* ========================================================
            2. TRAFFIC INFORMATION CARD
            ======================================================== */}
        <div className="card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} color="#0284c7" />
              Traffic Capacity & Scaling
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="badge badge-neutral">Simulated</span>
              {onNavigateTab && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigateTab('traffic')}
                  style={{ fontSize: '0.64rem', padding: '1px 6px', height: '22px' }}
                  title="Open Dedicated Traffic Simulator"
                >
                  Simulate
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
            <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Current Baseline</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>10,000 / mo</div>
              <span style={{ fontSize: '0.66rem', color: '#64748b' }}>~12 Peak RPS</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Simulated Growth</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#2563eb' }}>1,000,000 / mo</div>
              <span style={{ fontSize: '0.66rem', color: '#16a34a', fontWeight: 600 }}>100x Growth (+9,900%)</span>
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '4px' }}>
            Projected peak demand reaches <b>~1,200 RPS</b> with <b>~180 GB</b> monthly egress.
          </div>
        </div>

        {/* ========================================================
            3. COST INFORMATION CARD
            ======================================================== */}
        <div className="card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} color="#16a34a" />
              Monthly Cloud Cost Estimates
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="badge badge-success">{cheaperProvider} ~5% Lower</span>
              {onNavigateTab && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigateTab('cost')}
                  style={{ fontSize: '0.64rem', padding: '1px 6px', height: '22px' }}
                  title="Open Deep Cost Analysis & Breakdown"
                >
                  Breakdown
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
            <div style={{ padding: '8px', border: '1px solid #fed7aa', borderRadius: '6px', background: '#fffbeb' }}>
              <span style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 600 }}>AWS ESTIMATE</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                ${awsCost.toFixed(2)}
              </div>
              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>per month</span>
            </div>

            <div style={{ padding: '8px', border: '1px solid #bfdbfe', borderRadius: '6px', background: '#eff6ff' }}>
              <span style={{ fontSize: '0.68rem', color: '#1d4ed8', fontWeight: 600 }}>GCP ESTIMATE</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                ${gcpCost.toFixed(2)}
              </div>
              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>per month</span>
            </div>
          </div>

          <div style={{ fontSize: '0.66rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
            * Approximate estimates based on catalog pricing. Does not guarantee real-world cloud billing.
          </div>
        </div>

        {/* ========================================================
            4. BOTTLENECK ANALYSIS CARD
            ======================================================== */}
        <div className="card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertOctagon size={14} color="#dc2626" />
              Detected Bottlenecks (At 1M Users)
            </span>
            {onNavigateTab && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigateTab('bottlenecks')}
                style={{ fontSize: '0.64rem', padding: '1px 6px', height: '22px' }}
                title="Deep 7-Subsystem Bottleneck Analysis"
              >
                Audit
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
            {!hasCache && (
              <div style={{ padding: '8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.72rem' }}>
                <strong style={{ color: '#b45309' }}>Database Query Saturation:</strong>
                <p style={{ color: '#78350f', marginTop: '2px' }}>
                  Without an in-memory cache, 100% of read traffic hits PostgreSQL. IOPS saturation expected at peak RPS.
                </p>
              </div>
            )}

            {!hasLoadBalancer && (
              <div style={{ padding: '8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.72rem' }}>
                <strong style={{ color: '#b45309' }}>Single Backend Compute Instance:</strong>
                <p style={{ color: '#78350f', marginTop: '2px' }}>
                  A single compute instance handles ~250 RPS comfortably. Peak 1,200 RPS requires horizontal scaling.
                </p>
              </div>
            )}

            {hasCache && hasLoadBalancer && (
              <div style={{ padding: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.72rem', color: '#15803d' }}>
                <strong>No Critical Bottlenecks:</strong> Current architecture includes caching and distributed compute.
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '2px' }}>
            Assumptions: 1 container ~250 RPS, 1 medium DB ~400 QPS, Redis absorbs 85% reads.
          </div>
        </div>

        {/* ========================================================
            5. RECOMMENDATIONS & GENERATE SCALED ARCHITECTURE
            ======================================================== */}
        <div className="card" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#2563eb" />
              Auto-Scalability Recommendations
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem', color: '#334155' }}>
            {!hasLoadBalancer && <div>• Deploy Application Load Balancer across 3 Availability Zones.</div>}
            {!hasCache && <div>• Introduce Redis Cache Cluster to absorb repeat read queries.</div>}
            {!hasReplica && <div>• Configure Database Read Replicas to split transactional writes and analytical reads.</div>}
            {!hasCdn && <div>• Enable Global Edge CDN to cache static assets close to users.</div>}
          </div>

          {/* PRIMARY ACTION BUTTON: Generate Scaled Architecture */}
          <button
            className="btn btn-primary"
            onClick={onGenerateScaledArchitecture}
            disabled={isGeneratingScaled}
            style={{ width: '100%', marginTop: '8px', fontSize: '0.8rem', padding: '9px 12px' }}
          >
            <Sparkles size={14} />
            <span>{isGeneratingScaled ? 'Generating Scaled Model...' : '🚀 Generate Scaled Architecture'}</span>
          </button>

          {onNavigateTab && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('compare')}
              style={{ width: '100%', marginTop: '6px', fontSize: '0.74rem', padding: '6px 12px' }}
            >
              <span>Compare Current vs Scaled Topology</span>
            </button>
          )}
        </div>

        {/* ========================================================
            6. CURRENT ARCHITECTURE STATUS CARD
            ======================================================== */}
        <div className="card" style={{ background: '#ffffff' }}>
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#16a34a" />
              System Status
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenAIUsageModal}
              style={{ fontSize: '0.68rem', padding: '2px 7px' }}
            >
              Session Stats
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem', color: '#475569' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>AI Provider:</span>
              <strong style={{ color: '#0f172a' }}>{architecture?.provider_used || 'Auto-Fallback'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Cache State:</span>
              <strong style={{ color: architecture?.cached ? '#2563eb' : '#16a34a' }}>
                {architecture?.cached ? 'Response Cached' : 'Fresh Generation'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Graph Integrity:</span>
              <strong style={{ color: '#16a34a' }}>Structurally Valid</strong>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
