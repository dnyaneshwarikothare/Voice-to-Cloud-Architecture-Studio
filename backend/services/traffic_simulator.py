"""
Future Traffic Simulator and Bottleneck Detector Service
Simulates future traffic growth scenarios, calculates component load saturations,
and detects architectural bottlenecks under peak load.
"""

import sys
from pathlib import Path
from typing import List, Dict, Any

_parent = Path(__file__).resolve().parent.parent
_root = _parent.parent
for _p in [str(_root), str(_parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.models.architecture import (
        ArchitectureModel,
        TrafficSimulationRequest,
        TrafficSimulationResponse,
    )
except (ImportError, ValueError):
    try:
        from models.architecture import (  # type: ignore
            ArchitectureModel,
            TrafficSimulationRequest,
            TrafficSimulationResponse,
        )
    except (ImportError, ValueError):
        from ..models.architecture import (  # type: ignore
            ArchitectureModel,
            TrafficSimulationRequest,
            TrafficSimulationResponse,
        )


def simulate_traffic(request: TrafficSimulationRequest) -> TrafficSimulationResponse:
    arch = request.architecture
    components = arch.components or []
    current_users = max(100, request.current_users)
    future_users = max(current_users, request.future_users)
    base_rps = max(1.0, request.requests_per_second)
    peak_mult = max(1.0, request.peak_multiplier)
    avg_size_kb = max(1.0, request.avg_request_size_kb)

    # Calculate user scaling multiplier
    user_ratio = future_users / current_users
    projected_base_rps = base_rps * user_ratio
    projected_peak_rps = projected_base_rps * peak_mult

    # Monthly requests: projected_base_rps * 86400 * 30
    projected_monthly_reqs = int(projected_base_rps * 86400 * 30)

    # Network bandwidth in GB per month: (monthly_reqs * avg_size_kb) / (1024 * 1024)
    projected_network_gb = round((projected_monthly_reqs * avg_size_kb) / (1024 * 1024), 2)

    # Component characteristics
    types = {c.type for c in components}
    has_cache = "cache" in types
    has_cdn = "cdn" in types
    has_lb = "loadbalancer" in types or "gateway" in types
    backends = [c for c in components if c.type in ["backend", "payment"]]
    databases = [c for c in components if c.type == "database"]

    backend_instance_count = len(backends) if backends else 1

    # Capacity benchmarks:
    # A single standard container instance handles ~250 RPS comfortable, 500 RPS max
    instance_capacity_rps = 350.0 * backend_instance_count
    backend_load_pct = min(150.0, round((projected_peak_rps / instance_capacity_rps) * 100, 1))

    # Database capacity:
    # If cache exists, ~85% of reads are absorbed.
    # Otherwise 100% of queries hit DB.
    cache_hit_rate = 85.0 if has_cache else 0.0
    db_effective_rps = projected_peak_rps * (0.15 if has_cache else 1.0)
    db_capacity_rps = 400.0  # standard medium DB handle ~400 QPS
    database_load_pct = min(180.0, round((db_effective_rps / db_capacity_rps) * 100, 1))

    # Storage growth projection: ~1.5 MB per active user per year
    projected_storage_gb = round(20.0 + (future_users * 0.0015), 1)

    # Bottleneck detection
    bottlenecks: List[Dict[str, Any]] = []
    recommendations: List[str] = []

    # 1. Check Database Saturation
    if database_load_pct > 100.0:
        db_name = databases[0].name if databases else "Relational Database"
        bottlenecks.append({
            "component": db_name,
            "severity": "critical",
            "issue": f"Database CPU/IOPS saturation at {database_load_pct}% under peak traffic ({projected_peak_rps:.0f} peak RPS).",
            "recommendation": "Deploy an in-memory Redis cache to offload read queries, or configure read replicas with connection pooling."
        })
        recommendations.append("Add Redis in-memory cache to absorb 85%+ of repetitive database queries.")
        recommendations.append("Configure database read replicas to distribute query traffic across instances.")
    elif database_load_pct > 75.0:
        db_name = databases[0].name if databases else "Relational Database"
        bottlenecks.append({
            "component": db_name,
            "severity": "high",
            "issue": f"High database load ({database_load_pct}%) during traffic spikes.",
            "recommendation": "Implement query indexing, connection pooling (PgBouncer), and consider query result caching."
        })

    # 2. Check Backend Compute Saturation
    if backend_load_pct > 100.0:
        bottlenecks.append({
            "component": "Backend Compute Cluster",
            "severity": "critical" if backend_load_pct > 120 else "high",
            "issue": f"Backend instances saturated at {backend_load_pct}% capacity under {projected_peak_rps:.0f} peak RPS.",
            "recommendation": f"Configure horizontal autoscaling policy (scale to at least {max(3, int(projected_peak_rps / 250) + 1)} instances) behind a Load Balancer."
        })
        recommendations.append(f"Scale backend tier horizontally to at least {max(2, int(projected_peak_rps / 250) + 1)} container instances.")
    elif backend_load_pct > 75.0:
        bottlenecks.append({
            "component": "Backend Service",
            "severity": "medium",
            "issue": f"Backend load reaches {backend_load_pct}% during peak hours.",
            "recommendation": "Configure automated horizontal container autoscaling based on CPU/Memory thresholds."
        })

    # 3. Check Single Point of Failure (SPOF)
    if len(backends) <= 1 and not has_lb:
        bottlenecks.append({
            "component": "Backend Instance",
            "severity": "high",
            "issue": "Single backend instance represents a Single Point of Failure (SPOF) under high concurrency.",
            "recommendation": "Deploy multiple instances behind an Application Load Balancer across multi-AZ availability zones."
        })
        recommendations.append("Place multiple backend instances behind a Load Balancer.")

    # 4. Check Missing CDN
    if not has_cdn and projected_network_gb > 250:
        bottlenecks.append({
            "component": "Network Bandwidth",
            "severity": "medium",
            "issue": f"High egress bandwidth ({projected_network_gb} GB/month) served directly by origin servers.",
            "recommendation": "Deploy CloudFront / Cloud CDN at the edge to reduce latency and origin bandwidth costs."
        })
        recommendations.append("Introduce Edge CDN caching for static assets.")

    # Determine overall status
    max_load = max(backend_load_pct, database_load_pct)
    if max_load >= 100.0 or any(b["severity"] == "critical" for b in bottlenecks):
        status = "CRITICAL"
    elif max_load >= 70.0 or any(b["severity"] in ["high", "medium"] for b in bottlenecks):
        status = "HIGH LOAD"
    else:
        status = "NORMAL"

    if not recommendations:
        recommendations.append("Current architecture is well-dimensioned for this projected workload scenario.")

    return TrafficSimulationResponse(
        status=status,
        projected_rps_peak=round(projected_peak_rps, 1),
        projected_monthly_requests=projected_monthly_reqs,
        backend_load_pct=backend_load_pct,
        database_load_pct=database_load_pct,
        cache_hit_rate_pct=cache_hit_rate,
        storage_projected_gb=projected_storage_gb,
        network_bandwidth_gb=projected_network_gb,
        bottlenecks=bottlenecks,
        recommendations=recommendations,
        disclaimer="Scenario-based estimate. Actual traffic patterns vary with real-world user behavior."
    )
