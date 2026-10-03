"""
Pydantic schemas and architecture models for Voice-to-Cloud Architecture Studio
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, model_validator
import re

ComponentType = Literal[
    "frontend",
    "backend",
    "database",
    "cache",
    "queue",
    "gateway",
    "loadbalancer",
    "cdn",
    "storage",
    "auth",
    "monitoring",
    "payment",
    "custom"
]

ProtocolType = Literal["HTTP", "HTTPS", "TCP", "UDP", "WSS", "gRPC", "SQL", "Custom"]


class Component(BaseModel):
    id: str = Field(..., description="Unique alphanumeric identifier")
    name: str = Field(..., description="Display name of the component")
    type: ComponentType = Field(default="backend", description="Architecture role/category")
    role: Optional[str] = Field(default=None, description="Detailed architecture role (e.g., API Gateway, Payment Processor)")
    technology: Optional[str] = Field(default=None, description="Underlying technology (e.g., Node.js, FastAPI, PostgreSQL)")
    purpose: Optional[str] = Field(default="", description="Functional purpose of this component")
    why_recommended: Optional[str] = Field(default="", description="Why this component was recommended")
    alternatives: Optional[str] = Field(default="", description="Alternative options for this component")
    benefits: Optional[List[str]] = Field(default_factory=list, description="Key benefits")
    disadvantages: Optional[List[str]] = Field(default_factory=list, description="Trade-offs or disadvantages")
    provider: Optional[str] = Field(default=None, description="Cloud provider mapping (aws, gcp, or logical)")
    tier: Optional[str] = Field(default="standard", description="Compute/DB sizing tier")
    description: Optional[str] = Field(default="", description="Summary description")

    @model_validator(mode="before")
    @classmethod
    def sanitize_and_normalize(cls, data: Any) -> Any:
        if isinstance(data, dict):
            raw_id = data.get("id") or data.get("name") or "comp"
            data["id"] = re.sub(r"[^a-zA-Z0-9_]", "_", str(raw_id)).lower()
            if not data.get("name"):
                data["name"] = data["id"].replace("_", " ").title()
            if not data.get("technology"):
                data["technology"] = data["name"]
            if not data.get("role"):
                data["role"] = (data.get("type") or "custom").replace("_", " ").title()
            if not data.get("purpose"):
                data["purpose"] = f"Handles {data['name']} operations."
        return data


class Connection(BaseModel):
    from_id: str = Field(..., alias="from", description="Source component ID")
    to_id: str = Field(..., alias="to", description="Target component ID")
    protocol: Optional[str] = Field(default="HTTPS", description="Communication protocol")
    label: Optional[str] = Field(default="", description="Relationship or data flow label")

    model_config = {
        "populate_by_name": True
    }


class ArchitectureModel(BaseModel):
    project_name: str = Field(default="Cloud Architecture", description="Project title")
    description: Optional[str] = Field(default="", description="Original natural language prompt or notes")
    components: List[Component] = Field(default_factory=list)
    connections: List[Connection] = Field(default_factory=list)
    cloud_provider: Optional[str] = Field(default="logical", description="logical, aws, or gcp")
    provider_used: Optional[str] = Field(default=None, description="AI or fallback provider used")
    provider_notice: Optional[str] = Field(default=None, description="User friendly provider notice")
    cached: Optional[bool] = Field(default=False, description="Whether returned from cache")

    @model_validator(mode="after")
    def validate_graph(self) -> "ArchitectureModel":
        comp_ids = {c.id for c in self.components}
        # Check duplicate component IDs
        seen = set()
        for c in self.components:
            if c.id in seen:
                raise ValueError(f"Duplicate component ID detected: '{c.id}'")
            seen.add(c.id)

        # Validate connection endpoints
        for conn in self.connections:
            if conn.from_id not in comp_ids:
                raise ValueError(f"Connection source '{conn.from_id}' does not exist in components")
            if conn.to_id not in comp_ids:
                raise ValueError(f"Connection target '{conn.to_id}' does not exist in components")
        return self


# Requirement Analysis Schemas
class ClarificationQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    default_value: str
    hint: Optional[str] = None


class RequirementAnalysisResult(BaseModel):
    application_type: str = Field(..., description="E-commerce, Food Delivery, Streaming, etc.")
    needs_clarification: bool = Field(default=False)
    questions: List[ClarificationQuestion] = Field(default_factory=list)
    main_features: List[str] = Field(default_factory=list)
    expected_users: str = Field(default="10,000 - 100,000")
    data_requirements: List[str] = Field(default_factory=list)
    security_requirements: List[str] = Field(default_factory=list)
    performance_requirements: List[str] = Field(default_factory=list)
    availability_requirements: List[str] = Field(default_factory=list)
    raw_prompt: str = ""


class GenerateArchitectureRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    application_type: Optional[str] = None
    answers: Optional[Dict[str, str]] = Field(default_factory=dict)
    cloud_provider: Optional[str] = "logical"
    force_refresh: Optional[bool] = False


class ValidationIssue(BaseModel):
    type: Literal["error", "warning", "info"]
    code: str
    message: str
    component_id: Optional[str] = None


class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[ValidationIssue] = Field(default_factory=list)
    warnings: List[ValidationIssue] = Field(default_factory=list)
    summary: str


class WorkloadAssumptions(BaseModel):
    region: str = "us-east-1"
    monthly_users: int = 50000
    monthly_requests: int = 1000000
    compute_tier: Literal["small", "medium", "large", "serverless"] = "medium"
    compute_instances: int = 2
    database_storage_gb: int = 50
    database_tier: Literal["small", "medium", "large"] = "medium"
    database_multi_az: bool = False
    cache_memory_gb: int = 2
    traffic_out_gb: int = 100
    storage_gb: int = 25


class CostItem(BaseModel):
    component_id: str
    component_name: str
    cloud_service: str
    category: str
    monthly_cost: float
    yearly_cost: float
    calculation_details: str


class ProviderCost(BaseModel):
    provider_name: str
    currency: str = "USD"
    estimated_monthly_cost: float
    estimated_yearly_cost: float
    items: List[CostItem] = Field(default_factory=list)


class CostEstimateResponse(BaseModel):
    aws: ProviderCost
    gcp: ProviderCost
    cheaper_provider: str
    savings_delta: float
    assumptions: WorkloadAssumptions
    disclaimer: str = "Approximate estimate based on configured baseline pricing data. Not an actual cloud bill."


class HealthFinding(BaseModel):
    pillar: Literal["security", "scalability", "availability", "performance", "reliability", "cost"]
    type: Literal["good", "suggestion", "warning", "risk"]
    severity: Literal["none", "low", "medium", "high", "critical"]
    title: str
    description: str
    points: int = 0
    recommendation: Optional[str] = None


class PillarScore(BaseModel):
    score: int
    status: Literal["good", "warning", "risk"]
    reasons: List[str] = Field(default_factory=list)
    findings: List[HealthFinding] = Field(default_factory=list)


class HealthAnalysisResponse(BaseModel):
    overall_score: int
    pillars: Dict[str, PillarScore]
    summary: str


class TrafficSimulationRequest(BaseModel):
    architecture: ArchitectureModel
    current_users: int = 10000
    future_users: int = 100000
    requests_per_second: float = 100.0
    peak_multiplier: float = 2.5
    avg_request_size_kb: float = 15.0
    growth_rate_pct_monthly: float = 10.0
    duration_months: int = 12


class TrafficSimulationResponse(BaseModel):
    status: Literal["NORMAL", "HIGH LOAD", "CRITICAL"]
    projected_rps_peak: float
    projected_monthly_requests: int
    backend_load_pct: float
    database_load_pct: float
    cache_hit_rate_pct: float
    storage_projected_gb: float
    network_bandwidth_gb: float
    bottlenecks: List[Dict[str, Any]]
    recommendations: List[str]
    disclaimer: str = "Scenario-based estimate. Actual traffic patterns vary with real-world user behavior."


class FailureSimulationRequest(BaseModel):
    architecture: ArchitectureModel
    failure_target_id: Optional[str] = None
    failure_target_type: Optional[str] = "database"  # database, backend, cache, loadbalancer, cdn, payment


class FailureSimulationResponse(BaseModel):
    failed_component_ids: List[str]
    cascaded_failed_component_ids: List[str]
    operational_component_ids: List[str]
    business_impact: str
    severity: Literal["low", "medium", "high", "critical"]
    mitigation_strategies: List[str]
    disclaimer: str = "Scenario-based architectural failure simulation. Does not reflect live environment state."


# -------------------------------------------------------------
# New Architecture Decision & Simulation Studio Schemas
# -------------------------------------------------------------

class ImpactItem(BaseModel):
    changed_component_id: str
    affected_component_id: str
    affected_component_name: str
    impact_level: Literal["LOW IMPACT", "MEDIUM IMPACT", "HIGH IMPACT", "CRITICAL"]
    reason: str
    expected_impact: str
    suggested_mitigation: str


class ImpactDependencyNode(BaseModel):
    id: str
    name: str
    role: str
    status: str = "normal"  # normal, changed, affected, critical
    incoming: List[str] = Field(default_factory=list)
    outgoing: List[str] = Field(default_factory=list)


class ImpactAnalysisRequest(BaseModel):
    architecture: ArchitectureModel
    action: Literal["remove", "add", "modify", "fail"] = "modify"
    target_component_id: Optional[str] = None
    new_component: Optional[Component] = None


class ImpactAnalysisResponse(BaseModel):
    target_id: Optional[str] = None
    overall_impact_level: Literal["LOW IMPACT", "MEDIUM IMPACT", "HIGH IMPACT", "CRITICAL"] = "LOW IMPACT"
    affected_components: List[ImpactItem] = Field(default_factory=list)
    dependency_graph: List[ImpactDependencyNode] = Field(default_factory=list)
    summary: str = ""
    disclaimer: str = "Scenario-based dependency and impact analysis. Not an absolute runtime guarantee."


class WhatIfRequest(BaseModel):
    architecture: ArchitectureModel
    scenario_name: str = "Scenario Simulation"
    scenario_type: Literal[
        "traffic_increase",
        "traffic_decrease",
        "component_failure",
        "component_removal",
        "component_addition",
        "technology_change",
        "budget_constraint",
        "storage_growth",
        "user_growth",
        "custom"
    ] = "traffic_increase"
    scenario_description: Optional[str] = ""
    parameters: Dict[str, Any] = Field(default_factory=dict)


class WhatIfResponse(BaseModel):
    scenario_name: str
    scenario_type: str
    baseline_summary: Dict[str, Any]
    simulated_summary: Dict[str, Any]
    delta: Dict[str, Any]
    traffic_impact: Dict[str, Any]
    performance_impact: Dict[str, Any]
    cost_impact: Dict[str, Any]
    affected_components: List[Dict[str, Any]] = Field(default_factory=list)
    bottlenecks: List[Dict[str, Any]] = Field(default_factory=list)
    failure_risks: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    simulated_architecture: Optional[ArchitectureModel] = None
    disclaimer: str = "Scenario-based simulation. Not an exact production prediction."


class GrowthPeriodEstimate(BaseModel):
    period_month: int
    label: str
    projected_users: int
    requests_per_sec: float
    backend_load_pct: float
    database_load_pct: float
    storage_gb: float
    bandwidth_gb: float
    estimated_monthly_cost: float
    status: Literal["NORMAL", "HIGH LOAD", "CRITICAL"]
    bottleneck_note: str


class GrowthSimulationRequest(BaseModel):
    architecture: ArchitectureModel
    current_users: int = 10000
    monthly_growth_rate_pct: float = 15.0
    duration_months: int = 12
    avg_request_size_kb: float = 15.0


class GrowthSimulationResponse(BaseModel):
    timeline: List[GrowthPeriodEstimate]
    summary: str
    milestone_bottlenecks: List[Dict[str, Any]] = Field(default_factory=list)
    disclaimer: str = "This is a scenario-based estimate using the provided assumptions. Not a guaranteed future prediction."


class ArchitectureDecision(BaseModel):
    id: str
    component_id: Optional[str] = None
    component_name: Optional[str] = None
    decision: str
    reason: str
    alternative: str
    trade_off: str
    status: Literal["active", "superseded", "changed"] = "active"
    version: Optional[str] = "v1.0"
    created_at: Optional[str] = None


class ExperimentModel(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    architecture: ArchitectureModel
    requirements: Optional[Dict[str, Any]] = None
    traffic_assumptions: Optional[Dict[str, Any]] = None
    cost_assumptions: Optional[Dict[str, Any]] = None
    cloud_provider: str = "logical"
    region: str = "us-east-1"
    simulation_results: Optional[Dict[str, Any]] = None
    recommendations: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None


class ArchitectureMetricComparison(BaseModel):
    metric: str
    category: str
    arch_values: Dict[str, Any]
    description: str


class ArchitectureComparisonRequest(BaseModel):
    architectures: List[ArchitectureModel]
    requirements: Optional[Dict[str, Any]] = None


class ArchitectureComparisonResponse(BaseModel):
    summary: str
    metrics: List[ArchitectureMetricComparison]
    profiles: List[Dict[str, Any]]
    trade_off_analysis: Dict[str, str]
    disclaimer: str = "Objective multi-metric comparison. Final architectural selection depends on business constraints and SLA priorities."


class ConversationalCommandRequest(BaseModel):
    command: str
    architecture: ArchitectureModel


class ConversationalCommandResponse(BaseModel):
    intent: str
    action_taken: str
    updated_architecture: ArchitectureModel
    explanation: str
    suggested_next_steps: List[str] = Field(default_factory=list)

