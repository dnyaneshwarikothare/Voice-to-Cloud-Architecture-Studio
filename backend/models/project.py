"""
SQLAlchemy and Pydantic models for Project persistence in SQLite
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, Text, DateTime
from pydantic import BaseModel, Field
try:
    from backend.database.database import Base
except (ImportError, ValueError):
    try:
        from database.database import Base  # type: ignore
    except (ImportError, ValueError):
        from ..database.database import Base  # type: ignore


# SQLAlchemy Model
class ProjectORM(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    architecture_json = Column(Text, nullable=False)
    cloud_provider = Column(String(50), default="logical")
    cost_assumptions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Pydantic Schemas
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = ""
    cloud_provider: Optional[str] = "logical"


class ProjectCreate(ProjectBase):
    architecture: Dict[str, Any]
    cost_assumptions: Optional[Dict[str, Any]] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    architecture: Optional[Dict[str, Any]] = None
    cloud_provider: Optional[str] = None
    cost_assumptions: Optional[Dict[str, Any]] = None


class ProjectResponse(ProjectBase):
    id: int
    architecture: Dict[str, Any]
    cost_assumptions: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
