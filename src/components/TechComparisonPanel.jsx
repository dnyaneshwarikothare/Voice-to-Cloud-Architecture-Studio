import React, { useState } from 'react';
import { Scale, Check, AlertCircle, DollarSign, Layers, Cpu, Database, Zap, Sparkles, Server, Globe, HardDrive, Inbox, ShieldCheck } from 'lucide-react';

const TECH_CATALOG = {
  frontend: [
    {
      id: 'react',
      name: 'React (Vite SPA)',
      tag: 'Interactive Single-Page App',
      fit: 'Ideal for highly interactive web dashboards, real-time client apps, and rich developer studios.',
      complexity: 'Low to Moderate',
      scalability: 'Client-rendered at edge; virtually unlimited scalability when served via CloudFront/Cloudflare CDN.',
      ecosystem: 'Vast npm library, standard state managers (Redux, Zustand), UI kits (Tailwind, Radix).',
      costMonthly: '$5.00 - $15.00 (Static Hosting / S3 + CloudFront)',
      pros: ['Decoupled frontend architecture; zero server compute cost for rendering', 'Instant client-side route transitions and reactive UI state', 'Immense ecosystem of visualization libraries (Mermaid, D3, Canvas)'],
      cons: ['Client-side rendering (CSR) requires fast initial bundle download', 'Not inherently optimized for multi-page public SEO without prerendering']
    },
    {
      id: 'nextjs',
      name: 'Next.js (React Hybrid SSR)',
      tag: 'Server-Side Rendered & SEO',
      fit: 'Best for public e-commerce stores, content sites, marketing portals requiring high SEO ranking.',
      complexity: 'Moderate to High',
      scalability: 'Serverless Node runtime (Vercel / AWS Lambda) auto-scales per incoming HTTP request.',
      ecosystem: 'Vercel platform, React Server Components, NextAuth, Image Optimization.',
      costMonthly: '$20.00 - $60.00 (Serverless Compute / Edge SSR)',
      pros: ['First-class SEO and OpenGraph previews out of the box', 'Hybrid static generation (SSG) + dynamic server rendering (SSR)', 'API routes allow building full-stack applications in a single repository'],
      cons: ['Server runtime overhead compared to pure static file hosting', 'Cold start latency on serverless edge functions']
    },
    {
      id: 'vue',
      name: 'Vue.js (Vite / Nuxt)',
      tag: 'Progressive Lightweight UI',
      fit: 'Suited for teams seeking high developer velocity, clear template syntax, and progressive enhancement.',
      complexity: 'Low',
      scalability: 'Static edge CDN deployment with micro-frontend capabilities.',
      ecosystem: 'Pinia state management, Vue Router, Nuxt framework.',
      costMonthly: '$5.00 - $15.00 (Static Hosting / CDN)',
      pros: ['Gentle learning curve with intuitive single-file components (.vue)', 'Extremely fast build times with Vite', 'Small runtime bundle size (~34KB gzip)'],
      cons: ['Smaller enterprise component ecosystem than React', 'Fewer third-party library wrappers for niche visualization tools']
    }
  ],
  backend: [
    {
      id: 'fastapi',
      name: 'FastAPI (Python)',
      tag: 'AI & Data Friendly',
      fit: 'Ideal for Python-centric teams, machine learning integrations, REST APIs, and microservices.',
      complexity: 'Low to Moderate',
      scalability: 'Asyncio event loop with Uvicorn. Handles 15,000+ concurrent I/O requests per instance.',
      ecosystem: 'Pydantic, SQLAlchemy, PyTorch, NumPy, LangChain.',
      costMonthly: '$35.00 base (Container / ECS / Cloud Run)',
      pros: ['Built-in automatic OpenAPI / Swagger documentation', 'Native Pydantic data validation with strict type hints', 'Seamless integration with Python AI, ML, and data processing ecosystems'],
      cons: ['CPU-bound tasks require multi-process worker pools or Celery', 'Python GIL considerations for heavy raw CPU compute']
    },
    {
      id: 'node',
      name: 'Node.js (Express / Fastify)',
      tag: 'Fullstack JS/TS Standard',
      fit: 'Ideal for real-time applications (WebSockets), rapid prototyping, and unified JS/TS codebases.',
      complexity: 'Low to Moderate',
      scalability: 'Single-threaded event loop with non-blocking libuv worker pool. Highly scalable for I/O-bound web traffic.',
      ecosystem: 'Largest package ecosystem in the world (npm) with millions of packages.',
      costMonthly: '$30.00 base (Container / Fargate)',
      pros: ['Shared TypeScript models and types across client and server', 'Vast developer talent pool and rapid feature delivery', 'Exceptional native support for real-time WebSockets and streaming'],
      cons: ['Async callback / Promise error management overhead', 'Vulnerability to deep npm dependency tree security updates']
    },
    {
      id: 'golang',
      name: 'Go (Gin / Fiber)',
      tag: 'Extreme Throughput & Efficiency',
      fit: 'Best for hyperscale API gateways, network proxies, and low-latency microservices.',
      complexity: 'Moderate',
      scalability: 'Lightweight Goroutines with channel communication. Thousands of concurrent connections per MB.',
      ecosystem: 'Standard cloud-native infrastructure tooling (Docker, Kubernetes, Terraform).',
      costMonthly: '$25.00 base (Minimal RAM Footprint)',
      pros: ['Tiny memory footprint (< 30MB base RAM)', 'Lightning fast cold starts (< 50ms)', 'Compiled single static binary with zero external runtime dependencies'],
      cons: ['Explicit error handling boilerplate (`if err != nil`)', 'Fewer high-level ORM and rapid prototyping abstractions']
    },
    {
      id: 'springboot',
      name: 'Spring Boot (Java)',
      tag: 'Enterprise Standard',
      fit: 'Best for mission-critical enterprise systems, banking ledgers, and large multi-team enterprise apps.',
      complexity: 'High',
      scalability: 'Multi-threaded JVM (virtual threads via Project Loom in Java 21+). Scales horizontally on K8s.',
      ecosystem: 'Spring Cloud, Hibernate, Spring Security, Apache Kafka.',
      costMonthly: '$65.00 base (JVM Memory Footprint)',
      pros: ['Enterprise security, transaction management, and compliance out of the box', 'Rock-solid backwards compatibility and long-term enterprise vendor support', 'Mature corporate testing frameworks and distributed tracing tooling'],
      cons: ['Higher baseline memory consumption on cold starts', 'Steeper learning curve and heavy annotation magic']
    }
  ],
  database: [
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      tag: 'Relational ACID Gold Standard',
      fit: 'The recommended default for transactional systems, e-commerce, banking, and relational schemas.',
      complexity: 'Moderate',
      scalability: 'Vertical scaling with horizontal read replicas. Handles 10,000+ read QPS with replica pooling.',
      ecosystem: 'PostGIS (geospatial), pgvector (AI embeddings), TimescaleDB (time-series).',
      costMonthly: '$54.00 base (Managed RDS / Cloud SQL)',
      pros: ['Strict ACID transaction guarantees with row-level locking', 'Native JSONB support for hybrid relational + document models', 'Broadest cloud provider support (RDS, Cloud SQL, Aurora)'],
      cons: ['Horizontal multi-master write sharding requires specialized architectures (Citus)', 'Requires connection poolers (PgBouncer) under high concurrent traffic']
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      tag: 'Flexible Document Store',
      fit: 'Suited for rapid schema iteration, catalog product attributes, and mobile backends.',
      complexity: 'Low to Moderate',
      scalability: 'Native horizontal sharding across distributed clusters. High write throughput for unstructured data.',
      ecosystem: 'MongoDB Atlas, Aggregation Pipelines, Mongoose ODM.',
      costMonthly: '$57.00 base (Atlas Dedicated)',
      pros: ['Dynamic schema evolves seamlessly with product iterations', 'Native horizontal sharding across nodes without third-party plugins', 'Natural mapping to JavaScript/JSON objects'],
      cons: ['Multi-document joins and cross-collection transactions have compute overhead', 'Larger storage footprint than normalized relational tables']
    },
    {
      id: 'dynamodb',
      name: 'Amazon DynamoDB',
      tag: 'Serverless Hyperscale NoSQL',
      fit: 'Best for single-digit millisecond key-value lookups, high-volume gaming leaderboards, and cart data.',
      complexity: 'High (Single Table Design)',
      scalability: 'Fully distributed partition-based auto-scaling across AWS regions. Scales to millions of RPS.',
      ecosystem: 'Deep AWS integrations (Lambda, EventBridge, IAM, CloudWatch).',
      costMonthly: '$25.00 base (Serverless Pay-Per-Request)',
      pros: ['Zero server management or maintenance windows', 'Predictable single-digit millisecond latency at any throughput volume', 'Serverless pay-per-request pricing option'],
      cons: ['AWS vendor lock-in', 'Strict query limitations; no ad-hoc relational queries without secondary indexes']
    },
    {
      id: 'mysql',
      name: 'MySQL',
      tag: 'Web Standard Relational DB',
      fit: 'Widely used in traditional LAMP/LEMP stacks, WordPress, and existing relational architectures.',
      complexity: 'Moderate',
      scalability: 'Primary-replica asynchronous replication with AWS Aurora MySQL clustering.',
      ecosystem: 'Immense community, phpMyAdmin, MySQL Workbench, Percona toolkit.',
      costMonthly: '$50.00 base (Managed RDS)',
      pros: ['Very widespread developer familiarity across industry', 'High-speed read performance for standard relational tables', 'Excellent replication maturity'],
      cons: ['JSON querying capabilities less flexible than PostgreSQL JSONB', 'Fewer advanced extensibility modules than Postgres']
    }
  ],
  cache: [
    {
      id: 'redis',
      name: 'Redis',
      tag: 'Distributed In-Memory Engine',
      fit: 'Essential for query caching, session stores, rate-limiting tokens, and pub/sub queues.',
      complexity: 'Low',
      scalability: 'Single-threaded event loop avoiding locking bottlenecks. Redis Cluster shards across 100+ nodes.',
      ecosystem: 'Universal client support across every language; Redis Stack, ElastiCache, Memorystore.',
      costMonthly: '$29.00 base (ElastiCache / Memorystore)',
      pros: ['Sub-millisecond latency for cached lookups (< 1ms)', 'Rich data structures (Hashes, Sets, Sorted Sets, Streams)', 'Built-in replication, clustering, and persistence snapshots (RDB/AOF)'],
      cons: ['Entire working dataset must fit into physical RAM', 'Cluster setup has slight operational complexity']
    },
    {
      id: 'memcached',
      name: 'Memcached',
      tag: 'Simple Multi-Threaded Cache',
      fit: 'Suited for purely transient key-value caching where rich data structures are unnecessary.',
      complexity: 'Very Low',
      scalability: 'Multi-threaded architecture designed to leverage multi-core compute. Scales horizontally.',
      ecosystem: 'Established web standard for simple string/blob caching.',
      costMonthly: '$24.00 base',
      pros: ['Multi-threaded architecture excels on high core-count VMs', 'Minimal memory overhead for simple key-value pairs', 'Extremely lightweight protocol'],
      cons: ['No complex data types (strings only)', 'No disk persistence or pub/sub capabilities']
    }
  ],
  gateway: [
    {
      id: 'aws_api_gw',
      name: 'AWS API Gateway',
      tag: 'Fully Managed Serverless Gateway',
      fit: 'Best for serverless architectures, Lambda microservices, and automated OpenAPI deployment.',
      complexity: 'Low',
      scalability: 'Fully managed auto-scaling up to 10,000+ requests per second by default.',
      ecosystem: 'Deep AWS IAM, Cognito, CloudWatch, WAF integration.',
      costMonthly: '$3.50 per million requests',
      pros: ['Zero infrastructure provisioning or patching', 'Native throttling, API keys, and rate-limiting per client', 'Built-in AWS WAF integration for DDoS defense'],
      cons: ['Higher cost at hyperscale compared to self-hosted NGINX', 'Maximum 29-second execution timeout limitation']
    },
    {
      id: 'kong',
      name: 'Kong Gateway',
      tag: 'High-Performance Open-Source Gateway',
      fit: 'Ideal for multi-cloud, hybrid Kubernetes deployments, and fine-grained Lua/Go plugins.',
      complexity: 'Moderate',
      scalability: 'Built on NGINX/OpenResty; handles sub-millisecond proxy latency at 100,000+ RPS.',
      ecosystem: 'Kong Ingress Controller, declarative decK configuration, rich plugin marketplace.',
      costMonthly: '$45.00 base (Self-Hosted on K8s / EC2)',
      pros: ['Extremely low latency (< 1ms proxy overhead)', 'Cloud-agnostic; runs anywhere (AWS, GCP, Bare Metal, K8s)', 'Extensive plugin library (Auth, Rate Limiting, CORS, Transformations)'],
      cons: ['Requires managing underlying compute instances and PostgreSQL database', 'Enterprise management features require commercial license']
    },
    {
      id: 'nginx',
      name: 'NGINX Reverse Proxy',
      tag: 'Lightweight Battle-Tested Proxy',
      fit: 'Standard choice for load balancing HTTP traffic, SSL termination, and static caching.',
      complexity: 'Low to Moderate',
      scalability: 'Asynchronous event-driven architecture handles 50,000+ concurrent connections per core.',
      ecosystem: 'Most widely deployed web server and reverse proxy on the internet.',
      costMonthly: '$15.00 base (Small VM / Container)',
      pros: ['Unmatched raw performance and tiny memory footprint', 'Reliable SSL termination, HTTP/2, and gzip compression', 'Completely open source with zero vendor lock-in'],
      cons: ['Configuration changes require reload / reload scripting', 'Fewer dynamic API management features out of the box than Kong']
    }
  ],
  queue: [
    {
      id: 'kafka',
      name: 'Apache Kafka',
      tag: 'Distributed Event Streaming Log',
      fit: 'Best for high-volume telemetry, event sourcing, analytics pipelines, and audit logs.',
      complexity: 'High',
      scalability: 'Partitioned distributed commit log. Scales to millions of events per second with zero data loss.',
      ecosystem: 'Kafka Streams, Kafka Connect, Schema Registry, Confluent Cloud, AWS MSK.',
      costMonthly: '$120.00 base (Managed MSK / Confluent)',
      pros: ['Immutable append-only log allows event replay and temporal debugging', 'Extreme write throughput with zero-copy network transfer', 'Durable message retention for days, months, or years'],
      cons: ['High operational complexity (Zookeeper/KRaft, partition rebalancing)', 'Steep learning curve compared to standard push queues']
    },
    {
      id: 'rabbitmq',
      name: 'RabbitMQ',
      tag: 'Flexible AMQP Message Broker',
      fit: 'Best for complex message routing, background worker jobs, and asynchronous task dispatch.',
      complexity: 'Moderate',
      scalability: 'Clustered Erlang nodes with quorum queues. Handles tens of thousands of messages/sec.',
      ecosystem: 'Celery, Spring AMQP, AMQP 0-9-1 clients across all programming languages.',
      costMonthly: '$45.00 base (Managed Amazon MQ / CloudAMQP)',
      pros: ['Rich routing topologies (Direct, Topic, Fanout, Header exchanges)', 'Instant message acknowledgements and granular retry logic', 'Excellent visual management web UI for queue inspection'],
      cons: ['Messages are deleted upon consumption (no historical event replay)', 'Memory pressure under massive unconsumed backlog buildup']
    },
    {
      id: 'sqs',
      name: 'Amazon SQS',
      tag: 'Serverless Push/Pull Queue',
      fit: 'Suited for simple cloud decoupled microservices, email sending queues, and batch jobs.',
      complexity: 'Very Low',
      scalability: 'Unlimited throughput scaling with zero server provisioning or capacity planning.',
      ecosystem: 'AWS Lambda event source mapping, SNS fanout, S3 event notifications.',
      costMonthly: '$0.40 per million requests',
      pros: ['Zero infrastructure to manage, monitor, or patch', 'Dead letter queues (DLQ) built in for failed messages', 'Near-unlimited burst scaling on demand'],
      cons: ['AWS vendor lock-in', '15-minute maximum visibility timeout']
    }
  ],
  storage: [
    {
      id: 's3',
      name: 'Amazon S3',
      tag: 'Hyperscale Object Storage Standard',
      fit: 'Universal object storage for user uploads, media files, database backups, and data lakes.',
      complexity: 'Low',
      scalability: 'Virtually infinite storage capacity with 99.999999999% (11 9s) durability.',
      ecosystem: 'AWS CloudFront, Athena query engine, S3 Lifecycle policies, Glacier archive.',
      costMonthly: '$0.023 per GB/mo',
      pros: ['Industry standard S3 API supported across the entire cloud software world', 'Automatic lifecycle tiering to Glacier reduces cold storage costs by 80%+', 'Direct pre-signed URLs allow clients to upload securely without proxying through backend'],
      cons: ['Egress data transfer costs apply when serving out of AWS without CloudFront', 'Eventually consistent listing under certain high-churn concurrency edge cases']
    },
    {
      id: 'gcs',
      name: 'Google Cloud Storage',
      tag: 'Global Multi-Region Object Store',
      fit: 'Best for Google Cloud workloads, BigQuery analytical ingestion, and AI model weights.',
      complexity: 'Low',
      scalability: 'Global namespace with automatic cross-region redundancy and high read throughput.',
      ecosystem: 'BigQuery, Vertex AI, Cloud CDN, Google Kubernetes Engine (GKE).',
      costMonthly: '$0.020 per GB/mo',
      pros: ['Single global API endpoint with built-in multi-region replication', 'Seamless BigQuery external table querying', 'Strong consistency for all read-after-write operations'],
      cons: ['Multi-region egress costs require careful network tier planning', 'Less ubiquitous third-party tooling integration than S3 API']
    },
    {
      id: 'minio',
      name: 'MinIO',
      tag: 'Self-Hosted S3-Compatible Object Storage',
      fit: 'Best for on-premise deployments, hybrid cloud, local development, and compliance boundaries.',
      complexity: 'Moderate',
      scalability: 'Distributed erasure-coded clusters delivering 100+ GB/s throughput on NVMe drives.',
      ecosystem: 'Full S3 v4 API compatibility, Kubernetes Operator, Prometheus metrics.',
      costMonthly: '$30.00 base (Raw VM / Persistent Volume)',
      pros: ['100% S3 compatible; zero cloud provider lock-in', 'High performance on bare-metal and private clouds', 'Air-gapped and strictly compliant with local data sovereignty laws'],
      cons: ['Requires managing underlying disk hardware, backups, and RAID/Erasure sets', 'No serverless pay-per-GB pricing model']
    }
  ]
};

