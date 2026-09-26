"""
Project models compatibility module.
Re-exports project models from backend.models.project.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure project root and backend directory are in sys.path
_current = Path(__file__).resolve().parent
_backend = _current.parent.parent
_root = _backend.parent

for _p in [str(_root), str(_backend)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.models.project import (
        ProjectORM,
        ProjectBase,
        ProjectCreate,
        ProjectUpdate,
        ProjectResponse,
    )
except (ImportError, ModuleNotFoundError, ValueError):
    from models.project import (  # type: ignore
        ProjectORM,
        ProjectBase,
        ProjectCreate,
        ProjectUpdate,
        ProjectResponse,
    )

__all__ = [
    "ProjectORM",
    "ProjectBase",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
]

if __name__ == "__main__":
    print("Project models loaded successfully.")
