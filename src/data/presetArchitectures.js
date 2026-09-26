/**
 * Preset architectures for Demo Mode and Instant Testing (All 9 Required Domains)
 */

export const PRESET_ARCHITECTURES = [
  {
    id: 'ecommerce-platform',
    name: '1. E-Commerce Platform',
    domain: 'E-commerce',
    description: 'Next.js storefront with CloudFront CDN, API Gateway, Product & Order microservices, Stripe Payment, Redis caching, and PostgreSQL database.',
    components: [
      {
        id: 'cdn',
        name: 'CloudFront CDN',
        type: 'cdn',
        role: 'Edge Content Delivery Network',
        technology: 'Amazon CloudFront / Cloud CDN',
        purpose: 'Caches and delivers web assets and product images close to global shoppers.',
        why_recommended: 'Reduces latency for global shoppers and offloads traffic from backend origin servers.',
        alternatives: 'Direct origin server delivery.',
        benefits: ['Global sub-50ms asset delivery', 'Automatic DDoS mitigation at edge', 'Reduced compute bandwidth costs'],
        disadvantages: ['Cache invalidation delays upon rapid asset updates'],
        tier: 'standard'
      },
      {
        id: 'frontend',
        name: 'Next.js Storefront',
        type: 'frontend',
        role: 'User Interface / Web Client',
        technology: 'Next.js / React',
        purpose: 'Provides server-rendered shopping storefront, product search, cart, and checkout UI.',
        why_recommended: 'Next.js provides Server-Side Rendering (SSR) for superior SEO and rapid initial page loads.',
        alternatives: 'Standard React SPA, Vue.js.',
        benefits: ['SEO friendly for search engine indexing', 'Fast first contentful paint', 'Rich interactive product browsing'],
        disadvantages: ['Requires Node.js server or edge runtime for SSR'],
        tier: 'standard'
      },
      {
        id: 'api_gateway',
        name: 'API Gateway',
        type: 'gateway',
        role: 'API Gateway & Rate Limiter',
        technology: 'Kong / AWS API Gateway',
        purpose: 'Single entry point for client API requests, managing routing, rate limiting, and SSL termination.',
        why_recommended: 'Shields microservices, centralizes authentication verification, and prevents denial-of-service spikes.',
        alternatives: 'Direct Application Load Balancer.',
        benefits: ['Centralized rate limiting & abuse prevention', 'Unified CORS & SSL termination', 'API versioning support'],
        disadvantages: ['Additional network hop (usually <5ms)'],
        tier: 'standard'
      },
      {
        id: 'auth_service',
        name: 'Auth Service',
        type: 'auth',
        role: 'Authentication & Identity Service',
        technology: 'Node.js / Cognito',
        purpose: 'Handles user signup, secure login, password resets, and JWT session token generation.',
        why_recommended: 'Decouples user identity logic from core commerce services, enhancing security and audit compliance.',
        alternatives: 'Monolithic in-app user table.',
        benefits: ['Standardized JWT verification', 'Easy integration of social logins', 'Protection against credential stuffing'],
        disadvantages: ['Requires token rotation mechanisms'],
        tier: 'standard'
      },
      {
        id: 'product_service',
        name: 'Product Service',
        type: 'backend',
        role: 'Product Catalog Service',
        technology: 'FastAPI / Python',
        purpose: 'Manages product listings, categories, pricing, inventory stock counts, and search filters.',
        why_recommended: 'High-concurrency async read throughput allows thousands of shoppers to browse simultaneously.',
        alternatives: 'Single combined monolithic backend.',
        benefits: ['Independent autoscaling for high-traffic browsing', 'Optimized catalog query performance'],
        disadvantages: ['Inter-service communication required for order checkout'],
        tier: 'compute-medium'
      },
      {
        id: 'order_service',
        name: 'Order Service',
        type: 'backend',
        role: 'Order & Cart Management Service',
        technology: 'Node.js / Express',
        purpose: 'Manages shopping carts, calculates totals with taxes, and orchestrates the checkout order workflow.',
        why_recommended: 'Handles fast transactional shopping cart updates and order life-cycle state transitions.',
        alternatives: 'Combined backend service.',
        benefits: ['High availability during checkout', 'Clean transactional boundary for customer carts'],
        disadvantages: ['Distributed transaction coordination with inventory and payment'],
        tier: 'compute-medium'
      },
      {
        id: 'payment_service',
        name: 'Payment Service',
        type: 'payment',
        role: 'Payment Processing Gateway',
        technology: 'Stripe / Python Service',
        purpose: 'Securely interfaces with third-party payment gateways (Stripe/PayPal) and records payment receipts.',
        why_recommended: 'Isolates sensitive payment processing logic to satisfy PCI-DSS compliance boundaries.',
        alternatives: 'Third-party hosted checkout only.',
        benefits: ['Strict PCI-DSS isolation', 'Idempotent payment webhook retries', 'Guards against double billing'],
        disadvantages: ['Third-party gateway transaction processing fees'],
        tier: 'compute-small'
      },
      {
        id: 'cache',
        name: 'Redis Cache',
        type: 'cache',
        role: 'In-Memory Cache & Session Store',
        technology: 'Redis',
        purpose: 'Caches active shopping carts, popular product listings, and user login sessions.',
        why_recommended: 'Reduces repeated relational database queries by 85%+ and delivers sub-millisecond data reads.',
        alternatives: 'No cache (direct database queries on every click).',
        benefits: ['Sub-millisecond data retrieval', 'Protects PostgreSQL from traffic spikes', 'Built-in TTL for cart expiration'],
        disadvantages: ['Requires cache invalidation strategy on price/stock updates'],
        tier: 'cache-medium'
      },
      {
        id: 'database',
        name: 'PostgreSQL DB',
        type: 'database',
        role: 'Relational Transactional Database',
        technology: 'PostgreSQL',
        purpose: 'Primary ACID data store for orders, customers, inventory stock levels, and financial records.',
        why_recommended: 'ACID transactional consistency prevents race conditions (e.g. two customers buying the last item).',
        alternatives: 'MongoDB, DynamoDB.',
        benefits: ['Strong consistency (ACID)', 'Rich relational queries for reporting & analytics', 'Proven enterprise reliability'],
        disadvantages: ['Vertical scaling limits; requires read replicas under heavy read load'],
        tier: 'db-medium'
      },
      {
        id: 'storage',
        name: 'Object Storage (S3)',
        type: 'storage',
        role: 'Product Media & Image Storage',
        technology: 'Amazon S3 / Google Cloud Storage',
        purpose: 'Stores high-resolution product photos, user review images, and PDF invoice receipts.',
        why_recommended: 'Scalable, durable object storage prevents bloat in the relational database.',
        alternatives: 'Storing image binaries directly in database.',
        benefits: ['99.999999999% data durability', 'Near-infinite capacity without server reboots', 'Direct presigned uploads'],
        disadvantages: ['Eventual consistency on immediate re-reads'],
        tier: 'storage-standard'
      }
    ],
    connections: [
      { from: 'cdn', to: 'frontend', label: 'Edge Asset Delivery', protocol: 'HTTPS' },
      { from: 'frontend', to: 'api_gateway', label: 'HTTPS / REST', protocol: 'HTTPS' },
      { from: 'api_gateway', to: 'auth_service', label: 'Route /auth', protocol: 'REST' },
      { from: 'api_gateway', to: 'product_service', label: 'Route /products', protocol: 'REST' },
      { from: 'api_gateway', to: 'order_service', label: 'Route /orders', protocol: 'REST' },
      { from: 'order_service', to: 'payment_service', label: 'Process Charge', protocol: 'REST' },
      { from: 'product_service', to: 'cache', label: 'Cache Read/Write', protocol: 'TCP' },
      { from: 'order_service', to: 'cache', label: 'Cart State', protocol: 'TCP' },
      { from: 'product_service', to: 'database', label: 'Catalog Queries', protocol: 'SQL' },
      { from: 'order_service', to: 'database', label: 'ACID Transactions', protocol: 'SQL' },
      { from: 'product_service', to: 'storage', label: 'Uploads Media', protocol: 'HTTPS' },
      { from: 'cdn', to: 'storage', label: 'Fetches Images', protocol: 'HTTPS' }
    ]
  },
  {
    id: 'food-delivery',
    name: '2. Food Delivery Platform',
    domain: 'Food Delivery',
    description: 'Cross-platform mobile ordering with real-time Go WebSocket courier tracking, RabbitMQ dispatch queue, Redis GEO, and PostgreSQL database.',
    components: [
      {
        id: 'mobile_app',
        name: 'Customer & Courier Mobile App',
        type: 'frontend',
        role: 'Customer & Courier Interface',
        technology: 'Flutter / React Native',
        purpose: 'Allows customers to order meals, track delivery drivers live on a map, and allows couriers to accept gigs.',
        why_recommended: 'Cross-platform native mobile app with smooth 60fps live map rendering.',
        tier: 'standard'
      },
      {
        id: 'api_gateway',
        name: 'API Gateway & Load Balancer',
        type: 'gateway',
        role: 'Gateway & WSS Proxy',
        technology: 'Kong / Envoy',
        purpose: 'Routes HTTP and WebSocket connections, enforces rate limits and authentication.',
        why_recommended: 'Supports both standard REST and high-frequency WebSocket upgrades for driver GPS pings.',
        tier: 'standard'
      },
      {
        id: 'order_service',
        name: 'Order & Kitchen Service',
        type: 'backend',
        role: 'Order Lifecycle & Restaurant Management',
        technology: 'Node.js Express',
        purpose: 'Handles meal ordering, calculates delivery fees, and coordinates kitchen preparation timers.',
        why_recommended: 'Non-blocking event loop manages hundreds of simultaneous orders during peak meal rushes.',
        tier: 'compute-medium'
      },
      {
        id: 'dispatch_service',
        name: 'Dispatch & GPS Tracking Service',
        type: 'backend',
        role: 'Real-Time Driver Tracking Service',
        technology: 'Go (Golang)',
        purpose: 'Maintains live WebSocket connections with couriers and calculates driver assignment algorithms.',
        why_recommended: 'Go goroutines efficiently handle tens of thousands of simultaneous driver WebSocket connections.',
        tier: 'compute-medium'
      },
      {
        id: 'payment_service',
        name: 'Payment & Payout Service',
        type: 'payment',
        role: 'Payment Processing & Split Payouts',
        technology: 'Python / Stripe',
        purpose: 'Charges customers and distributes instant earnings payouts to restaurants and delivery drivers.',
        why_recommended: 'Isolates financial transactions and enforces PCI compliance.',
        tier: 'compute-small'
      },
      {
        id: 'message_queue',
        name: 'RabbitMQ Event Broker',
        type: 'queue',
        role: 'Asynchronous Event Buffer',
        technology: 'RabbitMQ',
        purpose: 'Buffers order events (OrderPlaced, KitchenReady, DriverAssigned) so no orders are lost during traffic spikes.',
        why_recommended: 'Guaranteed message delivery with acknowledgement prevents dropped orders.',
        tier: 'standard'
      },
      {
        id: 'redis_cache',
        name: 'Redis GEO Cache',
        type: 'cache',
        role: 'Geospatial Location & Menu Cache',
        technology: 'Redis GEO',
        purpose: 'Stores real-time driver coordinates and executes sub-millisecond radius searches.',
        why_recommended: 'Built-in GEO radius search commands find nearby couriers in microseconds.',
        tier: 'cache-medium'
      },
      {
        id: 'database',
        name: 'PostgreSQL + PostGIS DB',
        type: 'database',
        role: 'Primary Spatial & Relational DB',
        technology: 'PostgreSQL + PostGIS',
        purpose: 'Stores restaurants, menus, historical orders, customer accounts, and polygon delivery zones.',
        why_recommended: 'PostGIS extension provides enterprise spatial indexing and query capabilities.',
        tier: 'db-medium'
      }
    ],
    connections: [
      { from: 'mobile_app', to: 'api_gateway', label: 'HTTPS / WSS', protocol: 'WSS' },
      { from: 'api_gateway', to: 'order_service', label: 'Order API', protocol: 'REST' },
      { from: 'api_gateway', to: 'dispatch_service', label: 'Live GPS Stream', protocol: 'WSS' },
      { from: 'order_service', to: 'payment_service', label: 'Charge Customer', protocol: 'REST' },
      { from: 'order_service', to: 'message_queue', label: 'Publish OrderPlaced', protocol: 'TCP' },
      { from: 'message_queue', to: 'dispatch_service', label: 'Consume for Dispatch', protocol: 'TCP' },
      { from: 'dispatch_service', to: 'redis_cache', label: 'Update Driver GEO', protocol: 'TCP' },
      { from: 'order_service', to: 'database', label: 'Persist Orders', protocol: 'SQL' },
      { from: 'order_service', to: 'redis_cache', label: 'Menu Cache Check', protocol: 'TCP' }
    ]
  },
  {
    id: 'social-media',
    name: '3. Social Media Platform',
    domain: 'Social Media',
    description: 'High-concurrency social network with React mobile client, edge CDN, Redis timeline feed generation, WebSocket chat, and media storage.',
    components: [
      { id: 'cdn', name: 'CloudFront CDN', type: 'cdn', role: 'Media Edge Delivery', technology: 'CloudFront', purpose: 'Distributes user avatars, images, and short video clips globally.', tier: 'standard' },
      { id: 'frontend', name: 'React / Mobile App', type: 'frontend', role: 'Social Feed Interface', technology: 'React / React Native', purpose: 'Infinite scroll feed, post creation, direct messaging, and profile management.', tier: 'standard' },
      { id: 'api_gateway', name: 'API Gateway', type: 'gateway', role: 'Gateway & WebSocket Proxy', technology: 'API Gateway', purpose: 'Handles user authentication tokens and routes REST and WebSocket chat traffic.', tier: 'standard' },
      { id: 'post_service', name: 'Post & Feed Service', type: 'backend', role: 'Feed Generation & Post Management', technology: 'FastAPI / Python', purpose: 'Handles post publication, like counts, comments, and timeline feed generation.', tier: 'compute-medium' },
      { id: 'chat_service', name: 'Chat & Notification Service', type: 'backend', role: 'Real-Time Direct Messaging', technology: 'Node.js / WebSockets', purpose: 'Powers direct user-to-user messaging and instant push notification delivery.', tier: 'compute-medium' },
      { id: 'cache', name: 'Redis Feed Cache', type: 'cache', role: 'Timeline & In-Memory Social Graph', technology: 'Redis Cluster', purpose: 'Stores pre-computed user timeline feeds and active session tokens.', tier: 'cache-medium' },
      { id: 'storage', name: 'Media Storage (S3)', type: 'storage', role: 'Photo & Video Asset Storage', technology: 'Amazon S3', purpose: 'Stores user photos, post attachments, and video stories.', tier: 'storage-standard' },
      { id: 'database', name: 'PostgreSQL DB', type: 'database', role: 'Relational Social Graph & User DB', technology: 'PostgreSQL', purpose: 'Stores user accounts, follower relationships, posts, and comments.', tier: 'db-medium' }
    ],
    connections: [
      { from: 'cdn', to: 'frontend', label: 'Static Assets & Photos', protocol: 'HTTPS' },
      { from: 'frontend', to: 'api_gateway', label: 'HTTPS / WSS', protocol: 'HTTPS' },
      { from: 'api_gateway', to: 'post_service', label: 'Route /posts', protocol: 'REST' },
      { from: 'api_gateway', to: 'chat_service', label: 'Route /chat', protocol: 'WSS' },
      { from: 'post_service', to: 'cache', label: 'Feed Read / Fanout', protocol: 'TCP' },
      { from: 'post_service', to: 'storage', label: 'Presigned Upload URL', protocol: 'HTTPS' },
      { from: 'post_service', to: 'database', label: 'Persist Posts & Graph', protocol: 'SQL' },
      { from: 'chat_service', to: 'database', label: 'Persist Message History', protocol: 'SQL' }
    ]
  },
  {
    id: 'video-streaming',
    name: '4. Video Streaming Platform',
    domain: 'Video Streaming',
    description: 'Petabyte-scale video-on-demand platform with global edge CDN, adaptive bitrate player, FFmpeg transcoding workers, S3 storage, and Redis playback resume.',
    components: [
      { id: 'cdn', name: 'Global Media CDN', type: 'cdn', role: 'Edge Media Delivery Network', technology: 'CloudFront / Fastly', purpose: 'Caches video chunks (HLS/DASH) at thousands of edge points of presence across the world.', tier: 'standard' },
      { id: 'video_client', name: 'Web & Smart TV App', type: 'frontend', role: 'Adaptive Video Player Client', technology: 'React / HLS.js', purpose: 'Renders video library catalog and switches bitrates dynamically based on network speed.', tier: 'standard' },
      { id: 'api_gateway', name: 'API Gateway', type: 'gateway', role: 'API Gateway & Token Verifier', technology: 'AWS API Gateway', purpose: 'Handles user login, movie catalog browsing, subscription verification, and playback session creation.', tier: 'standard' },
      { id: 'catalog_service', name: 'Video Catalog & User Service', type: 'backend', role: 'Catalog & Metadata Service', technology: 'FastAPI / Python', purpose: 'Serves title metadata, search queries, recommendations, and user watch history.', tier: 'compute-medium' },
      { id: 'transcoding_worker', name: 'Transcoding Worker', type: 'backend', role: 'Video Encoding & HLS Chunker', technology: 'FFmpeg / Container Worker', purpose: 'Converts uploaded source videos into multiple resolutions (1080p, 720p, 480p) and slices into HLS segments.', tier: 'compute-large' },
      { id: 'storage', name: 'Video Object Storage (S3)', type: 'storage', role: 'Primary Video Asset Storage', technology: 'Amazon S3 Standard', purpose: 'Stores original master video uploads and encoded .m3u8 playlists and .ts video chunks.', tier: 'storage-standard' },
      { id: 'cache', name: 'Redis Playback Cache', type: 'cache', role: 'Playback Session & Metadata Cache', technology: 'Redis', purpose: 'Stores real-time viewer playback checkpoints (resume at mm:ss) and hot catalog search queries.', tier: 'cache-medium' },
      { id: 'database', name: 'PostgreSQL DB', type: 'database', role: 'Relational Metadata Database', technology: 'PostgreSQL', purpose: 'Stores user accounts, subscriptions, viewing history ledgers, movie tags, and licensing windows.', tier: 'db-medium' }
    ],
    connections: [
      { from: 'cdn', to: 'video_client', label: 'HLS Video Chunks', protocol: 'HTTPS' },
      { from: 'cdn', to: 'storage', label: 'Origin Fetch', protocol: 'HTTPS' },
      { from: 'video_client', to: 'api_gateway', label: 'Catalog & Resume API', protocol: 'REST' },
      { from: 'api_gateway', to: 'catalog_service', label: 'Routes API', protocol: 'REST' },
      { from: 'catalog_service', to: 'cache', label: 'Checkpoints & Hot Titles', protocol: 'TCP' },
      { from: 'catalog_service', to: 'database', label: 'Metadata Queries', protocol: 'SQL' },
      { from: 'transcoding_worker', to: 'storage', label: 'Read Master & Write HLS', protocol: 'HTTPS' }
    ]
  },
  {
    id: 'college-management',
    name: '5. College Management System',
    domain: 'College Management',
    description: 'Campus management portal for attendance, grading, and course schedules with Role-Based Access Control, S3 document storage, and PostgreSQL relational records.',
    components: [
      { id: 'frontend', name: 'College Portal Web & Mobile', type: 'frontend', role: 'Portal User Interface', technology: 'React SPA', purpose: 'Student & Faculty portal for taking attendance, viewing timetables, and recording grades.', tier: 'standard' },
      { id: 'api_gateway', name: 'API Gateway & Load Balancer', type: 'gateway', role: 'Gateway & SSL Proxy', technology: 'API Gateway', purpose: 'Secures access, terminates SSL, and validates JWT student/professor role permissions.', tier: 'standard' },
      { id: 'auth_service', name: 'Auth & Directory Service', type: 'auth', role: 'Role-Based Identity Provider', technology: 'Node.js / LDAP / OAuth', purpose: 'Integrates with campus single sign-on (SSO) and enforces role-based permissions.', tier: 'standard' },
      { id: 'academic_service', name: 'Attendance & Academic Service', type: 'backend', role: 'Core Academic Business Logic', technology: 'FastAPI / Python', purpose: 'Processes student attendance logs, course schedules, assignment grading, and report cards.', tier: 'compute-medium' },
      { id: 'storage', name: 'Document Storage (S3)', type: 'storage', role: 'Course Material & Assignment Storage', technology: 'Amazon S3', purpose: 'Stores syllabus PDFs, lecture slides, submitted student assignments, and exam archives.', tier: 'storage-standard' },
      { id: 'cache', name: 'Redis Cache', type: 'cache', role: 'Session & Timetable Cache', technology: 'Redis', purpose: 'Caches active student class timetables, daily attendance summaries, and session tokens.', tier: 'cache-small' },
      { id: 'database', name: 'PostgreSQL DB', type: 'database', role: 'Relational Academic Database', technology: 'PostgreSQL', purpose: 'ACID-compliant storage for student attendance logs, grade books, enrollments, and fee ledgers.', tier: 'db-medium' }
    ],
    connections: [
      { from: 'frontend', to: 'api_gateway', label: 'HTTPS REST', protocol: 'HTTPS' },
      { from: 'api_gateway', to: 'auth_service', label: 'Verify SSO / RBAC', protocol: 'REST' },
      { from: 'api_gateway', to: 'academic_service', label: 'Route Academic Requests', protocol: 'REST' },
      { from: 'academic_service', to: 'cache', label: 'Check Timetable Cache', protocol: 'TCP' },
      { from: 'academic_service', to: 'storage', label: 'Presigned Upload URL', protocol: 'HTTPS' },
      { from: 'academic_service', to: 'database', label: 'ACID Attendance & Grades', protocol: 'SQL' },
      { from: 'auth_service', to: 'database', label: 'User & Role Records', protocol: 'SQL' }
    ]
  },
  {
    id: 'online-banking',
    name: '6. Online Banking Platform',
    domain: 'Online Banking',
    description: 'High-security financial architecture featuring mTLS API gateway, real-time fraud scoring engine, Redis distributed idempotency locking, and Multi-AZ PostgreSQL ledger.',
    components: [
      { id: 'frontend', name: 'Web & Mobile Banking Client', type: 'frontend', role: 'Secure Customer Banking Portal', technology: 'React / iOS / Android', purpose: 'Enables customers to inspect balances, perform wire transfers, and manage cards.', tier: 'standard' },
      { id: 'api_gateway', name: 'Hardened API Gateway', type: 'gateway', role: 'Financial-Grade API Gateway', technology: 'Kong / Apigee', purpose: 'Enforces mTLS, terminates SSL, rate-limits endpoints, and checks device fingerprinting.', tier: 'standard' },
      { id: 'auth_service', name: 'Identity & MFA Service', type: 'auth', role: 'Multi-Factor Auth & Identity Provider', technology: 'Keycloak / Auth0', purpose: 'Manages user logins, SMS/Hardware OTP verification, and JWT session lifecycles.', tier: 'standard' },
      { id: 'core_banking', name: 'Core Banking & Ledger Service', type: 'backend', role: 'Double-Entry Financial Ledger', technology: 'Go (Golang)', purpose: 'Executes idempotent fund transfers, manages account balances, and writes immutable ledger journals.', tier: 'compute-medium' },
      { id: 'fraud_service', name: 'Fraud Detection Engine', type: 'backend', role: 'Real-Time Risk Scoring Engine', technology: 'Python / ML Model', purpose: 'Analyzes incoming transaction patterns, IP geolocations, and velocities to flag suspicious activity.', tier: 'compute-medium' },
      { id: 'cache', name: 'Redis Cluster', type: 'cache', role: 'Idempotency Key & Session Store', technology: 'Redis Multi-AZ', purpose: 'Maintains idempotency keys to prevent duplicate transfer clicks and caches account metadata.', tier: 'cache-medium' },
      { id: 'database', name: 'PostgreSQL Multi-AZ DB', type: 'database', role: 'ACID Relational Ledger Database', technology: 'PostgreSQL (Multi-AZ)', purpose: 'Primary immutable ledger database with synchronous Multi-AZ replication.', tier: 'db-large' }
    ],
    connections: [
      { from: 'frontend', to: 'api_gateway', label: 'mTLS / TLS 1.3', protocol: 'HTTPS' },
      { from: 'api_gateway', to: 'auth_service', label: 'Verify Token & MFA', protocol: 'REST' },
      { from: 'api_gateway', to: 'core_banking', label: 'Route /transfer', protocol: 'REST' },
      { from: 'core_banking', to: 'fraud_service', label: 'Score Transaction Risk', protocol: 'REST' },
      { from: 'core_banking', to: 'cache', label: 'Check Idempotency Key', protocol: 'TCP' },
      { from: 'core_banking', to: 'database', label: 'ACID Double-Entry Ledger', protocol: 'SQL' },
      { from: 'auth_service', to: 'database', label: 'User Credentials', protocol: 'SQL' }
    ]
  },
  {
    id: 'iot-monitoring',
    name: '7. IoT Monitoring Platform',
    domain: 'IoT Monitoring',
    description: 'High-throughput hardware telemetry ingestion with MQTT/Kafka broker, anomaly stream workers, Redis device shadow caching, and time-series database storage.',
    components: [
      { id: 'iot_devices', name: 'IoT Devices & Sensors', type: 'frontend', role: 'Edge Hardware & Sensors', technology: 'MQTT / Embedded Hardware', purpose: 'Measures temperature, pressure, GPS, and equipment telemetry and transmits over MQTT.', tier: 'standard' },
      { id: 'mqtt_broker', name: 'IoT Ingestion Broker', type: 'queue', role: 'High-Throughput MQTT / Kafka Broker', technology: 'EMQX / Apache Kafka', purpose: 'Maintains persistent connections with thousands of edge devices and buffers incoming telemetry.', tier: 'standard' },
      { id: 'telemetry_worker', name: 'Telemetry Processing Worker', type: 'backend', role: 'Stream Processing & Anomaly Worker', technology: 'Go / Python Worker', purpose: 'Consumes sensor metrics from message queue, checks alert thresholds, and downsamples data.', tier: 'compute-medium' },
      { id: 'dashboard', name: 'Telemetry Dashboard', type: 'frontend', role: 'Operations & Alerting Dashboard', technology: 'React / Grafana', purpose: 'Live charts, equipment health gauges, and alarm incident management for plant engineers.', tier: 'standard' },
      { id: 'cache', name: 'Redis Device State', type: 'cache', role: 'Latest Device Shadow State', technology: 'Redis', purpose: 'Stores the most recent ping and online/offline status for every registered sensor.', tier: 'cache-small' },
      { id: 'timeseries_db', name: 'TimescaleDB / InfluxDB', type: 'database', role: 'Time-Series Telemetry Database', technology: 'TimescaleDB (PostgreSQL)', purpose: 'Stores billions of timestamped sensor readings with automatic data retention and compression.', tier: 'db-medium' }
    ],
    connections: [
      { from: 'iot_devices', to: 'mqtt_broker', label: 'MQTT Telemetry Stream', protocol: 'TCP' },
      { from: 'mqtt_broker', to: 'telemetry_worker', label: 'Consume Sensor Stream', protocol: 'TCP' },
      { from: 'telemetry_worker', to: 'cache', label: 'Update Latest Shadow', protocol: 'TCP' },
      { from: 'telemetry_worker', to: 'timeseries_db', label: 'Batch Ingest Metrics', protocol: 'SQL' },
      { from: 'dashboard', to: 'cache', label: 'Live Device Status', protocol: 'TCP' },
      { from: 'dashboard', to: 'timeseries_db', label: 'Historical Charts Query', protocol: 'SQL' }
    ]
  },
  {
    id: 'file-storage',
    name: '8. Cloud File Storage Platform',
    domain: 'File Storage',
    description: 'Scalable cloud drive architecture with direct-to-S3 presigned uploads, ClamAV malware scanning, CloudFront download acceleration, and PostgreSQL metadata.',
    components: [
      { id: 'cdn', name: 'CloudFront CDN', type: 'cdn', role: 'Edge File Download Accelerator', technology: 'CloudFront', purpose: 'Accelerates download of public shared files and caches web portal assets.', tier: 'standard' },
      { id: 'frontend', name: 'Cloud Drive Web & Desktop App', type: 'frontend', role: 'File Explorer & Upload Client', technology: 'React / Electron', purpose: 'Provides folder tree navigation, drag-and-drop file upload, and sharing link creation.', tier: 'standard' },
      { id: 'api_gateway', name: 'API Gateway', type: 'gateway', role: 'API Gateway & Auth Proxy', technology: 'API Gateway', purpose: 'Routes file metadata requests and issues presigned upload/download authorization tickets.', tier: 'standard' },
      { id: 'file_service', name: 'File Metadata & Sharing Service', type: 'backend', role: 'Metadata & Permission Manager', technology: 'FastAPI / Python', purpose: 'Manages folder hierarchies, file names, sharing permissions, and generates presigned S3 URLs.', tier: 'compute-medium' },
      { id: 'scanner_worker', name: 'Virus & Malware Scanner', type: 'backend', role: 'Async File Quarantine Worker', technology: 'ClamAV / Container Worker', purpose: 'Scans newly uploaded files in the background and quarantines malicious attachments.', tier: 'compute-small' },
      { id: 'storage', name: 'Object Storage (S3)', type: 'storage', role: 'Primary File Object Storage', technology: 'Amazon S3 Standard', purpose: 'Durable encrypted storage for all customer documents, photos, and archives.', tier: 'storage-standard' },
      { id: 'database', name: 'PostgreSQL DB', type: 'database', role: 'File Tree & Permissions Database', technology: 'PostgreSQL', purpose: 'Stores user folders, file sizes, checksums, sharing permissions, and access logs.', tier: 'db-medium' }
    ],
    connections: [
      { from: 'frontend', to: 'api_gateway', label: 'HTTPS / REST', protocol: 'HTTPS' },
      { from: 'frontend', to: 'storage', label: 'Direct S3 Upload (Presigned)', protocol: 'HTTPS' },
      { from: 'api_gateway', to: 'file_service', label: 'Folder & File Metadata', protocol: 'REST' },
      { from: 'file_service', to: 'database', label: 'Query / Update File Tree', protocol: 'SQL' },
      { from: 'file_service', to: 'storage', label: 'Sign Presigned URL', protocol: 'HTTPS' },
      { from: 'storage', to: 'scanner_worker', label: 'Trigger S3 Event OnUpload', protocol: 'HTTPS' },
      { from: 'cdn', to: 'storage', label: 'Fetch Public Downloads', protocol: 'HTTPS' }
    ]
  },
  {
    id: 'ai-application',
    name: '9. AI Application with RAG',
    domain: 'AI Application',
    description: 'Enterprise AI architecture with conversational streaming frontend, LLM prompt orchestrator, Qdrant/pgvector embeddings store, and Redis prompt caching.',
    components: [
      { id: 'frontend', name: 'AI Chat & Assistant UI', type: 'frontend', role: 'Conversational AI Client', technology: 'React / Next.js', purpose: 'Provides conversational chat interface with streaming Server-Sent Events (SSE) token display.', tier: 'standard' },
      { id: 'api_gateway', name: 'API Gateway & Rate Limiter', type: 'gateway', role: 'Token Bucket Gateway', technology: 'API Gateway', purpose: 'Enforces user authentication, per-user token quotas, and rate limiting on expensive LLM calls.', tier: 'standard' },
      { id: 'orchestrator', name: 'LLM Orchestration Service', type: 'backend', role: 'RAG & Prompt Orchestration Service', technology: 'FastAPI / LangChain', purpose: 'Orchestrates prompts, queries vector search for context (RAG), and calls LLM inference models.', tier: 'compute-medium' },
      { id: 'vector_db', name: 'Vector DB (Qdrant / pgvector)', type: 'database', role: 'Semantic Embeddings Store (RAG)', technology: 'Qdrant / pgvector', purpose: 'Indexes high-dimensional document embeddings for semantic search and Retrieval-Augmented Generation.', tier: 'db-medium' },
      { id: 'cache', name: 'Semantic Prompt Cache (Redis)', type: 'cache', role: 'Prompt & Response Cache', technology: 'Redis', purpose: 'Caches exact and semantic AI responses to avoid repeatedly calling expensive external LLM models.', tier: 'cache-small' },
      { id: 'database', name: 'PostgreSQL DB', type: 'database', role: 'Chat History & User DB', technology: 'PostgreSQL', purpose: 'Stores user accounts, conversation history threads, token usage analytics, and feedback ratings.', tier: 'db-medium' }
    ],
    connections: [
      { from: 'frontend', to: 'api_gateway', label: 'SSE Streaming', protocol: 'HTTPS' },
      { from: 'api_gateway', to: 'orchestrator', label: 'Route Prompts', protocol: 'REST' },
      { from: 'orchestrator', to: 'cache', label: 'Check Prompt Cache', protocol: 'TCP' },
      { from: 'orchestrator', to: 'vector_db', label: 'Similarity Search (RAG)', protocol: 'TCP' },
      { from: 'orchestrator', to: 'database', label: 'Persist Conversation & Usage', protocol: 'SQL' }
    ]
  }
];
