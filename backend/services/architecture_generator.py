"""
Smart Architecture Recommendation Engine
Translates user requirements into a professional cloud architecture model.
Separates Technology != Role != Purpose.
Generates comprehensive educational justifications (Why, Benefits, Disadvantages, Alternatives).
"""

import sys
from pathlib import Path
import re
from typing import Dict, Any, List, Optional

_parent = Path(__file__).resolve().parent.parent
_root = _parent.parent
for _p in [str(_root), str(_parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.models.architecture import Component, Connection, ArchitectureModel
    from backend.services.requirement_analyzer import analyze_requirements, is_explicit_technical_prompt
except (ImportError, ValueError):
    try:
        from models.architecture import Component, Connection, ArchitectureModel  # type: ignore
        from services.requirement_analyzer import analyze_requirements, is_explicit_technical_prompt  # type: ignore
    except (ImportError, ValueError):
        from ..models.architecture import Component, Connection, ArchitectureModel  # type: ignore
        from .requirement_analyzer import analyze_requirements, is_explicit_technical_prompt  # type: ignore


def generate_architecture_from_requirements(
    prompt: str,
    application_type: Optional[str] = None,
    answers: Optional[Dict[str, str]] = None,
    cloud_provider: str = "logical"
) -> ArchitectureModel:
    """
    Generates a structured architecture model based on user prompt, domain, and answered questions.
    """
    answers = answers or {}
    clean_text = (prompt or "").strip()

    # If it's an explicit technical prompt, extract directly from keywords
    if is_explicit_technical_prompt(clean_text):
        return _build_explicit_tech_architecture(clean_text, cloud_provider)

    # Otherwise determine application domain
    req_analysis = analyze_requirements(clean_text, answers)
    app_domain = application_type or req_analysis.application_type

    if "e-commerce" in app_domain.lower() or "shop" in clean_text.lower():
        return _build_ecommerce_architecture(answers, cloud_provider)
    elif "food" in app_domain.lower():
        return _build_food_delivery_architecture(answers, cloud_provider)
    elif "social" in app_domain.lower():
        return _build_social_media_architecture(answers, cloud_provider)
    elif "streaming" in app_domain.lower() or "video" in clean_text.lower():
        return _build_video_streaming_architecture(answers, cloud_provider)
    elif "college" in app_domain.lower() or "attendance" in clean_text.lower() or "university" in clean_text.lower():
        return _build_college_management_architecture(answers, cloud_provider)
    elif "bank" in app_domain.lower() or "fintech" in clean_text.lower():
        return _build_banking_architecture(answers, cloud_provider)
    elif "iot" in app_domain.lower() or "sensor" in clean_text.lower():
        return _build_iot_architecture(answers, cloud_provider)
    elif "file" in app_domain.lower() or "storage" in clean_text.lower() or "drive" in clean_text.lower():
        return _build_file_storage_architecture(answers, cloud_provider)
    elif "ai" in app_domain.lower() or "llm" in clean_text.lower() or "bot" in clean_text.lower():
        return _build_ai_architecture(answers, cloud_provider)
    else:
        return _build_general_web_architecture(answers, cloud_provider, clean_text)


def _build_ecommerce_architecture(answers: Dict[str, str], cloud_provider: str) -> ArchitectureModel:
    high_users = answers.get("q_users") in ["10,000 – 100,000 users", "100,000+ users"]
    need_uploads = answers.get("q_uploads", "Yes, file/image uploads") == "Yes, file/image uploads"

    components = [
        Component(
            id="cdn",
            name="CloudFront CDN",
            type="cdn",
            role="Edge Content Delivery Network",
            technology="CloudFront / Cloud CDN",
            purpose="Caches and delivers frontend assets and product images close to global users.",
            why_recommended="Reduces latency for global shoppers and offloads traffic from backend origin servers.",
            alternatives="Direct origin server delivery (higher latency, higher server load).",
            benefits=["Global sub-50ms asset delivery", "Automatic DDoS mitigation at edge", "Reduced compute bandwidth costs"],
            disadvantages=["Cache invalidation delays upon rapid asset updates", "Slight configuration overhead"],
            tier="standard"
        ),
        Component(
            id="frontend",
            name="Next.js Storefront",
            type="frontend",
            role="User Interface / Web Client",
            technology="Next.js / React",
            purpose="Provides server-rendered shopping storefront, product search, cart, and checkout UI.",
            why_recommended="Next.js provides Server-Side Rendering (SSR) for superior SEO and rapid initial page loads.",
            alternatives="Standard React SPA (slower SEO indexing), Vue.js, Mobile Native app.",
            benefits=["SEO friendly for search engine indexing", "Fast first contentful paint", "Rich interactive product browsing"],
            disadvantages=["Requires Node.js server or edge runtime for SSR"],
            tier="standard"
        ),
        Component(
            id="api_gateway",
            name="API Gateway",
            type="gateway",
            role="API Gateway & Rate Limiter",
            technology="Kong / AWS API Gateway",
            purpose="Single entry point for client API requests, managing routing, rate limiting, and SSL termination.",
            why_recommended="Shields microservices, centralizes authentication verification, and prevents denial-of-service spikes.",
            alternatives="Direct Application Load Balancer without API Gateway features.",
            benefits=["Centralized rate limiting & abuse prevention", "Unified CORS & SSL termination", "API versioning support"],
            disadvantages=["Additional network hop (usually <5ms)"],
            tier="standard"
        ),
        Component(
            id="auth_service",
            name="Auth Service",
            type="auth",
            role="Authentication & Identity Service",
            technology="Node.js / Cognito",
            purpose="Handles user signup, secure login, password resets, and JWT session token generation.",
            why_recommended="Decouples user identity logic from core commerce services, enhancing security and audit compliance.",
            alternatives="Monolithic in-app user table.",
            benefits=["Standardized JWT verification", "Easy integration of social logins (Google, Apple)", "Protection against credential stuffing"],
            disadvantages=["Requires token rotation mechanisms"],
            tier="standard"
        ),
        Component(
            id="product_service",
            name="Product Service",
            type="backend",
            role="Product Catalog Service",
            technology="FastAPI / Python",
            purpose="Manages product listings, categories, pricing, inventory stock counts, and search filters.",
            why_recommended="High-concurrency async read throughput allows thousands of shoppers to browse simultaneously.",
            alternatives="Single combined monolithic backend.",
            benefits=["Independent autoscaling for high-traffic browsing", "Optimized catalog query performance"],
            disadvantages=["Inter-service communication required for order checkout"],
            tier="compute-medium"
        ),
        Component(
            id="order_service",
            name="Order Service",
            type="backend",
            role="Order & Cart Management Service",
            technology="Node.js / Express",
            purpose="Manages shopping carts, calculates totals with taxes, and orchestrates the checkout order workflow.",
            why_recommended="Handles fast transactional shopping cart updates and order life-cycle state transitions.",
            alternatives="Combined backend service.",
            benefits=["High availability during checkout", "Clean transactional boundary for customer carts"],
            disadvantages=["Distributed transaction coordination with inventory and payment"],
            tier="compute-medium"
        ),
        Component(
            id="payment_service",
            name="Payment Service",
            type="payment",
            role="Payment Processing Gateway",
            technology="Stripe / Python Service",
            purpose="Securely interfaces with third-party payment gateways (Stripe/PayPal) and records payment receipts.",
            why_recommended="Isolates sensitive payment processing logic to satisfy PCI-DSS compliance boundaries.",
            alternatives="Third-party hosted checkout only.",
            benefits=["Strict PCI-DSS isolation", "Idempotent payment webhook retries", "Guards against double billing"],
            disadvantages=["Third-party gateway transaction processing fees"],
            tier="compute-small"
        ),
        Component(
            id="cache",
            name="Redis Cache",
            type="cache",
            role="In-Memory Cache & Session Store",
            technology="Redis",
            purpose="Caches active shopping carts, popular product listings, and user login sessions.",
            why_recommended="Reduces repeated relational database queries by 85%+ and delivers sub-millisecond data reads.",
            alternatives="No cache (direct database queries on every click).",
            benefits=["Sub-millisecond data retrieval", "Protects PostgreSQL from traffic spikes", "Built-in TTL for cart expiration"],
            disadvantages=["Requires cache invalidation strategy on price/stock updates", "In-memory RAM is more expensive than disk"],
            tier="cache-medium" if high_users else "cache-small"
        ),
        Component(
            id="database",
            name="PostgreSQL",
            type="database",
            role="Relational Transactional Database",
            technology="PostgreSQL",
            purpose="Primary ACID data store for orders, customers, inventory stock levels, and financial records.",
            why_recommended="ACID transactional consistency prevents race conditions (e.g. two customers buying the last item).",
            alternatives="MongoDB (lacks native multi-table relational constraints), DynamoDB.",
            benefits=["Strong consistency (ACID)", "Rich relational queries for reporting & analytics", "Proven enterprise reliability"],
            disadvantages=["Vertical scaling limits; requires read replicas under heavy read load"],
            tier="db-medium"
        )
    ]

    if need_uploads:
        components.append(
            Component(
                id="storage",
                name="Object Storage (S3)",
                type="storage",
                role="Product Media & Image Storage",
                technology="Amazon S3 / Google Cloud Storage",
                purpose="Stores high-resolution product photos, user review images, and PDF invoice receipts.",
                why_recommended="Scalable, durable object storage prevents bloat in the relational database.",
                alternatives="Storing image binaries directly in database (inefficient) or local server disk (fails on autoscaling).",
                benefits=["99.999999999% data durability", "Near-infinite capacity without server reboots", "Direct presigned uploads"],
                disadvantages=["Eventual consistency on immediate re-reads in some configurations"],
                tier="storage-standard"
            )
        )

    connections = [
        Connection(from_id="cdn", to_id="frontend", label="Edge Asset Delivery", protocol="HTTPS"),
        Connection(from_id="frontend", to_id="api_gateway", label="HTTPS / REST", protocol="HTTPS"),
        Connection(from_id="api_gateway", to_id="auth_service", label="Route /auth", protocol="REST"),
        Connection(from_id="api_gateway", to_id="product_service", label="Route /products", protocol="REST"),
        Connection(from_id="api_gateway", to_id="order_service", label="Route /orders", protocol="REST"),
        Connection(from_id="order_service", to_id="payment_service", label="Process Charge", protocol="REST"),
        Connection(from_id="product_service", to_id="cache", label="Cache Read/Write", protocol="TCP"),
        Connection(from_id="order_service", to_id="cache", label="Cart State", protocol="TCP"),
        Connection(from_id="product_service", to_id="database", label="Catalog Queries", protocol="SQL"),
        Connection(from_id="order_service", to_id="database", label="ACID Transactions", protocol="SQL"),
        Connection(from_id="auth_service", to_id="database", label="User Records", protocol="SQL")
    ]

    if need_uploads:
        connections.append(Connection(from_id="product_service", to_id="storage", label="Uploads Media", protocol="HTTPS"))
        connections.append(Connection(from_id="cdn", to_id="storage", label="Fetches Cached Images", protocol="HTTPS"))

    return ArchitectureModel(
        project_name="E-Commerce Platform",
        description="Scalable microservice e-commerce architecture with edge CDN, API gateway, Redis caching, and PostgreSQL database.",
        components=components,
        connections=connections,
        cloud_provider=cloud_provider
    )


def _build_food_delivery_architecture(answers: Dict[str, str], cloud_provider: str) -> ArchitectureModel:
    components = [
        Component(
            id="mobile_app",
            name="Customer Mobile & Web App",
            type="frontend",
            role="Customer Ordering Interface",
            technology="Flutter / React Native",
            purpose="Enables customers to discover restaurants, customize food orders, checkout, and track delivery on a live map.",
            why_recommended="Cross-platform framework delivers native iOS and Android experiences from a single codebase.",
            alternatives="Separate native Swift and Kotlin apps.",
            benefits=["Unified codebase for iOS & Android", "Smooth 60fps map animations", "Push notification support"],
            disadvantages=["Slightly larger app bundle size than pure native"],
            tier="standard"
        ),
        Component(
            id="api_gateway",
            name="API Gateway & Load Balancer",
            type="gateway",
            role="API Gateway & SSL Termination",
            technology="Kong API Gateway",
            purpose="Routes customer, restaurant, and delivery driver traffic to corresponding backend microservices.",
            why_recommended="Centralizes rate limiting, authentication, and WebSocket connection upgrade routing.",
            alternatives="Standard Reverse Proxy (Nginx).",
            benefits=["Routes HTTP and WebSocket connections", "Enforces API token validation at perimeter"],
            disadvantages=["Requires configuring routing policies"],
            tier="standard"
        ),
        Component(
            id="order_service",
            name="Order & Restaurant Service",
            type="backend",
            role="Order Intake & Kitchen Management",
            technology="Node.js / Express",
            purpose="Accepts incoming orders, manages restaurant menus, and coordinates order preparation states.",
            why_recommended="Fast event-driven I/O handles concurrent order placement during peak meal hours.",
            alternatives="Python FastAPI.",
            benefits=["Non-blocking async I/O for burst traffic", "Lightweight JSON handling"],
            disadvantages=["Single-threaded event loop requires cluster mode or multiple container instances"],
            tier="compute-medium"
        ),
        Component(
            id="dispatch_service",
            name="Dispatch & Live Tracking Service",
            type="backend",
            role="Real-Time Driver Tracking Service",
            technology="Go (Golang)",
            purpose="Maintains live WebSocket connections with couriers and calculates driver assignment algorithms.",
            why_recommended="Go's lightweight goroutines efficiently maintain tens of thousands of simultaneous real-time driver connections.",
            alternatives="Node.js WebSockets.",
            benefits=["Ultra-low memory footprint per active WebSocket", "High-performance geospatial calculations"],
            disadvantages=["Strict typing requires more boilerplate code"],
            tier="compute-medium"
        ),
        Component(
            id="payment_service",
            name="Payment Service",
            type="payment",
            role="Payment Processing Gateway",
            technology="Stripe / Python Service",
            purpose="Charges customer cards, handles restaurant payouts, and manages driver commission disbursement.",
            why_recommended="Isolates sensitive financial flows to maintain PCI compliance.",
            alternatives="Direct third-party checkout.",
            benefits=["Safe idempotent processing", "Automated split-payouts to couriers and restaurants"],
            disadvantages=["Requires external gateway uptime"],
            tier="compute-small"
        ),
        Component(
            id="message_queue",
            name="RabbitMQ Broker",
            type="queue",
            role="Asynchronous Event Broker",
            technology="RabbitMQ",
            purpose="Buffers order lifecycle events (OrderPlaced, FoodReady, DriverAssigned, Delivered) between services.",
            why_recommended="Decouples order intake from tracking and dispatch, ensuring orders are never lost during peak dinner rushes.",
            alternatives="Apache Kafka, AWS SQS.",
            benefits=["Guaranteed message delivery with ACKs", "Prevents order drop under sudden traffic spikes"],
            disadvantages=["Requires queue monitoring to prevent dead-letter backlogs"],
            tier="standard"
        ),
        Component(
            id="redis_cache",
            name="Redis Cache",
            type="cache",
            role="Live Geospatial & Session Cache",
            technology="Redis",
            purpose="Stores active driver GPS coordinates (Redis GEO) and caches popular restaurant menus.",
            why_recommended="Redis GEO commands allow sub-millisecond radius searches (e.g. 'find drivers within 3km').",
            alternatives="In-database spatial queries (too slow under thousands of updates per second).",
            benefits=["Native GEO radius search commands", "Sub-millisecond read/write speeds for fast location updates"],
            disadvantages=["Requires persistent disk synchronization to prevent loss on container restart"],
            tier="cache-medium"
        ),
        Component(
            id="database",
            name="PostgreSQL DB",
            type="database",
            role="Primary Relational & Spatial Database",
            technology="PostgreSQL + PostGIS",
            purpose="Stores restaurants, menus, historical orders, customer profiles, and spatial delivery zones.",
            why_recommended="PostGIS extension provides world-class geographical boundary queries with relational integrity.",
            alternatives="MySQL, MongoDB.",
            benefits=["Rock-solid ACID compliance for money and orders", "Industry-standard PostGIS spatial extension"],
            disadvantages=["Requires memory tuning for complex spatial joins"],
            tier="db-medium"
        )
    ]

    connections = [
        Connection(from_id="mobile_app", to_id="api_gateway", label="HTTPS / WSS", protocol="WSS"),
        Connection(from_id="api_gateway", to_id="order_service", label="Order API", protocol="REST"),
        Connection(from_id="api_gateway", to_id="dispatch_service", label="Live GPS WebSocket", protocol="WSS"),
        Connection(from_id="order_service", to_id="payment_service", label="Charge Customer", protocol="REST"),
        Connection(from_id="order_service", to_id="message_queue", label="Publish OrderPlaced", protocol="TCP"),
        Connection(from_id="message_queue", to_id="dispatch_service", label="Consume Order for Dispatch", protocol="TCP"),
        Connection(from_id="dispatch_service", to_id="redis_cache", label="Redis GEO Driver Ping", protocol="TCP"),
        Connection(from_id="order_service", to_id="database", label="Persist Order Record", protocol="SQL"),
        Connection(from_id="order_service", to_id="redis_cache", label="Menu Cache Check", protocol="TCP")
    ]

    return ArchitectureModel(
        project_name="Food Delivery Platform",
        description="Real-time food delivery architecture with mobile client, Go WebSocket dispatching, Redis GEO tracking, and RabbitMQ event buffering.",
        components=components,
        connections=connections,
        cloud_provider=cloud_provider
    )


def _build_video_streaming_architecture(answers: Dict[str, str], cloud_provider: str) -> ArchitectureModel:
    components = [
        Component(
            id="cdn",
            name="Global Media CDN",
            type="cdn",
            role="Edge Media Delivery Network",
            technology="CloudFront / Fastly",
            purpose="Caches video chunks (HLS/DASH) at thousands of edge points of presence across the world.",
            why_recommended="Eliminates video buffering by streaming video segments from the server closest to the viewer.",
            alternatives="Direct origin server streaming (leads to massive buffering and crashes).",
            benefits=["Sub-second video chunk time-to-first-byte", "Massive egress bandwidth capacity", "Shields backend storage from 95% of requests"],
            disadvantages=["Egress bandwidth cost increases with viewing hours"],
            tier="standard"
        ),
        Component(
            id="video_client",
            name="Web & Smart TV App",
            type="frontend",
            role="Adaptive Video Player Client",
            technology="React / HLS.js",
            purpose="Renders video library catalog, controls playback, and switches bitrates dynamically based on network speed.",
            why_recommended="HLS.js provides adaptive bitrate streaming (switching 1080p -> 720p -> 480p automatically).",
            alternatives="Native AVPlayer / ExoPlayer.",
            benefits=["Adaptive bitrate streaming", "Cross-browser video player support"],
            disadvantages=["Requires media decoding capabilities on older devices"],
            tier="standard"
        ),
        Component(
            id="api_gateway",
            name="API Gateway",
            type="gateway",
            role="API Gateway & Token Verifier",
            technology="AWS API Gateway / Cloud Run Gateway",
            purpose="Handles user login, movie catalog browsing, subscription verification, and playback session creation.",
            why_recommended="Protects backend video APIs from unauthorized tokenless scraping.",
            alternatives="Direct backend hosting.",
            benefits=["Unified authentication token validation", "Rate limiting on search APIs"],
            disadvantages=["Small per-request invocation cost"],
            tier="standard"
        ),
        Component(
            id="catalog_service",
            name="Video Catalog & User Service",
            type="backend",
            role="Catalog & Metadata Service",
            technology="FastAPI / Python",
            purpose="Serves title metadata, search queries, recommendations, user watch history, and bookmarks.",
            why_recommended="Fast async Python backend capable of serving personalized recommendations.",
            alternatives="Node.js API.",
            benefits=["High performance JSON responses", "Clean Python AI/ML recommendation integration"],
            disadvantages=["Requires horizontal scaling for millions of active viewers"],
            tier="compute-medium"
        ),
        Component(
            id="transcoding_worker",
            name="Transcoding Worker",
            type="backend",
            role="Video Encoding & HLS Chunker",
            technology="FFmpeg / Container Worker",
            purpose="Converts uploaded source videos into multiple resolutions (1080p, 720p, 480p) and slices into HLS segments.",
            why_recommended="Ensures smooth playback on mobile connections by preparing adaptive bitrate ladders.",
            alternatives="AWS MediaConvert (managed alternative).",
            benefits=["Automated encoding into industry-standard HLS/DASH", "Scales out horizontally on upload queue"],
            disadvantages=["CPU/GPU compute intensive workload"],
            tier="compute-large"
        ),
        Component(
            id="storage",
            name="Video Object Storage (S3)",
            type="storage",
            role="Primary Video Asset Storage",
            technology="Amazon S3 / Google Cloud Storage",
            purpose="Stores original master video uploads and encoded .m3u8 playlists and .ts video chunks.",
            why_recommended="Designed for massive petabyte-scale media files with 11 9's of data durability.",
            alternatives="Local block storage (EBS) - too expensive and non-shared.",
            benefits=["Virtually limitless capacity", "Native integration with CDN origins", "High durability"],
            disadvantages=["Egress bandwidth charges if not cached properly by CDN"],
            tier="storage-standard"
        ),
        Component(
            id="cache",
            name="Redis Cache",
            type="cache",
            role="Playback Session & Metadata Cache",
            technology="Redis",
            purpose="Stores real-time viewer playback checkpoints (resume at mm:ss) and hot catalog search queries.",
            why_recommended="Instant sub-millisecond retrieval of user watch history when browsing homepage.",
            alternatives="PostgreSQL only.",
            benefits=["Instant resume-playback lookups", "Offloads catalog reads from PostgreSQL"],
            disadvantages=["Data must be periodically persisted to main DB"],
            tier="cache-medium"
        ),
        Component(
            id="database",
            name="PostgreSQL",
            type="database",
            role="Relational Metadata Database",
            technology="PostgreSQL",
            purpose="Stores user accounts, subscriptions, viewing history ledgers, movie tags, and licensing windows.",
            why_recommended="Reliable relational schema for complex movie categories, actor credits, and user subscriptions.",
            alternatives="MongoDB, Cassandra.",
            benefits=["ACID subscription transactions", "Rich JSONB support for variable video metadata"],
            disadvantages=["Requires read replicas under heavy global viewer loads"],
            tier="db-medium"
        )
    ]

    connections = [
        Connection(from_id="cdn", to_id="video_client", label="HLS Video Chunks", protocol="HTTPS"),
        Connection(from_id="cdn", to_id="storage", label="Origin Fetch", protocol="HTTPS"),
        Connection(from_id="video_client", to_id="api_gateway", label="Catalog & Resume API", protocol="REST"),
        Connection(from_id="api_gateway", to_id="catalog_service", label="Routes API", protocol="REST"),
        Connection(from_id="catalog_service", to_id="cache", label="Checkpoints & Hot Titles", protocol="TCP"),
        Connection(from_id="catalog_service", to_id="database", label="Metadata Queries", protocol="SQL"),
        Connection(from_id="transcoding_worker", to_id="storage", label="Read Master & Write HLS", protocol="HTTPS")
    ]

    return ArchitectureModel(
        project_name="Video Streaming Platform",
        description="High-throughput adaptive video streaming architecture with edge CDN caching, FFmpeg transcoding workers, S3 storage, and Redis playback resume caching.",
        components=components,
        connections=connections,
        cloud_provider=cloud_provider
    )


def _build_social_media_architecture(answers: Dict[str, str], cloud_provider: str) -> ArchitectureModel:
    components = [
        Component(
            id="cdn",
            name="CloudFront CDN",
            type="cdn",
            role="Media Edge Delivery",
            technology="CloudFront",
            purpose="Distributes user avatars, images, and short video clips globally.",
            why_recommended="Instant loading of feed images on mobile networks without lagging.",
            alternatives="Direct server hosting.",
            benefits=["Low latency photo loading", "Reduced server bandwidth costs"],
            disadvantages=["Cache invalidation on profile photo changes"],
            tier="standard"
        ),
        Component(
            id="frontend",
            name="React / Mobile App",
            type="frontend",
            role="Social Feed Interface",
            technology="React / React Native",
            purpose="Infinite scroll feed, post creation, direct messaging, and profile management.",
            why_recommended="Rich virtualized infinite scroll for smooth browsing.",
            alternatives="Standard web page.",
            benefits=["Smooth infinite scrolling", "Instant UI feedback with optimistic updates"],
            disadvantages=["Client state management complexity"],
            tier="standard"
        ),
        Component(
            id="api_gateway",
            name="API Gateway",
            type="gateway",
            role="Gateway & WebSocket Proxy",
            technology="API Gateway",
            purpose="Handles user authentication tokens and routes REST and WebSocket chat traffic.",
            why_recommended="Protects internal services and manages persistent connection upgrades.",
            alternatives="Nginx reverse proxy.",
            benefits=["Unified rate limiting", "WebSocket support for live messaging"],
            disadvantages=["Latency overhead (~2-5ms)"],
            tier="standard"
        ),
        Component(
            id="post_service",
            name="Post & Feed Service",
            type="backend",
            role="Feed Generation & Post Management",
            technology="FastAPI / Python",
            purpose="Handles post publication, like counts, comments, and timeline feed generation.",
            why_recommended="High-concurrency async operations for fanout-on-write feed distribution.",
            alternatives="Node.js.",
            benefits=["Asynchronous fanout processing", "Fast serialization"],
            disadvantages=["High memory usage on massive timeline fanouts"],
            tier="compute-medium"
        ),
        Component(
            id="chat_service",
            name="Chat & Notification Service",
            type="backend",
            role="Real-Time Direct Messaging",
            technology="Node.js / WebSockets",
            purpose="Powers direct user-to-user messaging and instant push notification delivery.",
            why_recommended="Event-driven WebSocket architecture maintains active chat connections.",
            alternatives="Polling (wasteful network calls).",
            benefits=["Instant real-time message delivery", "Push notification webhooks"],
            disadvantages=["Requires sticky sessions or Redis pub/sub across server nodes"],
            tier="compute-medium"
        ),
        Component(
            id="cache",
            name="Redis Feed Cache",
            type="cache",
            role="Timeline & In-Memory Social Graph",
            technology="Redis Cluster",
            purpose="Stores pre-computed user timeline feeds and active session tokens.",
            why_recommended="Enables instant sub-10ms feed loading without doing costly multi-table database joins on every refresh.",
            alternatives="SQL joins on every feed refresh (crashes at scale).",
            benefits=["Pre-computed feeds deliver instant timeline loads", "High-throughput like/comment counters"],
            disadvantages=["Memory intensive data storage"],
            tier="cache-medium"
        ),
        Component(
            id="storage",
            name="Media Storage (S3)",
            type="storage",
            role="Photo & Video Asset Storage",
            technology="Amazon S3",
            purpose="Stores user photos, post attachments, and video stories.",
            why_recommended="Highly durable, cost-effective storage for millions of user photos.",
            alternatives="Database BLOB storage (severely degrades performance).",
            benefits=["Near-infinite capacity", "Presigned client direct uploads"],
            disadvantages=["Egress costs for uncompressed media"],
            tier="storage-standard"
        ),
        Component(
            id="database",
            name="PostgreSQL",
            type="database",
            role="Relational Social Graph & User DB",
            technology="PostgreSQL",
            purpose="Stores user accounts, follower relationships, posts, and comments.",
            why_recommended="ACID relational model maintains follower connections and audit logs.",
            alternatives="Neo4j (graph DB), Cassandra.",
            benefits=["Reliable relationships and constraints", "Rich indexing for social graphs"],
            disadvantages=["Requires sharding or read-replicas above 10M users"],
            tier="db-medium"
        )
    ]

    connections = [
        Connection(from_id="cdn", to_id="frontend", label="Static Assets & Photos", protocol="HTTPS"),
        Connection(from_id="cdn", to_id="storage", label="Origin Fetch", protocol="HTTPS"),
        Connection(from_id="frontend", to_id="api_gateway", label="HTTPS / WSS", protocol="HTTPS"),
        Connection(from_id="api_gateway", to_id="post_service", label="Route /posts", protocol="REST"),
        Connection(from_id="api_gateway", to_id="chat_service", label="Route /chat", protocol="WSS"),
        Connection(from_id="post_service", to_id="cache", label="Feed Invalidation & Read", protocol="TCP"),
        Connection(from_id="post_service", to_id="storage", label="Presigned Upload URL", protocol="HTTPS"),
        Connection(from_id="post_service", to_id="database", label="Persist Posts & Graph", protocol="SQL"),
        Connection(from_id="chat_service", to_id="database", label="Persist Message History", protocol="SQL")
    ]

    return ArchitectureModel(
        project_name="Social Media Platform",
        description="Scalable social media architecture featuring real-time chat, Redis timeline caching, S3 media storage, and relational social graph storage.",
        components=components,
        connections=connections,
        cloud_provider=cloud_provider
    )


def _build_college_management_architecture(answers: Dict[str, str], cloud_provider: str) -> ArchitectureModel:
    components = [
        Component(
            id="frontend",
            name="College Portal Web & Mobile",
            type="frontend",
            role="Portal User Interface",
            technology="React SPA",
            purpose="Student & Faculty portal for taking attendance, viewing timetables, and recording grades.",
            why_recommended="Responsive web dashboard accessible on college laptops, tablets, and smartphones.",
            alternatives="Desktop desktop-only application.",
            benefits=["Accessible on any browser", "Role-tailored dashboards for students vs professors"],
            disadvantages=["Requires active internet connection"],
            tier="standard"
        ),
        Component(
            id="api_gateway",
            name="API Gateway & Load Balancer",
            type="gateway",
            role="Gateway & SSL Proxy",
            technology="API Gateway",
            purpose="Secures access, terminates SSL, and validates JWT student/professor role permissions.",
            why_recommended="Enforces Role-Based Access Control (RBAC) before requests reach backend services.",
            alternatives="Direct web server.",
            benefits=["Centralized role token inspection", "Guards sensitive grading APIs"],
            disadvantages=["Configuration learning curve"],
            tier="standard"
        ),
        Component(
            id="auth_service",
            name="Auth & Directory Service",
            type="auth",
            role="Role-Based Identity Provider",
            technology="Node.js / LDAP / OAuth",
            purpose="Integrates with campus single sign-on (SSO) and enforces role-based permissions.",
            why_recommended="Separates student credentials from grading data and supports 2FA for faculty.",
            alternatives="Basic unencrypted username/password table.",
            benefits=["Campus SSO compatibility", "Multi-factor authentication for staff"],
            disadvantages=["Requires syncing with college enrollment roster"],
            tier="standard"
        ),
        Component(
            id="academic_service",
            name="Attendance & Academic Service",
            type="backend",
            role="Core Academic Business Logic",
            technology="FastAPI / Python",
            purpose="Processes student attendance logs, course schedules, assignment grading, and report cards.",
            why_recommended="High-productivity Python API with excellent data processing for semester analytics.",
            alternatives="PHP / Java Spring.",
            benefits=["Rapid report generation", "Robust calculation of attendance percentages & GPA"],
            disadvantages=["Requires horizontal scaling on exam result days"],
            tier="compute-medium"
        ),
        Component(
            id="storage",
            name="Document Storage (S3)",
            type="storage",
            role="Course Material & Assignment Storage",
            technology="Amazon S3",
            purpose="Stores syllabus PDFs, lecture slides, submitted student assignments, and exam archives.",
            why_recommended="Durable cloud storage ensures student submissions are never lost or corrupted.",
            alternatives="Local server hard disk (prone to hardware failure).",
            benefits=["Automatic document versioning", "Zero storage limit bottlenecks"],
            disadvantages=["Occasional presigned URL expiration issues if misconfigured"],
            tier="storage-standard"
        ),
        Component(
            id="cache",
            name="Redis Cache",
            type="cache",
            role="Session & Timetable Cache",
            technology="Redis",
            purpose="Caches active student class timetables, daily attendance summaries, and session tokens.",
            why_recommended="Prevents database overload when hundreds of students check exam results simultaneously.",
            alternatives="Direct database reads.",
            benefits=["Sub-millisecond timetable lookups", "Protects PostgreSQL during morning attendance rush"],
            disadvantages=["Cache invalidation needed when class schedules change"],
            tier="cache-small"
        ),
        Component(
            id="database",
            name="PostgreSQL",
            type="database",
            role="Relational Academic Database",
            technology="PostgreSQL",
            purpose="ACID-compliant storage for student attendance logs, grade books, enrollments, and fee ledgers.",
            why_recommended="Relational constraints ensure grades cannot be recorded for non-enrolled students.",
            alternatives="MongoDB (lacks rigid relational integrity required for official transcripts).",
            benefits=["Strict relational constraints prevent orphaned grades", "Complete audit trail for grade edits"],
            disadvantages=["Requires regular schema migration planning"],
            tier="db-medium"
        )
    ]

    connections = [
        Connection(from_id="frontend", to_id="api_gateway", label="HTTPS REST", protocol="HTTPS"),
        Connection(from_id="api_gateway", to_id="auth_service", label="Verify SSO / RBAC", protocol="REST"),
        Connection(from_id="api_gateway", to_id="academic_service", label="Route Academic Requests", protocol="REST"),
        Connection(from_id="academic_service", to_id="cache", label="Check Timetable Cache", protocol="TCP"),
        Connection(from_id="academic_service", to_id="storage", label="Presigned Upload URL", protocol="HTTPS"),
        Connection(from_id="academic_service", to_id="database", label="ACID Attendance & Grades", protocol="SQL"),
        Connection(from_id="auth_service", to_id="database", label="User & Role Records", protocol="SQL")
    ]

    return ArchitectureModel(
        project_name="College Management System",
        description="Comprehensive academic architecture featuring role-based access control, attendance tracking, document storage, and PostgreSQL relational data persistence.",
        components=components,
        connections=connections,
        cloud_provider=cloud_provider
    )


def _build_banking_architecture(answers: Dict[str, str], cloud_provider: str) -> ArchitectureModel:
    components = [
        Component(
            id="frontend",
            name="Web & Mobile Banking Client",
            type="frontend",
            role="Secure Customer Banking Portal",
            technology="React / iOS / Android",
            purpose="Enables customers to inspect balances, perform wire transfers, and manage cards.",
            why_recommended="Enforces biometric authentication and secure local session storage.",
            alternatives="Third-party portal.",
            benefits=["Secure certificate pinning", "Biometric unlock support"],
            disadvantages=["Frequent mandatory security updates"],
            tier="standard"
        ),
        Component(
            id="api_gateway",
            name="Hardened API Gateway",
            type="gateway",
            role="Financial-Grade API Gateway",
            technology="Kong / Apigee",
            purpose="Enforces mTLS, terminates SSL, rate-limits endpoints, and checks device fingerprinting.",
            why_recommended="Protects core banking APIs against DDoS, credential brute-forcing, and replay attacks.",
            alternatives="Standard reverse proxy.",
            benefits=["Hardware-grade mTLS encryption", "Adaptive rate-limiting against fraud"],
            disadvantages=["Strict configuration requirements"],
            tier="standard"
        ),
        Component(
            id="auth_service",
            name="Identity & MFA Service",
            type="auth",
            role="Multi-Factor Auth & Identity Provider",
            technology="Keycloak / Auth0",
            purpose="Manages user logins, SMS/Hardware OTP verification, and JWT session lifecycles.",
            why_recommended="Prevents unauthorized access through step-up authentication on wire transfers.",
            alternatives="Basic in-app login.",
            benefits=["Enforces strict MFA", "Step-up authentication for large transfers"],
            disadvantages=["OTP delivery delays via SMS carriers"],
            tier="standard"
        ),
        Component(
            id="core_banking",
            name="Core Banking & Ledger Service",
            type="backend",
            role="Double-Entry Financial Ledger",
            technology="Go (Golang) / Java Spring",
            purpose="Executes idempotent fund transfers, manages account balances, and writes immutable ledger journals.",
            why_recommended="Memory-safe, high-speed compiled language prevents concurrency race conditions.",
            alternatives="Node.js.",
            benefits=["Strict double-entry bookkeeping", "Idempotent payment transaction processing"],
            disadvantages=["Requires formal compliance verification"],
            tier="compute-medium"
        ),
        Component(
            id="fraud_service",
            name="Fraud Detection Engine",
            type="backend",
            role="Real-Time Risk Scoring Engine",
            technology="Python / ML Model",
            purpose="Analyzes incoming transaction patterns, IP geolocations, and velocities to flag suspicious activity.",
            why_recommended="Evaluates fraud risk rules and anomaly models in under 150ms before releasing funds.",
            alternatives="Manual review only (too slow).",
            benefits=["Real-time risk scoring", "Automated temporary lock on stolen cards"],
            disadvantages=["Risk of false positive transaction denials"],
            tier="compute-medium"
        ),
        Component(
            id="cache",
            name="Redis Cluster",
            type="cache",
            role="Idempotency Key & Session Store",
            technology="Redis Multi-AZ",
            purpose="Maintains idempotency keys to prevent duplicate transfer clicks and caches account metadata.",
            why_recommended="Atomic key locks prevent customers from accidentally submitting the same transfer twice.",
            alternatives="Database locks (causes table contention).",
            benefits=["Atomic distributed locking", "Instant token validation"],
            disadvantages=["In-memory data must be backed up across multiple availability zones"],
            tier="cache-medium"
        ),
        Component(
            id="database",
            name="PostgreSQL",
            type="database",
            role="ACID Relational Ledger Database",
            technology="PostgreSQL (Multi-AZ)",
            purpose="Primary immutable ledger database with synchronous Multi-AZ replication.",
            why_recommended="Zero data loss (RPO=0) configuration guarantees exact account balances and auditability.",
            alternatives="NoSQL databases (not recommended for financial ledgers).",
            benefits=["Strict ACID transactional compliance", "Synchronous multi-AZ failover", "Immutable journal tables"],
            disadvantages=["Higher cost for multi-datacenter synchronous replication"],
            tier="db-large"
        )
    ]

    connections = [
        Connection(from_id="frontend", to_id="api_gateway", label="mTLS / TLS 1.3", protocol="HTTPS"),
        Connection(from_id="api_gateway", to_id="auth_service", label="Verify Token & MFA", protocol="REST"),
        Connection(from_id="api_gateway", to_id="core_banking", label="Route /transfer", protocol="REST"),
        Connection(from_id="core_banking", to_id="fraud_service", label="Score Transaction Risk", protocol="REST"),
        Connection(from_id="core_banking", to_id="cache", label="Check Idempotency Key", protocol="TCP"),
        Connection(from_id="core_banking", to_id="database", label="ACID Double-Entry Ledger", protocol="SQL"),
        Connection(from_id="auth_service", to_id="database", label="User Credentials", protocol="SQL")
    ]

    return ArchitectureModel(
        project_name="Online Banking Platform",
        description="High-security financial architecture featuring mTLS API gateway, fraud scoring engine, Redis distributed idempotency locking, and Multi-AZ PostgreSQL ledger.",
        components=components,
        connections=connections,
        cloud_provider=cloud_provider
    )


def _build_iot_architecture(answers: Dict[str, str], cloud_provider: str) -> ArchitectureModel:
    components = [
        Component(
            id="iot_devices",
            name="IoT Devices & Sensors",
            type="frontend",
            role="Edge Hardware & Sensors",
            technology="MQTT / Embedded Hardware",
            purpose="Measures temperature, pressure, GPS, and equipment telemetry and transmits over MQTT.",
            why_recommended="Low-power edge sensors report telemetry continuously.",
            alternatives="HTTP polling sensors (consumes too much battery).",
            benefits=["Minimal bandwidth usage", "Low power consumption over cellular/WiFi"],
            disadvantages=["Intermittent edge network disconnects"],
            tier="standard"
        ),
        Component(
            id="mqtt_broker",
            name="IoT Ingestion Broker",
            type="queue",
            role="High-Throughput MQTT / Kafka Broker",
            technology="EMQX / Apache Kafka",
            purpose="Maintains persistent connections with thousands of edge devices and buffers incoming telemetry.",
            why_recommended="Capable of ingesting tens of thousands of sensor pings per second without dropping packets.",
            alternatives="Direct REST API server (crashes under concurrent connection storms).",
            benefits=["Handles massive concurrent sensor connections", "Guaranteed packet delivery"],
            disadvantages=["Requires broker cluster management"],
            tier="standard"
        ),
        Component(
            id="telemetry_worker",
            name="Telemetry Processing Worker",
            type="backend",
            role="Stream Processing & Anomaly Worker",
            technology="Go / Python Worker",
            purpose="Consumes sensor metrics from message queue, checks alert thresholds, and downsamples data.",
            why_recommended="Decouples ingestion from database writes, ensuring data spikes are smoothed out.",
            alternatives="Synchronous database writing.",
            benefits=["Scales out horizontally to handle sensor spikes", "Instant anomaly threshold detection"],
            disadvantages=["Slight processing latency (sub-second)"],
            tier="compute-medium"
        ),
        Component(
            id="dashboard",
            name="Telemetry Dashboard",
            type="frontend",
            role="Operations & Alerting Dashboard",
            technology="React / Grafana",
            purpose="Live charts, equipment health gauges, and alarm incident management for plant engineers.",
            why_recommended="Visualizes real-time time-series metrics with sub-second live chart updates.",
            alternatives="Static PDF reports.",
            benefits=["Real-time operational visibility", "Interactive alert acknowledgement"],
            disadvantages=["Requires modern web browser for canvas charting"],
            tier="standard"
        ),
        Component(
            id="cache",
            name="Redis Device State",
            type="cache",
            role="Latest Device Shadow State",
            technology="Redis",
            purpose="Stores the most recent ping and online/offline status for every registered sensor.",
            why_recommended="Enables the dashboard to show instant 'current device status' without querying billions of historical rows.",
            alternatives="Database query on every refresh.",
            benefits=["Instant device online/offline check", "Sub-millisecond status lookups"],
            disadvantages=["Stores current snapshot only, not long-term history"],
            tier="cache-small"
        ),
        Component(
            id="timeseries_db",
            name="Time-Series DB (TimescaleDB / InfluxDB)",
            type="database",
            role="Time-Series Telemetry Database",
            technology="TimescaleDB (PostgreSQL) / InfluxDB",
            purpose="Stores billions of timestamped sensor readings with automatic data retention and compression.",
            why_recommended="Optimized for high-volume append-only time-series writes and downsampled aggregate queries.",
            alternatives="Standard relational database (fills disk and slows down rapidly).",
            benefits=["90%+ disk compression for historical telemetry", "Fast time-bucket aggregation queries"],
            disadvantages=["Specialized time-series query syntax"],
            tier="db-medium"
        )
    ]

    connections = [
        Connection(from_id="iot_devices", to_id="mqtt_broker", label="MQTT Telemetry Stream", protocol="TCP"),
        Connection(from_id="mqtt_broker", to_id="telemetry_worker", label="Consume Sensor Stream", protocol="TCP"),
        Connection(from_id="telemetry_worker", to_id="cache", label="Update Latest Shadow", protocol="TCP"),
        Connection(from_id="telemetry_worker", to_id="timeseries_db", label="Batch Ingest Metrics", protocol="SQL"),
        Connection(from_id="dashboard", to_id="cache", label="Live Device Status", protocol="TCP"),
        Connection(from_id="dashboard", to_id="timeseries_db", label="Historical Charts Query", protocol="SQL")
    ]

    return ArchitectureModel(
        project_name="IoT Monitoring & Telemetry Platform",
        description="High-throughput IoT architecture featuring MQTT message ingestion, stream processing workers, Redis device shadow caching, and time-series database storage.",
        components=components,
        connections=connections,
        cloud_provider=cloud_provider
    )


def _build_file_storage_architecture(answers: Dict[str, str], cloud_provider: str) -> ArchitectureModel:
    components = [
        Component(
            id="cdn",
            name="CloudFront CDN",
            type="cdn",
            role="Edge File Download Accelerator",
            technology="CloudFront",
            purpose="Accelerates download of public shared files and caches web portal assets.",
            why_recommended="Reduces latency and offloads repeated downloads of popular shared documents.",
            alternatives="Direct S3 download.",
            benefits=["Fast global downloads", "Reduces storage egress costs"],
            disadvantages=["Not applicable for private non-cacheable files"],
            tier="standard"
        ),
        Component(
            id="frontend",
            name="Cloud Drive Web & Desktop App",
            type="frontend",
            role="File Explorer & Upload Client",
            technology="React / Electron",
            purpose="Provides folder tree navigation, drag-and-drop file upload, and sharing link creation.",
            why_recommended="Performs direct-to-S3 multipart uploads directly from the browser.",
            alternatives="Simple HTML form.",
            benefits=["Resumable multipart uploads", "Chunked file transfers"],
            disadvantages=["Requires client-side JavaScript execution"],
            tier="standard"
        ),
        Component(
            id="api_gateway",
            name="API Gateway",
            type="gateway",
            role="API Gateway & Auth Proxy",
            technology="API Gateway",
            purpose="Routes file metadata requests and issues presigned upload/download authorization tickets.",
            why_recommended="Enforces user authentication before issuing temporary cryptographic storage tokens.",
            alternatives="Direct server.",
            benefits=["Prevents unauthorized file access", "Protects backend from high upload bandwidth"],
            disadvantages=["Token expiration handling required"],
            tier="standard"
        ),
        Component(
            id="file_service",
            name="File Metadata & Sharing Service",
            type="backend",
            role="Metadata & Permission Manager",
            technology="FastAPI / Python",
            purpose="Manages folder hierarchies, file names, sharing permissions, and generates presigned S3 URLs.",
            why_recommended="Because files upload directly to S3 via presigned URLs, this service handles lightweight metadata only.",
            alternatives="Uploading file streams through backend (causes server bottleneck and memory crashes).",
            benefits=["Server never chokes on large 5GB file uploads", "Fast JSON folder tree responses"],
            disadvantages=["Client must make two calls: get presigned URL, then upload to S3"],
            tier="compute-medium"
        ),
        Component(
            id="scanner_worker",
            name="Virus & Malware Scanner",
            type="backend",
            role="Async File Quarantine Worker",
            technology="ClamAV / Container Worker",
            purpose="Scans newly uploaded files in the background and quarantines malicious attachments.",
            why_recommended="Ensures shared files are safe without blocking initial upload completion.",
            alternatives="No scanning (security vulnerability).",
            benefits=["Protects users from malware infections", "Automated quarantine of infected files"],
            disadvantages=["Scanning large files takes a few seconds"],
            tier="compute-small"
        ),
        Component(
            id="storage",
            name="Object Storage (S3)",
            type="storage",
            role="Primary File Object Storage",
            technology="Amazon S3 Standard",
            purpose="Durable encrypted storage for all customer documents, photos, and archives.",
            why_recommended="Provides 99.999999999% durability and automated lifecycle tiering (hot -> cold archive).",
            alternatives="Attached block storage volumes.",
            benefits=["Industry standard 11 9's durability", "Automatic lifecycle tiering to Glacier to save 70% cost"],
            disadvantages=["Per-GB monthly storage cost"],
            tier="storage-standard"
        ),
        Component(
            id="database",
            name="PostgreSQL",
            type="database",
            role="File Tree & Permissions Database",
            technology="PostgreSQL",
            purpose="Stores user folders, file sizes, checksums, sharing permissions, and access logs.",
            why_recommended="Relational constraints ensure recursive folder deletion and permissions are strictly enforced.",
            alternatives="MongoDB.",
            benefits=["Fast indexed folder queries", "Guaranteed relational integrity for sharing ACLs"],
            disadvantages=["Index maintenance required as file count exceeds tens of millions"],
            tier="db-medium"
        )
    ]

    connections = [
        Connection(from_id="frontend", to_id="api_gateway", label="HTTPS / REST", protocol="HTTPS"),
        Connection(from_id="frontend", to_id="storage", label="Direct S3 Upload (Presigned)", protocol="HTTPS"),
        Connection(from_id="api_gateway", to_id="file_service", label="Folder & File Metadata", protocol="REST"),
        Connection(from_id="file_service", to_id="database", label="Query / Update File Tree", protocol="SQL"),
        Connection(from_id="file_service", to_id="storage", label="Sign Presigned URL", protocol="HTTPS"),
        Connection(from_id="storage", to_id="scanner_worker", label="Trigger S3 Event OnUpload", protocol="HTTPS"),
        Connection(from_id="cdn", to_id="storage", label="Fetch Public Downloads", protocol="HTTPS")
    ]

    return ArchitectureModel(
        project_name="Cloud File Storage Platform",
        description="Scalable cloud file storage architecture with direct-to-S3 presigned uploads, ClamAV malware scanning, CloudFront acceleration, and PostgreSQL metadata management.",
        components=components,
        connections=connections,
        cloud_provider=cloud_provider
    )


def _build_ai_architecture(answers: Dict[str, str], cloud_provider: str) -> ArchitectureModel:
    components = [
        Component(
            id="frontend",
            name="AI Chat & Assistant UI",
            type="frontend",
            role="Conversational AI Client",
            technology="React / Next.js",
            purpose="Provides conversational chat interface with streaming Server-Sent Events (SSE) token display.",
            why_recommended="Supports token-by-token streaming markdown rendering and file upload attachments.",
            alternatives="Standard web form.",
            benefits=["Real-time token streaming UX", "Syntax highlighting for code generation"],
            disadvantages=["Requires SSE / WebSocket connection management"],
            tier="standard"
        ),
        Component(
            id="api_gateway",
            name="API Gateway & Rate Limiter",
            type="gateway",
            role="Token Bucket Gateway",
            technology="API Gateway",
            purpose="Enforces user authentication, per-user token quotas, and rate limiting on expensive LLM calls.",
            why_recommended="Guards against runaway API billing and unauthorized automated scraping.",
            alternatives="Direct server.",
            benefits=["Prevents budget overruns with quota limits", "Unified CORS and authentication"],
            disadvantages=["Slight latency overhead"],
            tier="standard"
        ),
        Component(
            id="orchestrator",
            name="LLM Orchestration Service",
            type="backend",
            role="RAG & Prompt Orchestration Service",
            technology="FastAPI / LangChain / LlamaIndex",
            purpose="Orchestrates prompts, queries vector search for context (RAG), and calls LLM inference models.",
            why_recommended="Async Python service with deep native support for AI libraries, embeddings, and prompt chains.",
            alternatives="Node.js.",
            benefits=["Async streaming SSE support", "Native integration with Python ML/AI ecosystem"],
            disadvantages=["Requires model timeout and retry handling"],
            tier="compute-medium"
        ),
        Component(
            id="vector_db",
            name="Vector Database (Qdrant / pgvector)",
            type="database",
            role="Semantic Embeddings Store (RAG)",
            technology="Qdrant / pgvector",
            purpose="Indexes high-dimensional document embeddings for semantic search and Retrieval-Augmented Generation.",
            why_recommended="Enables the AI to accurately answer questions using your private documents.",
            alternatives="Full-text keyword search (lacks semantic meaning).",
            benefits=["Sub-50ms cosine similarity search", "Provides context to prevent LLM hallucinations"],
            disadvantages=["Requires upfront embedding generation on new documents"],
            tier="db-medium"
        ),
        Component(
            id="cache",
            name="Semantic Prompt Cache (Redis)",
            type="cache",
            role="Prompt & Response Cache",
            technology="Redis",
            purpose="Caches exact and semantic AI responses to avoid repeatedly calling expensive external LLM models.",
            why_recommended="Can cut external AI inference bills by 30-50% for common repeated queries.",
            alternatives="No cache (every question incurs full LLM token cost).",
            benefits=["Instant sub-10ms response for cached questions", "Significant LLM API cost savings"],
            disadvantages=["May return cached response if underlying data changed"],
            tier="cache-small"
        ),
        Component(
            id="database",
            name="PostgreSQL",
            type="database",
            role="Chat History & User DB",
            technology="PostgreSQL",
            purpose="Stores user accounts, conversation history threads, token usage analytics, and feedback ratings.",
            why_recommended="Reliable relational data store for audit logs, billing tracking, and prompt analytics.",
            alternatives="MongoDB.",
            benefits=["Auditable token billing records", "Relational chat thread hierarchies"],
            disadvantages=["Regular archiving of old chat logs recommended"],
            tier="db-medium"
        )
    ]

    connections = [
        Connection(from_id="frontend", to_id="api_gateway", label="SSE Streaming", protocol="HTTPS"),
        Connection(from_id="api_gateway", to_id="orchestrator", label="Route Prompts", protocol="REST"),
        Connection(from_id="orchestrator", to_id="cache", label="Check Prompt Cache", protocol="TCP"),
        Connection(from_id="orchestrator", to_id="vector_db", label="Similarity Search (RAG)", protocol="TCP"),
        Connection(from_id="orchestrator", to_id="database", label="Persist Conversation & Usage", protocol="SQL")
    ]

    return ArchitectureModel(
        project_name="AI Application with RAG",
        description="Enterprise AI architecture with conversational streaming frontend, LLM prompt orchestrator, Qdrant/pgvector embeddings store, and Redis prompt caching.",
        components=components,
        connections=connections,
        cloud_provider=cloud_provider
    )


def _build_general_web_architecture(answers: Dict[str, str], cloud_provider: str, prompt: str) -> ArchitectureModel:
    project_title = prompt.strip().title() if len(prompt.strip()) < 35 else "Web Application"

    components = [
        Component(
            id="frontend",
            name="React Web Client",
            type="frontend",
            role="Web User Interface",
            technology="React.js",
            purpose="Interactive user interface running in modern web browsers.",
            why_recommended="Popular, robust component-based frontend framework with massive ecosystem support.",
            alternatives="Vue.js, Svelte, Angular.",
            benefits=["Rich component ecosystem", "High developer productivity", "Responsive UI"],
            disadvantages=["Client bundle download size"],
            tier="standard"
        ),
        Component(
            id="api_gateway",
            name="API Gateway & Load Balancer",
            type="gateway",
            role="Traffic Gateway & SSL Termination",
            technology="Application Load Balancer / API Gateway",
            purpose="Routes client traffic and handles SSL termination.",
            why_recommended="Distributes traffic evenly and terminates SSL certificates at the edge.",
            alternatives="Direct single server.",
            benefits=["Health checks and automated failover", "Unified SSL management"],
            disadvantages=["Additional cloud service line item"],
            tier="standard"
        ),
        Component(
            id="backend",
            name="FastAPI Backend",
            type="backend",
            role="Business Logic API Service",
            technology="Python / FastAPI",
            purpose="Processes application requests, business rules, and API endpoints.",
            why_recommended="Asynchronous Python framework with automatic OpenAPI documentation and Pydantic validation.",
            alternatives="Node.js Express, Django, Go.",
            benefits=["High performance async throughput", "Automatic interactive API documentation", "Type-safe request validation"],
            disadvantages=["Requires ASGI server (Uvicorn) setup"],
            tier="compute-medium"
        ),
        Component(
            id="cache",
            name="Redis Cache",
            type="cache",
            role="Session & In-Memory Cache",
            technology="Redis",
            purpose="Caches frequently accessed data and manages user session states.",
            why_recommended="Significantly reduces repeated database reads and speeds up response times.",
            alternatives="No cache for low-traffic sites.",
            benefits=["Sub-millisecond data access", "Offloads read load from PostgreSQL"],
            disadvantages=["Cache invalidation management"],
            tier="cache-small"
        ),
        Component(
            id="database",
            name="PostgreSQL",
            type="database",
            role="Relational Database",
            technology="PostgreSQL",
            purpose="Primary transactional data store for user and application data.",
            why_recommended="Industry-leading open-source relational database known for reliability and ACID compliance.",
            alternatives="MySQL, SQLite (local development only).",
            benefits=["Full ACID compliance", "Rich indexing and query capabilities"],
            disadvantages=["Requires vertical memory scaling or read replicas under heavy loads"],
            tier="db-medium"
        )
    ]

    connections = [
        Connection(from_id="frontend", to_id="api_gateway", label="HTTPS / REST", protocol="HTTPS"),
        Connection(from_id="api_gateway", to_id="backend", label="Forward Requests", protocol="REST"),
        Connection(from_id="backend", to_id="cache", label="Cache Read/Write", protocol="TCP"),
        Connection(from_id="backend", to_id="database", label="SQL CRUD", protocol="SQL")
    ]

    return ArchitectureModel(
        project_name=project_title,
        description=f"Modern cloud architecture for {project_title} with React frontend, FastAPI backend, Redis cache, and PostgreSQL database.",
        components=components,
        connections=connections,
        cloud_provider=cloud_provider
    )


def _build_explicit_tech_architecture(text: str, cloud_provider: str) -> ArchitectureModel:
    """
    Parses explicit technical prompts (e.g. 'React frontend connected to FastAPI with Redis and PostgreSQL').
    """
    components = []
    seen_ids = set()

    tech_defs = [
        {"regex": r"\b(react(\.js|js)?)\b", "id": "frontend", "name": "React", "type": "frontend", "tech": "React.js", "role": "Frontend SPA Client"},
        {"regex": r"\b(next(\.js|js)?)\b", "id": "frontend", "name": "Next.js", "type": "frontend", "tech": "Next.js", "role": "SSR Web Frontend"},
        {"regex": r"\b(vue(\.js|js)?)\b", "id": "frontend", "name": "Vue.js", "type": "frontend", "tech": "Vue.js", "role": "Frontend Client"},
        {"regex": r"\b(angular)\b", "id": "frontend", "name": "Angular", "type": "frontend", "tech": "Angular", "role": "Enterprise Web Client"},
        {"regex": r"\b(fastapi)\b", "id": "backend", "name": "FastAPI", "type": "backend", "tech": "FastAPI", "role": "Async Python API"},
        {"regex": r"\b(node(\.js|js)?|express(\.js|js)?)\b", "id": "backend", "name": "Node.js", "type": "backend", "tech": "Node.js / Express", "role": "Backend API Service"},
        {"regex": r"\b(django)\b", "id": "backend", "name": "Django", "type": "backend", "tech": "Django", "role": "Python Backend Framework"},
        {"regex": r"\b(flask)\b", "id": "backend", "name": "Flask", "type": "backend", "tech": "Flask", "role": "Lightweight Python API"},
        {"regex": r"\b(golang|go\s*backend)\b", "id": "backend", "name": "Go Backend", "type": "backend", "tech": "Go (Golang)", "role": "High-Performance Backend"},
        {"regex": r"\b(spring(\s*boot)?)\b", "id": "backend", "name": "Spring Boot", "type": "backend", "tech": "Java Spring Boot", "role": "Enterprise Microservice"},
        {"regex": r"\b(redis)\b", "id": "cache", "name": "Redis", "type": "cache", "tech": "Redis", "role": "In-Memory Cache & Session Store"},
        {"regex": r"\b(memcached)\b", "id": "cache", "name": "Memcached", "type": "cache", "tech": "Memcached", "role": "In-Memory Cache Store"},
        {"regex": r"\b(postgres|postgresql|psql)\b", "id": "database", "name": "PostgreSQL", "type": "database", "tech": "PostgreSQL", "role": "Relational ACID Database"},
        {"regex": r"\b(mysql)\b", "id": "database", "name": "MySQL", "type": "database", "tech": "MySQL", "role": "Relational Database"},
        {"regex": r"\b(mongodb|mongo)\b", "id": "database", "name": "MongoDB", "type": "database", "tech": "MongoDB", "role": "Document Database"},
        {"regex": r"\b(dynamodb)\b", "id": "database", "name": "DynamoDB", "type": "database", "tech": "Amazon DynamoDB", "role": "Serverless NoSQL Database"},
        {"regex": r"\b(kafka)\b", "id": "queue", "name": "Apache Kafka", "type": "queue", "tech": "Apache Kafka", "role": "Distributed Event Log"},
        {"regex": r"\b(rabbitmq)\b", "id": "queue", "name": "RabbitMQ", "type": "queue", "tech": "RabbitMQ", "role": "Message Broker"},
        {"regex": r"\b(api\s*gateway)\b", "id": "gateway", "name": "API Gateway", "type": "gateway", "tech": "API Gateway", "role": "API Management & Routing"},
        {"regex": r"\b(load\s*balancer|alb)\b", "id": "loadbalancer", "name": "Load Balancer", "type": "loadbalancer", "tech": "Application Load Balancer", "role": "Traffic Distribution"},
        {"regex": r"\b(cdn|cloudfront)\b", "id": "cdn", "name": "CDN", "type": "cdn", "tech": "CloudFront CDN", "role": "Edge Delivery Network"},
        {"regex": r"\b(s3|storage)\b", "id": "storage", "name": "Object Storage (S3)", "type": "storage", "tech": "Amazon S3", "role": "Object & File Storage"}
    ]

    for item in tech_defs:
        if re.search(item["regex"], text, re.IGNORECASE):
            cid = item["id"]
            if cid in seen_ids:
                cid = f"{cid}_{len(seen_ids)}"
            seen_ids.add(cid)
            components.append(
                Component(
                    id=cid,
                    name=item["name"],
                    type=item["type"],
                    role=item["role"],
                    technology=item["tech"],
                    purpose=f"Serves as the {item['role']} in this architecture.",
                    why_recommended=f"Explicitly specified in prompt: '{item['name']}'.",
                    alternatives="Configurable in Visual Editor.",
                    benefits=["User-selected technology", "Fits required stack preferences"],
                    disadvantages=[],
                    tier="standard"
                )
            )

    # If no components matched, provide fallback
    if not components:
        return _build_general_web_architecture({}, cloud_provider, text)

    # Infer topological connections
    connections = []
    comp_map = {c.type: c.id for c in components}

    if "cdn" in comp_map and "frontend" in comp_map:
        connections.append(Connection(from_id=comp_map["cdn"], to_id=comp_map["frontend"], label="Edge Delivery", protocol="HTTPS"))
    if "frontend" in comp_map:
        fe_id = comp_map["frontend"]
        if "gateway" in comp_map:
            connections.append(Connection(from_id=fe_id, to_id=comp_map["gateway"], label="API Calls", protocol="HTTPS"))
            if "backend" in comp_map:
                connections.append(Connection(from_id=comp_map["gateway"], to_id=comp_map["backend"], label="Routes", protocol="REST"))
        elif "loadbalancer" in comp_map:
            connections.append(Connection(from_id=fe_id, to_id=comp_map["loadbalancer"], label="HTTP Traffic", protocol="HTTPS"))
            if "backend" in comp_map:
                connections.append(Connection(from_id=comp_map["loadbalancer"], to_id=comp_map["backend"], label="Forward", protocol="HTTP"))
        elif "backend" in comp_map:
            connections.append(Connection(from_id=fe_id, to_id=comp_map["backend"], label="REST / JSON", protocol="HTTPS"))

    if "backend" in comp_map:
        be_id = comp_map["backend"]
        if "cache" in comp_map:
            connections.append(Connection(from_id=be_id, to_id=comp_map["cache"], label="Cache Reads/Writes", protocol="TCP"))
        if "database" in comp_map:
            connections.append(Connection(from_id=be_id, to_id=comp_map["database"], label="SQL Queries", protocol="SQL"))
        if "queue" in comp_map:
            connections.append(Connection(from_id=be_id, to_id=comp_map["queue"], label="Publish Messages", protocol="TCP"))
        if "storage" in comp_map:
            connections.append(Connection(from_id=be_id, to_id=comp_map["storage"], label="Stores Files", protocol="HTTPS"))

    return ArchitectureModel(
        project_name="Custom Architecture",
        description=f"Architecture generated from explicit specification: {text}",
        components=components,
        connections=connections,
        cloud_provider=cloud_provider
    )
