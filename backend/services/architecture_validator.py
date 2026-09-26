"""
Architecture Validator Service
Validates graph integrity, orphan components, broken connections, security anti-patterns, and architectural rules.
"""

import sys
from pathlib import Path
from typing import List

_parent = Path(__file__).resolve().parent.parent
_root = _parent.parent
for _p in [str(_root), str(_parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.models.architecture import ArchitectureModel, ValidationResult, ValidationIssue
except (ImportError, ValueError):
    try:
        from models.architecture import ArchitectureModel, ValidationResult, ValidationIssue  # type: ignore
    except (ImportError, ValueError):
        from ..models.architecture import ArchitectureModel, ValidationResult, ValidationIssue  # type: ignore


def validate_architecture(arch: ArchitectureModel) -> ValidationResult:
    errors: List[ValidationIssue] = []
    warnings: List[ValidationIssue] = []

    components = arch.components or []
    connections = arch.connections or []

    if not components:
        warnings.append(ValidationIssue(
            type="warning",
            code="EMPTY_ARCHITECTURE",
            message="The architecture model has no components. Add components or enter a prompt."
        ))
        return ValidationResult(
            is_valid=True,
            errors=errors,
            warnings=warnings,
            summary="Empty architecture with no components."
        )

    # 1. Check duplicate IDs
    seen_ids = set()
    for comp in components:
        if comp.id in seen_ids:
            errors.append(ValidationIssue(
                type="error",
                code="DUPLICATE_COMPONENT_ID",
                message=f"Duplicate component ID detected: '{comp.id}'. Component IDs must be unique.",
                component_id=comp.id
            ))
        seen_ids.add(comp.id)

    comp_ids = {c.id for c in components}
    comp_map = {c.id: c for c in components}

    # 2. Check broken connections
    for conn in connections:
        if conn.from_id not in comp_ids:
            errors.append(ValidationIssue(
                type="error",
                code="BROKEN_CONNECTION_SOURCE",
                message=f"Connection source '{conn.from_id}' does not exist in component list.",
                component_id=conn.from_id
            ))
        if conn.to_id not in comp_ids:
            errors.append(ValidationIssue(
                type="error",
                code="BROKEN_CONNECTION_TARGET",
                message=f"Connection target '{conn.to_id}' does not exist in component list.",
                component_id=conn.to_id
            ))
        if conn.from_id == conn.to_id:
            warnings.append(ValidationIssue(
                type="warning",
                code="SELF_LOOP_CONNECTION",
                message=f"Component '{conn.from_id}' connects to itself in a redundant self-loop.",
                component_id=conn.from_id
            ))

    # Build graph adjacency
    incoming = {c.id: [] for c in components}
    outgoing = {c.id: [] for c in components}
    for conn in connections:
        if conn.from_id in comp_ids and conn.to_id in comp_ids:
            outgoing[conn.from_id].append(conn.to_id)
            incoming[conn.to_id].append(conn.from_id)

    # 3. Check for orphan / disconnected components (if more than 1 component)
    if len(components) > 1:
        for c in components:
            if c.type == "monitoring":
                continue  # Monitoring suite often acts passively
            if not incoming[c.id] and not outgoing[c.id]:
                warnings.append(ValidationIssue(
                    type="warning",
                    code="ORPHAN_COMPONENT",
                    message=f"Component '{c.name}' ({c.type}) is completely disconnected from the rest of the architecture.",
                    component_id=c.id
                ))

    # 4. Check Database rules
    databases = [c for c in components if c.type == "database"]
    backends = [c for c in components if c.type in ["backend", "payment", "custom"]]
    frontends = [c for c in components if c.type == "frontend"]

    for db in databases:
        inc = incoming[db.id]
        if not inc:
            warnings.append(ValidationIssue(
                type="warning",
                code="DISCONNECTED_DATABASE",
                message=f"Database '{db.name}' has no incoming application service queries.",
                component_id=db.id
            ))
        else:
            # Check if directly exposed to frontend
            for src_id in inc:
                src_comp = comp_map.get(src_id)
                if src_comp and src_comp.type == "frontend":
                    errors.append(ValidationIssue(
                        type="error",
                        code="PUBLIC_DATABASE_EXPOSURE",
                        message=f"CRITICAL: Database '{db.name}' is directly connected to Frontend '{src_comp.name}'. Databases must never be publicly exposed to the client; connect via an intermediary Backend Service or API Gateway.",
                        component_id=db.id
                    ))

    # 5. Check Backend entry point
    if backends and frontends:
        for be in backends:
            inc = incoming[be.id]
            # If backend has no incoming connections and no queue incoming
            if not inc and len(components) > 2:
                warnings.append(ValidationIssue(
                    type="warning",
                    code="BACKEND_NO_ENTRY_POINT",
                    message=f"Backend Service '{be.name}' has no incoming traffic routed from a Frontend, API Gateway, or Load Balancer.",
                    component_id=be.id
                ))

    # 6. Check Cache rules
    caches = [c for c in components if c.type == "cache"]
    for ca in caches:
        inc = incoming[ca.id]
        for src_id in inc:
            src_comp = comp_map.get(src_id)
            if src_comp and src_comp.type == "frontend":
                warnings.append(ValidationIssue(
                    type="warning",
                    code="CACHE_DIRECT_FRONTEND",
                    message=f"Cache '{ca.name}' is connected directly to Frontend '{src_comp.name}'. Typically caches should be managed by the Backend Service.",
                    component_id=ca.id
                ))

    is_valid = len(errors) == 0
    if not is_valid:
        summary = f"Validation failed with {len(errors)} error(s) and {len(warnings)} warning(s)."
    elif warnings:
        summary = f"Architecture is structurally valid with {len(warnings)} warning(s)."
    else:
        summary = "Architecture passed all structural and security validation checks."

    return ValidationResult(
        is_valid=is_valid,
        errors=errors,
        warnings=warnings,
        summary=summary
    )
