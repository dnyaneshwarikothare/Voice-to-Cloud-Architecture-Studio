"""
Terraform Infrastructure-as-Code (IaC) Generator
Generates clean, modular Terraform HCL configurations for AWS and GCP matching the active architecture model.
"""

import sys
from pathlib import Path
from typing import Dict, Any

_parent = Path(__file__).resolve().parent.parent
_root = _parent.parent
for _p in [str(_root), str(_parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.models.architecture import ArchitectureModel
except (ImportError, ValueError):
    try:
        from models.architecture import ArchitectureModel  # type: ignore
    except (ImportError, ValueError):
        from ..models.architecture import ArchitectureModel  # type: ignore


def generate_terraform_code(arch: ArchitectureModel, provider: str = "aws") -> Dict[str, Any]:
    provider = provider.lower() if provider in ["aws", "gcp"] else "aws"
    components = arch.components or []
    types = {c.type for c in components}

    lines = []

    lines.append("# =============================================================================")
    lines.append(f"# AI Voice-to-Cloud Architecture Studio - Terraform IaC Blueprint")
    lines.append(f"# Project: {arch.project_name}")
    lines.append(f"# Cloud Provider: {provider.upper()}")
    lines.append(f"# IMPORTANT NOTICE: This code is an architectural starter blueprint.")
    lines.append(f"# Review resource sizing, security groups, and credentials before applying.")
    lines.append("# =============================================================================\n")

    if provider == "aws":
        lines.append('terraform {')
        lines.append('  required_version = ">= 1.5.0"')
        lines.append('  required_providers {')
        lines.append('    aws = {')
        lines.append('      source  = "hashicorp/aws"')
        lines.append('      version = "~> 5.0"')
        lines.append('    }')
        lines.append('  }')
        lines.append('}\n')

        lines.append('provider "aws" {')
        lines.append('  region = var.aws_region')
        lines.append('  default_tags {')
        lines.append('    tags = {')
        lines.append(f'      Project     = "{arch.project_name}"')
        lines.append('      ManagedBy   = "Voice-to-Cloud Architecture Studio"')
        lines.append('      Environment = var.environment')
        lines.append('    }')
        lines.append('  }')
        lines.append('}\n')

        lines.append('variable "aws_region" {')
        lines.append('  description = "AWS deployment region"')
        lines.append('  type        = string')
        lines.append('  default     = "us-east-1"')
        lines.append('}\n')

        lines.append('variable "environment" {')
        lines.append('  type    = string')
        lines.append('  default = "production"')
        lines.append('}\n')

        # VPC
        lines.append('# --- Core Networking VPC ---')
        lines.append('resource "aws_vpc" "main" {')
        lines.append('  cidr_block           = "10.0.0.0/16"')
        lines.append('  enable_dns_hostnames = true')
        lines.append('  enable_dns_support   = true')
        lines.append('  tags = { Name = "${var.environment}-vpc" }')
        lines.append('}\n')

        # Components
        if "frontend" in types or "storage" in types:
            lines.append('# --- Amazon S3 Asset Bucket ---')
            lines.append('resource "aws_s3_bucket" "assets" {')
            lines.append('  bucket_prefix = "app-assets-"')
            lines.append('  force_destroy = false')
            lines.append('}\n')

        if "cdn" in types:
            lines.append('# --- Amazon CloudFront CDN ---')
            lines.append('resource "aws_cloudfront_distribution" "cdn" {')
            lines.append('  enabled             = true')
            lines.append('  is_ipv6_enabled     = true')
            lines.append('  default_root_object = "index.html"')
            lines.append('  origin {')
            lines.append('    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name')
            lines.append('    origin_id   = "S3-App-Assets"')
            lines.append('  }')
            lines.append('  default_cache_behavior {')
            lines.append('    allowed_methods        = ["GET", "HEAD", "OPTIONS"]')
            lines.append('    cached_methods         = ["GET", "HEAD"]')
            lines.append('    target_origin_id       = "S3-App-Assets"')
            lines.append('    viewer_protocol_policy = "redirect-to-https"')
            lines.append('  }')
            lines.append('  viewer_certificate {')
            lines.append('    cloudfront_default_certificate = true')
            lines.append('  }')
            lines.append('}\n')

        if "loadbalancer" in types or "gateway" in types:
            lines.append('# --- Application Load Balancer ---')
            lines.append('resource "aws_lb" "alb" {')
            lines.append('  name               = "app-alb"')
            lines.append('  internal           = false')
            lines.append('  load_balancer_type = "application"')
            lines.append('}\n')

        if any(c.type in ["backend", "payment", "custom"] for c in components):
            lines.append('# --- AWS ECS Cluster & Fargate Service ---')
            lines.append('resource "aws_ecs_cluster" "cluster" {')
            lines.append('  name = "app-ecs-cluster"')
            lines.append('}\n')
            lines.append('resource "aws_ecs_task_definition" "api_task" {')
            lines.append('  family                   = "api-task"')
            lines.append('  network_mode             = "awsvpc"')
            lines.append('  requires_compatibilities = ["FARGATE"]')
            lines.append('  cpu                      = "512"')
            lines.append('  memory                   = "1024"')
            lines.append('  container_definitions    = jsonencode([')
            lines.append('    {')
            lines.append('      name      = "api-service"')
            lines.append('      image     = "ghcr.io/org/api:latest"')
            lines.append('      essential = true')
            lines.append('      portMappings = [{ containerPort = 8000, hostPort = 8000 }]')
            lines.append('    }')
            lines.append('  ])')
            lines.append('}\n')

        if "database" in types:
            lines.append('# --- Amazon RDS PostgreSQL Database ---')
            lines.append('resource "aws_db_instance" "postgres" {')
            lines.append('  identifier          = "app-postgres-db"')
            lines.append('  engine              = "postgres"')
            lines.append('  engine_version      = "15.4"')
            lines.append('  instance_class      = "db.t4g.medium"')
            lines.append('  allocated_storage   = 50')
            lines.append('  storage_type        = "gp3"')
            lines.append('  multi_az            = true')
            lines.append('  publicly_accessible = false')
            lines.append('  skip_final_snapshot = true')
            lines.append('}\n')

        if "cache" in types:
            lines.append('# --- Amazon ElastiCache for Redis ---')
            lines.append('resource "aws_elasticache_cluster" "redis" {')
            lines.append('  cluster_id           = "app-redis-cache"')
            lines.append('  engine               = "redis"')
            lines.append('  node_type            = "cache.t4g.small"')
            lines.append('  num_cache_nodes      = 1')
            lines.append('  parameter_group_name = "default.redis7"')
            lines.append('  port                 = 6379')
            lines.append('}\n')

        if "queue" in types:
            lines.append('# --- Amazon SQS Message Queue ---')
            lines.append('resource "aws_sqs_queue" "async_tasks" {')
            lines.append('  name                       = "app-tasks-queue"')
            lines.append('  visibility_timeout_seconds = 60')
            lines.append('}\n')

    else:
        # GCP Terraform Blueprint
        lines.append('terraform {')
        lines.append('  required_version = ">= 1.5.0"')
        lines.append('  required_providers {')
        lines.append('    google = {')
        lines.append('      source  = "hashicorp/google"')
        lines.append('      version = "~> 5.0"')
        lines.append('    }')
        lines.append('  }')
        lines.append('}\n')

        lines.append('provider "google" {')
        lines.append('  project = var.gcp_project_id')
        lines.append('  region  = var.gcp_region')
        lines.append('}\n')

        lines.append('variable "gcp_project_id" {')
        lines.append('  description = "GCP Project ID"')
        lines.append('  type        = string')
        lines.append('  default     = "my-gcp-project"')
        lines.append('}\n')

        lines.append('variable "gcp_region" {')
        lines.append('  type    = string')
        lines.append('  default = "us-central1"')
        lines.append('}\n')

        if "storage" in types or "frontend" in types:
            lines.append('# --- Google Cloud Storage Bucket ---')
            lines.append('resource "google_storage_bucket" "assets" {')
            lines.append('  name     = "${var.gcp_project_id}-assets"')
            lines.append('  location = var.gcp_region')
            lines.append('  uniform_bucket_level_access = true')
            lines.append('}\n')

        if any(c.type in ["backend", "payment", "custom"] for c in components):
            lines.append('# --- GCP Cloud Run Microservice ---')
            lines.append('resource "google_cloud_run_v2_service" "backend_service" {')
            lines.append('  name     = "api-backend"')
            lines.append('  location = var.gcp_region')
            lines.append('  template {')
            lines.append('    containers {')
            lines.append('      image = "gcr.io/${var.gcp_project_id}/api:latest"')
            lines.append('      resources {')
            lines.append('        limits = {')
            lines.append('          cpu    = "1000m"')
            lines.append('          memory = "1024Mi"')
            lines.append('        }')
            lines.append('      }')
            lines.append('    }')
            lines.append('  }')
            lines.append('}\n')

        if "database" in types:
            lines.append('# --- GCP Cloud SQL for PostgreSQL ---')
            lines.append('resource "google_sql_database_instance" "postgres" {')
            lines.append('  name             = "app-postgres-db"')
            lines.append('  database_version = "POSTGRES_15"')
            lines.append('  region           = var.gcp_region')
            lines.append('  settings {')
            lines.append('    tier = "db-custom-2-7680"')
            lines.append('    availability_type = "REGIONAL"')
            lines.append('    ip_configuration {')
            lines.append('      ipv4_enabled    = false')
            lines.append('      private_network = "projects/${var.gcp_project_id}/global/networks/default"')
            lines.append('    }')
            lines.append('  }')
            lines.append('}\n')

        if "cache" in types:
            lines.append('# --- GCP Memorystore for Redis ---')
            lines.append('resource "google_redis_instance" "cache" {')
            lines.append('  name           = "app-redis-cache"')
            lines.append('  tier           = "STANDARD_HA"')
            lines.append('  memory_size_gb = 2')
            lines.append('  region         = var.gcp_region')
            lines.append('}\n')

        if "queue" in types:
            lines.append('# --- GCP Cloud Pub/Sub Topic ---')
            lines.append('resource "google_pubsub_topic" "tasks" {')
            lines.append('  name = "app-async-tasks"')
            lines.append('}\n')

    return {
        "cloud_provider": provider,
        "filename": f"main_{provider}.tf",
        "hcl_code": "\n".join(lines),
        "disclaimer": "Generated by AI Voice-to-Cloud Architecture Studio. Always run `terraform plan` and audit configurations before applying."
    }
