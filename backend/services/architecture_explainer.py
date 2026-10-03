"""
Architecture Explainer Service
Generates simple, plain-English explanations of cloud architectures for beginners.
Breaks down component roles, interactions, and step-by-step request flow journeys.
"""

from typing import Dict, Any, List
from backend.models.architecture import ArchitectureModel

ANALOGY_MAP = {
    "frontend": "the storefront window and cash register where customers interact",
    "backend": "the kitchen and kitchen staff that takes orders, cooks the food, and coordinates everything",
    "database": "the locked filing cabinet or warehouse where all customer records and order histories are safely stored forever",
    "cache": "a quick-access desk notepad storing the most popular dishes so the chef doesn't have to walk back to the filing cabinet every minute",
    "queue": "a ticket conveyor belt holding orders during busy lunchtime rushes so nothing gets dropped or forgotten",
    "gateway": "the front-door security guard and greeter who checks tickets, prevents crowd surges, and directs visitors",
    "loadbalancer": "the host or hostess who evenly divides waiting diners among multiple open waiter stations",
    "cdn": "local branch offices stationed in every major city worldwide so visitors don't have to travel across the globe to view the menu",
    "storage": "a huge digital warehouse holding photos, video recordings, and large files",
    "auth": "the ID checker making sure users are really who they claim to be",
    "monitoring": "the control room alarms and temperature gauges alerting engineers if any machine gets too hot"
}


def explain_architecture_narrative(arch: ArchitectureModel) -> Dict[str, Any]:
    """
    Returns an educational, beginner-friendly narrative explaining the architecture.
    """
    components = arch.components or []
    connections = arch.connections or []

    if not components:
        return {
            "summary": "This architecture has no components yet. Add some components or enter a prompt to generate an explanation.",
            "components_explanation": [],
            "request_flow": [],
            "key_takeaways": []
        }

    # 1. Per-component explanations
    comp_explanations = []
    for comp in components:
        comp_type = comp.type.lower()
        analogy = ANALOGY_MAP.get(comp_type, "a dedicated building block supporting system operations")
        tech = comp.technology or comp.name

        simple_role = comp.role or comp.type.title()
        explanation = f"{comp.name} ({tech}) acts as {analogy}. {comp.purpose}"

        comp_explanations.append({
            "id": comp.id,
            "name": comp.name,
            "type": comp.type,
            "technology": tech,
            "simple_explanation": explanation,
            "analogy": analogy
        })

    # 2. Step-by-Step Request Flow
    flow_steps: List[str] = []
    step_num = 1

    frontends = [c for c in components if c.type == "frontend"]
    cdns = [c for c in components if c.type == "cdn"]
    gateways = [c for c in components if c.type in ["gateway", "loadbalancer"]]
    backends = [c for c in components if c.type in ["backend", "payment"]]
    caches = [c for c in components if c.type == "cache"]
    databases = [c for c in components if c.type == "database"]

    if cdns:
        flow_steps.append(f"Step {step_num}: A user opens the application in their browser or phone. The request hits {cdns[0].name}, which immediately serves static assets from the nearest edge location.")
        step_num += 1

    if frontends:
        flow_steps.append(f"Step {step_num}: The user interacts with {frontends[0].name}, clicking buttons or submitting forms.")
        step_num += 1

    if gateways:
        flow_steps.append(f"Step {step_num}: API requests pass through {gateways[0].name}, which inspects traffic, handles SSL encryption, and routes requests safely.")
        step_num += 1

    if backends:
        flow_steps.append(f"Step {step_num}: {backends[0].name} receives the API request, executes business logic, verifies authentication, and calculates results.")
        step_num += 1

    if caches:
        flow_steps.append(f"Step {step_num}: Before querying the main database, the backend checks {caches[0].name} for fast in-memory cached responses.")
        step_num += 1

    if databases:
        flow_steps.append(f"Step {step_num}: If the data is not in cache, the backend reads or writes persistent records in {databases[0].name}.")
        step_num += 1

    flow_steps.append(f"Step {step_num}: The response travels back up the chain to the user's screen in milliseconds.")

    # 3. Summary
    tech_list = [c.technology for c in components if c.technology]
    tech_summary = ", ".join(tech_list[:4])
    summary_text = (
        f"This system is built using {tech_summary}. "
        f"It separates user interface concerns, application business logic, and persistent storage "
        f"into {len(components)} decoupled components linked by {len(connections)} secure communication channels."
    )

    takeaways = [
        f"Decoupled Architecture: Each of the {len(components)} components can be scaled or updated independently without taking down the whole app.",
        "Security-First Design: Private databases and caches are shielded from direct user internet access.",
        "Clear Separation: Frontend handles display, Backend handles computation, Database guarantees persistence."
    ]

    return {
        "summary": summary_text,
        "components_explanation": comp_explanations,
        "request_flow": flow_steps,
        "key_takeaways": takeaways
    }
