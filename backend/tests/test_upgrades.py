"""
Integration and unit tests for the Voice-to-Cloud Studio Upgrade features:
- AI Provider Fallback System
- AI Usage Manager
- Response Caching
- Scaled Architecture Generation
- Architecture Explainer
- Technology Comparison
- Enhanced Architecture Validation
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.architecture import ArchitectureModel, Component, Connection
from backend.services.scaling_engine import generate_scaled_architecture
from backend.services.architecture_explainer import explain_architecture_narrative
from backend.services.tech_comparator import compare_technologies
from backend.services.cache_manager import response_cache
from backend.services.ai_usage_manager import usage_manager
from backend.services.architecture_validator import repair_architecture_dict, validate_architecture

client = TestClient(app)


def test_ai_provider_fallback_generation():
    """Verify generate-architecture gracefully uses fallback provider without crashing."""
    payload = {
        "prompt": "Build a real-time chat application with WebSocket and messages storage.",
        "application_type": "Social Media",
        "answers": {},
        "cloud_provider": "logical"
    }
    response = client.post("/api/generate-architecture", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "components" in data
    assert len(data["components"]) >= 3
    assert data.get("provider_used") is not None


def test_response_caching():
    """Verify caching works for identical requests and tracks cache hits."""
    prompt = "Unique test prompt for caching verification 12345"
    payload = {
        "prompt": prompt,
        "application_type": "E-commerce",
        "answers": {"q_users": "10,000 – 100,000 users"},
        "cloud_provider": "logical"
    }

    # First call: populates cache
    res1 = client.post("/api/generate-architecture", json=payload)
    assert res1.status_code == 200
    data1 = res1.json()

    # Second call: should hit cache
    res2 = client.post("/api/generate-architecture", json=payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2.get("cached") is True

    # Usage stats should record at least 1 cached request
    stats_res = client.get("/api/ai/usage")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["cached_requests"] >= 1


def test_scaled_architecture_generation():
    """Verify generate-scaled-architecture adds high-availability components."""
    base_arch = ArchitectureModel(
        project_name="Simple Web App",
        components=[
            Component(id="web", name="React Web", type="frontend", role="Frontend", technology="React"),
            Component(id="api", name="FastAPI Service", type="backend", role="Backend", technology="FastAPI"),
            Component(id="db", name="PostgreSQL DB", type="database", role="Database", technology="PostgreSQL")
        ],
        connections=[
            Connection(**{"from": "web", "to": "api", "protocol": "HTTPS"}),
            Connection(**{"from": "api", "to": "db", "protocol": "SQL"})
        ]
    )

    scaled = generate_scaled_architecture(base_arch, target_users=1000000)
    scaled_types = {c.type for c in scaled.components}

    # Verify Load Balancer and Cache were added
    assert "loadbalancer" in scaled_types
    assert "cache" in scaled_types
    assert "cdn" in scaled_types
    assert any("Replica" in c.name for c in scaled.components)


def test_architecture_explainer():
    """Verify plain English explanation generation."""
    sample_arch = ArchitectureModel(
        project_name="Test Store",
        components=[
            Component(id="fe", name="Storefront", type="frontend", role="UI", technology="Next.js"),
            Component(id="be", name="Order API", type="backend", role="API", technology="FastAPI"),
            Component(id="db", name="Catalog DB", type="database", role="DB", technology="PostgreSQL")
        ],
        connections=[
            Connection(**{"from": "fe", "to": "be", "protocol": "HTTPS"}),
            Connection(**{"from": "be", "to": "db", "protocol": "SQL"})
        ]
    )

    explanation = explain_architecture_narrative(sample_arch)
    assert "summary" in explanation
    assert len(explanation["components_explanation"]) == 3
    assert len(explanation["request_flow"]) >= 3
    assert any("Storefront" in step for step in explanation["request_flow"])


def test_technology_comparison():
    """Verify multi-criteria comparison."""
    comp_res = compare_technologies(["fastapi", "node", "postgresql", "redis"])
    techs = comp_res["technologies"]
    assert len(techs) == 4
    fastapi_tech = next(t for t in techs if "fastapi" in t["name"].lower())
    assert "architecture_fit" in fastapi_tech
    assert "complexity" in fastapi_tech
    assert "estimated_monthly_base" in fastapi_tech


def test_repair_and_validation():
    """Verify auto-repair of malformed AI payloads."""
    malformed = {
        "project_name": "Broken App",
        "components": [
            {"id": "COMP-1", "name": "API Service"},
            {"id": "COMP-1", "name": "API Service Duplicate"}
        ],
        "connections": [
            {"from": "COMP-1", "to": "COMP-1"} # Self-loop
        ]
    }
    repaired = repair_architecture_dict(malformed)
    # Check duplicate ID resolved
    ids = [c["id"] for c in repaired["components"]]
    assert len(ids) == len(set(ids)), "IDs must be unique"
    # Self loops removed
    assert len(repaired["connections"]) == 0
