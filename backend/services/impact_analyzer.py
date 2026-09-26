"""
Architecture Change Impact Analyzer Service
Analyzes upstream and downstream dependencies, ripple effects,
and operational impact when components are added, removed, modified, or failed.
"""

from typing import List, Dict, Any, Optional
import sys
from pathlib import Path

# Add backend directory to sys.path for robust imports
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

try:
    from ..models.architecture import (
        ArchitectureModel,
        Component,
        ImpactItem,
        ImpactDependencyNode,
        ImpactAnalysisRequest,
        ImpactAnalysisResponse
    )
except (ImportError, ValueError):
    from models.architecture import (
        ArchitectureModel,
        Component,
        ImpactItem,
        ImpactDependencyNode,
        ImpactAnalysisRequest,
        ImpactAnalysisResponse
    )


def analyze_impact(request: ImpactAnalysisRequest) -> ImpactAnalysisResponse:
    arch = request.architecture
    action = request.action
    target_id = request.target_component_id

    components = arch.components or []
    connections = arch.connections or []
    comp_map = {c.id: c for c in components}

    # Build adjacency maps
    outgoing_map: Dict[str, List[str]] = {c.id: [] for c in components}
    incoming_map: Dict[str, List[str]] = {c.id: [] for c in components}

    for conn in connections:
        if conn.from_id in outgoing_map and conn.to_id in comp_map:
            outgoing_map[conn.from_id].append(conn.to_id)
        if conn.to_id in incoming_map and conn.from_id in comp_map:
            incoming_map[conn.to_id].append(conn.from_id)

    # If no target specified, pick first database or cache or backend as demonstration target
    if not target_id and components:
        cache_comp = next((c for c in components if c.type == "cache" or "redis" in c.name.lower()), None)
        db_comp = next((c for c in components if c.type == "database"), None)
        target_id = cache_comp.id if cache_comp else (db_comp.id if db_comp else components[0].id)

    target_comp = comp_map.get(target_id)
    target_type = target_comp.type if target_comp else "custom"
    target_name = target_comp.name if target_comp else (target_id or "Component")

    affected_items: List[ImpactItem] = []
    overall_level = "LOW IMPACT"

    # Analyze specific architectural impact scenarios
    if action in ("remove", "fail"):
        if target_type == "cache" or (target_comp and "redis" in target_comp.name.lower()):
            overall_level = "HIGH IMPACT"
            # Database gets more load
            db_comps = [c for c in components if c.type == "database"]
            for db in db_comps:
                affected_items.append(ImpactItem(
                    changed_component_id=target_id,
                    affected_component_id=db.id,
                    affected_component_name=db.name,
                    impact_level="HIGH IMPACT",
                    reason=f"Removal/failure of cache ({target_name}) removes hot-data read buffer.",
                    expected_impact="Direct database query volume and read IOPS can surge by 300%–500%, increasing latency.",
                    suggested_mitigation="Add read replicas, optimize indexed queries, or configure application memory caching."
                ))
            # Backends get higher latency
            backend_comps = [c for c in components if c.type == "backend"]
            for be in backend_comps:
                affected_items.append(ImpactItem(
                    changed_component_id=target_id,
                    affected_component_id=be.id,
                    affected_component_name=be.name,
                    impact_level="MEDIUM IMPACT",
                    reason="Backend services cannot serve cached responses directly.",
                    expected_impact="Request handling duration increases; concurrency limits reached faster.",
                    suggested_mitigation="Implement circuit breaker and fallback response payloads for non-critical reads."
                ))

        elif target_type == "database":
            overall_level = "CRITICAL"
            # Direct callers (backends, gateways)
            callers = incoming_map.get(target_id, [])
            for cid in callers:
                c = comp_map.get(cid)
                if c:
                    affected_items.append(ImpactItem(
                        changed_component_id=target_id,
                        affected_component_id=c.id,
                        affected_component_name=c.name,
                        impact_level="CRITICAL",
                        reason=f"Dependent service connects directly to {target_name}.",
                        expected_impact="All stateful write transactions and un-cached reads will fail with 500 errors.",
                        suggested_mitigation="Implement multi-AZ automated failover with read replica promotion and write-retry buffers."
                    ))
            # Any order or payment services
            for c in components:
                if c.id != target_id and any(kw in c.name.lower() for kw in ["payment", "order", "checkout", "auth"]):
                    if c.id not in [item.affected_component_id for item in affected_items]:
                        affected_items.append(ImpactItem(
                            changed_component_id=target_id,
                            affected_component_id=c.id,
                            affected_component_name=c.name,
                            impact_level="CRITICAL",
                            reason="Critical business transaction pipeline depends on transactional database durability.",
                            expected_impact="Customer checkout and identity verification halted during outage.",
                            suggested_mitigation="Queue pending transaction payloads into SQS/RabbitMQ dead-letter queue."
                        ))

        elif target_type in ("auth",) or (target_comp and "auth" in target_comp.name.lower()):
            overall_level = "HIGH IMPACT"
            for c in components:
                if c.type in ("backend", "gateway"):
                    affected_items.append(ImpactItem(
                        changed_component_id=target_id,
                        affected_component_id=c.id,
                        affected_component_name=c.name,
                        impact_level="HIGH IMPACT",
                        reason=f"Identity verification layer ({target_name}) modified or removed.",
                        expected_impact="Tokens cannot be authenticated centrally; risk of unauthenticated bypass or widespread rejection.",
                        suggested_mitigation="Validate signed JWTs locally using cached public JWKS keys."
                    ))

        elif target_type in ("gateway", "loadbalancer"):
            overall_level = "CRITICAL"
            for c in components:
                if c.type == "frontend":
                    affected_items.append(ImpactItem(
                        changed_component_id=target_id,
                        affected_component_id=c.id,
                        affected_component_name=c.name,
                        impact_level="CRITICAL",
                        reason="Edge entrypoint routing layer down.",
                        expected_impact="Frontend web and mobile clients cannot establish network routes to APIs.",
                        suggested_mitigation="Configure multi-region DNS failover (Route 53 / Cloud DNS) with health checks."
                    ))
        else:
            # General connected nodes
            connected_ids = set(outgoing_map.get(target_id, []) + incoming_map.get(target_id, []))
            for cid in connected_ids:
                c = comp_map.get(cid)
                if c:
                    affected_items.append(ImpactItem(
                        changed_component_id=target_id,
                        affected_component_id=c.id,
                        affected_component_name=c.name,
                        impact_level="MEDIUM IMPACT",
                        reason=f"Directly connected to modified component {target_name}.",
                        expected_impact="Network connection resets or fallback logic required.",
                        suggested_mitigation="Review interface contracts and provide graceful degradation."
                    ))
            overall_level = "MEDIUM IMPACT" if affected_items else "LOW IMPACT"

    elif action == "add":
        overall_level = "LOW IMPACT"
        new_name = request.new_component.name if request.new_component else "New Component"
        affected_items.append(ImpactItem(
            changed_component_id="new_component",
            affected_component_id=target_id or "system",
            affected_component_name=target_name,
            impact_level="LOW IMPACT",
            reason=f"Addition of {new_name} introduces new network path.",
            expected_impact="Minimal disruption. Requires establishing authenticated connections and firewall security groups.",
            suggested_mitigation="Define strict egress/ingress rules and health check probes."
        ))

    else:  # modify
        overall_level = "MEDIUM IMPACT"
        for cid in outgoing_map.get(target_id, []) + incoming_map.get(target_id, []):
            c = comp_map.get(cid)
            if c:
                affected_items.append(ImpactItem(
                    changed_component_id=target_id,
                    affected_component_id=c.id,
                    affected_component_name=c.name,
                    impact_level="MEDIUM IMPACT",
                    reason=f"Specification change on {target_name}.",
                    expected_impact="Service contract, sizing, or connection protocol might require client reconfiguration.",
                    suggested_mitigation="Conduct backward-compatible contract testing and gradual canary rollout."
                ))

    # Build Dependency Graph with statuses
    affected_ids = {item.affected_component_id for item in affected_items}
    dep_graph: List[ImpactDependencyNode] = []
    for c in components:
        if c.id == target_id:
            status = "changed" if action != "fail" else "critical"
        elif c.id in affected_ids:
            # find severity
            match = next((i for i in affected_items if i.affected_component_id == c.id), None)
            status = "critical" if match and match.impact_level == "CRITICAL" else "affected"
        else:
            status = "normal"

        dep_graph.append(ImpactDependencyNode(
            id=c.id,
            name=c.name,
            role=c.role or c.type,
            status=status,
            incoming=incoming_map.get(c.id, []),
            outgoing=outgoing_map.get(c.id, [])
        ))

    summary = (
        f"Simulating {action.upper()} on '{target_name}'. Identified {len(affected_items)} "
        f"dependent component(s) with overall {overall_level} severity."
    )

    return ImpactAnalysisResponse(
        target_id=target_id,
        overall_impact_level=overall_level,
        affected_components=affected_items,
        dependency_graph=dep_graph,
        summary=summary,
        disclaimer="Scenario-based dependency and impact analysis. Not an absolute runtime guarantee."
    )
