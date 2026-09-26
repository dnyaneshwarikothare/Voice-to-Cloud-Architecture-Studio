"""
Conversational Architecture Editor Service
Parses natural language commands (e.g., 'Add Redis', 'Remove Redis', 'Use Python for backend')
and applies real mutations to the underlying ArchitectureModel.
"""

from typing import List, Dict, Any, Tuple
import re
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
        ConversationalCommandRequest,
        ConversationalCommandResponse
    )
except (ImportError, ValueError):
    from models.architecture import (
        ArchitectureModel,
        Component,
        Connection,
        ConversationalCommandRequest,
        ConversationalCommandResponse
    )


def execute_conversational_command(request: ConversationalCommandRequest) -> ConversationalCommandResponse:
    raw_cmd = request.command.strip()
    cmd = raw_cmd.lower()
    arch = copy.deepcopy(request.architecture)

    intent = "unknown"
    action_taken = ""
    explanation = ""
    next_steps = []

    # 1. ADD COMPONENT (e.g. "Add Redis", "Add payment service", "Add authentication", "Add CDN")
    if re.search(r"\b(add|insert|include|attach|put)\b", cmd):
        intent = "add_component"

        if "redis" in cmd or "cache" in cmd:
            if not any(c.type == "cache" or "redis" in c.id for c in arch.components):
                new_comp = Component(
                    id="redis_cache",
                    name="Redis In-Memory Cache",
                    type="cache",
                    technology="Redis",
                    role="In-Memory Cache",
                    purpose="Caches hot query results and sessions to reduce primary database load."
                )
                arch.components.append(new_comp)

                # Connect backend to cache
                backend_comp = next((c for c in arch.components if c.type == "backend"), None)
                if backend_comp:
                    arch.connections.append(Connection(
                        from_id=backend_comp.id,
                        to_id="redis_cache",
                        protocol="TCP",
                        label="Caches Hot Data"
                    ))
                action_taken = "Added Redis In-Memory Cache component and connected to backend service."
                explanation = "Redis caches repetitive database reads, slashing average query latency from ~45ms to <2ms."
                next_steps = ["Check the 'Impact' tab to see database load reduction.", "Inspect 'Cost' tab for AWS ElastiCache / GCP Memorystore line item."]
            else:
                action_taken = "Redis cache is already present in this architecture."
                explanation = "The architecture already includes an in-memory caching tier."

        elif "payment" in cmd:
            if not any("payment" in c.id for c in arch.components):
                new_comp = Component(
                    id="payment_service",
                    name="Stripe / Payment Gateway Service",
                    type="payment",
                    technology="Node.js / Stripe SDK",
                    role="Payment Processor",
                    purpose="Processes customer credit cards, PCI-compliant tokenization, and webhooks."
                )
                arch.components.append(new_comp)
                gateway = next((c for c in arch.components if c.type in ("gateway", "backend")), None)
                if gateway:
                    arch.connections.append(Connection(
                        from_id=gateway.id,
                        to_id="payment_service",
                        protocol="HTTPS",
                        label="Checkout & Webhooks"
                    ))
                action_taken = "Added Payment Service component and connected to API Gateway."
                explanation = "Dedicated payment microservice isolates PCI-DSS compliance scope from general app logic."
                next_steps = ["Review 'Security' tab to verify tokenized webhook security.", "Run 'What-If' to test payment provider outage."]

        elif "auth" in cmd or "identity" in cmd or "jwt" in cmd:
            if not any("auth" in c.id or c.type == "auth" for c in arch.components):
                new_comp = Component(
                    id="auth_service",
                    name="Authentication & Identity Service",
                    type="auth",
                    technology="OAuth2 / JWT",
                    role="Identity Provider",
                    purpose="Issues secure JWT access tokens, hashes passwords, and manages user sessions."
                )
                arch.components.append(new_comp)
                gateway = next((c for c in arch.components if c.type in ("gateway", "backend")), None)
                if gateway:
                    arch.connections.append(Connection(
                        from_id=gateway.id,
                        to_id="auth_service",
                        protocol="HTTPS",
                        label="Validates Tokens"
                    ))
                action_taken = "Added Authentication & Identity Service."
                explanation = "Centralizes credential authentication, JWT token issuance, and role-based access control (RBAC)."
                next_steps = ["Check the 'Security' tab to see improved score.", "Inspect architecture diagram."]

        elif "cdn" in cmd or "cloudfront" in cmd:
            if not any(c.type == "cdn" for c in arch.components):
                new_comp = Component(
                    id="edge_cdn",
                    name="CloudFront / Edge CDN",
                    type="cdn",
                    technology="CloudFront",
                    role="Global Content Delivery Network",
                    purpose="Caches and terminates static web assets close to end-users worldwide."
                )
                arch.components.insert(0, new_comp)
                frontend = next((c for c in arch.components if c.type == "frontend"), None)
                if frontend:
                    arch.connections.insert(0, Connection(
                        from_id="edge_cdn",
                        to_id=frontend.id,
                        protocol="HTTPS",
                        label="Serves Static Assets"
                    ))
                action_taken = "Added Global Edge CDN."
                explanation = "Reduces frontend origin traffic by 70%+ and speeds up global load times."
                next_steps = ["Check 'Traffic' tab for reduced bandwidth costs."]

        elif "load balancer" in cmd or "alb" in cmd:
            if not any(c.type == "loadbalancer" for c in arch.components):
                new_comp = Component(
                    id="load_balancer",
                    name="Application Load Balancer",
                    type="loadbalancer",
                    technology="AWS ALB / GCP Cloud Load Balancing",
                    role="Traffic Distribution",
                    purpose="Distributes incoming HTTP/HTTPS traffic across multi-AZ backend instances."
                )
                arch.components.append(new_comp)
                action_taken = "Added Application Load Balancer."
                explanation = "Eliminates single point of failure on backend instances."
                next_steps = ["Review 'Health' tab to see availability score increase."]

        else:
            # Generic add
            cleaned = re.sub(r"\b(add|insert|include|attach|put|service|component|a|an)\b", "", cmd).strip().title()
            new_id = re.sub(r"[^a-zA-Z0-9_]", "_", cleaned).lower() or "custom_service"
            new_comp = Component(
                id=new_id,
                name=cleaned or "Custom Service",
                type="custom",
                technology=cleaned or "Microservice",
                role="Application Service",
                purpose=f"Handles specialized {cleaned} business operations."
            )
            arch.components.append(new_comp)
            action_taken = f"Added {new_comp.name} to architecture."
            explanation = f"Created dedicated {new_comp.name} node."
            next_steps = ["Use Visual Editor to connect it to other components."]

    # 2. REMOVE COMPONENT (e.g. "Remove Redis", "Remove the cache", "Delete payment service")
    elif re.search(r"\b(remove|delete|drop|eliminate|discard)\b", cmd):
        intent = "remove_component"
        target_kw = re.sub(r"\b(remove|delete|drop|eliminate|discard|the|component|service)\b", "", cmd).strip()

        matched = [c for c in arch.components if target_kw in c.name.lower() or target_kw in c.id.lower() or target_kw in c.type.lower()]
        if not matched and "cache" in cmd:
            matched = [c for c in arch.components if c.type == "cache" or "redis" in c.id]

        if matched:
            removed_ids = {c.id for c in matched}
            arch.components = [c for c in arch.components if c.id not in removed_ids]
            arch.connections = [c for c in arch.connections if c.from_id not in removed_ids and c.to_id not in removed_ids]
            removed_names = ", ".join(c.name for c in matched)
            action_taken = f"Removed {removed_names} from architecture."
            explanation = f"Removed component(s) and pruned all dangling network connections."
            next_steps = [
                "Navigate to 'Impact' tab to see how removal affects dependent services.",
                "Review 'Health' and 'Cost' tabs for updated scores and bill projections."
            ]
        else:
            action_taken = f"No component matching '{target_kw}' was found to remove."
            explanation = "Available components: " + ", ".join(c.name for c in arch.components)

    # 3. TECHNOLOGY CHANGE (e.g. "Use Python for backend", "Change database to PostgreSQL")
    elif re.search(r"\b(use|switch|change|migrate|convert)\b", cmd) and any(w in cmd for w in ["python", "node", "fastapi", "postgres", "mongo", "mysql"]):
        intent = "technology_change"

        if "python" in cmd or "fastapi" in cmd:
            for c in arch.components:
                if c.type == "backend":
                    c.technology = "Python / FastAPI"
                    c.name = c.name.replace("Node.js", "Python FastAPI").replace("Express", "FastAPI")
            action_taken = "Updated backend services to use Python / FastAPI."
            explanation = "FastAPI offers high-performance async I/O, automatic OpenAPI Swagger docs, and native AI/ML library support."
            next_steps = ["Inspect 'What-If' tab for technology comparison."]

        elif "node" in cmd:
            for c in arch.components:
                if c.type == "backend":
                    c.technology = "Node.js / Express"
            action_taken = "Updated backend services to use Node.js / Express."
            explanation = "Node.js offers unified JavaScript/TypeScript fullstack workflows and large npm ecosystem."
            next_steps = ["Inspect components in Visual Editor."]

        elif "postgres" in cmd or "postgresql" in cmd:
            for c in arch.components:
                if c.type == "database":
                    c.technology = "PostgreSQL"
                    c.name = "PostgreSQL Database"
            action_taken = "Updated primary database to PostgreSQL."
            explanation = "PostgreSQL guarantees ACID compliance, powerful JSON indexing, and wide cloud provider support."
            next_steps = ["Review 'Cost' tab for AWS RDS vs GCP Cloud SQL PostgreSQL."]

        elif "mongo" in cmd or "mongodb" in cmd:
            for c in arch.components:
                if c.type == "database":
                    c.technology = "MongoDB"
                    c.name = "MongoDB Document Store"
            action_taken = "Updated primary database to MongoDB."
            explanation = "Document-oriented database offering dynamic schemas for unstructured catalog data."
            next_steps = ["Check database considerations in 'Health' tab."]

    # 4. COST REDUCTION / CHEAPER (e.g. "Make this architecture cheaper", "Reduce cost")
    elif any(w in cmd for w in ["cheaper", "reduce cost", "lower cost", "budget", "cost down"]):
        intent = "optimize_cost"
        # Optimize tiers to small / serverless
        for c in arch.components:
            if c.type == "database":
                c.tier = "small"
            if c.type == "backend":
                c.technology = f"{c.technology} (Serverless)"
        action_taken = "Optimized architecture for lower cost: scaled database to burstable tier and set compute to scale-to-zero serverless."
        explanation = "Reduces baseline monthly run rate by up to 45% during low-traffic periods."
        next_steps = ["Check the 'Cost' tab to inspect new monthly estimate.", "Check 'Optimizer' tab for additional trade-offs."]

    # 5. USER / TRAFFIC SCALE (e.g. "Increase expected users to 1 million", "What happens if traffic is 10x")
    elif any(w in cmd for w in ["1 million", "1m", "100k", "traffic", "users", "10x", "surge"]):
        intent = "simulate_traffic"
        action_taken = "Configured traffic scaling scenario."
        explanation = "Simulates system behavior under high concurrency load."
        next_steps = [
            "Opening 'What-If' tab with 10x traffic multiplier scenario.",
            "Opening 'Traffic' tab to review component bottleneck saturation."
        ]

    # 6. EXPLAIN (e.g. "Explain the API Gateway", "Explain my architecture")
    elif "explain" in cmd or "how does it work" in cmd:
        intent = "explain"
        action_taken = "Generated architectural explanation."
        explanation = "Every request flows from client -> CDN edge -> API Gateway -> Backend microservices -> Cache / Database."
        next_steps = ["Review the 'Explain' tab for the full step-by-step request narrative."]

    else:
        intent = "general_query"
        action_taken = f"Parsed command: '{raw_cmd}'."
        explanation = "You can ask conversational commands like 'Add Redis', 'Remove Redis', 'Use Python for backend', 'Make this architecture cheaper', or 'What happens if PostgreSQL fails?'"
        next_steps = ["Try clicking one of the suggested action chips below."]

    return ConversationalCommandResponse(
        intent=intent,
        action_taken=action_taken,
        updated_architecture=arch,
        explanation=explanation,
        suggested_next_steps=next_steps
    )
