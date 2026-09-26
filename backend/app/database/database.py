"""
Database configuration compatibility module.
Provides access to Base, SessionLocal, engine, get_db, DATABASE_URL, and DB_DIR
from the primary backend database module.
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
    from backend.database.database import (
        Base,
        DATABASE_URL,
        DB_DIR,
        SessionLocal,
        engine,
        get_db,
    )
except (ImportError, ModuleNotFoundError, ValueError):
    from database.database import (  # type: ignore
        Base,
        DATABASE_URL,
        DB_DIR,
        SessionLocal,
        engine,
        get_db,
    )

__all__ = [
    "Base",
    "SessionLocal",
    "engine",
    "get_db",
    "DATABASE_URL",
    "DB_DIR",
]

if __name__ == "__main__":
    print("Database module loaded successfully.")
