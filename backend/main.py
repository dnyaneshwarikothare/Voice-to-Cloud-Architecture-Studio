"""
Main entry point for AI Voice-to-Cloud Architecture Studio Backend
FastAPI REST Server with SQLite persistence, modular services, and CORS support.
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure both workspace root and backend directory are in sys.path
_current_dir = Path(__file__).resolve().parent
_root_dir = _current_dir.parent
for _p in [str(_root_dir), str(_current_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from .database.database import engine, Base
    from .api.routes import router as api_router
except (ImportError, ValueError):
    from backend.database.database import engine, Base
    from backend.api.routes import router as api_router

# Load environment variables
load_dotenv()

# Create SQLite database tables if not already created
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Voice-to-Cloud Architecture Studio API",
    version="1.0.0",
    description="Intelligent architecture design platform translating natural language and voice into cloud architectures."
)

# Configure CORS origins safely via environment variable with local development defaults
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env.strip():
    allowed_origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]
else:
    # Default development origins: local Vite, standard frontend dev ports, and local API
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router)


@app.get("/health")
@app.get("/api/health")
def health_status():
    return {
        "status": "online",
        "service": "AI Voice-to-Cloud Architecture Studio Backend",
        "database": "connected"
    }


@app.get("/")
def root_status():
    return {
        "status": "online",
        "service": "AI Voice-to-Cloud Architecture Studio",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "analyze_requirements": "/api/analyze-requirements",
            "generate_architecture": "/api/generate-architecture",
            "validate_architecture": "/api/validate-architecture",
            "analyze_health": "/api/analyze-health",
            "estimate_cost": "/api/estimate-cost",
            "simulate_traffic": "/api/simulate-traffic",
            "simulate_failure": "/api/simulate-failure",
            "optimize": "/api/optimize",
            "map_cloud": "/api/map-cloud",
            "generate_terraform": "/api/generate-terraform",
            "demos": "/api/demos",
            "projects": "/api/projects"
        }
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    app_module = "main:app" if Path.cwd().resolve() == _current_dir else "backend.main:app"
    uvicorn.run(app_module, host="127.0.0.1", port=port, reload=True)
