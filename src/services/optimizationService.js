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

  return suggestions;
}
