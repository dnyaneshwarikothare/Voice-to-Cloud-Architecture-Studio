"""
Architecture Growth Simulator Service
Generates monthly growth timeline estimates covering user scale, throughput,
compute/db saturation, storage accumulation, and cloud costs.
"""

from typing import List, Dict, Any
import math
import sys
from pathlib import Path

# Add backend directory to sys.path
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

try:
    from ..models.architecture import (
        ArchitectureModel,
        GrowthPeriodEstimate,
        GrowthSimulationRequest,
        GrowthSimulationResponse,
        WorkloadAssumptions
    )
    from .cost_estimator import estimate_costs
except (ImportError, ValueError):
    from models.architecture import (
        ArchitectureModel,
        GrowthPeriodEstimate,
        GrowthSimulationRequest,
        GrowthSimulationResponse,
        WorkloadAssumptions
    )
    from services.cost_estimator import estimate_costs


def simulate_growth(request: GrowthSimulationRequest) -> GrowthSimulationResponse:
    arch = request.architecture
    current_users = max(500, request.current_users)
    rate = max(1.0, request.monthly_growth_rate_pct) / 100.0
    duration = min(36, max(3, request.duration_months))
    avg_size_kb = max(1.0, request.avg_request_size_kb)

    has_cache = any(c.type == "cache" or "redis" in c.name.lower() for c in arch.components)
    has_cdn = any(c.type == "cdn" or "cdn" in c.name.lower() for c in arch.components)
    has_lb = any(c.type in ("loadbalancer", "gateway") for c in arch.components)

    base_cost_obj = estimate_costs(arch, WorkloadAssumptions())
    base_monthly_cost = base_cost_obj.aws.estimated_monthly_cost

    timeline: List[GrowthPeriodEstimate] = []
    milestone_bottlenecks: List[Dict[str, Any]] = []

    # Sample months: Month 1, Month 2, Month 3, and then quarterly up to duration
    months_to_sample = set([1])
    for m in range(2, duration + 1):
        if m <= 3 or m % 3 == 0 or m == duration:
            months_to_sample.add(m)
    sorted_months = sorted(list(months_to_sample))

    base_storage_gb = 50.0

    for m in sorted_months:
        scale_factor = (1.0 + rate) ** (m - 1)
        users = int(current_users * scale_factor)

        # 1 user generates roughly 20 requests per day => ~0.23 requests per sec per 1,000 users
        rps = max(10.0, users * 0.002)

        # Sizing loads
        backend_load_factor = 25.0 * (scale_factor ** 0.55)
        if not has_lb:
            backend_load_factor *= 1.3
        backend_load = min(100.0, backend_load_factor)

        db_load_factor = 30.0 * (scale_factor ** 0.60)
        if has_cache:
            db_load_factor *= 0.45
        db_load = min(100.0, db_load_factor)

        storage = base_storage_gb + (users * 0.0015 * m)
        bandwidth_gb = (rps * avg_size_kb * 3600 * 24 * 30) / (1024.0 * 1024.0)
        if has_cdn:
            bandwidth_gb *= 0.35  # 65% offloaded by CDN edge

        # Estimated cost scale
        cost_scale = 1.0 + (scale_factor - 1.0) * 0.38
        est_cost = base_monthly_cost * cost_scale

        # Status and bottleneck note
        status = "NORMAL"
        note = "Architecture running within comfortable operating thresholds."

        if backend_load > 85.0 or db_load > 85.0:
            status = "CRITICAL"
            if db_load > 85.0:
                note = f"Database saturation risk at {users:,} users. Read replicas and caching required."
                milestone_bottlenecks.append({
                    "month": m,
                    "users": users,
                    "component": "Database",
                    "issue": "High IOPS & connection concurrency limit"
                })
            else:
                note = f"Backend compute clusters maxing out. Horizontal scaling policy required."
                milestone_bottlenecks.append({
                    "month": m,
                    "users": users,
                    "component": "Compute Cluster",
                    "issue": "CPU/Memory resource exhaustion"
                })
        elif backend_load > 60.0 or db_load > 60.0:
            status = "HIGH LOAD"
            note = f"Approaching scaling horizon at {users:,} users. Monitor query response times."

        timeline.append(GrowthPeriodEstimate(
            period_month=m,
            label=f"Month {m}",
            projected_users=users,
            requests_per_sec=round(rps, 1),
            backend_load_pct=round(backend_load, 1),
            database_load_pct=round(db_load, 1),
            storage_gb=round(storage, 1),
            bandwidth_gb=round(bandwidth_gb, 1),
            estimated_monthly_cost=round(est_cost, 2),
            status=status,
            bottleneck_note=note
        ))

    summary = (
        f"Simulated {duration}-month growth trajectory from {current_users:,} to "
        f"{timeline[-1].projected_users:,} users at {request.monthly_growth_rate_pct:.0f}% monthly growth. "
        f"Final estimated monthly run rate: ${timeline[-1].estimated_monthly_cost:,.2f}/mo."
    )

    return GrowthSimulationResponse(
        timeline=timeline,
        summary=summary,
        milestone_bottlenecks=milestone_bottlenecks,
        disclaimer="This is a scenario-based estimate using the provided assumptions. Not a guaranteed future prediction."
    )
