"""
Multi-Architecture Comparison Service
Factual, objective side-by-side architectural comparison across cost, scalability,
availability, performance, complexity, dependencies, bottlenecks, and security.
Does NOT declare an arbitrary 'winner', empowering users with clear trade-offs.
"""

from typing import List, Dict, Any
import sys
from pathlib import Path

# Add backend directory to sys.path
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

try:
    from ..models.architecture import (
        ArchitectureModel,
        ArchitectureMetricComparison,
        ArchitectureComparisonRequest,
        ArchitectureComparisonResponse,
        WorkloadAssumptions
    )
    from .cost_estimator import estimate_costs
    from .health_analyzer import analyze_health
except (ImportError, ValueError):
    from models.architecture import (
        ArchitectureModel,
        ArchitectureMetricComparison,
        ArchitectureComparisonRequest,
        ArchitectureComparisonResponse,
        WorkloadAssumptions
    )
    from services.cost_estimator import estimate_costs
    from services.health_analyzer import analyze_health


def compare_architectures(request: ArchitectureComparisonRequest) -> ArchitectureComparisonResponse:
    archs = request.architectures or []
    if not archs:
        return ArchitectureComparisonResponse(
            summary="No architectures provided for comparison.",
            metrics=[],
            profiles=[],
            trade_off_analysis={},
            disclaimer="Objective multi-metric comparison. Final architectural selection depends on business constraints and SLA priorities."
        )

    profiles = []
    costs = {}
    healths = {}

    for idx, arch in enumerate(archs):
        key = f"arch_{idx+1}"
        title = arch.project_name or f"Architecture {chr(65 + idx)}"
        cost = estimate_costs(arch, WorkloadAssumptions())
        health = analyze_health(arch)

        costs[key] = cost
        healths[key] = health

        has_cache = any(c.type == "cache" for c in arch.components)
        has_cdn = any(c.type == "cdn" for c in arch.components)
        has_lb = any(c.type in ("loadbalancer", "gateway") for c in arch.components)
        has_mq = any(c.type == "queue" for c in arch.components)

        profiles.append({
            "key": key,
            "title": title,
            "components_count": len(arch.components),
            "connections_count": len(arch.connections),
            "has_cache": has_cache,
            "has_cdn": has_cdn,
            "has_lb": has_lb,
            "has_mq": has_mq,
            "aws_cost": cost.aws.estimated_monthly_cost,
            "gcp_cost": cost.gcp.estimated_monthly_cost,
            "health_score": health.overall_score
        })

    # Build Comparison Metric Rows
    metrics: List[ArchitectureMetricComparison] = [
        ArchitectureMetricComparison(
            metric="Estimated Monthly Cost (AWS)",
            category="Cost",
            arch_values={p["key"]: f"${costs[p['key']].aws.estimated_monthly_cost:,.2f}/mo" for p in profiles},
            description="Baseline AWS monthly compute, database, cache, and bandwidth estimate."
        ),
        ArchitectureMetricComparison(
            metric="Estimated Monthly Cost (GCP)",
            category="Cost",
            arch_values={p["key"]: f"${costs[p['key']].gcp.estimated_monthly_cost:,.2f}/mo" for p in profiles},
            description="Baseline Google Cloud monthly infrastructure estimate."
        ),
        ArchitectureMetricComparison(
            metric="Scalability Capacity",
            category="Scalability",
            arch_values={
                p["key"]: (
                    "Enterprise (>1,000,000 users)" if p["has_cache"] and p["has_cdn"] and p["has_lb"]
                    else ("Moderate (~100,000 users)" if p["has_lb"] or p["has_cache"]
                    else "Lean MVP (~10,000 users)")
                ) for p in profiles
            },
            description="Anticipated concurrent user scaling ceiling before re-architecture."
        ),
        ArchitectureMetricComparison(
            metric="High Availability SLA",
            category="Availability",
            arch_values={
                p["key"]: (
                    "99.99% (Multi-AZ Clustered)" if p["has_lb"] and p["components_count"] >= 6
                    else ("99.9% (Standard Redundant)" if p["has_lb"]
                    else "99.0% (Single Point of Failure risks)")
                ) for p in profiles
            },
            description="Resilience against localized datacenter outages and service interruptions."
        ),
        ArchitectureMetricComparison(
            metric="Architecture Complexity",
            category="Operations",
            arch_values={
                p["key"]: (
                    "High (Distributed Microservices)" if p["components_count"] >= 8
                    else ("Moderate (Multi-tier Modular)" if p["components_count"] >= 4
                    else "Low (Simple Monolith/BFF)")
                ) for p in profiles
            },
            description="Operational maintenance overhead, CI/CD pipeline complexity, and observability footprint."
        ),
        ArchitectureMetricComparison(
            metric="Component Count",
            category="Topology",
            arch_values={p["key"]: p["components_count"] for p in profiles},
            description="Total number of dedicated architecture nodes."
        ),
        ArchitectureMetricComparison(
            metric="Dependencies Count",
            category="Topology",
            arch_values={p["key"]: p["connections_count"] for p in profiles},
            description="Network interconnects and direct service communication links."
        ),
        ArchitectureMetricComparison(
            metric="Potential Bottlenecks",
            category="Performance",
            arch_values={
                p["key"]: (
                    "Distributed network latency between microservices" if p["has_cache"] and p["has_cdn"]
                    else ("Primary database connection saturation under peak load" if not p["has_cache"]
                    else "Single entrypoint gateway throughput")
                ) for p in profiles
            },
            description="Anticipated system saturation point during unexpected traffic spikes."
        ),
        ArchitectureMetricComparison(
            metric="Security & Attack Surface",
            category="Security",
            arch_values={
                p["key"]: (
                    "Hardened: Gateway rate-limiting, private subnets, perimeter WAF" if p["has_lb"] and p["components_count"] >= 5
                    else "Standard: Basic token authentication and TLS termination"
                ) for p in profiles
            },
            description="Perimeter security, identity validation, and network isolation."
        )
    ]

    # Generate Objective Trade-off Analysis
    trade_off_analysis = {}
    for p in profiles:
        k = p["key"]
        t = p["title"]
        if p["aws_cost"] < 150:
            trade_off_analysis[k] = (
                f"{t}: Best suited for early-stage validation and lean MVPs. Minimizes initial cloud expenditure "
                f"(${p['aws_cost']:.0f}/mo), but lacks dedicated caching and automated multi-AZ failover."
            )
        elif p["aws_cost"] < 400:
            trade_off_analysis[k] = (
                f"{t}: Balanced production profile. Provides reliable automated failover, caching, and load balancing "
                f"at a predictable monthly budget (${p['aws_cost']:.0f}/mo) without enterprise over-engineering."
            )
        else:
            trade_off_analysis[k] = (
                f"{t}: Enterprise high-scale profile. Engineered for high concurrency, global edge delivery, and "
                f"zero-downtime tolerance. Higher monthly run rate (${p['aws_cost']:.0f}/mo) justified for mission-critical apps."
            )

    summary = (
        f"Compared {len(profiles)} candidate architectures across 9 operational dimensions. "
        f"Review trade-offs between monthly expenditure, operational complexity, and scaling limits."
    )

    return ArchitectureComparisonResponse(
        summary=summary,
        metrics=metrics,
        profiles=profiles,
        trade_off_analysis=trade_off_analysis,
        disclaimer="Objective multi-metric comparison. Final architectural selection depends on business constraints and SLA priorities."
    )
