"""
Architecture Response Caching Service
Normalizes architecture requests and caches validated architecture results.
Reduces unnecessary AI API calls and improves response speed.
"""

import time
import hashlib
import json
import re
from typing import Dict, Any, Optional

class ResponseCacheManager:
    def __init__(self, ttl_seconds: int = 86400, max_entries: int = 500):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _normalize_key(
        self,
        prompt: str,
        application_type: Optional[str] = None,
        answers: Optional[Dict[str, str]] = None,
        cloud_provider: str = "logical"
    ) -> str:
        # 1. Normalize prompt string: strip whitespace, lowercase, collapse multiple spaces
        norm_prompt = re.sub(r"\s+", " ", (prompt or "").strip().lower())
        norm_app_type = (application_type or "").strip().lower()
        
        # 2. Normalize answers dictionary (sorted keys)
        answers = answers or {}
        sorted_answers = {
            str(k).strip().lower(): str(v).strip().lower()
            for k, v in sorted(answers.items())
        }
        norm_answers_str = json.dumps(sorted_answers, sort_keys=True)
        norm_cloud = (cloud_provider or "logical").strip().lower()

        # 3. Create SHA-256 fingerprint
        raw_combined = f"{norm_prompt}|{norm_app_type}|{norm_answers_str}|{norm_cloud}"
        return hashlib.sha256(raw_combined.encode("utf-8")).hexdigest()

    def get(
        self,
        prompt: str,
        application_type: Optional[str] = None,
        answers: Optional[Dict[str, str]] = None,
        cloud_provider: str = "logical"
    ) -> Optional[Dict[str, Any]]:
        key = self._normalize_key(prompt, application_type, answers, cloud_provider)
        entry = self._cache.get(key)
        if not entry:
            return None

        # Check expiration
        now = time.time()
        if now - entry["timestamp"] > self.ttl_seconds:
            del self._cache[key]
            return None

        return entry["data"]

    def set(
        self,
        prompt: str,
        architecture_data: Dict[str, Any],
        application_type: Optional[str] = None,
        answers: Optional[Dict[str, str]] = None,
        cloud_provider: str = "logical"
    ):
        key = self._normalize_key(prompt, application_type, answers, cloud_provider)

        # Evict oldest entry if capacity reached
        if len(self._cache) >= self.max_entries:
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k]["timestamp"])
            del self._cache[oldest_key]

        self._cache[key] = {
            "timestamp": time.time(),
            "data": architecture_data
        }

    def clear(self):
        self._cache.clear()

    def size(self) -> int:
        return len(self._cache)

# Global response cache singleton
response_cache = ResponseCacheManager()
