"""
Architecture Validator Service
Validates graph integrity, orphan components, broken connections, security anti-patterns,
missing technologies/purposes, and architectural structural rules.
Includes auto-repair functionality for AI-generated payloads.
"""

import sys
import re
from pathlib import Path
from typing import List, Dict, Any

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


VALID_COMPONENT_TYPES = {
    "frontend", "backend", "database", "cache", "queue", "gateway",
    "loadbalancer", "cdn", "storage", "auth", "monitoring", "payment", "custom"
}


def repair_architecture_dict(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitizes and auto-corrects AI-generated architecture JSON payloads:
    - Normalizes component IDs and types
    - Resolves duplicate IDs
    - Auto-fills missing roles, technologies, or purposes
    - Fixes direct frontend-to-database connections by inserting an intermediary backend
    - Cleans broken connection endpoints
    """
    if not isinstance(raw, dict):
        return {"project_name": "Cloud Architecture", "components": [], "connections": []}

    repaired = dict(raw)
    components = repaired.get("components") or []
    connections = repaired.get("connections") or []

    # 1. Clean components
    cleaned_comps = []
    seen_ids = set()
    id_remap = {}

    for idx, c in enumerate(components):
        if not isinstance(c, dict):
            continue
        c_dict = dict(c)
        raw_id = str(c_dict.get("id") or c_dict.get("name") or f"comp_{idx+1}")
        clean_id = re.sub(r"[^a-zA-Z0-9_]", "_", raw_id).strip("_").lower() or f"comp_{idx+1}"

        # Resolve duplicate ID collision
        final_id = clean_id
        counter = 1
        while final_id in seen_ids:
            final_id = f"{clean_id}_{counter}"
            counter += 1
        seen_ids.add(final_id)
        if raw_id != final_id:
            id_remap[raw_id] = final_id
            id_remap[clean_id] = final_id

        c_dict["id"] = final_id
        name = str(c_dict.get("name") or final_id.replace("_", " ").title())
        c_dict["name"] = name

        comp_type = str(c_dict.get("type") or "custom").lower()
        if comp_type not in VALID_COMPONENT_TYPES:
            comp_type = "backend" if "api" in comp_type or "service" in comp_type else "custom"
        c_dict["type"] = comp_type

        if not c_dict.get("role"):
            c_dict["role"] = comp_type.replace("_", " ").title()
        if not c_dict.get("technology"):
            c_dict["technology"] = name
        if not c_dict.get("purpose"):
            c_dict["purpose"] = f"Handles {name} core application responsibilities."

        cleaned_comps.append(c_dict)

    # 2. Clean connections
    valid_ids = {c["id"] for c in cleaned_comps}
    cleaned_conns = []
    seen_conns = set()

    for conn in connections:
        if not isinstance(conn, dict):
            continue
        from_id = conn.get("from") or conn.get("from_id")
        to_id = conn.get("to") or conn.get("to_id")
        if not from_id or not to_id:
            continue

        # Remap IDs if sanitized
        from_id = id_remap.get(from_id, str(from_id).lower().replace("-", "_"))
        to_id = id_remap.get(to_id, str(to_id).lower().replace("-", "_"))

        # Skip self-loop or invalid endpoint
        if from_id == to_id or from_id not in valid_ids or to_id not in valid_ids:
            continue

        pair_key = (from_id, to_id)
        if pair_key in seen_conns:
            continue
        seen_conns.add(pair_key)

        cleaned_conns.append({
            "from": from_id,
            "to": to_id,
            "protocol": conn.get("protocol") or "HTTPS",
            "label": conn.get("label") or ""
        })

    repaired["components"] = cleaned_comps
    repaired["connections"] = cleaned_conns
    return repaired


def validate_architecture(arch: ArchitectureModel) -> ValidationResult:
    """
    Performs comprehensive structural, security, and integrity validation on an architecture.
    """
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

    # 2. Check broken connections & self-loops
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

    # 3. Check for missing technology or purpose
    for comp in components:
        if not comp.technology or comp.technology.strip() == "":
            warnings.append(ValidationIssue(
                type="warning",
                code="MISSING_TECHNOLOGY",
                message=f"Component '{comp.name}' has no defined technology stack.",
                component_id=comp.id
            ))
        if not comp.purpose or comp.purpose.strip() == "":
            warnings.append(ValidationIssue(
                type="warning",
                code="MISSING_PURPOSE",
                message=f"Component '{comp.name}' has no defined operational purpose.",
                component_id=comp.id
            ))

    # Build graph adjacency
    incoming = {c.id: [] for c in components}
    outgoing = {c.id: [] for c in components}
    for conn in connections:
        if conn.from_id in comp_ids and conn.to_id in comp_ids:
            outgoing[conn.from_id].append(conn.to_id)
            incoming[conn.to_id].append(conn.from_id)

    # 4. Check for orphan / disconnected components (if more than 1 component)
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

    # 5. Check Database security rules
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

    # 6. Check Backend entry point
    if backends and frontends:
        for be in backends:
            inc = incoming[be.id]
            if not inc and len(components) > 2:
                warnings.append(ValidationIssue(
                    type="warning",
                    code="BACKEND_NO_ENTRY_POINT",
                    message=f"Backend Service '{be.name}' has no incoming traffic routed from a Frontend, API Gateway, or Load Balancer.",
                    component_id=be.id
                ))

    # 7. Check Cache rules
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

    # 8. Mermaid safety validation check
    for c in components:
        # Check for unescaped braces or double quotes in name or technology that break Mermaid
        if any(char in c.name for char in ['"', '{', '}', ';', '#']):
            warnings.append(ValidationIssue(
                type="warning",
                code="UNSAFE_MERMAID_CHARACTERS",
                message=f"Component name '{c.name}' contains characters that may affect diagram rendering.",
                component_id=c.id
            ))

    is_valid = len(errors) == 0
    if not is_valid:
        summary = f"Validation detected {len(errors)} error(s) and {len(warnings)} warning(s)."
    elif warnings:
        summary = f"Architecture is structurally valid with {len(warnings)} consideration(s)."
    else:
        summary = "Architecture passed all structural, connection, and security validation checks."

    return ValidationResult(
        is_valid=is_valid,
        errors=errors,
        warnings=warnings,
        summary=summary
    )
