"""
Architecture Optimizer and Trade-off Engine
Generates actionable architectural improvements with problem, reason, expected benefit, trade-offs, and cost impact.
Provides Cost vs Performance trade-off profiles (Low Cost, Balanced, High Scalability).
"""

import sys
from pathlib import Path
from typing import List, Dict, Any
from copy import deepcopy

_parent = Path(__file__).resolve().parent.parent
_root = _parent.parent
for _p in [str(_root), str(_parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.models.architecture import ArchitectureModel, Component, Connection
except (ImportError, ValueError):
    try:
        from models.architecture import ArchitectureModel, Component, Connection  # type: ignore
    except (ImportError, ValueError):
        from ..models.architecture import ArchitectureModel, Component, Connection  # type: ignore


def get_optimizations(arch: ArchitectureModel) -> List[Dict[str, Any]]:
    components = arch.components or []
    connections = arch.connections or []
    types = {c.type for c in components}
    comp_map = {c.id: c for c in components}

    backends = [c for c in components if c.type in ["backend", "payment"]]
    frontends = [c for c in components if c.type == "frontend"]
    databases = [c for c in components if c.type == "database"]

    opts = []

    # 1. Recommendation: Add Redis Cache
    if "cache" not in types and databases:
        opt_arch = deepcopy(arch)
        cache_comp = Component(
            id="redis_cache",
            name="Redis Cache",
            type="cache",
            role="In-Memory Cache & Session Store",
            technology="Redis",
            purpose="Caches frequently accessed queries and user sessions.",
            why_recommended="Reduces repeated database reads by up to 85% and provides sub-millisecond responses.",
            tier="cache-small"
        )
        opt_arch.components.append(cache_comp)
        if backends:
            opt_arch.connections.append(Connection(from_id=backends[0].id, to_id="redis_cache", label="Cache Reads/Writes", protocol="TCP"))

        opts.append({
            "id": "opt_add_cache",
            "category": "Performance & Scalability",
            "title": "Introduce In-Memory Redis Cache",
            "problem": "All read requests hit the relational database directly, causing query latency and potential DB connection exhaustion during traffic surges.",
            "reason": "80-90% of web application requests are repetitive reads (user profiles, catalog items, sessions) that rarely change second-by-second.",
            "recommendation": "Deploy an in-memory Redis cache between backend services and the database.",
            "expected_benefit": "Sub-millisecond data reads and an 80%+ reduction in database CPU and I/O load.",
            "trade_off": "Requires implementing cache invalidation logic upon data writes; adds ~$15-30/mo in infrastructure cost.",
            "cost_impact": "+$15 to $30 / month",
            "target_architecture": opt_arch.model_dump()
        })

    # 2. Recommendation: Add CDN
    if "cdn" not in types and frontends:
        opt_arch = deepcopy(arch)
        cdn_comp = Component(
            id="cdn",
            name="CloudFront CDN",
            type="cdn",
            role="Global Edge Delivery Network",
            technology="Amazon CloudFront / Cloud CDN",
            purpose="Caches static frontend bundles, images, and media assets at global edge locations.",
            why_recommended="Delivers static files with sub-50ms latency globally and offloads bandwidth from origin servers.",
            tier="standard"
        )
        opt_arch.components.insert(0, cdn_comp)
        opt_arch.connections.append(Connection(from_id="cdn", to_id=frontends[0].id, label="Edge Delivery", protocol="HTTPS"))

        opts.append({
            "id": "opt_add_cdn",
            "category": "Performance & Cost",
            "title": "Add Global Edge Content Delivery Network (CDN)",
            "problem": "Static web client assets and images are delivered directly by origin servers, creating global latency and unnecessary compute load.",
            "reason": "Users located geographically far from the primary cloud data center experience slow initial page loads.",
            "recommendation": "Introduce a Content Delivery Network (CloudFront/Cloud CDN) to cache static assets close to end users.",
            "expected_benefit": "50-70% faster page loads for global users; 80% decrease in origin compute bandwidth consumption.",
            "trade_off": "Small edge egress fee; cache invalidation required on new frontend releases.",
            "cost_impact": "+$3 to $10 / month (frequently offset by compute bandwidth savings)",
            "target_architecture": opt_arch.model_dump()
        })

    # 3. Recommendation: Add Load Balancer
    has_lb_or_gw = "loadbalancer" in types or "gateway" in types
    if len(backends) >= 1 and not has_lb_or_gw:
        opt_arch = deepcopy(arch)
        lb_comp = Component(
            id="load_balancer",
            name="Application Load Balancer",
            type="loadbalancer",
            role="Traffic Distribution & SSL Termination",
            technology="AWS ALB / GCP Cloud Load Balancing",
            purpose="Evenly distributes incoming HTTP/HTTPS traffic across multiple backend container instances.",
            why_recommended="Eliminates the backend Single Point of Failure (SPOF) and enables automated horizontal autoscaling.",
            tier="standard"
        )
        opt_arch.components.insert(1 if frontends else 0, lb_comp)

        # Rewire: frontend -> LB -> backend
        new_conns = []
        for conn in opt_arch.connections:
            if frontends and conn.from_id == frontends[0].id and backends and conn.to_id == backends[0].id:
                new_conns.append(Connection(from_id=frontends[0].id, to_id="load_balancer", label="HTTPS Traffic", protocol="HTTPS"))
                new_conns.append(Connection(from_id="load_balancer", to_id=backends[0].id, label="Forward HTTP", protocol="HTTP"))
            else:
                new_conns.append(conn)
        opt_arch.connections = new_conns

        opts.append({
            "id": "opt_add_loadbalancer",
            "category": "Availability & Resilience",
            "title": "Deploy Application Load Balancer for High Availability",
            "problem": "A single backend instance creates a critical Single Point of Failure (SPOF) and cannot scale horizontally across availability zones.",
            "reason": "If the single backend server experiences hardware failure, memory leak, or traffic spike, the entire application becomes unreachable.",
            "recommendation": "Introduce a managed Load Balancer in front of backend container instances.",
            "expected_benefit": "Zero downtime rolling updates, automated health check failovers, and seamless horizontal autoscaling.",
            "trade_off": "Adds ~$20/mo baseline load balancer infrastructure cost.",
            "cost_impact": "+$20 to $25 / month",
            "target_architecture": opt_arch.model_dump()
        })

    # 4. Recommendation: Add Asynchronous Message Queue
    if "queue" not in types and len(backends) >= 2:
        opt_arch = deepcopy(arch)
        q_comp = Component(
            id="message_queue",
            name="Message Queue (RabbitMQ / SQS)",
            type="queue",
            role="Asynchronous Event Buffer",
            technology="RabbitMQ / AWS SQS",
            purpose="Buffers background tasks (email, payments, reports, notifications) asynchronously.",
            why_recommended="Prevents slow background operations from delaying user HTTP response times.",
            tier="standard"
        )
        opt_arch.components.append(q_comp)
        opt_arch.connections.append(Connection(from_id=backends[0].id, to_id="message_queue", label="Publish Async Events", protocol="TCP"))
        if len(backends) > 1:
            opt_arch.connections.append(Connection(from_id="message_queue", to_id=backends[1].id, label="Consume Tasks", protocol="TCP"))

        opts.append({
            "id": "opt_add_queue",
            "category": "Scalability & Resilience",
            "title": "Decouple Microservices with an Asynchronous Message Queue",
            "problem": "Services communicate synchronously; a slow downstream service directly blocks and degrades upstream user response times.",
            "reason": "Heavy operations such as email dispatch, receipt generation, and report processing should not block HTTP request threads.",
            "recommendation": "Introduce an asynchronous message broker (RabbitMQ or SQS) to decouple background job processing.",
            "expected_benefit": "Instant user perceived response times (<100ms) and guaranteed job delivery without dropping requests during traffic spikes.",
            "trade_off": "Requires implementing message idempotency and dead-letter queue monitoring.",
            "cost_impact": "+$2 to $15 / month",
            "target_architecture": opt_arch.model_dump()
        })

    return opts


def get_tradeoff_profiles(arch: ArchitectureModel) -> Dict[str, Any]:
    """
    Computes three concrete architectural options:
    Option A: Low Cost / Startup
    Option B: Balanced / Production Standard
    Option C: High Scalability / Enterprise Multi-AZ
    """
    return {
        "option_a_low_cost": {
            "name": "Option A: Lean & Low Cost",
            "summary": "Optimized for minimal monthly expenditure, early prototypes, and MVP validation.",
            "estimated_cost_range": "$15 - $45 / month",
            "scalability_rating": "Moderate (< 10,000 active users)",
            "availability_sla": "99.0% (Single Availability Zone)",
            "complexity": "Low (Easy to manage and deploy)",
            "key_features": [
                "Single shared container instance (e.g. AWS App Runner or GCP Cloud Run)",
                "Single-AZ database without multi-region read replicas",
                "Built-in in-memory application caching",
                "Serverless on-demand scale-to-zero when idle"
            ]
        },
        "option_b_balanced": {
            "name": "Option B: Balanced Production (Recommended)",
            "summary": "Industry standard architecture balancing high reliability, predictable cost, and linear scaling.",
            "estimated_cost_range": "$95 - $220 / month",
            "scalability_rating": "High (10,000 - 150,000 active users)",
            "availability_sla": "99.9% (Multi-AZ failover)",
            "complexity": "Medium (Automated cloud managed services)",
            "key_features": [
                "Application Load Balancer across 2+ availability zones",
                "Managed Redis Cache offloading 85%+ database reads",
                "Managed PostgreSQL with automated daily snapshots",
                "Edge CDN caching frontend bundles and media files"
            ]
        },
        "option_c_high_scalability": {
            "name": "Option C: Enterprise High Scalability",
            "summary": "Mission-critical enterprise topology with zero single-points-of-failure, event streaming, and multi-region resilience.",
            "estimated_cost_range": "$380 - $950+ / month",
            "scalability_rating": "Massive (500,000+ active users, high burst)",
            "availability_sla": "99.99% (Multi-Region / Five-Nines)",
            "complexity": "High (Microservice mesh, Kafka streaming, Terraform IaC)",
            "key_features": [
                "Multi-AZ synchronous database clustering with read replicas",
                "Distributed Redis Cluster with auto-sharding",
                "Apache Kafka / RabbitMQ event-driven streaming backbone",
                "WAF, DDoS Shield Advanced, and automated horizontal auto-scaling"
            ]
        }
    }
