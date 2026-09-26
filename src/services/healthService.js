/**
 * Architecture Health Check Service: Evaluates architecture across 5 pillars
 * (Security, Availability, Scalability, Performance, Cost)
 */

import { COMPONENT_TYPES } from '../utils/architectureSchema.js';

export function analyzeArchitectureHealth(architecture) {
  if (!architecture || !Array.isArray(architecture.components) || architecture.components.length === 0) {
    return {
      overallScore: 0,
      pillars: {
        security: { score: 100, status: 'good', findings: [] },
        availability: { score: 100, status: 'good', findings: [] },
        scalability: { score: 100, status: 'good', findings: [] },
        performance: { score: 100, status: 'good', findings: [] },
        cost: { score: 100, status: 'good', findings: [] }
      },
      summary: 'No active components to analyze.'
    };
  }

  const { components, connections = [] } = architecture;

  const frontends = components.filter(c => c.type === COMPONENT_TYPES.FRONTEND);
  const backends = components.filter(c => c.type === COMPONENT_TYPES.BACKEND);
  const databases = components.filter(c => c.type === COMPONENT_TYPES.DATABASE);
  const caches = components.filter(c => c.type === COMPONENT_TYPES.CACHE);
  const queues = components.filter(c => c.type === COMPONENT_TYPES.QUEUE);
  const lbs = components.filter(c => c.type === COMPONENT_TYPES.LOADBALANCER);
  const gateways = components.filter(c => c.type === COMPONENT_TYPES.GATEWAY);
  const cdns = components.filter(c => c.type === COMPONENT_TYPES.CDN);
  const auths = components.filter(c => c.type === COMPONENT_TYPES.AUTH);
  const monitorings = components.filter(c => c.type === COMPONENT_TYPES.MONITORING);

  // Set of targets directly contacted by frontends
  const frontendDirectTargets = new Set();
  connections.forEach(conn => {
    if (frontends.some(f => f.id === conn.from)) {
      frontendDirectTargets.add(conn.to);
    }
  });

  const securityFindings = [];
  const availabilityFindings = [];
  const scalabilityFindings = [];
  const performanceFindings = [];
  const costFindings = [];

  // ==========================================
  // 1. SECURITY
  // ==========================================
  // Check if any database is directly reached by frontend
  const exposedDbs = databases.filter(db => frontendDirectTargets.has(db.id));
  if (exposedDbs.length > 0) {
    securityFindings.push({
      type: 'risk',
      severity: 'high',
      title: 'Potential Risk: Database directly exposed to client tier',
      description: `Frontend communicates directly with ${exposedDbs.map(d => d.name).join(', ')}. Database instances should typically reside in private subnets behind an authenticated backend service layer.`,
      recommendation: 'Place backend API between frontend and database to enforce authentication, query validation, and access control.'
    });
  } else if (databases.length > 0) {
    securityFindings.push({
      type: 'good',
      severity: 'none',
      title: 'Good practice: Database is protected behind application tier',
      description: 'Databases are not directly accessed by public clients, keeping them safely within private VPC network layers.'
    });
  }

  // Check for authentication service if there is a frontend and backend
  if (frontends.length > 0 && backends.length > 0 && auths.length === 0) {
    securityFindings.push({
      type: 'suggestion',
      severity: 'medium',
      title: 'Consider: Dedicated authentication and token management',
      description: 'No distinct identity/auth provider (such as Cognito, OAuth2, or JWT Auth) was detected in the architecture graph.',
      recommendation: 'Consider introducing a managed identity service for session control, MFA, and API token validation.'
    });
  }

  // ==========================================
  // 2. AVAILABILITY
  // ==========================================
  // Single backend instance check
  if (backends.length === 1) {
    availabilityFindings.push({
      type: 'warning',
      severity: 'medium',
      title: 'Potential Risk: Single backend instance may become a single point of failure',
      description: `Only one backend service (${backends[0].name}) detected. A deployment crash, instance reboot, or network interruption could cause downtime.`,
      recommendation: 'Consider provisioning multi-instance redundancy behind a load balancer with auto-scaling.'
    });
  } else if (backends.length > 1) {
    availabilityFindings.push({
      type: 'good',
      severity: 'none',
      title: 'Good practice: Multiple backend services detected',
      description: 'Workloads are distributed across multiple backend components, improving fault isolation.'
    });
  }

  // Monitoring check
  if (monitorings.length === 0) {
    availabilityFindings.push({
      type: 'suggestion',
      severity: 'low',
      title: 'Consider: Centralized health monitoring & alerting',
      description: 'No active monitoring or logging service was found to track uptime, error spikes, or latency metrics.',
      recommendation: 'Add telemetry tools (e.g. Amazon CloudWatch, GCP Cloud Monitoring, or Prometheus) to detect outages.'
    });
  }

  // ==========================================
  // 3. SCALABILITY
  // ==========================================
  // Multiple backends without a load balancer or gateway
  if (backends.length > 1 && lbs.length === 0 && gateways.length === 0) {
    scalabilityFindings.push({
      type: 'warning',
      severity: 'medium',
      title: 'Consider: Adding a Load Balancer or API Gateway',
      description: 'Multiple backend services are operating without a centralized reverse proxy, load balancer, or API gateway to distribute client requests.',
      recommendation: 'Introduce an Application Load Balancer (ALB) or API Gateway for path-based routing and traffic balancing.'
    });
  } else if (lbs.length > 0 || gateways.length > 0) {
    scalabilityFindings.push({
      type: 'good',
      severity: 'none',
      title: 'Good practice: Traffic distribution layer present',
      description: 'Load balancer or API gateway handles incoming traffic routing and smooth connection distribution.'
    });
  }

  // Asynchronous queue check if multiple backends or heavy databases
  if (backends.length >= 2 && databases.length >= 1 && queues.length === 0) {
    scalabilityFindings.push({
      type: 'suggestion',
      severity: 'medium',
      title: 'Consider: Asynchronous message queue for inter-service communication',
      description: 'Services appear to communicate synchronously. High load on downstream services could cause thread starvation or cascading failure.',
      recommendation: 'Consider adding a message queue (such as RabbitMQ, SQS, or Apache Kafka) for decoupled async processing.'
    });
  }

  // ==========================================
  // 4. PERFORMANCE
  // ==========================================
  // Check if frontend has a CDN
  if (frontends.length > 0 && cdns.length === 0) {
    performanceFindings.push({
      type: 'suggestion',
      severity: 'medium',
      title: 'Recommended improvement: Add CDN for static frontend assets',
      description: 'Frontend client assets are served without an edge Content Delivery Network (CDN), which can increase latency for geographically distributed users.',
      recommendation: 'Add CloudFront or Cloud CDN to cache static bundles, images, and HTML at the network edge.'
    });
  } else if (cdns.length > 0) {
    performanceFindings.push({
      type: 'good',
      severity: 'none',
      title: 'Good practice: Edge CDN accelerates content delivery',
      description: 'Static assets and cached queries are delivered from edge locations close to users.'
    });
  }

  // Check if database has caching
  if (databases.length > 0 && caches.length === 0) {
    performanceFindings.push({
      type: 'suggestion',
      severity: 'medium',
      title: 'Recommended improvement: Consider adding Redis / Memcached in-memory caching',
      description: 'Backend queries database directly for every request. Repeated read queries can saturate database connection pools and disk I/O under peak load.',
      recommendation: 'Add an in-memory cache (such as Redis) to cache frequent query responses and session tokens.'
    });
  } else if (caches.length > 0) {
    performanceFindings.push({
      type: 'good',
      severity: 'none',
      title: 'Good practice: In-memory caching detected',
      description: 'Redis/Memcached cache layer protects the database from redundant queries and reduces response latency.'
    });
  }

  // ==========================================
  // 5. COST
  // ==========================================
  // Check for over-provisioning
  const highTierComponents = components.filter(c => c.tier === 'compute-large' || c.tier === 'db-large');
  if (highTierComponents.length > 0) {
    costFindings.push({
      type: 'suggestion',
      severity: 'low',
      title: 'Consider: Evaluate compute sizing to prevent idle cost',
      description: `${highTierComponents.map(c => c.name).join(', ')} is configured on a large tier. Verify if CPU/RAM utilization justifies dedicated high-tier capacity.`,
      recommendation: 'Consider auto-scaling standard instances or serverless execution during off-peak hours.'
    });
  } else {
    costFindings.push({
      type: 'good',
      severity: 'none',
      title: 'Good practice: Lean architectural component footprint',
      description: 'No immediate over-provisioned or idle resource traps identified in the current configuration.'
    });
  }

  // Calculate scores per pillar
  const calcPillarScore = (findings) => {
    let score = 100;
    findings.forEach(f => {
      if (f.severity === 'high') score -= 30;
      else if (f.severity === 'medium') score -= 15;
      else if (f.severity === 'low') score -= 5;
    });
    return Math.max(20, Math.min(100, score));
  };

  const securityScore = calcPillarScore(securityFindings);
  const availabilityScore = calcPillarScore(availabilityFindings);
  const scalabilityScore = calcPillarScore(scalabilityFindings);
  const performanceScore = calcPillarScore(performanceFindings);
  const costScore = calcPillarScore(costFindings);

  const overallScore = Math.round(
    (securityScore * 0.25) +
    (availabilityScore * 0.25) +
    (scalabilityScore * 0.20) +
    (performanceScore * 0.15) +
    (costScore * 0.15)
  );

  return {
    overallScore,
    pillars: {
      security: {
        score: securityScore,
        status: securityScore >= 80 ? 'good' : securityScore >= 60 ? 'warning' : 'risk',
        findings: securityFindings
      },
      availability: {
        score: availabilityScore,
        status: availabilityScore >= 80 ? 'good' : availabilityScore >= 60 ? 'warning' : 'risk',
        findings: availabilityFindings
      },
      scalability: {
        score: scalabilityScore,
        status: scalabilityScore >= 80 ? 'good' : scalabilityScore >= 60 ? 'warning' : 'risk',
        findings: scalabilityFindings
      },
      performance: {
        score: performanceScore,
        status: performanceScore >= 80 ? 'good' : performanceScore >= 60 ? 'warning' : 'risk',
        findings: performanceFindings
      },
      cost: {
        score: costScore,
        status: costScore >= 80 ? 'good' : costScore >= 60 ? 'warning' : 'risk',
        findings: costFindings
      }
    }
  };
}