export function TechComparisonPanel() {
  const [activeCategory, setActiveCategory] = useState('backend');
  const [viewMode, setViewMode] = useState('recommendations'); // 'recommendations' | 'comparison'

  const categories = [
    { id: 'frontend', name: 'Frontend', icon: Globe },
    { id: 'backend', name: 'Backend', icon: Cpu },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'cache', name: 'Cache', icon: Zap },
    { id: 'gateway', name: 'API Gateway', icon: Server },
    { id: 'queue', name: 'Message Queue', icon: Inbox },
    { id: 'storage', name: 'Storage', icon: HardDrive }
  ];

  const currentOptions = TECH_CATALOG[activeCategory] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Banner and Description */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} color="#2563eb" />
              <span>Technology Recommendations & Comparison</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px', maxWidth: '680px' }}>
              Detailed architectural fit, scalability trade-offs, complexity, and ecosystem evaluation across every tier of the modern cloud stack.
            </p>
          </div>

          {/* Mode Switcher: Recommendations vs Comparison Matrix */}
          <div className="tab-row" style={{ padding: '2px' }}>
            <button
              className={`tab-btn ${viewMode === 'recommendations' ? 'active' : ''}`}
              onClick={() => setViewMode('recommendations')}
              style={{ fontSize: '0.74rem', padding: '4px 12px' }}
            >
              <Sparkles size={13} style={{ marginRight: '4px' }} />
              Recommendations
            </button>
            <button
              className={`tab-btn ${viewMode === 'comparison' ? 'active' : ''}`}
              onClick={() => setViewMode('comparison')}
              style={{ fontSize: '0.74rem', padding: '4px 12px' }}
            >
              <Scale size={13} style={{ marginRight: '4px' }} />
              Comparison Matrix
            </button>
          </div>
        </div>

        {/* Guidance Notice */}
        <div style={{ marginTop: '10px', padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '0.73rem', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="#2563eb" style={{ flexShrink: 0 }} />
          <span>
            <b>Engineering Guidance:</b> No single technology is universally "the best". Selection depends on your team's existing expertise, I/O vs CPU profile, latency requirements, and cloud budget.
          </span>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="btn"
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '6px',
                background: isActive ? '#2563eb' : '#ffffff',
                color: isActive ? '#ffffff' : '#334155',
                borderColor: isActive ? '#2563eb' : '#e2e8f0',
                boxShadow: isActive ? '0 1px 2px rgba(37,99,235,0.2)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} color={isActive ? '#ffffff' : '#64748b'} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          VIEW 1: RECOMMENDATIONS CARDS
          ======================================================== */}
      {viewMode === 'recommendations' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
          {currentOptions.map((opt) => (
            <div
              key={opt.id}
              className="card"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{opt.name}</h4>
                  <span className="badge badge-info" style={{ marginTop: '4px' }}>{opt.tag}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600, background: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                  {opt.costMonthly}
                </span>
              </div>

              {/* Why It Fits */}
              <div style={{ fontSize: '0.74rem', color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a' }}>Why It Fits: </strong>
                {opt.fit}
              </div>

              {/* Scalability Considerations */}
              <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                <strong style={{ color: '#0f172a' }}>Scalability: </strong>
                {opt.scalability}
              </div>

              {/* Advantages */}
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} color="#16a34a" />
                  <span>Key Advantages:</span>
                </div>
                <ul style={{ paddingLeft: '16px', fontSize: '0.71rem', color: '#334155', lineHeight: 1.45 }}>
                  {opt.pros.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              {/* Limitations / Trade-Offs */}
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} color="#d97706" />
                  <span>Limitations & Trade-Offs:</span>
                </div>
                <ul style={{ paddingLeft: '16px', fontSize: '0.71rem', color: '#64748b', lineHeight: 1.45 }}>
                  {opt.cons.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ========================================================
            VIEW 2: COMPARISON MATRIX TABLE
            ======================================================== */
        <div className="card" style={{ padding: 0, overflowX: 'auto', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.73rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 700 }}>Technology</th>
                <th style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 700 }}>Architecture Fit</th>
                <th style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 700 }}>Scalability Profile</th>
                <th style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 700 }}>Complexity</th>
                <th style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 700 }}>Ecosystem</th>
                <th style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 700 }}>Estimated Hosting</th>
              </tr>
            </thead>
            <tbody>
              {currentOptions.map((opt, idx) => (
                <tr key={opt.id} style={{ borderBottom: idx < currentOptions.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{opt.name}</div>
                    <span className="badge badge-info" style={{ marginTop: '2px', display: 'inline-block' }}>{opt.tag}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#334155', verticalAlign: 'top', maxWidth: '240px' }}>
                    {opt.fit}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569', verticalAlign: 'top', maxWidth: '220px' }}>
                    {opt.scalability}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                    {opt.complexity}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569', verticalAlign: 'top', maxWidth: '200px' }}>
                    {opt.ecosystem}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: 600, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                    {opt.costMonthly}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
