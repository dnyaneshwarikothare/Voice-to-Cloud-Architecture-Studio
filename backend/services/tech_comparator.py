"""
Technology Comparison Service
Provides objective, multi-criteria comparisons between architectural technologies:
Backend Frameworks, Databases, Caching Layers, and Message Brokers.
Evaluates fit, complexity, concurrency, ecosystem, and approximate hosting cost.
"""

from typing import Dict, Any, List

TECH_PROFILES: Dict[str, Dict[str, Any]] = {
    # Backend frameworks
    "fastapi": {
        "name": "FastAPI (Python)",
        "category": "backend",
        "description": "Modern, high-performance asynchronous web framework for Python 3.8+ based on standard Python type hints.",
        "architecture_fit": "Excellent for AI/ML pipelines, microservices, data APIs, and rapid prototyping.",
        "concurrency_model": "Asyncio event loop with Uvicorn (ASGI). Highly efficient for I/O-bound operations.",
        "complexity": "Low to Moderate. Clean Pythonic syntax, automatic Swagger/OpenAPI documentation.",
        "ecosystem": "Vast Python ecosystem (NumPy, PyTorch, Pandas, SQLAlchemy, Pydantic).",
        "pros": ["Automatic OpenAPI / Swagger UI generation", "Built-in Pydantic data validation", "Seamless AI/data science integration"],
        "cons": ["CPU-bound tasks require multiprocessing", "Python GIL can limit extreme multithreaded raw compute"],
        "estimated_monthly_base": 35.00
    },
    "node": {
        "name": "Node.js (Express / Fastify)",
        "category": "backend",
        "description": "JavaScript runtime built on Chrome's V8 engine with an event-driven, non-blocking I/O model.",
        "architecture_fit": "Ideal for real-time applications (chat, collaborative tools), REST APIs, and fullstack JS/TS teams.",
        "concurrency_model": "Single-threaded event loop with libuv worker pool. High concurrent connection capacity.",
        "complexity": "Low to Moderate. Ubiquitous JavaScript knowledge across frontend and backend.",
        "ecosystem": "Largest package ecosystem in the world (npm) with millions of reusable libraries.",
        "pros": ["Shared language across client & server (TypeScript)", "Huge developer talent pool", "Great real-time WebSocket support"],
        "cons": ["Async callback / Promise chaining pitfalls", "npm dependency bloat risk"],
        "estimated_monthly_base": 30.00
    },
    "springboot": {
        "name": "Spring Boot (Java)",
        "category": "backend",
        "description": "Enterprise-grade Java framework providing production-ready infrastructure out of the box.",
        "architecture_fit": "Best suited for mission-critical enterprise systems, banking ledgers, and large multi-team codebases.",
        "concurrency_model": "Multi-threaded JVM (virtual threads via Project Loom in Java 21+). High throughput compute.",
        "complexity": "High. Extensive annotations, dependency injection configuration, and JVM tuning required.",
        "ecosystem": "Rock-solid enterprise libraries (Spring Cloud, Spring Security, Hibernate, Kafka).",
        "pros": ["Extreme reliability & backwards compatibility", "Top-tier enterprise security integrations", "Long-term vendor support"],
        "cons": ["Higher RAM footprint on cold starts", "Steeper learning curve for new developers"],
        "estimated_monthly_base": 65.00
    },
    "golang": {
        "name": "Go (Gin / Fiber)",
        "category": "backend",
        "description": "Compiled, statically typed language designed at Google for high-concurrency cloud networking.",
        "architecture_fit": "Superb for high-throughput microservices, API gateways, Kubernetes operators, and low-latency proxies.",
        "concurrency_model": "Goroutines with channel synchronization. Thousands of concurrent requests per megabyte of RAM.",
        "complexity": "Moderate. Minimalist language design, fast compilation, explicit error handling.",
        "ecosystem": "Standard cloud native ecosystem (Docker, Kubernetes, Terraform are all written in Go).",
        "pros": ["Minimal memory consumption (< 30MB RAM baseline)", "Lightning-fast sub-second cold starts", "Single compiled binary deployment"],
        "cons": ["Less syntactic sugar", "Verbose error handling boilerplate (if err != nil)"],
        "estimated_monthly_base": 25.00
    },

    # Databases
    "postgresql": {
        "name": "PostgreSQL",
        "category": "database",
        "description": "The world's most advanced open-source relational database with full ACID compliance and JSONB support.",
        "architecture_fit": "The default choice for relational business data, transactional ledgers, e-commerce, and hybrid JSON stores.",
        "concurrency_model": "Multi-Version Concurrency Control (MVCC) with connection pooling.",
        "complexity": "Moderate. Standard SQL schemas, foreign keys, migrations, and index optimization.",
        "ecosystem": "Rich extensions ecosystem (PostGIS for geospatial, pgvector for AI vector embeddings, TimescaleDB).",
        "pros": ["Rock-solid ACID transactions", "Hybrid relational + JSON document support", "Extensive tooling and cloud managed offerings"],
        "cons": ["Horizontal write sharding is complex", "Requires active connection pooling at scale (PgBouncer)"],
        "estimated_monthly_base": 54.00
    },
    "mongodb": {
        "name": "MongoDB",
        "category": "database",
        "description": "Leading distributed document database storing flexible, schema-free BSON documents.",
        "architecture_fit": "Great for content management, rapid schema iteration, catalog product variants, and mobile app backends.",
        "concurrency_model": "Document-level locking with wiredTiger storage engine. Built-in horizontal sharding.",
        "complexity": "Low to Moderate. Schema flexibility accelerates early development but requires strict app-level validation.",
        "ecosystem": "Strong driver support, Atlas cloud suite, aggregations pipeline framework.",
        "pros": ["Dynamic schema evolves with features", "Native horizontal clustering & auto-sharding", "Natural JSON object mapping"],
        "cons": ["Complex multi-document joins have performance costs", "Larger disk storage footprint than normalized relational tables"],
        "estimated_monthly_base": 57.00
    },
    "dynamodb": {
        "name": "Amazon DynamoDB",
        "category": "database",
        "description": "Fully managed, serverless NoSQL key-value and document database delivering consistent single-digit millisecond latency.",
        "architecture_fit": "Ideal for hyperscale cloud-native workloads, gaming leaderboards, shopping carts, and IoT telemetry.",
        "concurrency_model": "Distributed partition-based auto-scaling across AWS regions.",
        "complexity": "High for complex queries. Requires Single Table Design and upfront partition key planning.",
        "ecosystem": "Deep AWS native integration (Lambda, EventBridge, IAM, CloudWatch).",
        "pros": ["Zero server management or patching", "Predictable sub-10ms response times at any scale", "Serverless pay-per-request pricing"],
        "cons": ["AWS vendor lock-in", "No ad-hoc analytical multi-table queries without external search engines"],
        "estimated_monthly_base": 25.00
    },

    # Cache
    "redis": {
        "name": "Redis",
        "category": "cache",
        "description": "In-memory data structure store used as a distributed cache, message broker, and streaming engine.",
        "architecture_fit": "Essential for high-traffic read offloading, session tokens, rate limiting counters, and pub/sub queues.",
        "concurrency_model": "Single-threaded core event loop avoiding lock contention. Sub-millisecond read/writes.",
        "complexity": "Low. Intuitive key-value and data structure API (Hashes, Sets, Sorted Sets).",
        "ecosystem": "Universal client library support in every major programming language.",
        "pros": ["Sub-millisecond memory speed", "Versatile data structures (sorted sets, hyperloglog)", "Built-in replication and clustering"],
        "cons": ["Data set must fit in RAM", "Persistence requires periodic disk snapshots (RDB/AOF)"],
        "estimated_monthly_base": 29.00
    },
    "memcached": {
        "name": "Memcached",
        "category": "cache",
        "description": "High-performance, distributed memory object caching system for simple key-value lookups.",
        "architecture_fit": "Suited for purely transient string/blob caching where advanced data structures are not required.",
        "concurrency_model": "Multi-threaded memory allocation engine.",
        "complexity": "Very Low. Simple GET/SET/DELETE operations.",
        "ecosystem": "Mature, established web standard.",
        "pros": ["Multi-threaded architecture excels on multi-core compute", "Extremely simple and lightweight"],
        "cons": ["No complex data structures (only raw strings)", "No disk persistence or pub/sub capabilities"],
        "estimated_monthly_base": 24.00
    }
}


def compare_technologies(tech_ids: List[str]) -> Dict[str, Any]:
    """
    Compares selected technologies side-by-side with objective criteria.
    """
    results = []
    for tid in tech_ids:
        clean_id = tid.lower().replace("-", "").replace(".", "").replace(" ", "")
        found = None
        for key, profile in TECH_PROFILES.items():
            if key in clean_id or clean_id in key or profile["name"].lower().startswith(clean_id):
                found = profile
                break
        if found:
            results.append(found)

    return {
        "technologies": results,
        "comparison_count": len(results),
        "guidance": "Technology selection should depend on team proficiency, existing ecosystem, and workload latency requirements."
    }
