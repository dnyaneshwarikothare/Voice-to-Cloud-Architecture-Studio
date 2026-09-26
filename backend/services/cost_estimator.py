"""
Cloud Cost Estimator Service
Estimates monthly and yearly infrastructure costs for AWS and GCP based on workload assumptions.
Uses configurable pricing catalog data with clear estimation disclaimers.
"""

import sys
from pathlib import Path
import json
import os
from typing import Dict, Any, List

_parent = Path(__file__).resolve().parent.parent
_root = _parent.parent
for _p in [str(_root), str(_parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.models.architecture import (
        ArchitectureModel,
        WorkloadAssumptions,
        CostEstimateResponse,
        ProviderCost,
        CostItem,
    )
except (ImportError, ValueError):
    try:
        from models.architecture import (  # type: ignore
            ArchitectureModel,
            WorkloadAssumptions,
            CostEstimateResponse,
            ProviderCost,
            CostItem,
        )
    except (ImportError, ValueError):
        from ..models.architecture import (  # type: ignore
            ArchitectureModel,
            WorkloadAssumptions,
            CostEstimateResponse,
            ProviderCost,
            CostItem,
        )

# Load pricing catalog
CATALOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "pricing_catalog.json")


def _load_catalog() -> Dict[str, Any]:
    if os.path.exists(CATALOG_PATH):
        try:
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def estimate_costs(arch: ArchitectureModel, assumptions: WorkloadAssumptions = None) -> CostEstimateResponse:
    assumptions = assumptions or WorkloadAssumptions()
    catalog = _load_catalog()

    aws_catalog = catalog.get("aws", {})
    gcp_catalog = catalog.get("gcp", {})

    aws_items: List[CostItem] = []
    gcp_items: List[CostItem] = []

    components = arch.components or []

    for comp in components:
        ctype = comp.type.lower()
        cid = comp.id
        cname = comp.name

        # --- Compute (backend, payment, custom) ---
        if ctype in ["backend", "payment", "custom"]:
            tier_key = assumptions.compute_tier
            instances = max(1, assumptions.compute_instances)

            # AWS
            aws_cfg = aws_catalog.get("compute", {}).get(tier_key, {"service": "AWS ECS Fargate", "monthly": 35.04})
            if tier_key == "serverless":
                req_millions = assumptions.monthly_requests / 1_000_000
                aws_m = aws_cfg.get("base_monthly", 5.0) + (req_millions * aws_cfg.get("per_million_requests", 0.20))
                aws_details = f"Serverless invocations ({req_millions:.1f}M reqs @ $0.20/M + $5 base)"
            else:
                aws_m = aws_cfg.get("monthly", 35.04) * instances
                aws_details = f"{instances}x {aws_cfg.get('service')} (${aws_cfg.get('monthly', 35.04)}/ea)"

            aws_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service=aws_cfg.get("service", "AWS Compute"),
                category="Compute",
                monthly_cost=round(aws_m, 2),
                yearly_cost=round(aws_m * 12, 2),
                calculation_details=aws_details
            ))

            # GCP
            gcp_cfg = gcp_catalog.get("compute", {}).get(tier_key, {"service": "GCP Cloud Run", "monthly": 30.66})
            if tier_key == "serverless":
                req_millions = assumptions.monthly_requests / 1_000_000
                gcp_m = gcp_cfg.get("base_monthly", 4.5) + (req_millions * gcp_cfg.get("per_million_requests", 0.18))
                gcp_details = f"Serverless invocations ({req_millions:.1f}M reqs @ $0.18/M + $4.50 base)"
            else:
                gcp_m = gcp_cfg.get("monthly", 30.66) * instances
                gcp_details = f"{instances}x {gcp_cfg.get('service')} (${gcp_cfg.get('monthly', 30.66)}/ea)"

            gcp_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service=gcp_cfg.get("service", "GCP Compute"),
                category="Compute",
                monthly_cost=round(gcp_m, 2),
                yearly_cost=round(gcp_m * 12, 2),
                calculation_details=gcp_details
            ))

        # --- Database ---
        elif ctype == "database":
            db_tier = assumptions.database_tier
            storage_gb = assumptions.database_storage_gb
            multi_az = assumptions.database_multi_az

            # AWS
            aws_db_cfg = aws_catalog.get("database", {})
            aws_instance_cost = aws_db_cfg.get(db_tier, {}).get("monthly", 54.75)
            aws_storage_cost = storage_gb * aws_db_cfg.get("storage_per_gb", 0.115)
            aws_db_subtotal = (aws_instance_cost + aws_storage_cost) * (aws_db_cfg.get("multi_az_multiplier", 2.0) if multi_az else 1.0)
            aws_db_service = aws_db_cfg.get(db_tier, {}).get("service", "Amazon RDS PostgreSQL")

            aws_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service=f"{aws_db_service}{' (Multi-AZ)' if multi_az else ''}",
                category="Database",
                monthly_cost=round(aws_db_subtotal, 2),
                yearly_cost=round(aws_db_subtotal * 12, 2),
                calculation_details=f"Instance (${aws_instance_cost:.2f}) + {storage_gb}GB SSD (${aws_storage_cost:.2f}){' * 2x Multi-AZ' if multi_az else ''}"
            ))

            # GCP
            gcp_db_cfg = gcp_catalog.get("database", {})
            gcp_instance_cost = gcp_db_cfg.get(db_tier, {}).get("monthly", 51.20)
            gcp_storage_cost = storage_gb * gcp_db_cfg.get("storage_per_gb", 0.105)
            gcp_db_subtotal = (gcp_instance_cost + gcp_storage_cost) * (gcp_db_cfg.get("multi_az_multiplier", 1.9) if multi_az else 1.0)
            gcp_db_service = gcp_db_cfg.get(db_tier, {}).get("service", "GCP Cloud SQL PostgreSQL")

            gcp_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service=f"{gcp_db_service}{' (HA)' if multi_az else ''}",
                category="Database",
                monthly_cost=round(gcp_db_subtotal, 2),
                yearly_cost=round(gcp_db_subtotal * 12, 2),
                calculation_details=f"Instance (${gcp_instance_cost:.2f}) + {storage_gb}GB SSD (${gcp_storage_cost:.2f}){' * 1.9x HA' if multi_az else ''}"
            ))

        # --- Cache ---
        elif ctype == "cache":
            cache_gb = assumptions.cache_memory_gb
            size_key = "small" if cache_gb <= 2 else ("medium" if cache_gb <= 4 else "large")

            # AWS
            aws_ca_cfg = aws_catalog.get("cache", {}).get(size_key, {"service": "Amazon ElastiCache Redis", "monthly": 29.20})
            aws_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service=aws_ca_cfg.get("service", "Amazon ElastiCache Redis"),
                category="In-Memory Cache",
                monthly_cost=round(aws_ca_cfg.get("monthly", 29.20), 2),
                yearly_cost=round(aws_ca_cfg.get("monthly", 29.20) * 12, 2),
                calculation_details=f"{cache_gb}GB Memory node ({size_key} tier)"
            ))

            # GCP
            gcp_ca_cfg = gcp_catalog.get("cache", {}).get(size_key, {"service": "GCP Memorystore Redis", "monthly": 27.00})
            gcp_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service=gcp_ca_cfg.get("service", "GCP Memorystore Redis"),
                category="In-Memory Cache",
                monthly_cost=round(gcp_ca_cfg.get("monthly", 27.00), 2),
                yearly_cost=round(gcp_ca_cfg.get("monthly", 27.00) * 12, 2),
                calculation_details=f"{cache_gb}GB Memory node ({size_key} tier)"
            ))

        # --- Storage (S3 / GCS) ---
        elif ctype == "storage":
            storage_gb = assumptions.storage_gb
            # AWS
            aws_st_rate = aws_catalog.get("storage", {}).get("per_gb", 0.023)
            aws_st_cost = max(1.0, storage_gb * aws_st_rate)
            aws_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="Amazon S3 Standard",
                category="Object Storage",
                monthly_cost=round(aws_st_cost, 2),
                yearly_cost=round(aws_st_cost * 12, 2),
                calculation_details=f"{storage_gb}GB Standard Storage @ ${aws_st_rate}/GB"
            ))

            # GCP
            gcp_st_rate = gcp_catalog.get("storage", {}).get("per_gb", 0.020)
            gcp_st_cost = max(1.0, storage_gb * gcp_st_rate)
            gcp_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="GCP Cloud Storage Standard",
                category="Object Storage",
                monthly_cost=round(gcp_st_cost, 2),
                yearly_cost=round(gcp_st_cost * 12, 2),
                calculation_details=f"{storage_gb}GB Standard Storage @ ${gcp_st_rate}/GB"
            ))

        # --- Load Balancer ---
        elif ctype == "loadbalancer":
            aws_lb_cost = aws_catalog.get("loadbalancer", {}).get("monthly", 22.50)
            gcp_lb_cost = gcp_catalog.get("loadbalancer", {}).get("monthly", 19.50)
            aws_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="AWS Application Load Balancer (ALB)",
                category="Networking",
                monthly_cost=aws_lb_cost,
                yearly_cost=round(aws_lb_cost * 12, 2),
                calculation_details="Standard 730 hr base rate + LCU capacity"
            ))
            gcp_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="GCP Cloud Load Balancing",
                category="Networking",
                monthly_cost=gcp_lb_cost,
                yearly_cost=round(gcp_lb_cost * 12, 2),
                calculation_details="Standard 730 hr forwarding rule baseline"
            ))

        # --- API Gateway ---
        elif ctype == "gateway":
            req_millions = assumptions.monthly_requests / 1_000_000
            aws_gw_cost = aws_catalog.get("gateway", {}).get("base_monthly", 3.50) + (req_millions * aws_catalog.get("gateway", {}).get("per_million_requests", 1.00))
            gcp_gw_cost = gcp_catalog.get("gateway", {}).get("base_monthly", 3.00) + (req_millions * gcp_catalog.get("gateway", {}).get("per_million_requests", 0.90))
            aws_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="Amazon API Gateway",
                category="API Management",
                monthly_cost=round(aws_gw_cost, 2),
                yearly_cost=round(aws_gw_cost * 12, 2),
                calculation_details=f"{req_millions:.1f}M API requests + base gateway fee"
            ))
            gcp_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="GCP API Gateway",
                category="API Management",
                monthly_cost=round(gcp_gw_cost, 2),
                yearly_cost=round(gcp_gw_cost * 12, 2),
                calculation_details=f"{req_millions:.1f}M API requests + base gateway fee"
            ))

        # --- CDN ---
        elif ctype == "cdn":
            traffic_gb = assumptions.traffic_out_gb
            aws_cdn_rate = aws_catalog.get("cdn", {}).get("per_gb", 0.085)
            aws_cdn_cost = aws_catalog.get("cdn", {}).get("base_monthly", 2.50) + (traffic_gb * aws_cdn_rate)
            gcp_cdn_rate = gcp_catalog.get("cdn", {}).get("per_gb", 0.080)
            gcp_cdn_cost = gcp_catalog.get("cdn", {}).get("base_monthly", 2.00) + (traffic_gb * gcp_cdn_rate)
            aws_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="Amazon CloudFront",
                category="Edge CDN",
                monthly_cost=round(aws_cdn_cost, 2),
                yearly_cost=round(aws_cdn_cost * 12, 2),
                calculation_details=f"{traffic_gb}GB egress data transfer @ ${aws_cdn_rate}/GB"
            ))
            gcp_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="GCP Cloud CDN",
                category="Edge CDN",
                monthly_cost=round(gcp_cdn_cost, 2),
                yearly_cost=round(gcp_cdn_cost * 12, 2),
                calculation_details=f"{traffic_gb}GB egress data transfer @ ${gcp_cdn_rate}/GB"
            ))

        # --- Queue ---
        elif ctype == "queue":
            req_millions = assumptions.monthly_requests / 1_000_000
            aws_q_cost = aws_catalog.get("queue", {}).get("base_monthly", 1.0) + (req_millions * aws_catalog.get("queue", {}).get("per_million_requests", 0.40))
            gcp_q_cost = gcp_catalog.get("queue", {}).get("base_monthly", 1.0) + (req_millions * gcp_catalog.get("queue", {}).get("per_million_requests", 0.35))
            aws_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="Amazon SQS / SNS",
                category="Message Queue",
                monthly_cost=round(aws_q_cost, 2),
                yearly_cost=round(aws_q_cost * 12, 2),
                calculation_details=f"{req_millions:.1f}M queue API calls"
            ))
            gcp_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="GCP Cloud Pub/Sub",
                category="Message Queue",
                monthly_cost=round(gcp_q_cost, 2),
                yearly_cost=round(gcp_q_cost * 12, 2),
                calculation_details=f"{req_millions:.1f}M event deliveries"
            ))

        # --- Auth ---
        elif ctype == "auth":
            users = assumptions.monthly_users
            billable_users = max(0, users - 50_000)  # first 50k MAU free
            aws_auth_cost = billable_users * aws_catalog.get("auth", {}).get("per_user_above_free", 0.0055)
            gcp_auth_cost = billable_users * gcp_catalog.get("auth", {}).get("per_user_above_free", 0.0050)
            aws_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="Amazon Cognito",
                category="Identity & Auth",
                monthly_cost=round(aws_auth_cost, 2),
                yearly_cost=round(aws_auth_cost * 12, 2),
                calculation_details=f"{users} MAU (First 50,000 free)"
            ))
            gcp_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="GCP Identity Platform / Firebase Auth",
                category="Identity & Auth",
                monthly_cost=round(gcp_auth_cost, 2),
                yearly_cost=round(gcp_auth_cost * 12, 2),
                calculation_details=f"{users} MAU (First 50,000 free)"
            ))

        # --- Frontend Static Hosting ---
        elif ctype == "frontend":
            aws_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="AWS CloudFront + S3 Static Hosting",
                category="Frontend Hosting",
                monthly_cost=3.50,
                yearly_cost=42.00,
                calculation_details="S3 bundle storage + CloudFront distribution baseline"
            ))
            gcp_items.append(CostItem(
                component_id=cid,
                component_name=cname,
                cloud_service="GCP Cloud Storage + Cloud CDN",
                category="Frontend Hosting",
                monthly_cost=3.00,
                yearly_cost=36.00,
                calculation_details="Cloud Storage static bundle baseline"
            ))

    aws_total_m = sum(i.monthly_cost for i in aws_items)
    gcp_total_m = sum(i.monthly_cost for i in gcp_items)

    diff = abs(aws_total_m - gcp_total_m)
    cheaper = "Tie" if diff < 0.50 else ("GCP" if gcp_total_m < aws_total_m else "AWS")

    return CostEstimateResponse(
        aws=ProviderCost(
            provider_name="Amazon Web Services (AWS)",
            currency="USD",
            estimated_monthly_cost=round(aws_total_m, 2),
            estimated_yearly_cost=round(aws_total_m * 12, 2),
            items=aws_items
        ),
        gcp=ProviderCost(
            provider_name="Google Cloud Platform (GCP)",
            currency="USD",
            estimated_monthly_cost=round(gcp_total_m, 2),
            estimated_yearly_cost=round(gcp_total_m * 12, 2),
            items=gcp_items
        ),
        cheaper_provider=cheaper,
        savings_delta=round(diff, 2),
        assumptions=assumptions,
        disclaimer="Approximate estimate based on configured baseline pricing data. Not an actual cloud bill."
    )
