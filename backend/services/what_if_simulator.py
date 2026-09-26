"""
Architecture What-If Simulator Service
Executes scenario-based simulations across traffic surges, outages, removals,
technology migrations, budget caps, and multi-year scaling.
"""

from typing import List, Dict, Any, Optional
import copy
import sys
from pathlib import Path

# Add backend directory to sys.path
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

try:
    from ..models.architecture import (
        ArchitectureModel,
        Component,
        Connection,
        WhatIfRequest,
        WhatIfResponse,
        WorkloadAssumptions
    )
    from .cost_estimator import estimate_costs
    from .traffic_simulator import simulate_traffic
    from .health_analyzer import analyze_health
    from .impact_analyzer import analyze_impact
except (ImportError, ValueError):
    from models.architecture import (
        ArchitectureModel,
        Component,
        Connection,
        WhatIfRequest,
        WhatIfResponse,
        WorkloadAssumptions
    )
    from services.cost_estimator import estimate_costs
    from services.traffic_simulator import simulate_traffic
    from services.health_analyzer import analyze_health
    from services.impact_analyzer import analyze_impact


def run_what_if_simulation(request: WhatIfRequest) -> WhatIfResponse:
    baseline_arch = request.architecture
    scenario_type = request.scenario_type
    scenario_name = request.scenario_name or "What-If Simulation"
    params = request.parameters or {}

    # 1. Baseline measurements
    base_assumptions = WorkloadAssumptions()
    base_cost = estimate_costs(baseline_arch, base_assumptions)
    base_health = analyze_health(baseline_arch)

    base_users = params.get("current_users", 10000)
    base_rps = max(10.0, float(params.get("current_rps", 100.0)))
    base_aws_cost = base_cost.aws.estimated_monthly_cost
    base_gcp_cost = base_cost.gcp.estimated_monthly_cost
    base_score = base_health.overall_score

    simulated_arch = copy.deepcopy(baseline_arch)
    affected_components: List[Dict[str, Any]] = []
    bottlenecks: List[Dict[str, Any]] = []
    failure_risks: List[Dict[str, Any]] = []
    recommendations: List[str] = []

    # Dynamic metrics to compute
    sim_users = base_users
    sim_rps = base_rps
    sim_aws_cost = base_aws_cost
    sim_gcp_cost = base_gcp_cost
    sim_score = base_score
    backend_load = 35.0
    db_load = 40.0
    cache_hit_rate = 85.0 if any(c.type == "cache" for c in baseline_arch.components) else 0.0

    # 2. Scenario Type Handlers
    if scenario_type == "traffic_increase":
        mult = float(params.get("multiplier", 10.0))
        sim_users = int(base_users * mult)
        sim_rps = base_rps * mult
        backend_load = min(100.0, 35.0 * (mult ** 0.65))
        db_load = min(100.0, (40.0 * (mult ** 0.75)) if cache_hit_rate > 0 else (40.0 * mult))
        sim_aws_cost = base_aws_cost * (1.0 + (mult - 1.0) * 0.45)
        sim_gcp_cost = base_gcp_cost * (1.0 + (mult - 1.0) * 0.42)

        if backend_load > 80.0:
            bottlenecks.append({
                "component": "Backend Compute Cluster",
                "severity": "HIGH",
                "metric": f"{backend_load:.1f}% CPU/Memory saturation",
                "explanation": "Compute capacity overwhelmed by incoming request volume."
            })
            recommendations.append("Enable Horizontal Pod Autoscaling (HPA) with multi-instance replica sets.")

        if db_load > 80.0:
            bottlenecks.append({
                "component": "Primary Database",
                "severity": "CRITICAL" if db_load > 95.0 else "HIGH",
                "metric": f"{db_load:.1f}% IOPS & Connection Pool usage",
                "explanation": "Database connection pool saturated under peak transaction concurrency."
            })
            recommendations.append("Deploy Redis cluster caching and read replicas to offload read-heavy queries.")

        affected_components = [
            {"id": c.id, "name": c.name, "role": c.role or c.type, "load_change": f"+{((mult-1)*100):.0f}% traffic"}
            for c in baseline_arch.components if c.type in ("backend", "database", "gateway", "cdn", "loadbalancer")
        ]

    elif scenario_type == "traffic_decrease":
        mult = float(params.get("multiplier", 0.5))
        sim_users = max(500, int(base_users * mult))
        sim_rps = max(5.0, base_rps * mult)
        backend_load = max(10.0, 35.0 * mult)
        db_load = max(10.0, 40.0 * mult)
        sim_aws_cost = max(40.0, base_aws_cost * (0.6 + 0.4 * mult))
        sim_gcp_cost = max(35.0, base_gcp_cost * (0.6 + 0.4 * mult))
        recommendations.append("Consider serverless auto-scaling or scale-to-zero compute to optimize costs during low traffic.")

    elif scenario_type == "component_failure":
        target_id = params.get("target_id")
        target_type = params.get("target_type", "database")
        target_comp = next((c for c in baseline_arch.components if c.id == target_id or c.type == target_type), None)
        target_name = target_comp.name if target_comp else target_type.title()

        failure_risks.append({
            "target": target_name,
            "type": "Single Point of Failure Outage",
            "blast_radius": "Cascades to dependent backend logic and client transactions.",
            "impact_rating": "CRITICAL" if target_type == "database" else "HIGH"
        })
        sim_score = max(20, base_score - 35)

        if target_type == "database":
            bottlenecks.append({
                "component": target_name,
                "severity": "CRITICAL",
                "metric": "100% Service Unavailability",
                "explanation": "Primary relational database instance down. Stateful writes failing."
            })
            recommendations.append("Configure Amazon Aurora / Cloud SQL High Availability with multi-AZ automatic failover.")
            recommendations.append("Add write-retry message queues (RabbitMQ/SQS) to prevent order data loss.")
        elif target_type in ("cache", "redis"):
            bottlenecks.append({
                "component": "Primary Database",
                "severity": "HIGH",
                "metric": "Cache miss avalanche",
                "explanation": "All read traffic falls through directly to the database."
            })
            recommendations.append("Implement circuit breakers and stale-while-revalidate caching strategies.")

        affected_components = [
            {"id": c.id, "name": c.name, "role": c.role or c.type, "status": "Outage Cascade"}
            for c in baseline_arch.components if c.type in ("backend", "database", "payment", "auth")
        ]

    elif scenario_type == "component_removal":
        target_id = params.get("target_id", "redis")
        target_comp = next((c for c in baseline_arch.components if target_id in c.id.lower() or target_id in c.name.lower() or c.type == "cache"), None)

        if target_comp:
            simulated_arch.components = [c for c in simulated_arch.components if c.id != target_comp.id]
            simulated_arch.connections = [c for c in simulated_arch.connections if c.from_id != target_comp.id and c.to_id != target_comp.id]
            sim_aws_cost = max(20.0, base_aws_cost - 35.0)
            sim_gcp_cost = max(18.0, base_gcp_cost - 30.0)

            if target_comp.type == "cache" or "redis" in target_comp.name.lower():
                db_load = 85.0
                cache_hit_rate = 0.0
                bottlenecks.append({
                    "component": "Database",
                    "severity": "HIGH",
                    "metric": "85% DB read utilization",
                    "explanation": "Without Redis cache buffer, read queries hit database directly."
                })
                recommendations.append("Monitor DB IOPS closely. If response times degrade, re-introduce Redis caching.")
            affected_components.append({"id": target_comp.id, "name": target_comp.name, "action": "Removed"})
        else:
            recommendations.append("Specify an existing component ID or category to simulate removal.")

    elif scenario_type == "component_addition":
        new_role = params.get("role", "cache")
        new_tech = params.get("technology", "Redis")
        new_id = f"{new_tech.lower()}_{len(simulated_arch.components)+1}"
        new_comp = Component(
            id=new_id,
            name=f"{new_tech} Cluster",
            type=new_role if new_role in ["cache", "queue", "cdn", "auth", "monitoring"] else "custom",
            technology=new_tech,
            role=f"Dedicated {new_tech} Service",
            purpose=f"Accelerates operations and reduces latency."
        )
        simulated_arch.components.append(new_comp)
        sim_aws_cost = base_aws_cost + 42.0
        sim_gcp_cost = base_gcp_cost + 38.0
        sim_score = min(100, base_score + 10)
        cache_hit_rate = 88.0
        db_load = 22.0
        recommendations.append(f"Successfully simulated addition of {new_comp.name}. Database load reduced to {db_load:.0f}%.")
        affected_components.append({"id": new_id, "name": new_comp.name, "action": "Added"})

    elif scenario_type == "technology_change":
        from_tech = params.get("from_tech", "Node.js")
        to_tech = params.get("to_tech", "Python/FastAPI")
        for c in simulated_arch.components:
            if from_tech.lower() in (c.technology or "").lower() or from_tech.lower() in c.name.lower():
                c.technology = to_tech
                c.name = c.name.replace(from_tech, to_tech)
                affected_components.append({"id": c.id, "name": c.name, "change": f"Migrated from {from_tech} to {to_tech}"})
        recommendations.append(f"Migrating to {to_tech} provides rich AI/ML ecosystem libraries and native async throughput.")
        recommendations.append("Ensure gunicorn/uvicorn ASGI workers are configured with appropriate CPU core worker scaling.")

    elif scenario_type == "budget_constraint":
        budget_val = float(params.get("budget", 100.0))  # Default USD $100 or user input
        currency = params.get("currency", "USD")
        current_cost = base_aws_cost if currency == "USD" else (base_aws_cost * 83.0)

        diff = current_cost - budget_val
        is_exceeded = diff > 0

        if is_exceeded:
            bottlenecks.append({
                "component": "Budget Cap",
                "severity": "CRITICAL",
                "metric": f"{currency} {diff:,.2f} over budget",
                "explanation": f"Current estimated monthly cost ({currency} {current_cost:,.2f}) exceeds target ({currency} {budget_val:,.2f})."
            })
            recommendations.append("1. Downsize primary database to burstable tier (e.g. db.t4g.medium).")
            recommendations.append("2. Implement scale-to-zero serverless compute (AWS Lambda / Cloud Run).")
            recommendations.append("3. Leverage Cloudflare / CloudFront free-tier CDN edge caching to cut bandwidth bills.")
            recommendations.append("4. Use single-AZ instances for non-production environments with automated daily snapshots.")
        else:
            recommendations.append(f"Architecture currently fits within {currency} {budget_val:,.2f} monthly budget. Surplus: {currency} {abs(diff):,.2f}.")

    elif scenario_type in ("user_growth", "storage_growth"):
        new_users = int(params.get("new_users", 1000000))
        sim_users = new_users
        ratio = max(1.0, new_users / max(1000, base_users))
        sim_rps = base_rps * (ratio ** 0.8)
        sim_aws_cost = base_aws_cost * (1.0 + (ratio - 1.0) * 0.38)
        sim_gcp_cost = base_gcp_cost * (1.0 + (ratio - 1.0) * 0.35)
        backend_load = min(100.0, 35.0 * (ratio ** 0.45))
        db_load = min(100.0, 40.0 * (ratio ** 0.55))

        if new_users >= 500000:
            bottlenecks.append({
                "component": "Database Storage & IOPS",
                "severity": "HIGH",
                "metric": f"{new_users:,} users scaling horizon",
                "explanation": "Table partitioning and read replicas required to prevent query degradation."
            })
            recommendations.append("Partition large tables by date/tenant and establish automated data archiving policies.")
            recommendations.append("Deploy multi-region CDN caching for static media and API response payloads.")

    else:  # Custom scenario
        recommendations.append("Custom scenario evaluated against current architectural graph topology.")
        recommendations.append("Maintain decoupling of services via event bus or message brokers.")

    # 3. Compile Responses
    baseline_summary = {
        "users": base_users,
        "rps": round(base_rps, 1),
        "aws_monthly_cost": round(base_aws_cost, 2),
        "gcp_monthly_cost": round(base_gcp_cost, 2),
        "health_score": base_score,
        "components_count": len(baseline_arch.components)
    }

    simulated_summary = {
        "users": sim_users,
        "rps": round(sim_rps, 1),
        "aws_monthly_cost": round(sim_aws_cost, 2),
        "gcp_monthly_cost": round(sim_gcp_cost, 2),
        "health_score": sim_score,
        "backend_load_pct": round(backend_load, 1),
        "database_load_pct": round(db_load, 1),
        "cache_hit_rate_pct": round(cache_hit_rate, 1),
        "components_count": len(simulated_arch.components)
    }

    cost_delta = round(sim_aws_cost - base_aws_cost, 2)
    cost_delta_pct = round(((sim_aws_cost - base_aws_cost) / max(1.0, base_aws_cost)) * 100.0, 1)

    delta = {
        "cost_delta_usd": cost_delta,
        "cost_delta_pct": cost_delta_pct,
        "rps_delta": round(sim_rps - base_rps, 1),
        "users_delta": sim_users - base_users,
        "health_score_delta": sim_score - base_score
    }

    traffic_impact = {
        "projected_rps": round(sim_rps, 1),
        "peak_rps": round(sim_rps * 2.5, 1),
        "bandwidth_gb": round(sim_rps * 0.05 * 30 * 24 * 3.6, 1),
        "status": "CRITICAL" if backend_load > 85 or db_load > 85 else ("HIGH LOAD" if backend_load > 65 or db_load > 65 else "NORMAL")
    }

    performance_impact = {
        "backend_load_pct": round(backend_load, 1),
        "database_load_pct": round(db_load, 1),
        "cache_hit_rate_pct": round(cache_hit_rate, 1),
        "avg_latency_ms": round(45.0 + (backend_load * 1.5) + (db_load * 0.8), 1)
    }

    cost_impact = {
        "baseline_aws_cost": round(base_aws_cost, 2),
        "simulated_aws_cost": round(sim_aws_cost, 2),
        "simulated_gcp_cost": round(sim_gcp_cost, 2),
        "monthly_delta_usd": cost_delta,
        "cheaper_provider": "GCP" if sim_gcp_cost < sim_aws_cost else "AWS"
    }

    return WhatIfResponse(
        scenario_name=scenario_name,
        scenario_type=scenario_type,
        baseline_summary=baseline_summary,
        simulated_summary=simulated_summary,
        delta=delta,
        traffic_impact=traffic_impact,
        performance_impact=performance_impact,
        cost_impact=cost_impact,
        affected_components=affected_components,
        bottlenecks=bottlenecks,
        failure_risks=failure_risks,
        recommendations=recommendations,
        simulated_architecture=simulated_arch,
        disclaimer="Scenario-based simulation. Not an exact production prediction."
    )
