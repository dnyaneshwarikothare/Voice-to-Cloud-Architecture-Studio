import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Zap, Shield, Cpu, Layers, DollarSign, Scale } from 'lucide-react';
import { getArchitectureOptimizations } from '../services/optimizationService';

const TRADEOFF_PROFILES = {
  option_a_low_cost: {
    name: 'Option A: Lean & Low Cost',
    summary: 'Optimized for minimal monthly expenditure, early prototypes, and MVP validation.',
    cost: '$15 - $45 / mo',
    scalability: 'Moderate (< 10,000 active users)',
    availability: '99.0% (Single AZ)',
    complexity: 'Low',
    color: '#34d399',
    features: [
      'Single shared container instance (AWS App Runner / GCP Cloud Run)',
      'Single-AZ database without multi-region read replicas',
      'Serverless scale-to-zero when idle'
    ]
  },
  option_b_balanced: {
    name: 'Option B: Balanced Production (Recommended)',
    summary: 'Industry standard architecture balancing high reliability, predictable cost, and linear scaling.',
    cost: '$95 - $220 / mo',
    scalability: 'High (10,000 - 150,000 active users)',
    availability: '99.9% (Multi-AZ failover)',
    complexity: 'Medium',
    color: '#818cf8',
    features: [
      'Application Load Balancer across 2+ availability zones',
      'Managed Redis Cache offloading 85%+ database reads',
      'Managed PostgreSQL with automated daily snapshots',
      'Edge CDN caching frontend bundles and static assets'
    ]
  },
  option_c_high_scalability: {
    name: 'Option C: Enterprise High Scalability',
    summary: 'Mission-critical enterprise topology with zero single points of failure and event streaming.',
    cost: '$380 - $950+ / mo',
    scalability: 'Massive (500,000+ active users)',
    availability: '99.99% (Multi-Region / Five-Nines)',
    complexity: 'High',
    color: '#f59e0b',
    features: [
      'Multi-AZ synchronous database clustering with read replicas',
      'Distributed Redis Cluster with auto-sharding',
      'Apache Kafka / RabbitMQ asynchronous event streaming',
      'Cloud Armor / AWS WAF with automated DDoS protection'
    ]
  }
};

export function RecommendationPanel({ architecture, onApplyOptimization }) {
  const [activeTab, setActiveTab] = useState('suggestions'); // 'suggestions' | 'tradeoffs'
  const optimizations = getArchitectureOptimizations(architecture);

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc' }}>
            Cloud Architecture Optimizer
          </h4>
          <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
            AI-driven pattern recommendations and structural trade-off analysis.
          </p>
        </div>
      </div>

      {/* Mode Toggle: Actionable Suggestions vs Cost/Performance Trade-Offs */}
      <div className="tab-row" style={{ borderRadius: '6px' }}>
        <button
          className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          <Sparkles size={13} style={{ marginRight: '4px' }} />
          Actionable Suggestions ({optimizations.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'tradeoffs' ? 'active' : ''}`}
          onClick={() => setActiveTab('tradeoffs')}
        >
          <Scale size={13} style={{ marginRight: '4px' }} />
          Cost vs Performance Trade-Offs
        </button>
      </div>

      {activeTab === 'suggestions' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
          {optimizations.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                color: '#a7f3d0'
              }}
            >
              <CheckCircle2 size={32} style={{ marginBottom: '8px', color: '#10b981' }} />
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>High Architectural Maturity</div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                Your architecture already incorporates core best practices (edge CDN, caching, load balancing, and async queuing).
              </p>
            </div>
          ) : (
            optimizations.map((opt) => (
              <div key={opt.id} className="opt-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="opt-badge">{opt.category}</span>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>
                    Recommended
                  </span>
                </div>

                <div className="opt-title">{opt.title}</div>

                <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>
                    <span style={{ color: '#fda4af', fontWeight: 600 }}>Problem: </span>
                    {opt.problem}
                  </div>
                  <div>
                    <span style={{ color: '#fed7aa', fontWeight: 600 }}>Reason: </span>
                    {opt.reason}
                  </div>
                  <div>
                    <span style={{ color: '#a7f3d0', fontWeight: 600 }}>Solution: </span>
                    {opt.suggestedSolution}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="opt-impact">{opt.impact}</span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onApplyOptimization(opt)}
                    title="Preview Before/After and apply optimization"
                  >
                    <Sparkles size={13} />
                    Apply Suggestion
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Cost vs Performance Trade-Off Comparison (Options A, B, C) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }}>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', background: 'rgba(30, 41, 59, 0.45)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
            Compare architectural maturity levels. The system does not force expensive enterprise infrastructure on early-stage MVPs.
          </div>

          {Object.entries(TRADEOFF_PROFILES).map(([key, opt]) => (
            <div
              key={key}
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: `1px solid ${key === 'option_b_balanced' ? '#818cf8' : 'rgba(148, 163, 184, 0.18)'}`,
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.84rem', color: opt.color }}>
                  {opt.name}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#f8fafc' }}>
                  {opt.cost}
                </span>
              </div>

              <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: 0 }}>
                {opt.summary}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '4px' }}>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase' }}>Scalability</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 500, color: '#e2e8f0', marginTop: '2px' }}>{opt.scalability}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase' }}>Availability</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 500, color: '#e2e8f0', marginTop: '2px' }}>{opt.availability}</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase' }}>Complexity</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 500, color: '#e2e8f0', marginTop: '2px' }}>{opt.complexity}</div>
                </div>
              </div>

              <div style={{ marginTop: '4px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Key Characteristics:</div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.72rem', color: '#94a3b8' }}>
                  {opt.features.map((f, i) => (
                    <li key={i} style={{ marginBottom: '2px' }}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
