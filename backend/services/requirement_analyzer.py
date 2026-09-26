"""
Requirement Analyzer Service
Understands natural language ideas without requiring technical keywords.
Identifies domain, features, requirements, and generates smart clarification questions.
"""

import sys
from pathlib import Path
import re
from typing import Dict, Any, List

_parent = Path(__file__).resolve().parent.parent
_root = _parent.parent
for _p in [str(_root), str(_parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.models.architecture import RequirementAnalysisResult, ClarificationQuestion
except (ImportError, ValueError):
    try:
        from models.architecture import RequirementAnalysisResult, ClarificationQuestion  # type: ignore
    except (ImportError, ValueError):
        from ..models.architecture import RequirementAnalysisResult, ClarificationQuestion  # type: ignore

DOMAINS = [
    {
        "type": "E-commerce",
        "patterns": [r"\b(shop|shopping|ecommerce|e-commerce|store|cart|checkout|retail|marketplace|sell)\b"],
        "default_features": ["User Authentication", "Product Catalog", "Shopping Cart", "Payment Gateway", "Order Management", "Order Tracking"],
        "data_reqs": ["Relational transactional database for orders & ledger", "Fast in-memory cache for catalog & inventory", "Encrypted customer payment profiles"],
        "sec_reqs": ["PCI-DSS compliance for payment data", "HTTPS / SSL encryption across all endpoints", "Role-based access control (Admin vs Customer)", "API rate limiting against card brute-forcing"],
        "perf_reqs": ["Sub-100ms product catalog page load", "Global static content delivery via CDN", "High-concurrency cache during flash promotions"],
        "avail_reqs": ["99.95% High Availability for checkout funnel", "Database Multi-AZ failover", "Automated daily transactional backups"],
        "domain_question": ClarificationQuestion(
            id="q_flash_sales",
            question="Do you anticipate high-traffic flash sales or promotions?",
            options=["Yes, high burst traffic expected", "No, steady traffic"],
            default_value="No, steady traffic",
            hint="Determines whether high-capacity caching and queue throttling are essential."
        )
    },
    {
        "type": "Food Delivery",
        "patterns": [r"\b(food\s*delivery|restaurant|order\s*food|delivery\s*partner|dishes|menu|meal|courier)\b"],
        "default_features": ["Customer App & Web Ordering", "Restaurant Menu Management", "Real-time Order Dispatch", "Live GPS Delivery Tracking", "Payment Processing"],
        "data_reqs": ["Spatial / Geospatial location data for drivers & restaurants", "Real-time order state transition log", "Customer review & rating records"],
        "sec_reqs": ["Secure OAuth / JWT token authentication", "End-to-end encrypted driver location updates", "Strict separation of restaurant and courier APIs"],
        "perf_reqs": ["Real-time bi-directional WebSocket connection for driver updates", "Sub-second order dispatch notification latency"],
        "avail_reqs": ["99.9% availability during peak lunch and dinner hours", "Resilient async order processing queue"],
        "domain_question": ClarificationQuestion(
            id="q_live_tracking",
            question="Do you need real-time GPS live tracking for deliveries?",
            options=["Yes, live map tracking", "No, status updates only"],
            default_value="Yes, live map tracking",
            hint="Adds WebSocket / real-time messaging gateway for instant driver updates."
        )
    },
    {
        "type": "Social Media",
        "patterns": [r"\b(social\s*media|social\s*network|posts|followers|timeline|feed|chat|direct\s*messages)\b"],
        "default_features": ["User Profiles & Follow Graph", "Activity Feed Generation", "Post Creation & Media Uploads", "Real-time Direct Messaging", "Push Notifications"],
        "data_reqs": ["Graph or relational followers/friendship model", "High-throughput activity feed cache", "Scalable media storage for photos & short videos"],
        "sec_reqs": ["Private message encryption", "Automated content moderation & rate limiting", "Granular privacy & blocking settings"],
        "perf_reqs": ["P99 feed query latency under 80ms", "CDN caching for viral images and video media"],
        "avail_reqs": ["Multi-region read replicas", "Event-driven asynchronous fanout on post publication"],
        "domain_question": ClarificationQuestion(
            id="q_media_heavy",
            question="Will users upload rich media like high-res photos and videos?",
            options=["Yes, photo and video uploads", "Primarily text posts"],
            default_value="Yes, photo and video uploads",
            hint="Enables Dedicated Object Storage (S3/GCS) and Media CDN distribution."
        )
    },
    {
        "type": "Video Streaming",
        "patterns": [r"\b(video\s*streaming|stream|watch\s*videos|youtube|netflix|twitch|vod|transcoding)\b"],
        "default_features": ["Video Library Catalog", "Adaptive Bitrate Video Player", "Video Transcoding Pipeline", "User Watch History & Recommendations", "Subscription Management"],
        "data_reqs": ["Video chunk & segment storage (HLS/DASH)", "Metadata database for tags, categories, and views", "User playback session checkpoints"],
        "sec_reqs": ["DRM / Token-authenticated media stream URLs", "DDoS mitigation on public video endpoints"],
        "perf_reqs": ["Global Edge CDN with high video chunk cache-hit ratio", "High-throughput storage egress bandwidth"],
        "avail_reqs": ["99.99% CDN edge uptime", "Elastic autoscaling transcoding workers"],
        "domain_question": ClarificationQuestion(
            id="q_live_vs_vod",
            question="Is your streaming Live streaming or Video on Demand (VOD)?",
            options=["Video on Demand (VOD)", "Live Streaming", "Both VOD and Live"],
            default_value="Video on Demand (VOD)",
            hint="Live streaming requires real-time RTMP/WebRTC ingestion clusters."
        )
    },
    {
        "type": "College Management",
        "patterns": [r"\b(college|university|attendance|school|student|professors?|faculty|grading|courses)\b"],
        "default_features": ["Student & Faculty Portal", "Class Attendance Tracking", "Course Enrollment & Timetable", "Assignment Submission", "Grading & Exam Ledger"],
        "data_reqs": ["Relational ACID database for immutable grade and attendance records", "Document store for assignment PDFs", "Audit logs of faculty edits"],
        "sec_reqs": ["Role-Based Access Control (Admin, Faculty, Student)", "Encrypted student personal identification records (FERPA/GDPR compliance)", "Multi-Factor Authentication for staff"],
        "perf_reqs": ["Quick batch attendance marking without timeout", "Burst resilience during semester exam result announcements"],
        "avail_reqs": ["Standard business-hours 99.5% uptime", "Scheduled nightly off-site backups"],
        "domain_question": ClarificationQuestion(
            id="q_biometric",
            question="Do you plan to integrate biometric attendance hardware / RFID scanners?",
            options=["Yes, IoT / Hardware scanners", "No, web and mobile app only"],
            default_value="No, web and mobile app only",
            hint="IoT integration includes an IoT ingestion broker and gateway."
        )
    },
    {
        "type": "Online Banking",
        "patterns": [r"\b(banking|bank|fintech|money\s*transfer|account|balance|ledger|wire\s*transfer|loans)\b"],
        "default_features": ["Account Dashboard & Balances", "Fund Transfers & Wire Orders", "Transaction History & Ledger", "Card Management", "Fraud Detection Engine"],
        "data_reqs": ["Strictly consistent relational DB with ACID guarantees", "Immutable append-only transaction ledger", "Encrypted audit archives"],
        "sec_reqs": ["Financial-grade TLS 1.3 encryption", "Hardware Security Module (HSM) or KMS for key management", "Strict mTLS between internal microservices", "Anti-tamper audit trails"],
        "perf_reqs": ["Real-time fraud scoring (<150ms per transaction)", "Idempotent payment APIs preventing double charges"],
        "avail_reqs": ["99.999% Five-Nines High Availability", "Zero-RPO multi-datacenter active-passive replication"],
        "domain_question": ClarificationQuestion(
            id="q_fraud_detection",
            question="Do you require real-time automated fraud detection scoring?",
            options=["Yes, real-time risk engine", "No, basic rule checks"],
            default_value="Yes, real-time risk engine",
            hint="Deploys an asynchronous event-driven fraud analysis pipeline."
        )
    },
    {
        "type": "IoT Monitoring",
        "patterns": [r"\b(iot|sensors?|telemetry|smart\s*home|hardware\s*monitoring|fleet\s*tracking|devices)\b"],
        "default_features": ["Device Registration & Certificates", "High-throughput Telemetry Ingestion", "Time-series Metrics Storage", "Real-time Alerting Rules", "Device Fleet Dashboard"],
        "data_reqs": ["High-write time-series telemetry data", "Device shadow state configuration", "Downsampled historical metrics"],
        "sec_reqs": ["X.509 device mutual TLS authentication", "Per-device isolated access credentials", "Firmware over-the-air (FOTA) verification"],
        "perf_reqs": ["Sustained 5,000+ writes per second ingestion", "Instant anomaly threshold alerting"],
        "avail_reqs": ["Decoupled message buffering (Kafka/MQTT broker) ensuring no dropped sensor pings"],
        "domain_question": ClarificationQuestion(
            id="q_device_count",
            question="Approximately how many connected devices will report data?",
            options=["< 500 devices", "500 - 10,000 devices", "10,000+ devices"],
            default_value="500 - 10,000 devices",
            hint="High device counts require distributed message streaming like Kafka."
        )
    },
    {
        "type": "File Storage",
        "patterns": [r"\b(file\s*storage|drive|cloud\s*drive|dropbox|documents?|upload\s*files|folders)\b"],
        "default_features": ["Folder & File Hierarchy", "Resumable File Uploads", "File Sharing & Access Links", "Version History", "Virus & Malware Scanning"],
        "data_reqs": ["Object storage for raw file chunks", "Relational metadata database for file tree and permissions", "Search index for file names"],
        "sec_reqs": ["Presigned temporary download/upload URLs", "Server-side encryption with customer-managed keys (SSE-KMS)", "Malware quarantine pipeline"],
        "perf_reqs": ["Direct-to-storage client uploads bypassing backend bottleneck", "Accelerated multipart upload for large files (>100MB)"],
        "avail_reqs": ["99.999999999% (11 9's) object durability", "Cross-region storage replication"],
        "domain_question": ClarificationQuestion(
            id="q_file_sizes",
            question="What is the expected average file size?",
            options=["Documents (< 10 MB)", "Media / Large Archives (100 MB - 5 GB)"],
            default_value="Documents (< 10 MB)",
            hint="Large files benefit from direct presigned S3/GCS bucket uploads."
        )
    },
    {
        "type": "AI Application",
        "patterns": [r"\b(ai\s*app|llm|chatbot|generative\s*ai|machine\s*learning|embeddings|vector\s*search|openai)\b"],
        "default_features": ["Chat Interface & Prompt Input", "LLM Inference Orchestration", "Vector Database & Embeddings Search (RAG)", "Chat History & Sessions", "Token Usage & Cost Guardrails"],
        "data_reqs": ["Vector database for semantic embeddings", "Session and conversation memory store", "Prompt analytics log"],
        "sec_reqs": ["API key protection in secure secrets vault", "Prompt injection filtering & PII redaction", "Tenant-isolated vector collections"],
        "perf_reqs": ["Streaming server-sent events (SSE) for token generation", "Semantic response caching for identical queries"],
        "avail_reqs": ["Graceful fallback across multiple model providers (e.g. primary + backup)"],
        "domain_question": ClarificationQuestion(
            id="q_rag",
            question="Do you need retrieval from private documents (RAG / Vector Database)?",
            options=["Yes, Vector Database (RAG)", "No, direct LLM generation only"],
            default_value="Yes, Vector Database (RAG)",
            hint="Adds a high-performance Vector Database and document chunking worker."
        )
    }
]

# Standard clarification questions asked when user provides high-level idea without details
UNIVERSAL_QUESTIONS = [
    ClarificationQuestion(
        id="q_users",
        question="Approximately how many active users do you expect?",
        options=["< 1,000 users", "1,000 – 10,000 users", "10,000 – 100,000 users", "100,000+ users"],
        default_value="10,000 – 100,000 users",
        hint="Affects instance counts, caching tiers, and database sizing."
    ),
    ClarificationQuestion(
        id="q_payments",
        question="Do you need online payments and billing processing?",
        options=["Yes, online payments", "No, free / no payments"],
        default_value="Yes, online payments",
        hint="Recommends secure Payment Service and webhook listener."
    ),
    ClarificationQuestion(
        id="q_uploads",
        question="Do you need user image or file uploads?",
        options=["Yes, file/image uploads", "No uploads needed"],
        default_value="Yes, file/image uploads",
        hint="Includes dedicated Object Storage (S3/GCS) and CDN."
    ),
    ClarificationQuestion(
        id="q_notifications",
        question="Do you need real-time notifications or live updates?",
        options=["Yes, real-time notifications", "No, standard refresh"],
        default_value="Yes, real-time notifications",
        hint="Adds WebSocket gateway or asynchronous message queues."
    )
]


def is_explicit_technical_prompt(text: str) -> bool:
    """
    Checks if the user prompt already contains explicit technical terms
    (e.g. "React frontend connected to FastAPI with Redis and PostgreSQL").
    """
    tech_keywords = [
        "react", "vue", "angular", "next.js", "svelte",
        "fastapi", "node", "express", "django", "flask", "spring", "golang",
        "redis", "memcached", "postgres", "postgresql", "mysql", "mongodb",
        "dynamodb", "kafka", "rabbitmq", "api gateway", "load balancer", "cdn", "s3"
    ]
    matches = sum(1 for kw in tech_keywords if re.search(rf"\b{re.escape(kw)}\b", text, re.IGNORECASE))
    return matches >= 2


def analyze_requirements(prompt: str, user_answers: Dict[str, str] = None) -> RequirementAnalysisResult:
    """
    Analyzes prompt text, extracts requirements, identifies domain, and provides clarification questions if needed.
    """
    if not prompt or not prompt.strip():
        prompt = "General Web Application"

    clean_text = prompt.strip()
    user_answers = user_answers or {}

    # Check matching domain
    matched_domain = None
    for d in DOMAINS:
        for p in d["patterns"]:
            if re.search(p, clean_text, re.IGNORECASE):
                matched_domain = d
                break
        if matched_domain:
            break

    if not matched_domain:
        # Default web app domain
        matched_domain = {
            "type": "General Web Application",
            "default_features": ["User Authentication", "Web Client Interface", "REST / JSON API", "Relational Database", "Application Caching"],
            "data_reqs": ["Relational user & application data storage", "Session cache"],
            "sec_reqs": ["HTTPS encryption", "Password hashing & JWT tokens", "Rate limiting"],
            "perf_reqs": ["Standard web latency (<200ms)", "Static asset caching"],
            "avail_reqs": ["99.9% uptime", "Automated backups"],
            "domain_question": None
        }

    # Decide if clarification questions are needed:
    # If explicit tech prompt, no clarification needed.
    # If user already provided answers, no further clarification needed.
    # Otherwise, ask questions.
    explicit_tech = is_explicit_technical_prompt(clean_text)
    has_answers = len(user_answers) > 0
    needs_clarification = (not explicit_tech) and (not has_answers)

    # Prepare questions
    questions = []
    if needs_clarification:
        questions.extend(UNIVERSAL_QUESTIONS)
        if matched_domain.get("domain_question"):
            questions.append(matched_domain["domain_question"])

    # Determine expected users from answers or default
    expected_users = user_answers.get("q_users", "10,000 – 100,000")

    # Add dynamic features based on answers
    features = list(matched_domain["default_features"])
    if user_answers.get("q_payments") == "Yes, online payments" and "Payment Gateway" not in features:
        features.append("Online Payment Gateway")
    if user_answers.get("q_uploads") == "Yes, file/image uploads" and "Media / File Uploads" not in features:
        features.append("Media / File Uploads")
    if user_answers.get("q_notifications") == "Yes, real-time notifications" and "Real-time Push Notifications" not in features:
        features.append("Real-time Push Notifications")

    return RequirementAnalysisResult(
        application_type=matched_domain["type"],
        needs_clarification=needs_clarification,
        questions=questions,
        main_features=features,
        expected_users=expected_users,
        data_requirements=matched_domain["data_reqs"],
        security_requirements=matched_domain["sec_reqs"],
        performance_requirements=matched_domain["perf_reqs"],
        availability_requirements=matched_domain["avail_reqs"],
        raw_prompt=prompt
    )
