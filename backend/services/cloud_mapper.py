"""
Cloud Service Mapper Service
Maps logical architecture components to AWS and GCP cloud native services with clear justifications.
"""

import sys
from pathlib import Path
from typing import Dict, Any, List

_parent = Path(__file__).resolve().parent.parent
_root = _parent.parent
for _p in [str(_root), str(_parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.models.architecture import ArchitectureModel, Component
except (ImportError, ValueError):
    try:
        from models.architecture import ArchitectureModel, Component  # type: ignore
    except (ImportError, ValueError):
        from ..models.architecture import ArchitectureModel, Component  # type: ignore


CLOUD_SERVICE_CATALOG = {
    "frontend": {
        "aws": {
            "service": "AWS CloudFront + S3",
            "category": "Edge CDN & Static Hosting",
            "why_selected": "S3 stores static HTML/JS bundles securely while CloudFront caches and accelerates distribution globally.",
            "alternatives": ["AWS Amplify Hosting", "ECS Fargate (for SSR)"]
        },
        "gcp": {
            "service": "GCP Cloud CDN + Cloud Storage",
            "category": "Edge CDN & Static Hosting",
            "why_selected": "GCS provides zero-maintenance asset buckets paired with Google's worldwide fiber network edge PoPs.",
            "alternatives": ["GCP Firebase Hosting", "Cloud Run (for SSR)"]
        }
    },
    "backend": {
        "aws": {
            "service": "AWS ECS Fargate / App Runner",
            "category": "Serverless Container Compute",
            "why_selected": "Fargate runs Docker containers on-demand without requiring manual EC2 virtual machine management or patching.",
            "alternatives": ["AWS Lambda (Serverless)", "Amazon EKS (Kubernetes)", "Amazon EC2 (IaaS)"]
        },
        "gcp": {
            "service": "GCP Cloud Run",
            "category": "Serverless Container Compute",
            "why_selected": "Cloud Run scales containers automatically from zero to thousands of instances in seconds with per-millisecond billing.",
            "alternatives": ["Google Kubernetes Engine (GKE)", "Google Compute Engine (GCE)"]
        }
    },
    "database": {
        "aws": {
            "service": "Amazon RDS for PostgreSQL",
            "category": "Managed Relational Database",
            "why_selected": "Automated backups, multi-AZ synchronous replication, point-in-time recovery, and zero-downtime minor version upgrades.",
            "alternatives": ["Amazon Aurora PostgreSQL (Serverless v2)", "Amazon DynamoDB (NoSQL)"]
        },
        "gcp": {
            "service": "GCP Cloud SQL for PostgreSQL",
            "category": "Managed Relational Database",
            "why_selected": "Fully managed ACID relational database with high availability regional failover and automatic storage increase.",
            "alternatives": ["Google Cloud Spanner (Global Multi-Region)", "Google Cloud Firestore (NoSQL)"]
        }
    },
    "cache": {
        "aws": {
            "service": "Amazon ElastiCache for Redis",
            "category": "Managed In-Memory Datastore",
            "why_selected": "Delivers sub-millisecond data reads, automatic cluster failover, and Redis OSS protocol compatibility.",
            "alternatives": ["Amazon MemoryDB for Redis (Ultra-durable)", "ElastiCache Memcached"]
        },
        "gcp": {
            "service": "GCP Memorystore for Redis",
            "category": "Managed In-Memory Datastore",
            "why_selected": "Fully managed Redis with automated patching, high availability cross-zone failover, and zero-code client migration.",
            "alternatives": ["Memorystore for Memcached"]
        }
    },
    "gateway": {
        "aws": {
            "service": "Amazon API Gateway",
            "category": "Managed API Gateway",
            "why_selected": "Handles traffic management, CORS, authorization, rate limiting, and API versioning at any scale.",
            "alternatives": ["AWS Application Load Balancer (ALB)", "Self-hosted Kong on ECS"]
        },
        "gcp": {
            "service": "GCP API Gateway",
            "category": "Managed API Gateway",
            "why_selected": "Serverless gateway built on OpenAPI specifications with built-in Google Cloud IAM authentication.",
            "alternatives": ["Google Cloud Apigee (Enterprise)", "Cloud Load Balancing"]
        }
    },
    "loadbalancer": {
        "aws": {
            "service": "AWS Application Load Balancer (ALB)",
            "category": "Layer 7 Load Balancer",
            "why_selected": "Content-based HTTP/HTTPS routing, integrated AWS Certificate Manager SSL, and automated health checks.",
            "alternatives": ["AWS Network Load Balancer (NLB - Layer 4)"]
        },
        "gcp": {
            "service": "GCP Cloud Load Balancing",
            "category": "Global External HTTPS Load Balancer",
            "why_selected": "Single anycast IP routing user traffic to the closest healthy backend instance globally without DNS latency.",
            "alternatives": ["GCP Regional External Application Load Balancer"]
        }
    },
    "cdn": {
        "aws": {
            "service": "Amazon CloudFront",
            "category": "Global Content Delivery Network",
            "why_selected": "Massive global footprint of 600+ edge locations, built-in AWS Shield DDoS defense, and free SSL certificates.",
            "alternatives": ["Cloudflare CDN", "Fastly"]
        },
        "gcp": {
            "service": "Google Cloud CDN",
            "category": "Global Content Delivery Network",
            "why_selected": "Leverages Google's private global fiber network for lowest edge round-trip latency and rapid cache fills.",
            "alternatives": ["Fastly", "Cloudflare"]
        }
    },
    "queue": {
        "aws": {
            "service": "Amazon SQS / EventBridge",
            "category": "Managed Message Queue & Event Bus",
            "why_selected": "Virtually unlimited throughput, zero server maintenance, dead-letter queues, and at-least-once message delivery.",
            "alternatives": ["Amazon MQ (RabbitMQ)", "Amazon MSK (Managed Kafka)"]
        },
        "gcp": {
            "service": "Google Cloud Pub/Sub",
            "category": "Global Real-Time Messaging",
            "why_selected": "Automated provisioning with high-throughput stream ingestion and at-least-once global delivery.",
            "alternatives": ["GCP Cloud Tasks (Rate-limited queues)"]
        }
    },
    "storage": {
        "aws": {
            "service": "Amazon Simple Storage Service (S3)",
            "category": "Object Storage",
            "why_selected": "Industry-standard object storage with 99.999999999% (11 9's) durability, lifecycle tiering, and presigned URLs.",
            "alternatives": ["Amazon EFS (Elastic File System)"]
        },
        "gcp": {
            "service": "Google Cloud Storage (GCS)",
            "category": "Object Storage",
            "why_selected": "Worldwide unified API with automatic storage class analysis, high throughput, and strongly consistent listings.",
            "alternatives": ["Google Cloud Filestore (NFS)"]
        }
    },
    "auth": {
        "aws": {
            "service": "Amazon Cognito User Pools",
            "category": "Customer Identity & Access Management",
            "why_selected": "Managed signup/signin, social identity federation (Google/Apple), MFA, and OAuth 2.0 / JWT issuance.",
            "alternatives": ["Auth0 by Okta", "Self-hosted Keycloak"]
        },
        "gcp": {
            "service": "GCP Identity Platform / Firebase Auth",
            "category": "Customer Identity & Access Management",
            "why_selected": "Quick integration with drop-in authentication SDKs, multi-factor SMS auth, and enterprise SAML/OIDC support.",
            "alternatives": ["Auth0", "Keycloak"]
        }
    },
    "payment": {
        "aws": {
            "service": "Stripe Integration on AWS ECS / Lambda",
            "category": "PCI-Compliant Payment Handler",
            "why_selected": "Isolated microservice boundary handles tokenized payment charges without exposing credit cards to primary database.",
            "alternatives": ["PayPal API", "Adyen"]
        },
        "gcp": {
            "service": "Stripe Integration on Cloud Run",
            "category": "PCI-Compliant Payment Handler",
            "why_selected": "Stateless container processing with Secrets Manager guarding private merchant API tokens.",
            "alternatives": ["Braintree", "Adyen"]
        }
    },
    "monitoring": {
        "aws": {
            "service": "Amazon CloudWatch & X-Ray",
            "category": "Observability & Distributed Tracing",
            "why_selected": "Centralized logs, automated alarm triggers, and end-to-end request tracing across microservices.",
            "alternatives": ["Datadog", "Prometheus + Grafana"]
        },
        "gcp": {
            "service": "Google Cloud Operations Suite (Cloud Monitoring & Logging)",
            "category": "Observability & Distributed Tracing",
            "why_selected": "Deep integration with Cloud Run and GKE with zero-configuration metrics dashboards and log analysis.",
            "alternatives": ["Datadog", "New Relic"]
        }
    }
}


def map_architecture_to_cloud(arch: ArchitectureModel, provider: str = "aws") -> List[Dict[str, Any]]:
    provider = provider.lower() if provider in ["aws", "gcp"] else "aws"
    components = arch.components or []
    mappings = []

    for comp in components:
        ctype = comp.type.lower()
        catalog_entry = CLOUD_SERVICE_CATALOG.get(ctype)

        if not catalog_entry:
            # Fallback for custom components
            catalog_entry = CLOUD_SERVICE_CATALOG.get("backend")

        provider_data = catalog_entry.get(provider, catalog_entry.get("aws"))

        mappings.append({
            "component_id": comp.id,
            "component_name": comp.name,
            "logical_role": comp.role or comp.type,
            "technology": comp.technology or comp.name,
            "cloud_provider": provider.upper(),
            "suggested_service": provider_data.get("service"),
            "category": provider_data.get("category"),
            "why_selected": provider_data.get("why_selected"),
            "alternatives": provider_data.get("alternatives", []),
            "disclaimer": "Suggested mapping based on typical cloud design patterns. Other cloud services can be selected manually."
        })

    return mappings
