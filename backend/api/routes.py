"""
FastAPI REST API Routes for AI Voice-to-Cloud Architecture Studio
"""

import json
from typing import List, Dict, Any, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

try:
    from backend.models.architecture import (
        ArchitectureModel,
        RequirementAnalysisResult,
        GenerateArchitectureRequest,
        ValidationResult,
        WorkloadAssumptions,
        CostEstimateResponse,
        HealthAnalysisResponse,
        TrafficSimulationRequest,
        TrafficSimulationResponse,
        FailureSimulationRequest,
        FailureSimulationResponse,
        ImpactAnalysisRequest,
        ImpactAnalysisResponse,
        WhatIfRequest,
        WhatIfResponse,
        GrowthSimulationRequest,
        GrowthSimulationResponse,
        ArchitectureDecision,
        ArchitectureComparisonRequest,
        ArchitectureComparisonResponse,
        ConversationalCommandRequest,
        ConversationalCommandResponse
    )
    from backend.models.project import ProjectORM, ProjectCreate, ProjectUpdate, ProjectResponse
    from backend.database.database import get_db
    from backend.services import (
        analyze_requirements,
        generate_architecture_from_requirements,
        validate_architecture,
        analyze_health,
        estimate_costs,
        simulate_traffic,
        simulate_failure,
        get_optimizations,
        get_tradeoff_profiles,
        map_architecture_to_cloud,
        generate_terraform_code,
        analyze_impact,
        run_what_if_simulation,
        simulate_growth,
        compare_architectures,
        execute_conversational_command,
        list_decisions,
        add_decision,
        delete_decision
    )
except (ImportError, ValueError):
    try:
        from ..models.architecture import (  # type: ignore
            ArchitectureModel,
            RequirementAnalysisResult,
            GenerateArchitectureRequest,
            ValidationResult,
            WorkloadAssumptions,
            CostEstimateResponse,
            HealthAnalysisResponse,
            TrafficSimulationRequest,
            TrafficSimulationResponse,
            FailureSimulationRequest,
            FailureSimulationResponse,
            ImpactAnalysisRequest,
            ImpactAnalysisResponse,
            WhatIfRequest,
            WhatIfResponse,
            GrowthSimulationRequest,
            GrowthSimulationResponse,
            ArchitectureDecision,
            ArchitectureComparisonRequest,
            ArchitectureComparisonResponse,
            ConversationalCommandRequest,
            ConversationalCommandResponse
        )
        from ..models.project import ProjectORM, ProjectCreate, ProjectUpdate, ProjectResponse  # type: ignore
        from ..database.database import get_db  # type: ignore
        from ..services import (  # type: ignore
            analyze_requirements,
            generate_architecture_from_requirements,
            validate_architecture,
            analyze_health,
            estimate_costs,
            simulate_traffic,
            simulate_failure,
            get_optimizations,
            get_tradeoff_profiles,
            map_architecture_to_cloud,
            generate_terraform_code,
            analyze_impact,
            run_what_if_simulation,
            simulate_growth,
            compare_architectures,
            execute_conversational_command,
            list_decisions,
            add_decision,
            delete_decision
        )
    except (ImportError, ValueError):
        from models.architecture import (  # type: ignore
            ArchitectureModel,
            RequirementAnalysisResult,
            GenerateArchitectureRequest,
            ValidationResult,
            WorkloadAssumptions,
            CostEstimateResponse,
            HealthAnalysisResponse,
            TrafficSimulationRequest,
            TrafficSimulationResponse,
            FailureSimulationRequest,
            FailureSimulationResponse,
            ImpactAnalysisRequest,
            ImpactAnalysisResponse,
            WhatIfRequest,
            WhatIfResponse,
            GrowthSimulationRequest,
            GrowthSimulationResponse,
            ArchitectureDecision,
            ArchitectureComparisonRequest,
            ArchitectureComparisonResponse,
            ConversationalCommandRequest,
            ConversationalCommandResponse
        )
        from models.project import ProjectORM, ProjectCreate, ProjectUpdate, ProjectResponse  # type: ignore
        from database.database import get_db  # type: ignore
        from services import (  # type: ignore
            analyze_requirements,
            generate_architecture_from_requirements,
            validate_architecture,
            analyze_health,
            estimate_costs,
            simulate_traffic,
            simulate_failure,
            get_optimizations,
            get_tradeoff_profiles,
            map_architecture_to_cloud,
            generate_terraform_code,
            analyze_impact,
            run_what_if_simulation,
            simulate_growth,
            compare_architectures,
            execute_conversational_command,
            list_decisions,
            add_decision,
            delete_decision
        )

