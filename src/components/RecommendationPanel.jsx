import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Zap,
  Shield,
  Cpu,
  Layers,
  DollarSign,
  Scale,
  AlertTriangle,
  Server,
  Database,
  Globe,
  Gauge,
  SlidersHorizontal,
  Lock,
  RefreshCw,
  History,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getArchitectureOptimizations,
  generateComprehensiveOptimization,
  computeArchitectureDiff
} from '../services/optimizationService';
import { generateMermaidCode, renderMermaidSvg } from '../services/mermaidService';
import { analyzeArchitectureHealth } from '../services/healthService';
import { calculateArchitectureCosts } from '../services/costService';

const TRADEOFF_PROFILES = {
  option_a_low_cost: {
    name: 'Option A: Lean & Low Cost MVP',
    badge: 'Budget Friendly',
    badgeClass: 'badge-success',
    summary: 'Optimized for minimal monthly expenditure, early stage validation, and developer testing.',
    cost: '$15 - $45 / mo',
    scalability: 'Moderate (< 10,000 active users)',
    availability: '99.0% (Single Availability Zone)',
    complexity: 'Low',
    color: '#16a34a',
    features: [
      'Single shared container instance (AWS App Runner / GCP Cloud Run)',
      'Single-AZ database without multi-region read replicas',
      'Serverless scale-to-zero compute when idle',
      'Burstable CPU instances with automated overnight pause'
    ]
  },
  option_b_balanced: {
    name: 'Option B: Balanced Production (Recommended)',
    badge: 'Industry Standard',
    badgeClass: 'badge-info',
    summary: 'Industry standard architecture balancing high reliability, predictable cost, and linear horizontal scaling.',
    cost: '$95 - $220 / mo',
    scalability: 'High (10,000 - 150,000 active users)',
    availability: '99.9% (Multi-AZ automated failover)',
    complexity: 'Medium',
    color: '#2563eb',
    features: [
      'Application Load Balancer across 2+ availability zones',
      'Managed Redis Cache offloading 85%+ database read queries',
      'Managed PostgreSQL / Cloud SQL with automated daily snapshots',
      'Edge CDN caching frontend bundles and static assets globally'
    ]
  },
  option_c_high_scalability: {
    name: 'Option C: Enterprise High Scalability & HA',
    badge: 'Zero Downtime',
    badgeClass: 'badge-warning',
    summary: 'Mission-critical enterprise topology with zero single points of failure, auto-sharding, and event streaming.',
    cost: '$380 - $950+ / mo',
    scalability: 'Massive (500,000+ active users)',
    availability: '99.99% (Multi-Region / Five-Nines SLA)',
    complexity: 'High',
    color: '#d97706',
    features: [
      'Multi-AZ synchronous database clustering with active read replicas',
      'Distributed Redis Cluster with auto-sharding and replication',
      'Apache Kafka / RabbitMQ asynchronous event streaming',
      'Cloud Armor / AWS WAF with automated DDoS protection & rate limiting'
    ]
  }
};

