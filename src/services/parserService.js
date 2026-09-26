/**
 * Rule-Based and Extensible Natural Language Architecture Parser
 */

import { COMPONENT_TYPES, sanitizeId } from '../utils/architectureSchema.js';

// Specific technologies
const SPECIFIC_TECH_DICTIONARY = [
  // Frontends
  { patterns: [/\breact(\.js|js)?\b/i], name: 'React', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
  { patterns: [/\bnext(\.js|js)?\b/i], name: 'Next.js', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
  { patterns: [/\bvue(\.js|js)?\b/i], name: 'Vue.js', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
  { patterns: [/\bangular\b/i], name: 'Angular', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
  { patterns: [/\bsvelte(kit)?\b/i], name: 'Svelte', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
  { patterns: [/\b(mobile|ios|android|flutter|react\s*native)\b/i], name: 'Mobile App', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },

  // Gateways & Traffic
  { patterns: [/\b(api\s*gateway|apigw)\b/i], name: 'API Gateway', type: COMPONENT_TYPES.GATEWAY, tier: 'standard' },
  { patterns: [/\b(load\s*balancer|alb|nlb|elb|haproxy|nginx)\b/i], name: 'Load Balancer', type: COMPONENT_TYPES.LOADBALANCER, tier: 'standard' },
  { patterns: [/\b(cdn|cloudfront|cloudflare\s*cdn)\b/i], name: 'CDN', type: COMPONENT_TYPES.CDN, tier: 'standard' },

  // Backends
  { patterns: [/\bfastapi\b/i], name: 'FastAPI', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
  { patterns: [/\bexpress(\.js|js)?\b/i], name: 'Express', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
  { patterns: [/\bnode(\.js|js)?\b/i], name: 'Node.js', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
  { patterns: [/\bdjango\b/i], name: 'Django', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
  { patterns: [/\bflask\b/i], name: 'Flask', type: COMPONENT_TYPES.BACKEND, tier: 'compute-small' },
  { patterns: [/\bspring(\s*boot)?\b/i], name: 'Spring Boot', type: COMPONENT_TYPES.BACKEND, tier: 'compute-large' },
  { patterns: [/\b(golang|go\s*backend|go\s*api|go\s*service)\b/i], name: 'Go Backend', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
  { patterns: [/\b(ruby\s*on\s*rails|rails)\b/i], name: 'Ruby on Rails', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
  { patterns: [/\b(asp\.net|\.net\s*core|\.net)\b/i], name: '.NET Backend', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
  { patterns: [/\b(lambda|serverless\s*functions?|cloud\s*functions?)\b/i], name: 'Serverless Functions', type: COMPONENT_TYPES.BACKEND, tier: 'serverless' },

  // Caches
  { patterns: [/\bredis\b/i], name: 'Redis', type: COMPONENT_TYPES.CACHE, tier: 'cache-small' },
  { patterns: [/\bmemcached\b/i], name: 'Memcached', type: COMPONENT_TYPES.CACHE, tier: 'cache-small' },

  // Databases
  { patterns: [/\b(postgres|postgresql|psql)\b/i], name: 'PostgreSQL', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' },
  { patterns: [/\bmysql\b/i], name: 'MySQL', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' },
  { patterns: [/\bmongo(db)?\b/i], name: 'MongoDB', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' },
  { patterns: [/\bdynamo(db)?\b/i], name: 'DynamoDB', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' },
  { patterns: [/\bcassandra\b/i], name: 'Cassandra', type: COMPONENT_TYPES.DATABASE, tier: 'db-large' },
  { patterns: [/\bsqlite\b/i], name: 'SQLite', type: COMPONENT_TYPES.DATABASE, tier: 'db-small' },
  { patterns: [/\b(firestore|firebase)\b/i], name: 'Firestore', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' },

  // Queues
  { patterns: [/\b(kafka|apache\s*kafka)\b/i], name: 'Apache Kafka', type: COMPONENT_TYPES.QUEUE, tier: 'standard' },
  { patterns: [/\brabbitmq\b/i], name: 'RabbitMQ', type: COMPONENT_TYPES.QUEUE, tier: 'standard' },
  { patterns: [/\b(sqs|pubsub|pub\/sub)\b/i], name: 'Message Queue', type: COMPONENT_TYPES.QUEUE, tier: 'standard' },

  // Storage
  { patterns: [/\b(s3|blob\s*storage|cloud\s*storage|bucket)\b/i], name: 'Object Storage (S3)', type: COMPONENT_TYPES.STORAGE, tier: 'storage-standard' },

  // Auth
  { patterns: [/\b(cognito|auth0|keycloak)\b/i], name: 'Auth Service', type: COMPONENT_TYPES.AUTH, tier: 'standard' },

  // Monitoring
  { patterns: [/\b(cloudwatch|datadog|prometheus|grafana)\b/i], name: 'Monitoring & Logs', type: COMPONENT_TYPES.MONITORING, tier: 'standard' }
];

// Generic fallback terms (only matched if no specific tech of this type was found)
const GENERIC_FALLBACK_DICTIONARY = [
  { patterns: [/\b(web\s*app|frontend|spa|client|browser)\b/i], name: 'Web Client', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
  { patterns: [/\b(backend|api\s*server|web\s*server|microservice|worker)\b/i], name: 'Backend Service', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
  { patterns: [/\b(cache|caching)\b/i], name: 'Cache Store', type: COMPONENT_TYPES.CACHE, tier: 'cache-small' },
  { patterns: [/\b(database|sql\s*database|db|datastore)\b/i], name: 'Database', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' },
  { patterns: [/\b(message\s*queue|event\s*bus)\b/i], name: 'Message Queue', type: COMPONENT_TYPES.QUEUE, tier: 'standard' },
  { patterns: [/\b(auth|authentication|identity)\b/i], name: 'Auth Provider', type: COMPONENT_TYPES.AUTH, tier: 'standard' },
  { patterns: [/\b(monitoring|telemetry|logging)\b/i], name: 'Monitoring Suite', type: COMPONENT_TYPES.MONITORING, tier: 'standard' }
];

/**
 * Parses natural language description into an Architecture JSON model
 */
export function parseArchitectureFromText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      components: [],
      connections: [],
      rawText: text || ''
    };
  }

  const cleanText = text.replace(/[\n\r]+/g, ' ').trim();
  const matchedComponents = [];
  const foundTypes = new Set();
  const foundNames = new Set();

  // 1. Scan for specific technologies first
  SPECIFIC_TECH_DICTIONARY.forEach((entry) => {
    for (const pattern of entry.patterns) {
      const match = pattern.exec(cleanText);
      if (match && !foundNames.has(entry.name)) {
        foundNames.add(entry.name);
        foundTypes.add(entry.type);
        matchedComponents.push({
          id: sanitizeId(entry.name),
          name: entry.name,
          type: entry.type,
          tier: entry.tier,
          matchIndex: match.index,
          matchLength: match[0].length,
          matchedWord: match[0]
        });
        break;
      }
    }
  });

  // 2. Scan for generic terms only if that category type was NOT already matched
  GENERIC_FALLBACK_DICTIONARY.forEach((entry) => {
    if (!foundTypes.has(entry.type)) {
      for (const pattern of entry.patterns) {
        const match = pattern.exec(cleanText);
        if (match && !foundNames.has(entry.name)) {
          foundNames.add(entry.name);
          foundTypes.add(entry.type);
          matchedComponents.push({
            id: sanitizeId(entry.name),
            name: entry.name,
            type: entry.type,
            tier: entry.tier,
            matchIndex: match.index,
            matchLength: match[0].length,
            matchedWord: match[0]
          });
          break;
        }
      }
    }
  });

  // 3. Scan for custom services (e.g. "Stripe Payment Service", "Fraud Detection Engine")
  const customPattern = /(?:uses|with|connected to|calls|has a)\s+([A-Z][a-zA-Z0-9_\s]{2,25}?)\s+(?:service|api|microservice|worker|engine|gateway|database|component)/gi;
  let customMatch;
  while ((customMatch = customPattern.exec(cleanText)) !== null) {
    const rawCustomName = customMatch[1].trim();
    if (rawCustomName && !foundNames.has(rawCustomName) && rawCustomName.length > 2) {
      const name = `${rawCustomName} Service`;
      foundNames.add(name);
      matchedComponents.push({
        id: sanitizeId(name),
        name: name,
        type: COMPONENT_TYPES.CUSTOM,
        tier: 'standard',
        matchIndex: customMatch.index,
        matchLength: customMatch[0].length,
        matchedWord: customMatch[0]
      });
    }
  }

  // Sort components by order of appearance
  matchedComponents.sort((a, b) => a.matchIndex - b.matchIndex);

  // 4. Domain-Aware Architecture Generation for non-technical user prompts
  if (matchedComponents.length === 0) {
    const lower = cleanText.toLowerCase();

    if (/shop|shopping|ecommerce|e-commerce|store|cart|checkout/i.test(lower)) {
      matchedComponents.push(
        { id: 'cdn', name: 'CloudFront CDN', type: COMPONENT_TYPES.CDN, tier: 'standard' },
        { id: 'frontend', name: 'Next.js Storefront', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
        { id: 'api_gateway', name: 'API Gateway', type: COMPONENT_TYPES.GATEWAY, tier: 'standard' },
        { id: 'auth_service', name: 'Auth Service', type: COMPONENT_TYPES.AUTH, tier: 'standard' },
        { id: 'product_service', name: 'Product Service', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
        { id: 'order_service', name: 'Order Service', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
        { id: 'payment_service', name: 'Payment Service', type: COMPONENT_TYPES.CUSTOM, tier: 'compute-small' },
        { id: 'redis_cache', name: 'Redis Cache', type: COMPONENT_TYPES.CACHE, tier: 'cache-small' },
        { id: 'database', name: 'PostgreSQL DB', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' },
        { id: 'storage', name: 'Object Storage (S3)', type: COMPONENT_TYPES.STORAGE, tier: 'storage-standard' }
      );
    } else if (/food|restaurant|order\s*food|delivery/i.test(lower)) {
      matchedComponents.push(
        { id: 'mobile_app', name: 'Customer Mobile App', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
        { id: 'api_gateway', name: 'API Gateway', type: COMPONENT_TYPES.GATEWAY, tier: 'standard' },
        { id: 'order_service', name: 'Order & Kitchen Service', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
        { id: 'dispatch_service', name: 'Live GPS Dispatch Service', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
        { id: 'payment_service', name: 'Payment Service', type: COMPONENT_TYPES.CUSTOM, tier: 'compute-small' },
        { id: 'message_queue', name: 'RabbitMQ Broker', type: COMPONENT_TYPES.QUEUE, tier: 'standard' },
        { id: 'redis_cache', name: 'Redis GEO Cache', type: COMPONENT_TYPES.CACHE, tier: 'cache-medium' },
        { id: 'database', name: 'PostgreSQL + PostGIS DB', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' }
      );
    } else if (/stream|video|watch|movies/i.test(lower)) {
      matchedComponents.push(
        { id: 'cdn', name: 'Global Media CDN', type: COMPONENT_TYPES.CDN, tier: 'standard' },
        { id: 'video_client', name: 'Web & TV Video Player', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
        { id: 'api_gateway', name: 'API Gateway', type: COMPONENT_TYPES.GATEWAY, tier: 'standard' },
        { id: 'catalog_service', name: 'Video Catalog Service', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
        { id: 'transcoding_worker', name: 'Transcoding Worker', type: COMPONENT_TYPES.BACKEND, tier: 'compute-large' },
        { id: 'storage', name: 'Video Storage (S3)', type: COMPONENT_TYPES.STORAGE, tier: 'storage-standard' },
        { id: 'cache', name: 'Redis Playback Cache', type: COMPONENT_TYPES.CACHE, tier: 'cache-medium' },
        { id: 'database', name: 'PostgreSQL DB', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' }
      );
    } else if (/college|university|attendance|school|student/i.test(lower)) {
      matchedComponents.push(
        { id: 'frontend', name: 'College Portal App', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
        { id: 'api_gateway', name: 'API Gateway & Load Balancer', type: COMPONENT_TYPES.GATEWAY, tier: 'standard' },
        { id: 'auth_service', name: 'Auth & Directory Service', type: COMPONENT_TYPES.AUTH, tier: 'standard' },
        { id: 'academic_service', name: 'Attendance & Grading Service', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
        { id: 'storage', name: 'Document Storage (S3)', type: COMPONENT_TYPES.STORAGE, tier: 'storage-standard' },
        { id: 'cache', name: 'Redis Cache', type: COMPONENT_TYPES.CACHE, tier: 'cache-small' },
        { id: 'database', name: 'PostgreSQL DB', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' }
      );
    } else if (/bank|fintech|money|transfer|ledger/i.test(lower)) {
      matchedComponents.push(
        { id: 'frontend', name: 'Banking Client App', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
        { id: 'api_gateway', name: 'Financial API Gateway', type: COMPONENT_TYPES.GATEWAY, tier: 'standard' },
        { id: 'auth_service', name: 'Identity & MFA Service', type: COMPONENT_TYPES.AUTH, tier: 'standard' },
        { id: 'core_banking', name: 'Core Ledger Service', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
        { id: 'fraud_service', name: 'Fraud Detection Engine', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
        { id: 'cache', name: 'Redis Cluster', type: COMPONENT_TYPES.CACHE, tier: 'cache-medium' },
        { id: 'database', name: 'PostgreSQL Multi-AZ DB', type: COMPONENT_TYPES.DATABASE, tier: 'db-large' }
      );
    } else if (/ai|llm|chat|bot|rag|vector/i.test(lower)) {
      matchedComponents.push(
        { id: 'frontend', name: 'AI Chat UI', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
        { id: 'api_gateway', name: 'API Gateway & Rate Limiter', type: COMPONENT_TYPES.GATEWAY, tier: 'standard' },
        { id: 'orchestrator', name: 'LLM Orchestration Service', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
        { id: 'vector_db', name: 'Vector DB (pgvector / Qdrant)', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' },
        { id: 'cache', name: 'Semantic Prompt Cache', type: COMPONENT_TYPES.CACHE, tier: 'cache-small' },
        { id: 'database', name: 'PostgreSQL DB', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' }
      );
    } else {
      // General web app standard tier
      matchedComponents.push(
        { id: 'frontend', name: 'Web Client', type: COMPONENT_TYPES.FRONTEND, tier: 'standard' },
        { id: 'backend', name: 'Backend API Service', type: COMPONENT_TYPES.BACKEND, tier: 'compute-medium' },
        { id: 'cache', name: 'Redis Cache', type: COMPONENT_TYPES.CACHE, tier: 'cache-small' },
        { id: 'database', name: 'Database', type: COMPONENT_TYPES.DATABASE, tier: 'db-medium' }
      );
    }
  }

  // Ensure unique IDs
  const finalComponents = [];
  const usedIds = new Set();
  matchedComponents.forEach((comp) => {
    let finalId = comp.id;
    let counter = 1;
    while (usedIds.has(finalId)) {
      finalId = `${comp.id}_${counter++}`;
    }
    usedIds.add(finalId);
    finalComponents.push({
      id: finalId,
      name: comp.name,
      type: comp.type,
      tier: comp.tier || 'standard',
      description: `${comp.name} (${comp.type})`
    });
  });

  // Infer Connections
  const connections = inferConnections(finalComponents, cleanText);

  return {
    components: finalComponents,
    connections,
    rawText: text
  };
}

/**
 * Intelligent connections inference
 */
function inferConnections(components, text) {
  const connections = [];
  const addedPairs = new Set();

  const addEdge = (fromId, toId, label = '') => {
    if (!fromId || !toId || fromId === toId) return;
    const key = `${fromId}->${toId}`;
    if (!addedPairs.has(key)) {
      addedPairs.add(key);
      connections.push({ from: fromId, to: toId, label });
    }
  };

  const frontends = components.filter(c => c.type === COMPONENT_TYPES.FRONTEND);
  const cdns = components.filter(c => c.type === COMPONENT_TYPES.CDN);
  const gateways = components.filter(c => c.type === COMPONENT_TYPES.GATEWAY);
  const lbs = components.filter(c => c.type === COMPONENT_TYPES.LOADBALANCER);
  const backends = components.filter(c => c.type === COMPONENT_TYPES.BACKEND);
  const databases = components.filter(c => c.type === COMPONENT_TYPES.DATABASE);
  const caches = components.filter(c => c.type === COMPONENT_TYPES.CACHE);
  const queues = components.filter(c => c.type === COMPONENT_TYPES.QUEUE);
  const storages = components.filter(c => c.type === COMPONENT_TYPES.STORAGE);
  const customs = components.filter(c => c.type === COMPONENT_TYPES.CUSTOM);

  // Standard architectural tier topological wiring:
  // 1. CDN -> Frontend
  cdns.forEach(cdn => {
    frontends.forEach(fe => addEdge(cdn.id, fe.id, 'Edge Delivery'));
  });

  // 2. Frontend -> Gateway, LB, or Backend
  frontends.forEach(fe => {
    if (gateways.length > 0) {
      gateways.forEach(gw => addEdge(fe.id, gw.id, 'API Calls'));
    } else if (lbs.length > 0) {
      lbs.forEach(lb => addEdge(fe.id, lb.id, 'HTTP Traffic'));
    } else if (backends.length > 0) {
      backends.forEach(be => addEdge(fe.id, be.id, 'REST / JSON'));
    } else if (databases.length > 0) {
      databases.forEach(db => addEdge(fe.id, db.id, 'Direct Access'));
    }
  });

  // 3. Gateway -> Load Balancer or Backend
  gateways.forEach(gw => {
    if (lbs.length > 0) {
      lbs.forEach(lb => addEdge(gw.id, lb.id, 'Routes'));
    } else if (backends.length > 0) {
      backends.forEach(be => addEdge(gw.id, be.id, 'Proxies'));
    }
  });

  // 4. Load Balancers -> Backend
  lbs.forEach(lb => {
    backends.forEach(be => addEdge(lb.id, be.id, 'Balances Traffic'));
  });

  // 5. Backends -> Caches, Databases, Queues, Storage, Customs
  backends.forEach(be => {
    caches.forEach(ca => addEdge(be.id, ca.id, 'Cache Reads/Writes'));
    databases.forEach(db => addEdge(be.id, db.id, 'Queries / CRUD'));
    queues.forEach(q => addEdge(be.id, q.id, 'Publish Events'));
    storages.forEach(s => addEdge(be.id, s.id, 'Stores Media'));
    customs.forEach(cu => addEdge(be.id, cu.id, 'Integrates'));
  });

  // 6. Queues -> Consumers / Workers
  queues.forEach(q => {
    backends.forEach(be => {
      if (be.name.toLowerCase().includes('worker') || be.name.toLowerCase().includes('consumer')) {
        addEdge(q.id, be.id, 'Consumes Messages');
      }
    });
  });

  // Fallback sequential linking if still disconnected
  if (connections.length === 0 && components.length > 1) {
    for (let i = 0; i < components.length - 1; i++) {
      addEdge(components[i].id, components[i + 1].id, 'Connects');
    }
  }

  return connections;
}

/**
 * Extensible Parser function: Calls Cloudflare Worker AI parser if requested/available,
 * otherwise cleanly uses rule-based parsing.
 */
export async function parseArchitecture(text, options = {}) {
  const { useAi = false, workerUrl = '/api/parse' } = options;

  if (useAi) {
    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.components) {
          return data;
        }
      }
    } catch (err) {
      console.warn('AI Parser endpoint unreachable, falling back to rule-based parser:', err);
    }
  }

  return parseArchitectureFromText(text);
}
