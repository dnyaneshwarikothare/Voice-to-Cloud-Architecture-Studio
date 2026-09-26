"""
Architecture Decision Memory (ADR) Service
Manages architectural decisions, rationale, trade-offs, and validates them
against the active architecture graph to detect superseded or changed decisions.
"""

from typing import List, Dict, Any, Optional
import datetime
import sys
from pathlib import Path

# Add backend directory to sys.path
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

try:
    from ..models.architecture import (
        ArchitectureModel,
        ArchitectureDecision
    )
except (ImportError, ValueError):
    from models.architecture import (
        ArchitectureModel,
        ArchitectureDecision
    )

# In-memory ADR cache (mirrored in SQLite)
_DECISION_STORE: List[Dict[str, Any]] = [
    {
        "id": "adr_1",
        "component_id": "postgres",
        "component_name": "PostgreSQL Database",
        "decision": "Adopt PostgreSQL as Primary Relational Store",
        "reason": "ACID compliance for order transactions and structured schema integrity.",
        "alternative": "MongoDB Document Store",
        "trade_off": "Guarantees transactional consistency; requires read replicas and connection pooling at massive concurrency.",
        "status": "active",
        "version": "v1.0",
        "created_at": datetime.datetime.utcnow().isoformat()
    },
    {
        "id": "adr_2",
        "component_id": "redis",
        "component_name": "Redis In-Memory Cache",
        "decision": "Implement In-Memory Redis Caching Tier",
        "reason": "Absorbs repeated catalog read queries and session tokens to protect database.",
        "alternative": "Direct database query with in-memory process cache",
        "trade_off": "Sub-millisecond read latency; introduces cache invalidation and memory eviction management.",
        "status": "active",
        "version": "v1.0",
        "created_at": datetime.datetime.utcnow().isoformat()
    },
    {
        "id": "adr_3",
        "component_id": "gateway",
        "component_name": "API Gateway",
        "decision": "Deploy Centralized API Gateway for Routing & Rate Limiting",
        "reason": "Single perimeter boundary for token authentication, SSL termination, and client throttling.",
        "alternative": "Direct microservice exposure via individual public IPs",
        "trade_off": "Centralizes security and observability; potential routing bottleneck if un-cached.",
        "status": "active",
        "version": "v1.0",
        "created_at": datetime.datetime.utcnow().isoformat()
    }
]


def list_decisions(architecture: Optional[ArchitectureModel] = None) -> List[ArchitectureDecision]:
    comp_ids = {c.id for c in architecture.components} if architecture else set()
    comp_techs = {c.id: (c.technology or "").lower() for c in architecture.components} if architecture else {}

    results = []
    for d in _DECISION_STORE:
        status = d.get("status", "active")
        cid = d.get("component_id")

        # Validate against active architecture if provided
        if architecture and cid:
            # Check if component still exists in architecture
            matched_comp = next((c for c in architecture.components if cid in c.id or cid in c.type or cid in c.name.lower()), None)
            if not matched_comp:
                status = "changed"
            else:
                # Check if decision alternative was chosen or tech changed
                alt = d.get("alternative", "").lower()
                current_tech = (matched_comp.technology or "").lower()
                if any(alt_kw in current_tech for alt_kw in ["mongo", "mysql", "dynamo"] if alt_kw in alt):
                    status = "changed"

        results.append(ArchitectureDecision(
            id=d["id"],
            component_id=d.get("component_id"),
            component_name=d.get("component_name"),
            decision=d["decision"],
            reason=d["reason"],
            alternative=d["alternative"],
            trade_off=d["trade_off"],
            status=status,
            version=d.get("version", "v1.0"),
            created_at=d.get("created_at")
        ))
    return results


def add_decision(decision: ArchitectureDecision) -> ArchitectureDecision:
    item = decision.model_dump()
    if not item.get("created_at"):
        item["created_at"] = datetime.datetime.utcnow().isoformat()
    # Check if exists
    existing = next((i for i in _DECISION_STORE if i["id"] == item["id"]), None)
    if existing:
        existing.update(item)
    else:
        _DECISION_STORE.append(item)
    return decision


def delete_decision(decision_id: str) -> bool:
    global _DECISION_STORE
    orig_len = len(_DECISION_STORE)
    _DECISION_STORE = [d for d in _DECISION_STORE if d["id"] != decision_id]
    return len(_DECISION_STORE) < orig_len
