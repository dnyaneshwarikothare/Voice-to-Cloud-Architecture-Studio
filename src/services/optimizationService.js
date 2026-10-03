/**
 * Architecture Optimizer Service
 * Analyzes architecture topology and provides actionable transformation suggestions
 * with individual "Apply Suggestion" actions and Before/After generation.
 */

import { COMPONENT_TYPES, sanitizeId } from '../utils/architectureSchema.js';

export function getArchitectureOptimizations(architecture) {
  if (!architecture || !Array.isArray(architecture.components) || architecture.components.length === 0) {
    return [];
  }

  const { components, connections = [] } = architecture;
  const suggestions = [];

  const frontends = components.filter(c => c.type === COMPONENT_TYPES.FRONTEND);
  const backends = components.filter(c => c.type === COMPONENT_TYPES.BACKEND);
  const databases = components.filter(c => c.type === COMPONENT_TYPES.DATABASE);
  const caches = components.filter(c => c.type === COMPONENT_TYPES.CACHE);
  const cdns = components.filter(c => c.type === COMPONENT_TYPES.CDN);
  const lbs = components.filter(c => c.type === COMPONENT_TYPES.LOADBALANCER);
  const gateways = components.filter(c => c.type === COMPONENT_TYPES.GATEWAY);
  const queues = components.filter(c => c.type === COMPONENT_TYPES.QUEUE);
  const monitorings = components.filter(c => c.type === COMPONENT_TYPES.MONITORING);

  // 1. Suggestion: Add CDN for Frontend
  if (frontends.length > 0 && cdns.length === 0) {
    suggestions.push({
      id: 'opt_add_cdn',
      title: 'Add Global Content Delivery Network (CDN)',
      category: 'Performance',
      problem: 'Frontend assets and static files are served directly from origin or host without edge caching.',
      reason: 'A CDN brings media and compiled bundles to edge POP locations globally, dropping TTFB and offloading origin bandwidth.',
      suggestedSolution: 'Insert an edge CDN (AWS CloudFront / GCP Cloud CDN) in front of the frontend application.',
      impact: '⚡ +12 Performance score | ~$2.00/mo estimated CDN baseline',
      apply: (arch) => {
        const cdnId = 'cdn_edge';
        const newComp = {
          id: cdnId,
          name: 'Global CDN',
          type: COMPONENT_TYPES.CDN,
          tier: 'standard',
          description: 'Edge Content Delivery Network (CloudFront / Cloud CDN)'
        };
        const updatedComponents = [newComp, ...arch.components];
        const newConnections = [...arch.connections];

        // Connect CDN to frontends
        frontends.forEach(fe => {
          newConnections.unshift({
            from: cdnId,
            to: fe.id,
            label: 'Edge Distribution'
          });
        });

        return {
          ...arch,
          components: updatedComponents,
          connections: newConnections
        };
      }
    });
  }

  // 2. Suggestion: Add In-Memory Cache (Redis)
  if (databases.length > 0 && caches.length === 0 && backends.length > 0) {
    suggestions.push({
      id: 'opt_add_cache',
      title: 'Add Redis In-Memory Cache Layer',
      category: 'Performance & Scalability',
      problem: 'All reads hit the primary database directly, risking query bottlenecks under traffic bursts.',
      reason: 'In-memory caching absorbs frequent read queries (e.g. user sessions, catalog queries), reducing DB CPU utilization by 70-90%.',
      suggestedSolution: 'Add a Redis cache cluster alongside the backend and database.',
      impact: '⚡ +15 Performance & Scalability score | ~$13.50/mo (ElastiCache / Memorystore)',
      apply: (arch) => {
        const cacheId = 'redis_cache';
        const newComp = {
          id: cacheId,
          name: 'Redis Cache',
          type: COMPONENT_TYPES.CACHE,
          tier: 'cache-small',
          description: 'High-throughput in-memory key-value cache'
        };
        const updatedComponents = [...arch.components, newComp];
        const newConnections = [...arch.connections];

        // Connect backends to the new cache
        backends.forEach(be => {
          newConnections.push({
            from: be.id,
            to: cacheId,
            label: 'Cache Reads/Writes'
          });
        });

        return {
          ...arch,
          components: updatedComponents,
          connections: newConnections
        };
      }
    });
  }

  // 3. Suggestion: Add Load Balancer
  if (backends.length >= 1 && lbs.length === 0 && gateways.length === 0) {
    suggestions.push({
      id: 'opt_add_loadbalancer',
      title: 'Add Application Load Balancer (ALB)',
      category: 'Availability & Scalability',
      problem: 'Clients communicate directly with backend compute instances, preventing horizontal scaling and SSL offload.',
      reason: 'A load balancer distributes incoming connections evenly across healthy backend targets with automated health checks.',
      suggestedSolution: 'Position an Application Load Balancer between frontends and backends.',
      impact: '🛡️ +18 Availability score | ~$16.20/mo (AWS ALB / GCP Cloud LB)',
      apply: (arch) => {
        const lbId = 'app_load_balancer';
        const newComp = {
          id: lbId,
          name: 'Application Load Balancer',
          type: COMPONENT_TYPES.LOADBALANCER,
          tier: 'standard',
          description: 'High-availability reverse proxy and load distributor'
        };

        // Rewire connections: frontends -> loadbalancer -> backends
        const updatedComponents = [
          ...arch.components.slice(0, 1),
          newComp,
          ...arch.components.slice(1)
        ];

        let newConnections = arch.connections.filter(c => {
          // Remove direct frontend to backend links
          const isFrontendToBackend = frontends.some(f => f.id === c.from) && backends.some(b => b.id === c.to);
          return !isFrontendToBackend;
        });

        frontends.forEach(fe => {
          newConnections.push({ from: fe.id, to: lbId, label: 'HTTPS Traffic' });
        });

        backends.forEach(be => {
          newConnections.push({ from: lbId, to: be.id, label: 'Forward Requests' });
        });

        return {
          ...arch,
          components: updatedComponents,
          connections: newConnections
        };
      }
    });
  }

  // 4. Suggestion: Add Asynchronous Message Queue
  if (backends.length >= 1 && databases.length >= 1 && queues.length === 0) {
    suggestions.push({
      id: 'opt_add_queue',
      title: 'Add Message Queue for Asynchronous Jobs',
      category: 'Scalability & Reliability',
      problem: 'Synchronous API calls handle all background operations, risking request timeouts during third-party or heavy processing.',
      reason: 'A message queue buffers unpredictable request spikes and ensures at-least-once message processing without dropping transactions.',
      suggestedSolution: 'Add Amazon SQS / RabbitMQ to offload async emails, notifications, and webhooks.',
      impact: '📦 +10 Scalability score | ~$0.40/1M messages',
      apply: (arch) => {
        const queueId = 'async_queue';
        const newComp = {
          id: queueId,
          name: 'Message Queue (SQS/PubSub)',
          type: COMPONENT_TYPES.QUEUE,
          tier: 'standard',
          description: 'Managed message queue for background jobs'
        };
        const updatedComponents = [...arch.components, newComp];
        const newConnections = [...arch.connections];

        backends.forEach(be => {
          newConnections.push({
            from: be.id,
            to: queueId,
            label: 'Enqueue Jobs'
          });
        });

        return {
          ...arch,
          components: updatedComponents,
          connections: newConnections
        };
      }
    });
  }

  // 5. Suggestion: Add Observability & Monitoring
  if (monitorings.length === 0) {
    suggestions.push({
      id: 'opt_add_monitoring',
      title: 'Add Cloud Telemetry & Observability',
      category: 'Availability',
      problem: 'No centralized logging or performance monitoring service detected.',
      reason: 'Real-time telemetry provides CPU/memory alarms, error tracking, and distributed tracing to diagnose incidents quickly.',
      suggestedSolution: 'Integrate CloudWatch / GCP Cloud Monitoring metrics suite.',
      impact: '📊 +8 Availability score | ~$10-$12/mo baseline telemetry',
      apply: (arch) => {
        const monId = 'cloud_monitoring';
        const newComp = {
          id: monId,
          name: 'Cloud Monitoring & Logs',
          type: COMPONENT_TYPES.MONITORING,
          tier: 'standard',
          description: 'Centralized telemetry, log aggregation, and alerting'
        };
        const updatedComponents = [...arch.components, newComp];
        const newConnections = [...arch.connections];

        backends.forEach(be => {
          newConnections.push({
            from: be.id,
            to: monId,
            label: 'Export Logs/Metrics'
          });
        });

        return {
          ...arch,
          components: updatedComponents,
          connections: newConnections
        };
      }
    });
  }

  // 6. Suggestion: Add Database Read Replica
  const hasDbReplica = components.some(c => 
    c.id.includes('replica') || (c.name && c.name.toLowerCase().includes('replica'))
  );
  if (databases.length > 0 && !hasDbReplica && backends.length > 0) {
    suggestions.push({
      id: 'opt_add_db_replica',
      title: 'Add PostgreSQL / Cloud SQL Read Replica',
      category: 'Scalability & Performance',
      problem: 'Primary database processes all write mutations and high-volume read queries simultaneously.',
      reason: 'Asynchronous read replicas isolate read-heavy workloads (reporting, search, dashboards), reducing primary DB contention.',
      suggestedSolution: 'Provision an automated read replica alongside the primary database.',
      impact: '📈 +14 Scalability score | ~$24.00/mo managed replica',
      apply: (arch) => {
        const replicaId = 'db_read_replica';
        const primaryDb = databases[0];
        const newComp = {
          id: replicaId,
          name: 'PostgreSQL Read Replica',
          type: COMPONENT_TYPES.DATABASE,
          tier: 'standard',
          technology: primaryDb.technology || 'PostgreSQL',
          description: 'Asynchronous read replica offloading queries'
        };
        const updatedComponents = [...arch.components, newComp];
        const newConnections = [
          ...arch.connections,
          {
            from: primaryDb.id,
            to: replicaId,
            label: 'Replication Stream'
          }
        ];
        backends.forEach(be => {
          newConnections.push({
            from: be.id,
            to: replicaId,
            label: 'Read Queries'
          });
        });
        return {
          ...arch,
          components: updatedComponents,
          connections: newConnections
        };
      }
    });
  }

  // 7. Suggestion: Increase Backend Instances & Horizontal Auto-Scaling
  const hasScaledCluster = backends.some(b => 
    (b.instances && b.instances > 1) || (b.name && b.name.includes('Cluster'))
  );
  if (backends.length > 0 && !hasScaledCluster) {
    suggestions.push({
      id: 'opt_scale_backends',
      title: 'Increase Backend Instances & Multi-AZ Auto-Scaling',
      category: 'Availability & Scalability',
      problem: 'Backend services run on a single compute node, representing a single point of failure under peak traffic.',
      reason: 'Auto-scaling across multiple availability zones maintains target request latency and prevents service dropouts.',
      suggestedSolution: 'Scale backend to a 3-node redundant cluster with automated CPU/memory scale-out policies.',
      impact: '🛡️ +16 Availability score | Elastic on-demand compute',
      apply: (arch) => {
        const updatedComponents = arch.components.map(c => {
          if (c.type === COMPONENT_TYPES.BACKEND) {
            return {
              ...c,
              name: c.name.includes('Cluster') ? c.name : `${c.name} (Auto-Scaled Cluster)`,
              tier: 'cluster-ha',
              instances: 3,
              description: 'Multi-AZ auto-scaling backend cluster (2-5 instances)'
            };
          }
          return c;
        });
        return {
          ...arch,
          components: updatedComponents,
          connections: [...arch.connections]
        };
      }
    });
  }

  // 8. Manual Policy: IAM Least Privilege (Requirement 7)
  suggestions.push({
    id: 'opt_iam_security',
    title: 'Enforce IAM Least-Privilege & Key Rotation',
    category: 'Security',
    problem: 'Broad wildcard permissions on cloud IAM roles expose assets to lateral blast radius.',
    reason: 'Scoping service accounts to minimum necessary resource ARNs protects against leaked credential misuse.',
    suggestedSolution: 'Audit IAM policies in AWS IAM / GCP IAM Console to enforce least-privilege scoping.',
    impact: '🔒 +10 Security score | Manual policy configuration',
    isManualOnly: true,
    manualNotice: 'Recommendation only — manual configuration required.'
  });

  // 9. Manual Policy: Disaster Recovery & Automated Backups (Requirement 7)
  suggestions.push({
    id: 'opt_multi_region_backup',
    title: 'Configure Cross-Region Automated Disaster Recovery',
    category: 'Reliability',
    problem: 'Primary database backups are co-located in the primary region, vulnerable to regional cloud incidents.',
    reason: 'Replicating encrypted daily snapshots to a secondary geographic region guarantees rapid RTO/RPO recovery.',
    suggestedSolution: 'Enable cross-region snapshot replication in Cloud Console / Terraform storage policy.',
    impact: '🛡️ +8 Reliability score | Manual cloud configuration',
    isManualOnly: true,
    manualNotice: 'Recommendation only — manual configuration required.'
  });

  return suggestions;
}

