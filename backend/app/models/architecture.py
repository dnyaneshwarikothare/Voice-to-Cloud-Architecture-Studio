"""
Architecture models compatibility module.
Re-exports architecture models from backend.models.architecture.
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
    from backend.models.architecture import *
except (ImportError, ModuleNotFoundError, ValueError):
    from models.architecture import *  # type: ignore

if __name__ == "__main__":
    print("Architecture models loaded successfully.")
