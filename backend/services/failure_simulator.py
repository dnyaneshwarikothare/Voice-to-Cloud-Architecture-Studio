"""
Failure Simulator Service
Simulates component outage scenarios (Database, Backend, Cache, Load Balancer, CDN, Payment),
computes failure blast radiuses and cascading impacts across the architecture graph,
and recommends resilience mitigations (Multi-AZ, Circuit Breakers, Retries, Queues).
"""

import sys
from pathlib import Path
from typing import List, Set, Dict, Any

_parent = Path(__file__).resolve().parent.parent
_root = _parent.parent
for _p in [str(_root), str(_parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.models.architecture import (
        ArchitectureModel,
        FailureSimulationRequest,
        FailureSimulationResponse,
    )
except (ImportError, ValueError):
    try:
        from models.architecture import (  # type: ignore
            ArchitectureModel,
            FailureSimulationRequest,
            FailureSimulationResponse,
        )
    except (ImportError, ValueError):
        from ..models.architecture import (  # type: ignore
            ArchitectureModel,
            FailureSimulationRequest,
            FailureSimulationResponse,
        )


def simulate_failure(request: FailureSimulationRequest) -> FailureSimulationResponse:
    arch = request.architecture
    components = arch.components or []
    connections = arch.connections or []

    target_type = (request.failure_target_type or "database").lower()
    target_id = request.failure_target_id

    comp_map = {c.id: c for c in components}
    type_map = {c.type: c.id for c in components}

    # Find the target component ID to fail
    failed_id = None
    if target_id and target_id in comp_map:
        failed_id = target_id
    elif target_type in type_map:
        failed_id = type_map[target_type]
    elif components:
        # Fallback to matching name
        for c in components:
            if target_type in c.name.lower() or target_type in c.type.lower():
                failed_id = c.id
                break
        if not failed_id:
            failed_id = components[0].id

    failed_component = comp_map.get(failed_id)
    failed_type = failed_component.type if failed_component else target_type
    failed_name = failed_component.name if failed_component else target_type.title()

    # Build reverse dependency graph: who calls the failed component?
    # If DB fails, backends that query it are affected.
    # If Backend fails, API Gateway or Frontend that routes to it is affected.
    callers: Dict[str, List[str]] = {c.id: [] for c in components}
    for conn in connections:
        if conn.to_id in callers and conn.from_id in comp_map:
            callers[conn.to_id].append(conn.from_id)

    cascaded_ids: Set[str] = set()

    # Determine cascading impact based on component failure mode
    if failed_type == "database":
        # Any backend service directly querying this DB loses transactional write ability
        direct_callers = callers.get(failed_id, [])
        for caller_id in direct_callers:
            cascaded_ids.add(caller_id)
        # Frontends calling those backends also experience 500 errors
        for b_id in list(cascaded_ids):
            for fe_id in callers.get(b_id, []):
                fe_comp = comp_map.get(fe_id)
                if fe_comp and fe_comp.type == "frontend":
                    cascaded_ids.add(fe_id)

        business_impact = (
            f"❌ Database Outage ({failed_name}): All stateful transactions (user logins, checkouts, and order saves) "
            "fail immediately with HTTP 500 Internal Server Errors. Read-only cached pages may remain partially accessible if a cache is present."
        )
        severity = "critical"
        mitigations = [
            "Enable Automated Multi-AZ Synchronous Database Replication with automatic health check failover (< 60s RTO).",
            "Implement Read Replicas across multiple availability zones to preserve read traffic if the primary writer fails.",
            "Add Circuit Breaker pattern (with exponential backoff and jitter) to prevent backend container connection pool exhaustion.",
            "Queue write operations temporarily in a durable message queue (SQS/RabbitMQ) for deferred playback once the DB recovers."
        ]

    elif failed_type in ["backend", "payment"]:
        # Direct callers of this backend fail
        direct_callers = callers.get(failed_id, [])
        for caller_id in direct_callers:
            cascaded_ids.add(caller_id)

        business_impact = (
            f"❌ Backend Service Failure ({failed_name}): Business logic endpoints handled by this service are unreachable. "
            "Clients receive HTTP 502 / 503 Bad Gateway errors."
        )
        severity = "high"
        mitigations = [
            "Configure horizontal container autoscaling with a minimum of 2 or 3 replica instances across availability zones.",
            "Deploy an Application Load Balancer with active health checks to automatically redirect traffic away from crashed container instances.",
            "Implement graceful degradation in the web client (show friendly retry screens instead of raw crash errors)."
        ]

    elif failed_type == "cache":
        # Cache failure does NOT necessarily crash backends, but creates a Cache Stampede / thundering herd on DB
        direct_callers = callers.get(failed_id, [])
        business_impact = (
            f"⚠️ Cache Store Outage ({failed_name}): Temporary data, active user carts, and session lookups miss in-memory cache. "
            "100% of read traffic suddenly waterfalls directly onto the relational database, risking a severe database overload or outage."
        )
        severity = "medium"
        mitigations = [
            "Deploy Redis in Multi-AZ Cluster mode with automatic primary-replica failover.",
            "Implement probabilistic cache early expiration or mutex locks to prevent the Thundering Herd / Cache Stampede problem.",
            "Ensure backend gracefully falls back to database queries without throwing unhandled exceptions if Redis connection drops."
        ]

    elif failed_type in ["loadbalancer", "gateway"]:
        # Everything upstream is severed
        for c in components:
            if c.id != failed_id and c.type in ["frontend", "cdn"]:
                cascaded_ids.add(c.id)

        business_impact = (
            f"❌ Perimeter Gateway / Load Balancer Outage ({failed_name}): All incoming external client API traffic is severed. "
            "Internal backend services remain operational but cannot receive any user requests."
        )
        severity = "critical"
        mitigations = [
            "Use cloud-managed, multi-AZ redundant load balancing infrastructure (AWS ALB / GCP Cloud Load Balancing).",
            "Configure DNS-level global failover (Route 53 latency/health check routing) across secondary standby regions."
        ]

    elif failed_type == "cdn":
        business_impact = (
            f"⚠️ Edge CDN Outage ({failed_name}): Global edge asset acceleration is disabled. "
            "All traffic falls back directly to the origin web servers, causing higher latency for global users and increased origin server CPU usage."
        )
        severity = "medium"
        mitigations = [
            "Configure multi-CDN failover strategy for critical enterprise web platforms.",
            "Ensure origin servers have adequate bandwidth capacity to temporarily absorb traffic if CDN fails."
        ]

    else:
        direct_callers = callers.get(failed_id, [])
        for cid in direct_callers:
            cascaded_ids.add(cid)
        business_impact = f"⚠️ Component Outage ({failed_name}): Downstream components dependent on this service will experience timeouts or connection resets."
        severity = "medium"
        mitigations = [
            "Implement timeout limits and circuit breakers on all inter-service communications.",
            "Deploy redundant service instances behind internal load balancers."
        ]

    operational_ids = [
        c.id for c in components
        if c.id != failed_id and c.id not in cascaded_ids
    ]

    return FailureSimulationResponse(
        failed_component_ids=[failed_id] if failed_id else [],
        cascaded_failed_component_ids=list(cascaded_ids),
        operational_component_ids=operational_ids,
        business_impact=business_impact,
        severity=severity,
        mitigation_strategies=mitigations,
        disclaimer="Scenario-based architectural failure simulation. Does not reflect live environment state."
    )