/**
 * Generate Comprehensive Optimization
 * Aggregates all automated optimizations and returns the fully transformed architecture
 */
export function generateComprehensiveOptimization(architecture) {
  if (!architecture || !Array.isArray(architecture.components) || architecture.components.length === 0) {
    return {
      optimizedArchitecture: architecture,
      appliedActions: [],
      totalApplied: 0
    };
  }
  const suggestions = getArchitectureOptimizations(architecture);
  const autoSuggestions = suggestions.filter(s => !s.isManualOnly && typeof s.apply === 'function');

  let current = JSON.parse(JSON.stringify(architecture));
  const appliedActions = [];

  for (const opt of autoSuggestions) {
    try {
      const next = opt.apply(current);
      if (next && Array.isArray(next.components) && next.components.length > 0) {
        current = next;
        appliedActions.push({
          id: opt.id,
          title: opt.title,
          category: opt.category,
          impact: opt.impact
        });
      }
    } catch (err) {
      console.warn('Failed to apply optimization step:', opt.id, err);
    }
  }

  return {
    optimizedArchitecture: current,
    appliedActions,
    totalApplied: appliedActions.length
  };
}

/**
 * Compute Architecture Diff
 * Compares before and after architectures and calculates exact structural deltas
 */
export function computeArchitectureDiff(beforeArch, afterArch) {
  const beforeComps = beforeArch?.components || [];
  const afterComps = afterArch?.components || [];
  const beforeConns = beforeArch?.connections || [];
  const afterConns = afterArch?.connections || [];

  const beforeMap = new Map(beforeComps.map(c => [c.id, c]));
  const afterMap = new Map(afterComps.map(c => [c.id, c]));

  const addedComponents = afterComps.filter(c => !beforeMap.has(c.id));
  const removedComponents = beforeComps.filter(c => !afterMap.has(c.id));
  const modifiedComponents = afterComps.filter(c => {
    if (!beforeMap.has(c.id)) return false;
    const orig = beforeMap.get(c.id);
    return orig.name !== c.name || orig.tier !== c.tier || orig.instances !== c.instances;
  });

  const connectionsChanged = Math.abs(afterConns.length - beforeConns.length) +
    afterConns.filter(ac => !beforeConns.some(bc => (bc.from === ac.from && bc.to === ac.to) || (bc.from_id === ac.from_id && bc.to_id === ac.to_id))).length;

  return {
    addedComponents,
    removedComponents,
    modifiedComponents,
    connectionsChanged,
    beforeCount: beforeComps.length,
    afterCount: afterComps.length
  };
}
