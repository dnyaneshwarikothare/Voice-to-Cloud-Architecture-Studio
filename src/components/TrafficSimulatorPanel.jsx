import React, { useState } from 'react';
import { Activity, AlertTriangle, TrendingUp, Cpu, Database, HardDrive, Wifi, Sliders, CheckCircle2, Sparkles, Layers, ArrowRight, ShieldAlert } from 'lucide-react';

export function TrafficSimulatorPanel({ architecture, onGenerateScaledArchitecture, isGeneratingScaled }) {
  const [currentUsers, setCurrentUsers] = useState(10000);
  const [futureUsers, setFutureUsers] = useState(1000000);
  const [growthRate, setGrowthRate] = useState('100x');
  const [timePeriod, setTimePeriod] = useState('12 Months');

  const components = architecture?.components || [];
  const types = new Set(components.map(c => c.type));

  const hasBackend = types.has('backend');
  const hasDatabase = types.has('database');
  const hasCache = types.has('cache');
  const hasLoadBalancer = types.has('loadbalancer') || types.has('gateway');
  const hasCdn = types.has('cdn');
  const hasQueue = types.has('queue');

  // Traffic heuristics
  const currentRps = Math.max(1, Math.round((currentUsers / (30 * 24 * 3600)) * 12));
  const futureRps = Math.max(10, Math.round((futureUsers / (30 * 24 * 3600)) * 12));
  const growthMultiple = Math.round(futureUsers / Math.max(1, currentUsers));
  const projectedEgressGb = Math.round((futureUsers * 0.18)); // ~180KB per user visit

  // Bottlenecks calculated based on architectural presence
  const bottlenecks = [];
  if (!hasLoadBalancer && futureRps > 200) {
    bottlenecks.push({
      component: 'Application Backend',
      type: 'backend',
      severity: 'Critical',
      reason: `Single backend instance will be overwhelmed by ~${futureRps.toLocaleString()} peak RPS. Comfortable single-node capacity is ~250 RPS.`,
      strategy: 'Deploy Multi-AZ Application Load Balancer with horizontal auto-scaling (min 3, max 10 instances).'
    });
  }

  if (!hasCache && futureUsers > 50000) {
    bottlenecks.push({
      component: 'Database Query Engine',
      type: 'database',
      severity: 'Critical',
      reason: `Without in-memory caching, 100% of read and session queries hit PostgreSQL directly, causing IOPS exhaustion at peak traffic.`,
      strategy: 'Introduce Redis cluster to absorb 85%+ of repetitive database queries with sub-millisecond responses.'
    });
  }

  if (hasDatabase && !components.some(c => c.name?.toLowerCase().includes('replica')) && futureUsers > 100000) {
    bottlenecks.push({
      component: 'Database Storage IOPS',
      type: 'database',
      severity: 'High',
      reason: 'Concurrent read queries compete with transactional write locks on the primary database instance.',
      strategy: 'Configure read-only database replicas to separate analytical / catalog queries from transactional write operations.'
    });
  }

  if (!hasCdn && futureUsers > 25000) {
    bottlenecks.push({
      component: 'Static Asset Delivery',
      type: 'frontend',
      severity: 'Medium',
      reason: `Serving web bundles and media directly from backend servers increases bandwidth egress and server CPU latency.`,
      strategy: 'Enable edge Content Delivery Network (CloudFront / Cloud CDN) to cache assets at global points of presence.'
    });
  }

  if (!hasQueue && futureUsers > 200000) {
    bottlenecks.push({
      component: 'Asynchronous Task Processing',
      type: 'queue',
      severity: 'Medium',
      reason: 'Long-running tasks (emails, payment callbacks, webhooks) block HTTP request worker threads.',
      strategy: 'Implement asynchronous message queue (Amazon SQS / RabbitMQ) to decouple background worker tasks.'
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Banner */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#2563eb" />
              <span>Future Traffic & Capacity Simulation</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px' }}>
              Simulate traffic surges from baseline to future growth, identify affected architecture tiers, and preview auto-scaling recommendations.
            </p>
          </div>
          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
            Simulated Capacity Heuristics
          </span>
        </div>
      </div>

      {/* Traffic Parameters Control Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={15} color="#2563eb" />
          <span>Simulation Parameters</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {/* Current Traffic */}
          <div className="form-group">
            <label className="form-label">Current Baseline Traffic</label>
            <select
              className="select-custom"
              value={currentUsers}
              onChange={(e) => setCurrentUsers(Number(e.target.value))}
            >
              <option value={1000}>1,000 users / month (~1 RPS)</option>
              <option value={10000}>10,000 users / month (~12 RPS)</option>
              <option value={50000}>50,000 users / month (~60 RPS)</option>
              <option value={100000}>100,000 users / month (~120 RPS)</option>
            </select>
          </div>

          {/* Future Traffic */}
          <div className="form-group">
            <label className="form-label">Projected Future Traffic</label>
            <select
              className="select-custom"
              value={futureUsers}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFutureUsers(val);
                setGrowthRate(`${Math.round(val / currentUsers)}x`);
              }}
            >
              <option value={50000}>50,000 users / month (~60 RPS)</option>
              <option value={200000}>200,000 users / month (~240 RPS)</option>
              <option value={500000}>500,000 users / month (~600 RPS)</option>
              <option value={1000000}>1,000,000 users / month (~1,200 RPS)</option>
              <option value={5000000}>5,000,000 users / month (~6,000 RPS)</option>
            </select>
          </div>

          {/* Growth Rate */}
          <div className="form-group">
            <label className="form-label">Growth Multiple</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['5x', '10x', '50x', '100x'].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  className={`btn btn-sm ${growthRate === rate ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.72rem' }}
                  onClick={() => {
                    setGrowthRate(rate);
                    const mult = parseInt(rate);
                    setFutureUsers(currentUsers * mult);
                  }}
                >
                  {rate}
                </button>
              ))}
            </div>
          </div>

          {/* Time Period */}
          <div className="form-group">
            <label className="form-label">Simulation Time Horizon</label>
            <select
              className="select-custom"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              <option value="3 Months">3 Months (Rapid Ramp)</option>
              <option value="6 Months">6 Months (Mid-Term Growth)</option>
              <option value="12 Months">12 Months (Annual Scale Target)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Traffic Growth Metrics Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Current Baseline</span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {currentUsers.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>users/mo</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>~{currentRps} Peak RPS</span>
        </div>

        <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px' }}>
          <span style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: 600 }}>Simulated Future Load</span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>
            {futureUsers.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>users/mo</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600 }}>~{futureRps.toLocaleString()} Peak RPS ({growthMultiple}x Growth)</span>
        </div>

        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Estimated Egress Bandwidth</span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {projectedEgressGb.toLocaleString()} GB
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Monthly outbound data transfer</span>
        </div>

        <div className="card" style={{ background: bottlenecks.length > 0 ? '#fffbeb' : '#f0fdf4', border: `1px solid ${bottlenecks.length > 0 ? '#fde68a' : '#bbf7d0'}`, padding: '12px' }}>
          <span style={{ fontSize: '0.7rem', color: bottlenecks.length > 0 ? '#b45309' : '#15803d', fontWeight: 600 }}>Saturation Risk</span>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: bottlenecks.length > 0 ? '#b45309' : '#15803d', marginTop: '2px' }}>
            {bottlenecks.length > 0 ? `${bottlenecks.length} Bottlenecks` : 'Optimal Scale'}
          </div>
          <span style={{ fontSize: '0.68rem', color: bottlenecks.length > 0 ? '#b45309' : '#15803d' }}>
            {bottlenecks.length > 0 ? 'Mitigations required for peak RPS' : 'Current tiers handle workload'}
          </span>
        </div>
      </div>

      {/* Affected Components & Saturation Analysis */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={15} color="#2563eb" />
          <span>Affected Architecture Components Under {futureUsers.toLocaleString()} Users</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {components.map((comp) => {
            const isBackend = comp.type === 'backend';
            const isDb = comp.type === 'database';
            const loadStatus = (isBackend && !hasLoadBalancer) || (isDb && !hasCache) ? 'Saturated' : 'Normal';
            const statusColor = loadStatus === 'Saturated' ? '#dc2626' : '#16a34a';

            return (
              <div
                key={comp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.74rem'
                }}
              >
                <div>
                  <strong style={{ color: '#0f172a' }}>{comp.name}</strong>
                  <span style={{ color: '#64748b', marginLeft: '6px' }}>({comp.technology || comp.type})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#64748b' }}>Projected Traffic: ~{futureRps} RPS</span>
                  <span
                    className="badge"
                    style={{
                      background: loadStatus === 'Saturated' ? '#fef2f2' : '#f0fdf4',
                      color: statusColor,
                      borderColor: loadStatus === 'Saturated' ? '#fecaca' : '#bbf7d0'
                    }}
                  >
                    {loadStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scaling Recommendations & Action */}
      <div className="card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={15} color="#2563eb" />
            <span>Auto-Scaling Recommendations for {futureUsers.toLocaleString()} Users</span>
          </div>
          {onGenerateScaledArchitecture && (
            <button
              className="btn btn-primary"
              onClick={onGenerateScaledArchitecture}
              disabled={isGeneratingScaled}
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              <Sparkles size={13} />
              <span>{isGeneratingScaled ? 'Generating Scaled Model...' : '🚀 Generate Scaled Architecture'}</span>
            </button>
          )}
        </div>

        <ul style={{ paddingLeft: '18px', fontSize: '0.74rem', color: '#334155', lineHeight: 1.6 }}>
          {!hasLoadBalancer && <li><b>Deploy Application Load Balancer (ALB):</b> Distribute traffic across 3+ backend compute nodes across availability zones.</li>}
          {!hasCache && <li><b>Add Redis Cache Cluster:</b> Absorb 85%+ repeat queries and session reads to keep DB latency sub-millisecond.</li>}
          {hasDatabase && <li><b>Provision Database Read Replica:</b> Route read queries to read replicas and preserve the primary node for ACID writes.</li>}
          {!hasCdn && <li><b>Enable Edge CDN:</b> Cache static JavaScript, CSS, and images at global edge PoPs.</li>}
        </ul>

        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '10px' }}>
          * Clearly labeled as a scenario-based simulation estimate. Actual resource consumption depends on endpoint compute complexity and data payload sizes.
        </div>
      </div>
    </div>
  );
}
