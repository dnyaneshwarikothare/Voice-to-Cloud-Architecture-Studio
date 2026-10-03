"""
AI Usage Management Service
Tracks request metrics, provider usage, success/failure counts, latency, and session stats.
Does NOT expose secret API keys.
"""

import time
from typing import Dict, Any, List, Optional
from collections import deque
from datetime import datetime

class AIUsageManager:
    def __init__(self, max_history: int = 100):
        self.max_history = max_history
        self.session_start = datetime.utcnow().isoformat() + "Z"
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.cached_requests = 0
        self.fallback_events = 0
        
        # Stats per provider
        self.provider_stats: Dict[str, Dict[str, Any]] = {
            "gemini": {"requests": 0, "success": 0, "fail": 0, "total_ms": 0, "avg_ms": 0, "tokens": 0},
            "openai": {"requests": 0, "success": 0, "fail": 0, "total_ms": 0, "avg_ms": 0, "tokens": 0},
            "anthropic": {"requests": 0, "success": 0, "fail": 0, "total_ms": 0, "avg_ms": 0, "tokens": 0},
            "groq": {"requests": 0, "success": 0, "fail": 0, "total_ms": 0, "avg_ms": 0, "tokens": 0},
            "rule_based_engine": {"requests": 0, "success": 0, "fail": 0, "total_ms": 0, "avg_ms": 0, "tokens": 0}
        }
        
        # Recent activity log (FIFO deque)
        self.history = deque(maxlen=max_history)

    def record_request(
        self,
        provider: str,
        success: bool,
        duration_ms: float,
        cached: bool = False,
        was_fallback: bool = False,
        prompt_snippet: str = "",
        tokens: int = 0,
        error_msg: Optional[str] = None
    ):
        self.total_requests += 1
        if cached:
            self.cached_requests += 1
        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1
        if was_fallback:
            self.fallback_events += 1

        # Update per-provider stats
        if provider not in self.provider_stats:
            self.provider_stats[provider] = {"requests": 0, "success": 0, "fail": 0, "total_ms": 0, "avg_ms": 0, "tokens": 0}
        
        stat = self.provider_stats[provider]
        stat["requests"] += 1
        if success:
            stat["success"] += 1
        else:
            stat["fail"] += 1
        stat["total_ms"] += duration_ms
        stat["avg_ms"] = round(stat["total_ms"] / max(1, stat["requests"]), 1)
        stat["tokens"] += tokens

        # Append to recent history
        self.history.appendleft({
            "id": f"req_{self.total_requests}",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "provider": provider,
            "success": success,
            "duration_ms": round(duration_ms, 1),
            "cached": cached,
            "was_fallback": was_fallback,
            "prompt_snippet": (prompt_snippet[:60] + "...") if len(prompt_snippet) > 60 else prompt_snippet,
            "approx_tokens": tokens,
            "error": error_msg
        })

    def get_summary(self) -> Dict[str, Any]:
        return {
            "session_start": self.session_start,
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "cached_requests": self.cached_requests,
            "fallback_events": self.fallback_events,
            "success_rate_pct": round((self.successful_requests / max(1, self.total_requests)) * 100, 1),
            "cache_hit_rate_pct": round((self.cached_requests / max(1, self.total_requests)) * 100, 1),
            "provider_stats": self.provider_stats,
            "recent_activity": list(self.history)[:20]
        }

# Global usage manager singleton
usage_manager = AIUsageManager()
