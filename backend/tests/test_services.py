"""
Comprehensive Unit Tests for Voice-to-Cloud Architecture Studio Services
"""

import pytest
from backend.services.requirement_analyzer import analyze_requirements, is_explicit_technical_prompt
from backend.services.architecture_generator import generate_architecture_from_requirements
from backend.services.architecture_validator import validate_architecture
from backend.services.health_analyzer import analyze_health
from backend.services.cost_estimator import estimate_costs
from backend.services.traffic_simulator import simulate_traffic
from backend.services.failure_simulator import simulate_failure
from backend.services.optimizer import get_optimizations, get_tradeoff_profiles
from backend.services.cloud_mapper import map_architecture_to_cloud
from backend.services.terraform_generator import generate_terraform_code
from backend.models.architecture import (
    ArchitectureModel,
    Component,
    Connection,
    WorkloadAssumptions,
    TrafficSimulationRequest,
    FailureSimulationRequest
)


def test_acceptance_test_1_generic_shopping():
    """
    Test 1: Input 'I want to build a shopping website.'
    Expected: System identifies e-commerce and asks useful clarification questions.
    """
    prompt = "I want to build a shopping website."
    result = analyze_requirements(prompt)
    assert result.application_type == "E-commerce"
    assert result.needs_clarification is True
    assert len(result.questions) >= 4
    # Check that questions cover expected users, payments, uploads, etc.
    q_ids = [q.id for q in result.questions]
    assert "q_users" in q_ids
    assert "q_payments" in q_ids
    assert "q_uploads" in q_ids


def test_acceptance_test_2_generic_food_delivery():
    """
    Test 2: Input 'I want to build a food delivery app where users order food and track delivery.'
    Expected: Generates a meaningful architecture without requiring React/Node.js keywords.
    """
    prompt = "I want to build a food delivery app where users order food and track delivery."
    arch = generate_architecture_from_requirements(prompt)
    assert len(arch.components) >= 5
    types = {c.type for c in arch.components}
    assert "frontend" in types
    assert "backend" in types
    assert "database" in types
    assert "cache" in types
    # Check that technology != role
    for comp in arch.components:
        assert comp.role is not None
        assert comp.technology is not None
        assert comp.why_recommended is not None
        assert len(comp.why_recommended) > 0


def test_acceptance_test_3_explicit_technical_prompt():
    """
    Test 3: Input 'React frontend connected to FastAPI with Redis and PostgreSQL.'
    Expected: Generates corresponding architecture directly without requiring clarification.
    """
    prompt = "React frontend connected to FastAPI with Redis and PostgreSQL."
    assert is_explicit_technical_prompt(prompt) is True
    req = analyze_requirements(prompt)
    assert req.needs_clarification is False

    arch = generate_architecture_from_requirements(prompt)
    names = [c.name for c in arch.components]
    assert "React" in names
    assert "FastAPI" in names
    assert "Redis" in names
    assert "PostgreSQL" in names
    assert len(arch.connections) >= 3


def test_acceptance_test_4_and_9_component_manipulation():
    """
    Test 4 & 9: Component modifications (delete, add Payment service) update health, cost, and validation.
    """
    prompt = "React frontend connected to FastAPI with Redis and PostgreSQL."
    arch = generate_architecture_from_requirements(prompt)

    # Base health and cost
    h_before = analyze_health(arch)
    c_before = estimate_costs(arch)

    # Remove Redis
    arch_no_redis = ArchitectureModel(
        project_name=arch.project_name,
        components=[c for c in arch.components if c.type != "cache"],
        connections=[conn for conn in arch.connections if conn.from_id != "cache" and conn.to_id != "cache"]
    )
    h_after = analyze_health(arch_no_redis)
    c_after = estimate_costs(arch_no_redis)

    # Health scalability score should reflect missing cache
    assert h_after.pillars["scalability"].score < h_before.pillars["scalability"].score
    # Cost should decrease because Redis cache instance was removed
    assert c_after.aws.estimated_monthly_cost < c_before.aws.estimated_monthly_cost

    # Add Payment Service
    payment_comp = Component(
        id="payment_svc",
        name="Stripe Payment Service",
        type="payment",
        role="Payment Gateway",
        technology="Python / Stripe",
        purpose="Processes customer credit cards securely.",
        why_recommended="PCI isolation."
    )
    arch_with_payment = ArchitectureModel(
        project_name=arch.project_name,
        components=arch.components + [payment_comp],
        connections=arch.connections + [Connection(from_id="backend", to_id="payment_svc", label="Process Charge", protocol="REST")]
    )
    c_with_payment = estimate_costs(arch_with_payment)
    assert c_with_payment.aws.estimated_monthly_cost > c_before.aws.estimated_monthly_cost
    val = validate_architecture(arch_with_payment)
    assert val.is_valid is True


