import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldAlert, Cpu, Database, Zap, Server, HardDrive, Layers, Inbox, ArrowRight, Sparkles } from 'lucide-react';

export function BottleneckAnalysisPanel({ architecture, onGenerateScaledArchitecture, isGeneratingScaled }) {
  const [trafficScale, setTrafficScale] = useState(1000000); // 1M users by default
  const components = architecture?.components || [];
  const types = new Set(components.map(c => c.type));

  const hasBackend = types.has('backend');
  const hasDatabase = types.has('database');
  const hasCache = types.has('cache');
  const hasLoadBalancer = types.has('loadbalancer') || types.has('gateway');
  const hasCdn = types.has('cdn');
  const hasQueue = types.has('queue');
  const hasReplica = components.some(c => c.name?.toLowerCase().includes('replica') || c.id?.toLowerCase().includes('replica'));

  // Heuristic bottleneck checks across the 7 requested subsystems:
  // 1. Backend
  // 2. Database
  // 3. Cache
  // 4. API Gateway / Load Balancer
  // 5. Storage
  // 6. Load Balancer
  // 7. Message Queue
  const subsystemAudits = [
    {
      id: 'backend',
      name: 'Backend Compute Tier',
      icon: Cpu,
      status: hasBackend && hasLoadBalancer ? 'optimal' : (hasBackend ? 'warning' : 'critical'),
      isBottleneck: !hasLoadBalancer,
      reason: !hasBackend
        ? 'No application backend service configured in architecture.'
        : !hasLoadBalancer
        ? 'Single compute instance. Handles ~250 RPS comfortably; projected surge exceeds single-node CPU thread limit.'
        : 'Multiple instances balanced across availability zones.',
      strategies: [
        'Deploy Application Load Balancer (ALB) across 2+ Availability Zones',
        'Configure Horizontal Pod Autoscaling (HPA) based on CPU/Memory utilization',
        'Decouple heavy synchronous endpoints into async background worker queues'
      ]
    },
    {
      id: 'database',
      name: 'Database Storage Tier',
      icon: Database,
      status: hasDatabase && hasCache && hasReplica ? 'optimal' : (hasDatabase && hasCache ? 'warning' : 'critical'),
      isBottleneck: !hasCache || !hasReplica,
      reason: !hasDatabase
        ? 'No persistent database configured.'
        : !hasCache
        ? 'Higher read/write workload. 100% of read queries hit disk storage directly, risking IOPS saturation.'
        : !hasReplica
        ? 'Concurrent read and analytics queries compete with transactional write locks on the primary database.'
        : 'Protected by Redis in-memory cache and read replicas.',
      strategies: [
        'Provision Read Replicas to split transactional writes and analytical reads',
        'Implement In-Memory Redis caching for frequent catalog lookups',
        'Add connection pooling (PgBouncer) to prevent database connection starvation'
      ]
    },
    {
      id: 'cache',
      name: 'In-Memory Cache Tier',
      icon: Zap,
      status: hasCache ? 'optimal' : 'critical',
      isBottleneck: !hasCache,
      reason: !hasCache
        ? 'Missing cache tier. Repetitive queries, user sessions, and rate-limiting counters cause unnecessary database load.'
        : 'Redis cache deployed. Sub-millisecond read access absorbs ~85%+ of repeat queries.',
      strategies: [
        'Deploy managed Redis Cluster (AWS ElastiCache / GCP Memorystore)',
        'Cache product catalogs, user session tokens, and computed aggregates',
        'Configure Cache-Aside pattern with sensible TTL expiration'
      ]
    },
    {
      id: 'gateway',
      name: 'API Gateway & Ingress',
      icon: Server,
      status: hasLoadBalancer ? 'optimal' : 'warning',
      isBottleneck: !hasLoadBalancer,
      reason: !hasLoadBalancer
        ? 'No dedicated API Gateway or Reverse Proxy. Client requests connect directly to backend ports without SSL offloading or rate limiting.'
        : 'API Gateway / Reverse Proxy in place with SSL termination and centralized ingress routing.',
      strategies: [
        'Deploy Kong Gateway or AWS API Gateway at system boundary',
        'Enforce per-client token bucket rate limiting to prevent noisy neighbor DDoS',
        'Offload TLS/SSL certificate handshakes at edge ingress'
      ]
    },
    {
      id: 'storage',
      name: 'Object & File Storage',
      icon: HardDrive,
      status: 'optimal',
      isBottleneck: false,
      reason: 'Static files and user media can be served directly from object storage via pre-signed URLs without backend proxying.',
      strategies: [
        'Use pre-signed S3/GCS URLs for client direct-to-cloud uploads',
        'Configure lifecycle rules to transition old blobs to cold storage (Glacier)',
        'Enable Cross-Region Replication (CRR) for disaster recovery'
      ]
    },
    {
      id: 'loadbalancer',
      name: 'Load Balancer & Distribution',
      icon: Layers,
      status: hasLoadBalancer ? 'optimal' : 'critical',
      isBottleneck: !hasLoadBalancer,
      reason: !hasLoadBalancer
        ? 'Single point of failure. Without traffic load balancing, any node crash causes immediate full service downtime.'
        : 'Multi-AZ load balancer distributes incoming HTTP/HTTPS traffic and performs automatic health checks.',
      strategies: [
        'Deploy Application Load Balancer across minimum 2 Availability Zones',
        'Configure automated health check probes with 5-second interval',
        'Enable sticky sessions only where stateful WebSockets require it'
      ]
    },
    {
      id: 'queue',
      name: 'Message Queue & Asynchronous Processing',
      icon: Inbox,
      status: hasQueue ? 'optimal' : (trafficScale > 250000 ? 'warning' : 'optimal'),
      isBottleneck: !hasQueue && trafficScale > 250000,
      reason: !hasQueue && trafficScale > 250000
        ? 'Synchronous request coupling. Slow third-party integrations (emails, payments, webhooks) hold open HTTP sockets.'
        : hasQueue
        ? 'Asynchronous queue buffers traffic bursts and isolates worker failures.'
        : 'Workload scale currently manageable synchronously; queue recommended as traffic doubles.',
      strategies: [
        'Integrate Amazon SQS or RabbitMQ for asynchronous background task dispatch',
        'Configure Dead Letter Queues (DLQ) for failed task retry and inspection',
        'Scale worker instances independently from user-facing API servers'
      ]
    }
  ];

  const activeBottlenecks = subsystemAudits.filter(a => a.isBottleneck);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={18} color="#dc2626" />
              <span>Deep Bottleneck & Saturation Analysis</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px' }}>
              Audits the 7 critical architecture subsystems (Backend, Database, Cache, API Gateway, Storage, Load Balancer, Queue) for capacity bottlenecks.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Traffic Scale:</span>
            <select
              className="select-custom"
              value={trafficScale}
              onChange={(e) => setTrafficScale(Number(e.target.value))}
              style={{ width: 'auto', fontSize: '0.72rem', padding: '3px 8px', height: '28px' }}
            >
              <option value={10000}>10,000 Users / mo</option>
              <option value={100000}>100,000 Users / mo</option>
              <option value={1000000}>1,000,000 Users / mo (Scale Target)</option>
              <option value={5000000}>5,000,000 Users / mo (Enterprise Surge)</option>
            </select>
          </div>
        </div>

        {/* Status Alert Banner */}
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: activeBottlenecks.length > 0 ? '#fffbeb' : '#f0fdf4',
            border: `1px solid ${activeBottlenecks.length > 0 ? '#fde68a' : '#bbf7d0'}`,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeBottlenecks.length > 0 ? (
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
            )}
            <div style={{ fontSize: '0.76rem', color: activeBottlenecks.length > 0 ? '#92400e' : '#15803d' }}>
              <strong>
                {activeBottlenecks.length > 0
                  ? `Identified ${activeBottlenecks.length} potential architecture bottlenecks at ${(trafficScale).toLocaleString()} users.`
                  : 'All 7 subsystems are configured with adequate scaling redundancy.'}
              </strong>
            </div>
          </div>

          {activeBottlenecks.length > 0 && onGenerateScaledArchitecture && (
            <button
              className="btn btn-primary btn-sm"
              onClick={onGenerateScaledArchitecture}
              disabled={isGeneratingScaled}
              style={{ fontSize: '0.72rem', padding: '4px 12px' }}
            >
              <Sparkles size={12} />
              <span>{isGeneratingScaled ? 'Generating Scaled Model...' : 'Auto-Resolve with Scaled Architecture'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Subsystem Audit Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
        {subsystemAudits.map((audit) => {
          const Icon = audit.icon;
          const isWarning = audit.isBottleneck;
          const statusBg = isWarning ? '#fffbeb' : '#f0fdf4';
          const statusBorder = isWarning ? '#fde68a' : '#bbf7d0';
          const statusText = isWarning ? '#b45309' : '#15803d';
          const badgeText = isWarning ? 'POTENTIAL BOTTLENECK' : 'OPTIMAL';

          return (
            <div
              key={audit.id}
              className="card"
              style={{
                background: '#ffffff',
                border: `1px solid ${isWarning ? '#fde68a' : '#e2e8f0'}`,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: isWarning ? '0 1px 3px rgba(217,119,6,0.08)' : 'var(--shadow-xs)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: isWarning ? '#fef3c7' : '#dcfce7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={16} color={isWarning ? '#d97706' : '#16a34a'} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{audit.name}</h4>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Subsystem Analysis</span>
                  </div>
                </div>

                <span
                  className="badge"
                  style={{
                    background: statusBg,
                    color: statusText,
                    borderColor: statusBorder,
                    fontSize: '0.64rem',
                    fontWeight: 700
                  }}
                >
                  {badgeText}
                </span>
              </div>

              {/* Workload Risk & Reason */}
              <div
                style={{
                  fontSize: '0.74rem',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: isWarning ? '#fffbeb' : '#f8fafc',
                  border: `1px solid ${isWarning ? '#fde68a' : '#e2e8f0'}`,
                  color: isWarning ? '#78350f' : '#334155'
                }}
              >
                <strong>Reason: </strong>
                {audit.reason}
              </div>

              {/* Mitigation Strategies */}
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Possible Mitigation Strategies:
                </div>
                <ul style={{ paddingLeft: '16px', fontSize: '0.71rem', color: '#475569', lineHeight: 1.45 }}>
                  {audit.strategies.map((strat, i) => (
                    <li key={i}>{strat}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 8px' }}>
        * Heuristic analysis based on industry concurrency limits (e.g. single node compute ~250 RPS, relational primary writes, in-memory caching benefits). Not scientifically exact measurements.
      </div>
    </div>
  );
}