router = APIRouter(prefix="/api", tags=["Architecture Studio"])


class AnalyzeRequirementsRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Idea or description")
    answers: Optional[Dict[str, str]] = Field(default_factory=dict)


class CostRequest(BaseModel):
    architecture: ArchitectureModel
    assumptions: Optional[WorkloadAssumptions] = None


class OptimizeRequest(BaseModel):
    architecture: ArchitectureModel


class TerraformRequest(BaseModel):
    architecture: ArchitectureModel
    provider: str = "aws"


class CloudMapRequest(BaseModel):
    architecture: ArchitectureModel
    provider: str = "aws"


# 0. API Health Check Endpoint
@router.get("/health")
def api_health():
    return {"status": "ok", "service": "Voice-to-Cloud Studio API"}


# 1. Natural Language Idea Requirement Analyzer
@router.post("/analyze-requirements", response_model=RequirementAnalysisResult)
def api_analyze_requirements(req: AnalyzeRequirementsRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Prompt text cannot be empty")
    return analyze_requirements(req.text, req.answers)


# 2. Architecture Generator
@router.post("/generate-architecture", response_model=ArchitectureModel)
def api_generate_architecture(req: GenerateArchitectureRequest):
    return generate_architecture_from_requirements(
        prompt=req.prompt,
        application_type=req.application_type,
        answers=req.answers or {},
        cloud_provider=req.cloud_provider or "logical"
    )


# 3. Architecture Validator
@router.post("/validate-architecture", response_model=ValidationResult)
def api_validate_architecture(arch: ArchitectureModel):
    return validate_architecture(arch)


# 4. Multi-Pillar Architecture Health Analyzer
@router.post("/analyze-health", response_model=HealthAnalysisResponse)
def api_analyze_health(arch: ArchitectureModel):
    return analyze_health(arch)


# 4b. Dedicated Security Analysis
@router.post("/analyze-security")
def api_analyze_security(arch: ArchitectureModel):
    health = analyze_health(arch)
    sec_pillar = health.pillars.get("security")
    return {
        "score": sec_pillar.score if sec_pillar else 80,
        "status": sec_pillar.status if sec_pillar else "good",
        "findings": [f.model_dump() for f in sec_pillar.findings] if sec_pillar else [],
        "reasons": sec_pillar.reasons if sec_pillar else [],
        "disclaimer": "Design diagnostic. Not an audited penetration test or formal compliance certification."
    }


# 5. Cloud Cost Estimator (AWS & GCP)
@router.post("/estimate-cost", response_model=CostEstimateResponse)
def api_estimate_cost(req: CostRequest):
    assumptions = req.assumptions or WorkloadAssumptions()
    return estimate_costs(req.architecture, assumptions)


# 6. Future Traffic Simulator & Bottleneck Detection
@router.post("/simulate-traffic", response_model=TrafficSimulationResponse)
def api_simulate_traffic(req: TrafficSimulationRequest):
    return simulate_traffic(req)


# 7. Architecture Failure Simulator (Blast Radius)
@router.post("/simulate-failure", response_model=FailureSimulationResponse)
def api_simulate_failure(req: FailureSimulationRequest):
    return simulate_failure(req)


# 8. Architecture Change Impact Analyzer
@router.post("/analyze-impact", response_model=ImpactAnalysisResponse)
def api_analyze_impact(req: ImpactAnalysisRequest):
    return analyze_impact(req)


# 9. Architecture What-If Simulator
@router.post("/run-what-if", response_model=WhatIfResponse)
def api_run_what_if(req: WhatIfRequest):
    return run_what_if_simulation(req)


# 10. Multi-Month Growth Simulator
@router.post("/simulate-growth", response_model=GrowthSimulationResponse)
def api_simulate_growth(req: GrowthSimulationRequest):
    return simulate_growth(req)


# 11. Multi-Architecture Comparison
@router.post("/compare-architectures", response_model=ArchitectureComparisonResponse)
def api_compare_architectures(req: ArchitectureComparisonRequest):
    return compare_architectures(req)


# 12. Conversational Architecture Command Processor
@router.post("/conversational-command", response_model=ConversationalCommandResponse)
def api_conversational_command(req: ConversationalCommandRequest):
    return execute_conversational_command(req)


# 13. Architecture Decision Memory (ADRs)
@router.get("/decisions", response_model=List[ArchitectureDecision])
def api_list_decisions():
    return list_decisions(None)


@router.post("/decisions", response_model=ArchitectureDecision)
def api_add_decision(decision: ArchitectureDecision):
    return add_decision(decision)


@router.delete("/decisions/{decision_id}")
def api_delete_decision(decision_id: str):
    success = delete_decision(decision_id)
    if not success:
        raise HTTPException(status_code=404, detail="Decision not found")
    return {"message": "Decision deleted successfully", "id": decision_id}


# 14. Architecture Optimizer & Trade-Offs
@router.post("/optimize")
def api_optimize(req: OptimizeRequest):
    suggestions = get_optimizations(req.architecture)
    tradeoffs = get_tradeoff_profiles(req.architecture)
    return {
        "suggestions": suggestions,
        "tradeoffs": tradeoffs
    }


# 15. Cloud Provider Mapper
@router.post("/map-cloud")
def api_map_cloud(req: CloudMapRequest):
    return map_architecture_to_cloud(req.architecture, req.provider)


# 16. Terraform HCL Generator
@router.post("/generate-terraform")
def api_generate_terraform(req: TerraformRequest):
    res = generate_terraform_code(req.architecture, req.provider)
    return {
        "provider": req.provider,
        "cloud_provider": res.get("cloud_provider", req.provider),
        "filename": res.get("filename", f"main_{req.provider}.tf"),
        "hcl_code": res.get("hcl_code", ""),
        "terraform_code": res.get("hcl_code", ""),
        "disclaimer": "Preview Terraform IaC code. Review and configure provider credentials before applying."
    }


# 17. Demo Presets
@router.get("/demos")
def api_list_demos():
    demo_domains = [
        ("E-commerce", "High-throughput online store with product catalog and payments", {}),
        ("Food Delivery", "Food ordering with driver GPS tracking", {}),
        ("Social Media", "Social network with posts, feeds, and direct chat", {}),
        ("Video Streaming", "Video on demand streaming with adaptive HLS", {}),
        ("College Management", "Student attendance, courses, and grading portal", {}),
        ("Online Banking", "Secure banking ledger with fraud scoring", {}),
        ("IoT Monitoring", "Hardware sensor telemetry ingestion and monitoring", {}),
        ("File Storage", "Cloud file drive with presigned S3 uploads", {}),
        ("AI Application", "Conversational AI assistant with Vector RAG", {})
    ]

    demos = []
    for domain_name, desc, answers in demo_domains:
        arch = generate_architecture_from_requirements(
            prompt=f"Demo architecture for {domain_name}",
            application_type=domain_name,
            answers=answers,
            cloud_provider="logical"
        )
        demos.append({
            "id": domain_name.lower().replace(" ", "_").replace("-", "_"),
            "name": domain_name,
            "description": desc,
            "architecture": arch.model_dump()
        })
    return demos


# 18. Project Persistence (SQLite)
@router.post("/projects", response_model=ProjectResponse)
def api_create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = ProjectORM(
        name=project.name,
        description=project.description,
        architecture_json=json.dumps(project.architecture),
        cloud_provider=project.cloud_provider or "logical",
        cost_assumptions=json.dumps(project.cost_assumptions) if project.cost_assumptions else None
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    return ProjectResponse(
        id=db_project.id,
        name=db_project.name,
        description=db_project.description,
        cloud_provider=db_project.cloud_provider,
        architecture=json.loads(db_project.architecture_json),
        cost_assumptions=json.loads(db_project.cost_assumptions) if db_project.cost_assumptions else None,
        created_at=db_project.created_at,
        updated_at=db_project.updated_at
    )


@router.get("/projects", response_model=List[ProjectResponse])
def api_list_projects(db: Session = Depends(get_db)):
    projects = db.query(ProjectORM).order_by(ProjectORM.updated_at.desc()).all()
    results = []
    for p in projects:
        results.append(ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            cloud_provider=p.cloud_provider,
            architecture=json.loads(p.architecture_json),
            cost_assumptions=json.loads(p.cost_assumptions) if p.cost_assumptions else None,
            created_at=p.created_at,
            updated_at=p.updated_at
        ))
    return results


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def api_get_project(project_id: int, db: Session = Depends(get_db)):
    p = db.query(ProjectORM).filter(ProjectORM.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(
        id=p.id,
        name=p.name,
        description=p.description,
        cloud_provider=p.cloud_provider,
        architecture=json.loads(p.architecture_json),
        cost_assumptions=json.loads(p.cost_assumptions) if p.cost_assumptions else None,
        created_at=p.created_at,
        updated_at=p.updated_at
    )


@router.delete("/projects/{project_id}")
def api_delete_project(project_id: int, db: Session = Depends(get_db)):
    p = db.query(ProjectORM).filter(ProjectORM.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(p)
    db.commit()
    return {"message": "Project deleted successfully", "id": project_id}
