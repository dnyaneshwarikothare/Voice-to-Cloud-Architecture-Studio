"""
Architecture Scaling Engine
Generates an upgraded, production-grade 'Scaled Future Architecture' based on current architecture.
Adds Load Balancers, Multi-instance Clusters, Redis Caching, DB Read Replicas, Edge CDNs, and Queues.
Keeps original architecture intact for comparison.
"""

from typing import Dict, Any, List
from backend.models.architecture import ArchitectureModel, Component, Connection

def generate_scaled_architecture(arch: ArchitectureModel, target_users: int = 1000000) -> ArchitectureModel:
    """
    Transforms a baseline architecture into a high-scale, resilient future architecture.
    """
    comps = [Component.model_validate(c.model_dump()) for c in (arch.components or [])]
    conns = [Connection.model_validate(c.model_dump()) for c in (arch.connections or [])]

    types = {c.type for c in comps}
    comp_map = {c.id: c for c in comps}

    has_cdn = "cdn" in types
    has_lb = "loadbalancer" in types or "gateway" in types
    has_cache = "cache" in types
    has_db = "database" in types
    has_queue = "queue" in types
    frontends = [c for c in comps if c.type == "frontend"]
    backends = [c for c in comps if c.type in ["backend", "payment"]]
    databases = [c for c in comps if c.type == "database"]

    new_comps: List[Component] = []
    new_conns: List[Connection] = []

    # 1. Add Edge CDN if not present
    if not has_cdn and frontends:
        cdn_comp = Component(
            id="edge_cdn",
            name="CloudFront / Global CDN",
            type="cdn",
            role="Edge Content Delivery Network",
            technology="AWS CloudFront / Fastly",
            purpose="Caches static frontend bundles, images, and API edge responses globally.",
            why_recommended="Absorbs 80%+ of static asset traffic at edge point-of-presence (PoPs).",
            tier="standard"
        )
        new_comps.append(cdn_comp)
        new_conns.append(Connection(**{"from": "edge_cdn", "to": frontends[0].id, "protocol": "HTTPS", "label": "Origin Fetch"}))

    # 2. Add Load Balancer if not present and backends exist
    lb_id = "app_load_balancer"
    if not has_lb and backends:
        lb_comp = Component(
            id=lb_id,
            name="Application Load Balancer (ALB)",
            type="loadbalancer",
            role="Traffic Distribution / Reverse Proxy",
            technology="AWS ALB / NGINX Plus",
            purpose="Distributes incoming user API traffic across multiple backend worker instances with health checks.",
            why_recommended="Eliminates single point of failure; automatically routes around unhealthy instances.",
            tier="standard"
        )
        new_comps.append(lb_comp)

        # Rewire: frontends -> load balancer -> backends
        if frontends:
            new_conns.append(Connection(**{"from": frontends[0].id, "to": lb_id, "protocol": "HTTPS", "label": "API Traffic"}))
            # Remove direct frontend -> backend connections
            conns = [c for c in conns if not (c.from_id in {f.id for f in frontends} and c.to_id in {b.id for b in backends})]
        for be in backends:
            new_conns.append(Connection(**{"from": lb_id, "to": be.id, "protocol": "HTTP", "label": "Load Balanced"}))

    # 3. Upgrade backend to horizontal scaled cluster
    for be in backends:
        be.name = f"{be.name} (Auto-Scaling Cluster)"
        be.role = "Containerized Auto-Scaling Service"
        be.purpose = f"{be.purpose} Scaled horizontally across 3+ availability zones."
        be.tier = "large"
        if not be.benefits:
            be.benefits = []
        be.benefits.append("Automatic horizontal pod/task autoscaling based on CPU/Memory load")

    # 4. Add In-Memory Redis Cache if not present
    redis_id = "redis_cluster"
    if not has_cache and databases and backends:
        redis_comp = Component(
            id=redis_id,
            name="Redis In-Memory Cache Cluster",
            type="cache",
            role="Distributed In-Memory Cache",
            technology="Amazon ElastiCache Redis / Redis Enterprise",
            purpose="Caches query results, session states, and hot data with sub-millisecond latency.",
            why_recommended="Absorbs up to 90% of repeat database read queries to prevent DB saturation.",
            tier="medium"
        )
        new_comps.append(redis_comp)
        for be in backends:
            new_conns.append(Connection(**{"from": be.id, "to": redis_id, "protocol": "TCP", "label": "Cache Reads/Writes"}))

    # 5. Add Database Read Replica if database exists
    if databases:
        primary_db = databases[0]
        replica_id = f"{primary_db.id}_replica"
        if not any(c.id == replica_id for c in comps):
            replica_comp = Component(
                id=replica_id,
                name=f"{primary_db.name} (Read Replica)",
                type="database",
                role="Read-Only Database Replica",
                technology=f"{primary_db.technology or 'PostgreSQL'} Read Replica",
                purpose="Handles read-heavy analytics, queries, and search traffic asynchronously replicated from Primary DB.",
                why_recommended="Offloads 60-80% of query volume from primary database to preserve transactional throughput.",
                tier=primary_db.tier or "standard"
            )
            new_comps.append(replica_comp)
            new_conns.append(Connection(**{"from": primary_db.id, "to": replica_id, "protocol": "SQL", "label": "Async Replication"}))
            for be in backends:
                new_conns.append(Connection(**{"from": be.id, "to": replica_id, "protocol": "SQL", "label": "Read Queries"}))

    # 6. Add Message Queue for asynchronous background processing if not present
    if not has_queue and backends:
        queue_comp = Component(
            id="task_queue",
            name="Amazon SQS / Event Queue",
            type="queue",
            role="Asynchronous Message Broker",
            technology="Amazon SQS / RabbitMQ",
            purpose="Buffers burst traffic, webhooks, notifications, and async jobs to decouple compute.",
            why_recommended="Guarantees zero message loss during peak traffic spikes; isolates background workloads.",
            tier="standard"
        )
        new_comps.append(queue_comp)
        for be in backends:
            new_conns.append(Connection(**{"from": be.id, "to": "task_queue", "protocol": "HTTPS", "label": "Enqueue Tasks"}))

    # Combine all
    all_components = comps + new_comps
    all_connections = conns + new_conns

    # Deduplicate connections
    seen_conns = set()
    final_conns = []
    for c in all_connections:
        key = (c.from_id, c.to_id)
        if key not in seen_conns and c.from_id != c.to_id:
            seen_conns.add(key)
            final_conns.append(c)

    return ArchitectureModel(
        project_name=f"{arch.project_name} (Scaled Architecture)",
        description=f"Auto-scaled high-availability future architecture designed for {target_users:,} users/month.",
        cloud_provider=arch.cloud_provider,
        components=all_components,
        connections=final_conns
    )