export function RecommendationPanel({
  architecture,
  onApplyOptimization,
  onApplyDirectOptimization,
  versionHistory = [],
  assumptions,
  onReturnToCanvas,
  onNavigateToVersions
}) {
  const [activeTab, setActiveTab] = useState('suggestions'); // 'suggestions' | 'tradeoffs' | 'dimensions'
  const [reviewState, setReviewState] = useState({
    isActive: false,
    selectedOpt: null,
    afterArchitecture: null
  });

  const [beforeSvg, setBeforeSvg] = useState('');
  const [afterSvg, setAfterSvg] = useState('');
  const [lastSuccessNotice, setLastSuccessNotice] = useState(null);

  const components = architecture?.components || [];
  const optimizations = getArchitectureOptimizations(architecture);

  // Dynamic evaluation of the 8 architecture dimensions
  const hasDb = components.some(c => c.type === 'database');
  const hasCache = components.some(c => c.type === 'cache');
  const hasLb = components.some(c => c.type === 'loadbalancer');
  const hasCdn = components.some(c => c.type === 'cdn');
  const hasQueue = components.some(c => c.type === 'queue');
  const hasBackend = components.some(c => c.type === 'backend');

  const dimensions = [
    { id: 'scalability', label: 'Scalability', status: hasLb && hasCache ? 'Optimized' : 'Needs Review', score: hasLb && hasCache ? 90 : 60, icon: Gauge, desc: 'Horizontal scaling & query offloading' },
    { id: 'performance', label: 'Performance', status: hasCdn && hasCache ? 'High' : 'Moderate', score: hasCdn && hasCache ? 92 : 65, icon: Zap, desc: 'Sub-millisecond caching & CDN distribution' },
    { id: 'reliability', label: 'Reliability', status: hasLb ? 'High' : 'Medium', score: hasLb ? 88 : 65, icon: CheckCircle2, desc: 'Traffic routing & failover redundancy' },
    { id: 'cost', label: 'Cost Efficiency', status: 'Balanced', score: 85, icon: DollarSign, desc: 'Right-sized resources without idle sprawl' },
    { id: 'security', label: 'Security & Isolation', status: 'Good', score: 82, icon: Lock, desc: 'Private VPC tiers and TLS termination' },
    { id: 'availability', label: 'Availability', status: hasLb ? 'Multi-AZ Ready' : 'Single AZ', score: hasLb ? 90 : 60, icon: Server, desc: 'Fault tolerance across availability zones' },
    { id: 'bottlenecks', label: 'Bottleneck Risk', status: !hasCache && hasDb ? 'Database At Risk' : 'Low Risk', score: !hasCache && hasDb ? 55 : 88, icon: AlertTriangle, desc: 'Workload pinch points under traffic bursts' },
    { id: 'tech_choices', label: 'Technology Fit', status: 'Production Grade', score: 92, icon: Cpu, desc: 'FastAPI, PostgreSQL, Redis, React ecosystems' }
  ];

  // Render Before and After SVGs when in review state
  useEffect(() => {
    if (!reviewState.isActive || !reviewState.afterArchitecture) {
      setBeforeSvg('');
      setAfterSvg('');
      return;
    }

    let isMounted = true;
    async function renderPreview() {
      const codeBefore = generateMermaidCode(architecture, { direction: 'LR', mode: 'logical' });
      const codeAfter = generateMermaidCode(reviewState.afterArchitecture, { direction: 'LR', mode: 'logical' });

      const resBefore = await renderMermaidSvg('optimizer_review_before', codeBefore);
      const resAfter = await renderMermaidSvg('optimizer_review_after', codeAfter);

      if (isMounted) {
        if (resBefore.success) setBeforeSvg(resBefore.svg);
        if (resAfter.success) setAfterSvg(resAfter.svg);
      }
    }

    renderPreview();
    return () => {
      isMounted = false;
    };
  }, [reviewState, architecture]);

  // Trigger full comprehensive optimization review
  const handleGenerateFullOptimization = () => {
    const { optimizedArchitecture } = generateComprehensiveOptimization(architecture);
    setReviewState({
      isActive: true,
      selectedOpt: null,
      afterArchitecture: optimizedArchitecture
    });
  };

  // Trigger single suggestion review
  const handleReviewSingleOptimization = (opt) => {
    if (opt.isManualOnly) {
      alert(`Recommendation: ${opt.title}\n\n${opt.suggestedSolution}\n\nNotice: Recommendation only — manual configuration required.`);
      return;
    }
    const afterArch = opt.target_architecture || (opt.apply ? opt.apply(architecture) : null);
    if (!afterArch) return;

    setReviewState({
      isActive: true,
      selectedOpt: opt,
      afterArchitecture: afterArch
    });
  };

  // Cancel review / Keep current architecture
  const handleCancelReview = () => {
    setReviewState({
      isActive: false,
      selectedOpt: null,
      afterArchitecture: null
    });
  };

  // Execute Apply Optimization
  const handleApplyOptimization = () => {
    if (!reviewState.afterArchitecture) return;

    const diff = computeArchitectureDiff(architecture, reviewState.afterArchitecture);
    const beforeH = analyzeArchitectureHealth(architecture);
    const afterH = analyzeArchitectureHealth(reviewState.afterArchitecture);
    const beforeC = calculateArchitectureCosts(architecture, assumptions);
    const afterC = calculateArchitectureCosts(reviewState.afterArchitecture, assumptions);

    const summary = {
      addedCount: diff.addedComponents.length,
      addedNames: diff.addedComponents.map(c => c.name),
      removedCount: diff.removedComponents.length,
      connectionsChanged: diff.connectionsChanged,
      beforeHealth: beforeH.overallScore,
      afterHealth: afterH.overallScore,
      beforeCost: beforeC.aws.totalMonthly,
      afterCost: afterC.aws.totalMonthly
    };

    try {
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
    } catch (e) {}

    if (onApplyDirectOptimization) {
      onApplyDirectOptimization(reviewState.afterArchitecture, summary);
    } else if (onApplyOptimization && reviewState.selectedOpt) {
      onApplyOptimization(reviewState.selectedOpt);
    }

    setLastSuccessNotice({
      timestamp: Date.now(),
      summary
    });

    setReviewState({
      isActive: false,
      selectedOpt: null,
      afterArchitecture: null
    });
  };

  // If in review mode, render the Optimization Review / Before-After screen
  if (reviewState.isActive && reviewState.afterArchitecture) {
    const beforeHealth = analyzeArchitectureHealth(architecture);
    const afterHealth = analyzeArchitectureHealth(reviewState.afterArchitecture);
    const beforeCost = calculateArchitectureCosts(architecture, assumptions);
    const afterCost = calculateArchitectureCosts(reviewState.afterArchitecture, assumptions);
    const diff = computeArchitectureDiff(architecture, reviewState.afterArchitecture);

    const healthDelta = afterHealth.overallScore - beforeHealth.overallScore;
    const costDeltaAws = afterCost.aws.totalMonthly - beforeCost.aws.totalMonthly;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Safety Check & Review Header Banner (Requirement 6) */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#16a34a" />
                <span>Review optimization changes before applying.</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                Simulate and review the architectural modifications, health score improvements, and topology changes before applying.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                id="btn-keep-current-top"
                className="btn btn-secondary btn-sm"
                onClick={handleCancelReview}
              >
                Keep Current Architecture
              </button>
              <button
                id="btn-apply-opt-top"
                className="btn btn-primary btn-sm"
                onClick={handleApplyOptimization}
                style={{ background: '#16a34a', borderColor: '#15803d', fontWeight: 600, gap: '6px' }}
              >
                <Sparkles size={14} />
                <span>Apply Optimization</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Delta Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {/* Health Score Comparison */}
          <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Architecture Health Score
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ef4444' }}>
                  {beforeHealth.overallScore}/100
                </span>
                <ArrowRight size={14} color="#94a3b8" />
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                  {afterHealth.overallScore}/100
                </span>
              </div>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: '9999px', background: '#dcfce7', color: '#15803d', fontSize: '0.76rem', fontWeight: 700 }}>
              +{healthDelta} Points
            </div>
          </div>

          {/* Cost Comparison */}
          <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Estimated Monthly Cost (AWS/GCP)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  ${beforeCost.aws.totalMonthly.toFixed(2)}
                </span>
                <ArrowRight size={14} color="#94a3b8" />
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb' }}>
                  ${afterCost.aws.totalMonthly.toFixed(2)}
                </span>
              </div>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: '9999px', background: '#e0f2fe', color: '#0369a1', fontSize: '0.76rem', fontWeight: 700 }}>
              {costDeltaAws >= 0 ? `+$${costDeltaAws.toFixed(2)}/mo` : `-$${Math.abs(costDeltaAws).toFixed(2)}/mo`}
            </div>
          </div>
        </div>

        {/* Exact Structural Modifications (Requirement 2 & 6) */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Exact Structural Modifications to Apply:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {diff.addedComponents.map(comp => (
              <span key={comp.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', padding: '4px 9px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                <span>+</span>
                <span>Add {comp.name}</span>
                <span style={{ color: '#15803d', fontSize: '0.68rem', opacity: 0.85 }}>({comp.type})</span>
              </span>
            ))}
            {diff.modifiedComponents?.map(comp => (
              <span key={comp.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '4px 9px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                <span>↑</span>
                <span>Scale {comp.name}</span>
              </span>
            ))}
            {diff.connectionsChanged > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '4px 9px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                <span>⇄</span>
                <span>{diff.connectionsChanged} Connections Rewired / Added</span>
              </span>
            )}
          </div>

          {/* Requirement 7: Manual configuration notice */}
          <div style={{ marginTop: '10px', fontSize: '0.74rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} color="#d97706" />
            <span>Policy considerations (IAM Least Privilege &amp; Cross-Region Backups): <em>Recommendation only — manual configuration required.</em></span>
          </div>
        </div>

        {/* Visual Diagrams Side-by-Side with Action button placed near AFTER OPTIMIZATION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
          {/* BEFORE ARCHITECTURE */}
          <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#b91c1c' }}>
                🔴 BEFORE ARCHITECTURE
              </span>
              <span style={{ fontSize: '0.72rem', color: '#7f1d1d', fontWeight: 600 }}>
                {components.length} Components
              </span>
            </div>
            <div
              style={{
                minHeight: '260px',
                background: '#ffffff',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                padding: '8px'
              }}
              dangerouslySetInnerHTML={{ __html: beforeSvg || '<div style="color:#94a3b8;font-size:0.75rem;">Rendering diagram...</div>' }}
            />
          </div>

          {/* AFTER OPTIMIZATION */}
          <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#15803d' }}>
                  🟢 AFTER OPTIMIZATION
                </span>
                <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>
                  ({reviewState.afterArchitecture.components.length} Components)
                </span>
              </div>

              {/* Requirement 1: Apply Optimization button placed near the AFTER OPTIMIZATION section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  id="btn-apply-opt-section"
                  className="btn btn-primary btn-sm"
                  onClick={handleApplyOptimization}
                  style={{ background: '#16a34a', borderColor: '#15803d', fontWeight: 600, fontSize: '0.74rem', gap: '5px' }}
                >
                  <Sparkles size={13} />
                  <span>Apply Optimization</span>
                </button>
                <button
                  id="btn-cancel-opt-section"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCancelReview}
                  style={{ fontSize: '0.74rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>

            <div
              style={{
                minHeight: '260px',
                background: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                padding: '8px'
              }}
              dangerouslySetInnerHTML={{ __html: afterSvg || '<div style="color:#94a3b8;font-size:0.75rem;">Rendering diagram...</div>' }}
            />
          </div>
        </div>

        {/* Bottom Action Footer (Requirement 1) */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleCancelReview}>
            Keep Current Architecture
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApplyOptimization}
            style={{ background: '#16a34a', borderColor: '#15803d', fontWeight: 600, gap: '6px' }}
          >
            <Check size={16} />
            <span>Apply Optimization</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Success Notification Banner (Requirement 5) */}
      {lastSuccessNotice && (
        <div style={{ padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <CheckCircle2 size={20} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#15803d' }}>
                Optimization applied successfully.
              </div>
              <div style={{ fontSize: '0.76rem', color: '#166534', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <span><strong>Components added:</strong> {lastSuccessNotice.summary.addedCount} {lastSuccessNotice.summary.addedNames.length > 0 ? `(${lastSuccessNotice.summary.addedNames.join(', ')})` : ''}</span>
                <span><strong>Components removed:</strong> {lastSuccessNotice.summary.removedCount}</span>
                <span><strong>Connections changed:</strong> {lastSuccessNotice.summary.connectionsChanged}</span>
                <span><strong>Health:</strong> {lastSuccessNotice.summary.beforeHealth} → {lastSuccessNotice.summary.afterHealth}</span>
                <span><strong>Estimated cost:</strong> ${lastSuccessNotice.summary.beforeCost.toFixed(2)} → ${lastSuccessNotice.summary.afterCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {onReturnToCanvas && (
              <button className="btn btn-primary btn-sm" onClick={onReturnToCanvas} style={{ fontSize: '0.72rem' }}>
                Return to Architecture Canvas
              </button>
            )}
            {onNavigateToVersions && (
              <button className="btn btn-secondary btn-sm" onClick={onNavigateToVersions} style={{ fontSize: '0.72rem' }}>
                View Versions
              </button>
            )}
            <button className="icon-btn" onClick={() => setLastSuccessNotice(null)} style={{ padding: '4px' }}>
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#16a34a" />
              <span>Cloud Architecture Optimizer & Transformation Engine</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Analyzes real topology data to recommend structural enhancements for scalability, performance, cost, and reliability.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
              {components.length} Live Components
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
              {optimizations.length} Opportunities Identified
            </span>
            {optimizations.length > 0 && (
              <button
                id="btn-generate-full-opt"
                className="btn btn-primary btn-sm"
                onClick={handleGenerateFullOptimization}
                style={{ background: '#16a34a', borderColor: '#15803d', fontWeight: 600, fontSize: '0.74rem', gap: '5px' }}
              >
                <Sparkles size={13} />
                <span>Generate Architecture Optimization</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'suggestions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('suggestions')}
            style={{ fontSize: '0.75rem' }}
          >
            <Sparkles size={13} />
            <span>Optimization Opportunities ({optimizations.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'dimensions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('dimensions')}
            style={{ fontSize: '0.75rem' }}
          >
            <Gauge size={13} />
            <span>8-Dimension Architecture Health</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'tradeoffs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('tradeoffs')}
            style={{ fontSize: '0.75rem' }}
          >
            <Scale size={13} />
            <span>Cost vs Performance Profiles</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ACTIONABLE SUGGESTIONS */}
      {activeTab === 'suggestions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {optimizations.length === 0 ? (
            <div className="card" style={{ background: '#ffffff', border: '1px solid #bbf7d0', padding: '24px', textAlign: 'center' }}>
              <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 8px' }} />
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#15803d' }}>
                High Architectural Maturity Verified
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '540px', margin: '6px auto 0' }}>
                Your current architecture incorporates all recommended structural tiers (edge CDN, caching layer, load balancing, and async queues). No critical topology gaps detected!
              </p>
            </div>
          ) : (
            optimizations.map((opt, idx) => (
              <div
                key={opt.id || idx}
                className="card"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                      {opt.category || 'Architecture'}
                    </span>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {opt.title}
                    </h4>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#16a34a' }}>
                    Recommended Action
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', fontSize: '0.76rem' }}>
                  <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', padding: '10px' }}>
                    <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '2px' }}>Current Bottleneck / Problem:</strong>
                    <span style={{ color: '#7f1d1d', lineHeight: 1.4 }}>{opt.problem}</span>
                  </div>

                  <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '6px', padding: '10px' }}>
                    <strong style={{ color: '#1d4ed8', display: 'block', marginBottom: '2px' }}>Engineering Rationale:</strong>
                    <span style={{ color: '#1e3a8a', lineHeight: 1.4 }}>{opt.reason}</span>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '6px', padding: '10px' }}>
                    <strong style={{ color: '#15803d', display: 'block', marginBottom: '2px' }}>Suggested Solution:</strong>
                    <span style={{ color: '#14532d', lineHeight: 1.4 }}>{opt.suggestedSolution}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
                    Expected Impact: <strong style={{ color: '#0f172a' }}>{opt.impact}</strong>
                  </span>

                  {opt.isManualOnly ? (
                    <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>
                      Recommendation only — manual configuration required
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleReviewSingleOptimization(opt)}
                      style={{ fontSize: '0.74rem', gap: '5px' }}
                    >
                      <Sparkles size={13} />
                      <span>Review &amp; Apply Optimization</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: 8-DIMENSION HEALTH AUDIT */}
      {activeTab === 'dimensions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {dimensions.map(dim => {
            const Icon = dim.icon;
            const isHigh = dim.score >= 80;
            return (
              <div key={dim.id} className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isHigh ? '#dcfce7' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={15} color={isHigh ? '#16a34a' : '#d97706'} />
                    </div>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{dim.label}</span>
                  </div>
                  <span className={`badge ${isHigh ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.66rem' }}>
                    {dim.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '8px', lineHeight: 1.35 }}>
                  {dim.desc}
                </div>

                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginBottom: '3px' }}>
                    <span>Readiness Index</span>
                    <strong style={{ color: isHigh ? '#16a34a' : '#d97706' }}>{dim.score} / 100</strong>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${dim.score}%`, height: '100%', background: isHigh ? '#16a34a' : '#d97706' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: TRADEOFF PROFILES */}
      {activeTab === 'tradeoffs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
          {Object.entries(TRADEOFF_PROFILES).map(([key, opt]) => (
            <div
              key={key}
              className="card"
              style={{
                background: '#ffffff',
                border: `1px solid ${key === 'option_b_balanced' ? '#3b82f6' : '#e2e8f0'}`,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: key === 'option_b_balanced' ? '0 4px 12px rgba(59, 130, 246, 0.08)' : '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`badge ${opt.badgeClass}`} style={{ fontSize: '0.66rem' }}>
                  {opt.badge}
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {opt.cost}
                </span>
              </div>

              <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: opt.color, margin: 0 }}>
                {opt.name}
              </h4>

              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                {opt.summary}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase' }}>Scalability</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{opt.scalability.split('(')[0]}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase' }}>Availability</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{opt.availability.split('(')[0]}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase' }}>Complexity</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{opt.complexity}</div>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.72rem', color: '#334155', display: 'block', marginBottom: '4px' }}>Key Architecture Traits:</strong>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5 }}>
                  {opt.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Heuristic Disclaimer */}
      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: '4px' }}>
        * Architectural recommendations are derived from proven cloud-native best practices (AWS Well-Architected Framework &amp; Google Cloud Architecture Framework). Always validate against specific workload requirements.
      </div>
    </div>
  );
}
