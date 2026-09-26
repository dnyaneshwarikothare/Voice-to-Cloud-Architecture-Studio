"""
Architecture Health and Security Analyzer
Evaluates Security, Availability, Scalability, Performance, Reliability, and Cost Efficiency.
Provides explicit score justification (+ and - reason points).
"""

import sys
from pathlib import Path
from typing import Dict, List

_parent = Path(__file__).resolve().parent.parent
_root = _parent.parent
for _p in [str(_root), str(_parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.models.architecture import ArchitectureModel, HealthAnalysisResponse, PillarScore, HealthFinding
except (ImportError, ValueError):
    try:
        from models.architecture import ArchitectureModel, HealthAnalysisResponse, PillarScore, HealthFinding  # type: ignore
    except (ImportError, ValueError):
        from ..models.architecture import ArchitectureModel, HealthAnalysisResponse, PillarScore, HealthFinding  # type: ignore


def analyze_health(arch: ArchitectureModel) -> HealthAnalysisResponse:
    components = arch.components or []
    connections = arch.connections or []

    if not components:
        empty_pillar = PillarScore(score=50, status="warning", reasons=["No components in architecture."], findings=[])
        return HealthAnalysisResponse(
            overall_score=50,
            pillars={
                "security": empty_pillar,
                "availability": empty_pillar,
                "scalability": empty_pillar,
                "performance": empty_pillar,
                "reliability": empty_pillar,
                "cost": empty_pillar
            },
            summary="Empty architecture model. Add components to run health diagnostics."
        )

    types = {c.type for c in components}
    has_cdn = "cdn" in types
    has_gateway = "gateway" in types
    has_loadbalancer = "loadbalancer" in types
    has_cache = "cache" in types
    has_auth = "auth" in types
    has_queue = "queue" in types
    has_db = "database" in types
    has_storage = "storage" in types
    has_monitoring = "monitoring" in types

    backends = [c for c in components if c.type in ["backend", "payment"]]
    databases = [c for c in components if c.type == "database"]
    frontends = [c for c in components if c.type == "frontend"]

    # Check for direct frontend -> DB
    frontend_to_db = any(
        conn.from_id in {f.id for f in frontends} and conn.to_id in {d.id for d in databases}
        for conn in connections
    )

    # 1. SECURITY PILLAR (Base 70)
    sec_score = 70
    sec_reasons = []
    sec_findings = []

    if has_auth:
        sec_score += 15
        sec_reasons.append("+15: Dedicated Authentication / Identity Provider detected.")
        sec_findings.append(HealthFinding(
            pillar="security",
            type="good",
            severity="none",
            title="Authentication Layer Present",
            description="Dedicated identity service centralizes credential security and token issuance.",
            points=15
        ))
    else:
        sec_score -= 15
        sec_reasons.append("-15: Missing dedicated authentication or identity management service.")
        sec_findings.append(HealthFinding(
            pillar="security",
            type="warning",
            severity="medium",
            title="Missing Authentication Layer",
            description="No dedicated auth service detected. Ensure user authentication and token verification are enforced.",
            recommendation="Add an Auth Service (e.g. Amazon Cognito, Firebase Auth, or Keycloak).",
            points=-15
        ))

    if has_gateway or has_loadbalancer:
        sec_score += 15
        sec_reasons.append("+15: Edge API Gateway / Load Balancer protects internal services from direct internet exposure.")
        sec_findings.append(HealthFinding(
            pillar="security",
            type="good",
            severity="none",
            title="Perimeter Protection Active",
            description="API Gateway/ALB provides centralized SSL termination and firewall perimeter defense.",
            points=15
        ))
    else:
        sec_score -= 10
        sec_reasons.append("-10: No API Gateway or Load Balancer detected at network perimeter.")
        sec_findings.append(HealthFinding(
            pillar="security",
            type="suggestion",
            severity="low",
            title="No Perimeter Gateway",
            description="Backend services may be directly exposed to the internet without perimeter rate-limiting.",
            recommendation="Place an API Gateway or Load Balancer in front of backend microservices.",
            points=-10
        ))

    if frontend_to_db:
        sec_score -= 35
        sec_reasons.append("-35: CRITICAL SECURITY RISK - Database is directly connected to the web client.")
        sec_findings.append(HealthFinding(
            pillar="security",
            type="risk",
            severity="critical",
            title="Public Database Exposure",
            description="Client connects directly to database credentials. This exposes raw database ports to internet threats.",
            recommendation="Remove direct connection from frontend to database and route through a secure backend API.",
            points=-35
        ))
    else:
        sec_score += 5
        sec_reasons.append("+5: Database is protected in private tier behind backend application layer.")

    sec_score = max(10, min(100, sec_score))
    sec_status = "good" if sec_score >= 80 else ("warning" if sec_score >= 60 else "risk")

    # 2. AVAILABILITY PILLAR (Base 70)
    avail_score = 70
    avail_reasons = []
    avail_findings = []

    if len(backends) == 1 and not (has_loadbalancer or has_gateway):
        avail_score -= 20
        avail_reasons.append("-20: Potential Single Point of Failure (SPOF): Single backend instance without redundancy.")
        avail_findings.append(HealthFinding(
            pillar="availability",
            type="warning",
            severity="high",
            title="Potential Single Point of Failure",
            description="A single backend service instance without a load balancer will bring down the entire application if the node crashes.",
            recommendation="Deploy multiple backend instances across availability zones behind an Application Load Balancer.",
            points=-20
        ))
    elif len(backends) >= 2 or has_loadbalancer or has_gateway:
        avail_score += 15
        avail_reasons.append("+15: Multi-service or load-balanced topology supports traffic failover.")
        avail_findings.append(HealthFinding(
            pillar="availability",
            type="good",
            severity="none",
            title="Redundancy Ready",
            description="Architecture is structured to support horizontal failover and load balancing.",
            points=15
        ))

    if has_queue:
        avail_score += 15
        avail_reasons.append("+15: Asynchronous message queue decouples dependencies and absorbs sudden traffic surges.")
        avail_findings.append(HealthFinding(
            pillar="availability",
            type="good",
            severity="none",
            title="Asynchronous Decoupling",
            description="Message queue (RabbitMQ/Kafka) buffers background jobs preventing cascading failures during traffic surges.",
            points=15
        ))

    avail_score = max(10, min(100, avail_score))
    avail_status = "good" if avail_score >= 80 else ("warning" if avail_score >= 60 else "risk")

    # 3. SCALABILITY PILLAR (Base 65)
    scale_score = 65
    scale_reasons = []
    scale_findings = []

    if has_cache:
        scale_score += 15
        scale_reasons.append("+15: In-memory cache (Redis) offloads heavy repetitive reads from relational database.")
        scale_findings.append(HealthFinding(
            pillar="scalability",
            type="good",
            severity="none",
            title="Caching Layer Operational",
            description="Redis caching reduces database read load by up to 85% during high concurrency.",
            points=15
        ))
    else:
        scale_score -= 15
        scale_reasons.append("-15: Missing caching layer. Relational database will absorb 100% of read queries.")
        scale_findings.append(HealthFinding(
            pillar="scalability",
            type="warning",
            severity="medium",
            title="Missing Cache Tier",
            description="All read requests hit the database directly, creating a potential bottleneck as active users grow.",
            recommendation="Add Redis Cache for frequently read catalog items and user sessions.",
            points=-15
        ))

    if has_cdn:
        scale_score += 15
        scale_reasons.append("+15: Edge CDN absorbs static assets and images, scaling effortlessly to millions of hits.")
        scale_findings.append(HealthFinding(
            pillar="scalability",
            type="good",
            severity="none",
            title="Edge Scalability Active",
            description="CDN handles global content requests at the edge.",
            points=15
        ))
    else:
        scale_score -= 10
        scale_reasons.append("-10: No CDN. Frontend assets must be served directly from compute servers.")
        scale_findings.append(HealthFinding(
            pillar="scalability",
            type="suggestion",
            severity="low",
            title="Missing CDN",
            description="Serving static assets directly from backend instances wastes compute capacity.",
            recommendation="Add CloudFront or Cloud CDN in front of web assets.",
            points=-10
        ))

    scale_score = max(10, min(100, scale_score))
    scale_status = "good" if scale_score >= 80 else ("warning" if scale_score >= 60 else "risk")

    # 4. PERFORMANCE PILLAR (Base 70)
    perf_score = 70
    perf_reasons = []
    perf_findings = []

    if has_cdn:
        perf_score += 15
        perf_reasons.append("+15: Edge CDN ensures sub-50ms static delivery worldwide.")
    if has_cache:
        perf_score += 15
        perf_reasons.append("+15: Redis provides sub-millisecond in-memory data retrieval.")
    if not has_cache and not has_cdn:
        perf_score -= 20
        perf_reasons.append("-20: No CDN or Cache. High round-trip database read latencies expected.")
        perf_findings.append(HealthFinding(
            pillar="performance",
            type="warning",
            severity="high",
            title="High Latency Risk",
            description="Without edge caching or Redis in-memory storage, user requests experience full round-trip DB latency.",
            recommendation="Implement Redis caching for hot data keys and Cloud CDN for web assets.",
            points=-20
        ))

    perf_score = max(10, min(100, perf_score))
    perf_status = "good" if perf_score >= 80 else ("warning" if perf_score >= 60 else "risk")

    # 5. RELIABILITY PILLAR (Base 75)
    rel_score = 75
    rel_reasons = []
    rel_findings = []

    if has_db:
        rel_score += 10
        rel_reasons.append("+10: ACID relational database ensures persistent data integrity.")
    if has_monitoring:
        rel_score += 15
        rel_reasons.append("+15: Telemetry & Monitoring suite provides real-time alerting on error spikes.")
    else:
        rel_score -= 10
        rel_reasons.append("-10: No centralized monitoring or log aggregation detected.")
        rel_findings.append(HealthFinding(
            pillar="reliability",
            type="suggestion",
            severity="low",
            title="Observability Recommended",
            description="Centralized telemetry (CloudWatch/Datadog) accelerates incident response times.",
            recommendation="Add CloudWatch / Prometheus monitoring to track server health metrics.",
            points=-10
        ))

    rel_score = max(10, min(100, rel_score))
    rel_status = "good" if rel_score >= 80 else ("warning" if rel_score >= 60 else "risk")

    # 6. COST EFFICIENCY PILLAR (Base 80)
    cost_score = 80
    cost_reasons = []
    cost_findings = []

    comp_count = len(components)
    if comp_count > 10:
        cost_score -= 15
        cost_reasons.append(f"-15: High component count ({comp_count} services). Monitor infrastructure overhead.")
    else:
        cost_score += 10
        cost_reasons.append(f"+10: Lean modular architecture ({comp_count} services) maintains predictable operating costs.")

    if has_storage:
        cost_score += 10
        cost_reasons.append("+10: Object storage (S3/GCS) keeps storage costs 80% cheaper than database block storage.")

    cost_score = max(10, min(100, cost_score))
    cost_status = "good" if cost_score >= 80 else ("warning" if cost_score >= 60 else "risk")

    # Overall weighted average
    overall_score = round(
        (sec_score * 0.25) +
        (avail_score * 0.20) +
        (scale_score * 0.20) +
        (perf_score * 0.15) +
        (rel_score * 0.10) +
        (cost_score * 0.10)
    )

    pillars = {
        "security": PillarScore(score=sec_score, status=sec_status, reasons=sec_reasons, findings=sec_findings),
        "availability": PillarScore(score=avail_score, status=avail_status, reasons=avail_reasons, findings=avail_findings),
        "scalability": PillarScore(score=scale_score, status=scale_status, reasons=scale_reasons, findings=scale_findings),
        "performance": PillarScore(score=perf_score, status=perf_status, reasons=perf_reasons, findings=perf_findings),
        "reliability": PillarScore(score=rel_score, status=rel_status, reasons=rel_reasons, findings=rel_findings),
        "cost": PillarScore(score=cost_score, status=cost_status, reasons=cost_reasons, findings=cost_findings)
    }

    summary = f"Overall Architecture Health Score: {overall_score}/100. "
    if overall_score >= 85:
        summary += "Architecture demonstrates strong resilience, security perimeter defense, and scalability best practices."
    elif overall_score >= 65:
        summary += "Architecture is functional but has identifiable opportunities in caching, perimeter protection, or failover redundancy."
    else:
        summary += "Architecture has critical design bottlenecks or security risks that require remediation before production deployment."

    return HealthAnalysisResponse(
        overall_score=overall_score,
        pillars=pillars,
        summary=summary
    )