def test_acceptance_test_5_traffic_simulation_scaling():
    """
    Test 5: Change 10,000 users -> 1,000,000 users.
    Expected: Traffic analysis and bottleneck recommendations change dynamically.
    """
    prompt = "React frontend connected to FastAPI with Redis and PostgreSQL."
    arch = generate_architecture_from_requirements(prompt)

    # Normal traffic scenario
    sim_low = simulate_traffic(TrafficSimulationRequest(
        architecture=arch,
        current_users=10000,
        future_users=10000,
        requests_per_second=20
    ))
    assert sim_low.status in ["NORMAL", "HIGH LOAD"]

    # Massive surge scenario
    sim_high = simulate_traffic(TrafficSimulationRequest(
        architecture=arch,
        current_users=10000,
        future_users=1000000,
        requests_per_second=500,
        peak_multiplier=3.0
    ))
    assert sim_high.status == "CRITICAL"
    assert sim_high.projected_rps_peak > sim_low.projected_rps_peak
    assert len(sim_high.bottlenecks) > 0


def test_acceptance_test_6_failure_simulator():
    """
    Test 6: Simulate Database failure.
    Expected: Affected components are identified and mitigation suggestions appear.
    """
    prompt = "React frontend connected to FastAPI with Redis and PostgreSQL."
    arch = generate_architecture_from_requirements(prompt)

    res = simulate_failure(FailureSimulationRequest(
        architecture=arch,
        failure_target_type="database"
    ))
    assert "database" in res.failed_component_ids
    assert len(res.cascaded_failed_component_ids) > 0
    assert len(res.mitigation_strategies) >= 3
    assert res.severity == "critical"


def test_acceptance_test_7_and_8_cloud_mapping():
    """
    Test 7 & 8: AWS and GCP service mapping.
    """
    prompt = "React frontend connected to FastAPI with Redis and PostgreSQL."
    arch = generate_architecture_from_requirements(prompt)

    aws_mapping = map_architecture_to_cloud(arch, "aws")
    gcp_mapping = map_architecture_to_cloud(arch, "gcp")

    assert len(aws_mapping) == len(arch.components)
    assert len(gcp_mapping) == len(arch.components)

    # Verify RDS for AWS DB and Cloud SQL for GCP DB
    db_aws = next(m for m in aws_mapping if m["component_id"] == "database")
    db_gcp = next(m for m in gcp_mapping if m["component_id"] == "database")

    assert "RDS" in db_aws["suggested_service"]
    assert "Cloud SQL" in db_gcp["suggested_service"]


def test_architecture_validator_catches_public_db_exposure():
    """
    Security check: Direct connection from frontend to database should be flagged as an error.
    """
    fe = Component(id="fe", name="React Web", type="frontend")
    db = Component(id="db", name="Postgres", type="database")
    invalid_arch = ArchitectureModel(
        project_name="Insecure Arch",
        components=[fe, db],
        connections=[Connection(from_id="fe", to_id="db", label="Direct SQL", protocol="SQL")]
    )
    val = validate_architecture(invalid_arch)
    assert val.is_valid is False
    assert any(e.code == "PUBLIC_DATABASE_EXPOSURE" for e in val.errors)


def test_terraform_generator():
    """
    Terraform generator generates valid HCL preview for AWS and GCP.
    """
    prompt = "React frontend connected to FastAPI with Redis and PostgreSQL."
    arch = generate_architecture_from_requirements(prompt)

    tf_aws = generate_terraform_code(arch, "aws")
    assert "provider \"aws\"" in tf_aws["hcl_code"]
    assert "aws_db_instance" in tf_aws["hcl_code"]

    tf_gcp = generate_terraform_code(arch, "gcp")
    assert "provider \"google\"" in tf_gcp["hcl_code"]
    assert "google_sql_database_instance" in tf_gcp["hcl_code"]
