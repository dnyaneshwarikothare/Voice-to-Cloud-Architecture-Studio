"""
Unit and API integration tests for the Advanced Architecture Decision & Simulation Studio
Tests What-If, Impact Analysis, Growth Simulation, Multi-Arch Comparison,
Conversational Commands, and ADR Decision Memory.
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.models.architecture import ArchitectureModel, Component, Connection

client = TestClient(app)


@pytest.fixture
def sample_arch():
    return {
        "project_name": "Test E-Commerce Store",
        "cloud_provider": "logical",
        "components": [
            {
                "id": "frontend",
                "name": "React Web Storefront",
                "type": "frontend",
                "technology": "React",
                "role": "Single Page Application",
                "purpose": "Serves shopping catalog UI to customers."
            },
            {
                "id": "api_gateway",
                "name": "API Gateway",
                "type": "gateway",
                "technology": "Kong / AWS API Gateway",
                "role": "API Gateway",
                "purpose": "Routes requests and enforces rate limits."
            },
            {
                "id": "backend_order",
                "name": "Order Service",
                "type": "backend",
                "technology": "FastAPI",
                "role": "Microservice",
                "purpose": "Handles order placement and checkout logic."
            },
            {
                "id": "redis_cache",
                "name": "Redis In-Memory Cache",
                "type": "cache",
                "technology": "Redis",
                "role": "Cache",
                "purpose": "Caches product catalog records."
            },
            {
                "id": "db_postgres",
                "name": "PostgreSQL Database",
                "type": "database",
                "technology": "PostgreSQL",
                "role": "Database",
                "purpose": "Persists transactional orders and inventory."
            }
        ],
        "connections": [
            {"from": "frontend", "to": "api_gateway", "protocol": "HTTPS", "label": "API Calls"},
            {"from": "api_gateway", "to": "backend_order", "protocol": "HTTPS", "label": "Routes /orders"},
            {"from": "backend_order", "to": "redis_cache", "protocol": "TCP", "label": "Cache Lookups"},
            {"from": "backend_order", "to": "db_postgres", "protocol": "SQL", "label": "Persists Data"}
        ]
    }


def test_api_analyze_impact(sample_arch):
    # Test impact when removing Redis cache
    payload = {
        "architecture": sample_arch,
        "action": "remove",
        "target_component_id": "redis_cache"
    }
    res = client.post("/api/analyze-impact", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["target_id"] == "redis_cache"
    assert data["overall_impact_level"] == "HIGH IMPACT"
    assert len(data["affected_components"]) > 0
    # Must identify database as affected
    db_affected = any("postgres" in item["affected_component_id"] for item in data["affected_components"])
    assert db_affected is True


def test_api_run_what_if_traffic_increase(sample_arch):
    payload = {
        "architecture": sample_arch,
        "scenario_name": "10x Black Friday Spike",
        "scenario_type": "traffic_increase",
        "parameters": {"multiplier": 10.0, "current_users": 10000, "current_rps": 100}
    }
    res = client.post("/api/run-what-if", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_name"] == "10x Black Friday Spike"
    assert data["delta"]["users_delta"] == 90000
    assert data["traffic_impact"]["projected_rps"] == 1000.0
    assert len(data["recommendations"]) > 0
    assert "scenario-based" in data["disclaimer"].lower()


def test_api_simulate_growth(sample_arch):
    payload = {
        "architecture": sample_arch,
        "current_users": 10000,
        "monthly_growth_rate_pct": 15.0,
        "duration_months": 12
    }
    res = client.post("/api/simulate-growth", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["timeline"]) >= 4
    # Final month users must be greater than starting users
    assert data["timeline"][-1]["projected_users"] > 10000
    assert "timeline" in data


def test_api_compare_architectures(sample_arch):
    # Create two variant architectures
    arch1 = dict(sample_arch)
    arch1["project_name"] = "Architecture A (Lean)"

    arch2 = dict(sample_arch)
    arch2["project_name"] = "Architecture B (High Scale)"
    # Add CDN to arch2
    arch2["components"] = list(sample_arch["components"]) + [{
        "id": "cdn_edge",
        "name": "CloudFront CDN",
        "type": "cdn",
        "technology": "CloudFront",
        "role": "CDN",
        "purpose": "Edge delivery"
    }]

    payload = {
        "architectures": [arch1, arch2]
    }
    res = client.post("/api/compare-architectures", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["profiles"]) == 2
    assert len(data["metrics"]) >= 5
    assert "arch_1" in data["trade_off_analysis"]
    assert "arch_2" in data["trade_off_analysis"]


def test_api_conversational_commands(sample_arch):
    # Test conversational "Add Payment Service"
    payload = {
        "command": "Add payment service",
        "architecture": sample_arch
    }
    res = client.post("/api/conversational-command", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "add_component"
    assert any("payment" in c["id"] for c in data["updated_architecture"]["components"])

    # Test conversational "Remove Redis"
    payload2 = {
        "command": "Remove Redis",
        "architecture": data["updated_architecture"]
    }
    res2 = client.post("/api/conversational-command", json=payload2)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["intent"] == "remove_component"
    assert not any("redis" in c["id"] for c in data2["updated_architecture"]["components"])


def test_api_decisions_crud():
    # List initial decisions
    res = client.get("/api/decisions")
    assert res.status_code == 200
    initial_list = res.json()
    assert len(initial_list) >= 3

    # Add a new ADR
    new_adr = {
        "id": "adr_test_kafka",
        "component_id": "kafka",
        "component_name": "Kafka Event Streaming",
        "decision": "Use Kafka for asynchronous event logging",
        "reason": "Decouples order ingestion from inventory processing",
        "alternative": "Synchronous REST calls",
        "trade_off": "Adds broker cluster operational overhead",
        "status": "active",
        "version": "v1.1"
    }
    res2 = client.post("/api/decisions", json=new_adr)
    assert res2.status_code == 200
    assert res2.json()["id"] == "adr_test_kafka"

    # Delete the ADR
    res3 = client.delete("/api/decisions/adr_test_kafka")
    assert res3.status_code == 200
