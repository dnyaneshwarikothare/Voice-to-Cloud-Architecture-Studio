"""
API Integration Tests using FastAPI TestClient
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "analyze_requirements" in data["endpoints"]


def test_api_analyze_requirements():
    res = client.post("/api/analyze-requirements", json={
        "text": "I want to build an online shopping website"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["application_type"] == "E-commerce"
    assert data["needs_clarification"] is True
    assert len(data["questions"]) >= 4


def test_api_generate_architecture():
    res = client.post("/api/generate-architecture", json={
        "prompt": "I want to build a shopping website",
        "answers": {
            "q_users": "100,000+ users",
            "q_payments": "Yes, online payments",
            "q_uploads": "Yes, file/image uploads",
            "q_notifications": "Yes, real-time notifications"
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["components"]) >= 6
    assert len(data["connections"]) >= 5


def test_api_validate_architecture():
    # Valid architecture
    arch = {
        "project_name": "Test App",
        "components": [
            {"id": "fe", "name": "Frontend", "type": "frontend"},
            {"id": "be", "name": "Backend", "type": "backend"},
            {"id": "db", "name": "Database", "type": "database"}
        ],
        "connections": [
            {"from": "fe", "to": "be", "label": "REST"},
            {"from": "be", "to": "db", "label": "SQL"}
        ]
    }
    res = client.post("/api/validate-architecture", json=arch)
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True


def test_api_health_cost_traffic():
    arch = {
        "project_name": "Test App",
        "components": [
            {"id": "fe", "name": "React", "type": "frontend"},
            {"id": "be", "name": "FastAPI", "type": "backend"},
            {"id": "ca", "name": "Redis", "type": "cache"},
            {"id": "db", "name": "PostgreSQL", "type": "database"}
        ],
        "connections": [
            {"from": "fe", "to": "be", "label": "REST"},
            {"from": "be", "to": "ca", "label": "Cache"},
            {"from": "be", "to": "db", "label": "SQL"}
        ]
    }

    # Health
    res_h = client.post("/api/analyze-health", json=arch)
    assert res_h.status_code == 200
    assert res_h.json()["overall_score"] > 0

    # Cost
    res_c = client.post("/api/estimate-cost", json={"architecture": arch})
    assert res_c.status_code == 200
    assert res_c.json()["aws"]["estimated_monthly_cost"] > 0

    # Traffic
    res_t = client.post("/api/simulate-traffic", json={
        "architecture": arch,
        "current_users": 10000,
        "future_users": 50000,
        "requests_per_second": 50
    })
    assert res_t.status_code == 200
    assert res_t.json()["status"] in ["NORMAL", "HIGH LOAD", "CRITICAL"]


def test_api_demos():
    res = client.get("/api/demos")
    assert res.status_code == 200
    demos = res.json()
    assert len(demos) == 9
    demo_names = [d["name"] for d in demos]
    assert "E-commerce" in demo_names
    assert "Food Delivery" in demo_names
    assert "Social Media" in demo_names
    assert "Video Streaming" in demo_names
    assert "College Management" in demo_names
    assert "Online Banking" in demo_names
    assert "IoT Monitoring" in demo_names
    assert "File Storage" in demo_names
    assert "AI Application" in demo_names


def test_api_project_crud():
    arch = {
        "project_name": "CRUD Test",
        "components": [{"id": "be", "name": "API", "type": "backend"}],
        "connections": []
    }
    # Create
    create_res = client.post("/api/projects", json={
        "name": "My Architecture Project",
        "description": "Test description",
        "cloud_provider": "aws",
        "architecture": arch
    })
    assert create_res.status_code == 200
    project_id = create_res.json()["id"]

    # Read
    get_res = client.get(f"/api/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "My Architecture Project"

    # List
    list_res = client.get("/api/projects")
    assert list_res.status_code == 200
    assert any(p["id"] == project_id for p in list_res.json())

    # Delete
    del_res = client.delete(f"/api/projects/{project_id}")
    assert del_res.status_code == 200
