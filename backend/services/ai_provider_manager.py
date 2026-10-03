"""
AI Provider Fallback Manager
Manages LLM providers with automatic fallback, rate limit detection, and rule-based failover.
Primary Provider -> Backup Provider -> Rule-Based Fallback.
API keys remain strictly on the backend.
"""

import os
import time
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import httpx

from backend.models.architecture import ArchitectureModel, Component, Connection
from backend.services.ai_usage_manager import usage_manager
from backend.services.cache_manager import response_cache
from backend.services.architecture_validator import validate_architecture, repair_architecture_dict

logger = logging.getLogger("AIProviderManager")

ARCHITECTURE_SCHEMA_INSTRUCTION = """
You are an expert cloud architect. Return ONLY a valid JSON object matching the following structure without Markdown formatting or backticks:
{
  "project_name": "Project Name",
  "description": "Short description of the system",
  "cloud_provider": "logical",
  "components": [
    {
      "id": "unique_alphanumeric_id",
      "name": "Component Display Name",
      "type": "frontend|backend|database|cache|queue|gateway|loadbalancer|cdn|storage|auth|monitoring|payment|custom",
      "role": "Architecture Role",
      "technology": "Specific Technology (e.g. Next.js, FastAPI, PostgreSQL, Redis)",
      "purpose": "Specific operational purpose",
      "why_recommended": "Reason for inclusion",
      "benefits": ["Benefit 1", "Benefit 2"],
      "disadvantages": ["Disadvantage 1"],
      "tier": "standard"
    }
  ],
  "connections": [
    {
      "from": "source_component_id",
      "to": "target_component_id",
      "protocol": "HTTPS|REST|gRPC|SQL",
      "label": "Data or request flow description"
    }
  ]
}
Rules:
- NEVER connect frontend directly to database. Always route through backend or gateway.
- Ensure all connection 'from' and 'to' IDs exist in 'components'.
- Component IDs must be unique, lowercase, alphanumeric with underscores.
- Include practical technologies matching the user prompt.
"""


class BaseAIProvider(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if the provider has the necessary credentials configured."""
        pass

    @abstractmethod
    async def generate_architecture(
        self,
        prompt: str,
        application_type: Optional[str] = None,
        answers: Optional[Dict[str, str]] = None,
        cloud_provider: str = "logical"
    ) -> ArchitectureModel:
        """Generates structured ArchitectureModel from prompt."""
        pass


class OpenAIProvider(BaseAIProvider):
    def __init__(self):
        super().__init__("openai")
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate_architecture(
        self,
        prompt: str,
        application_type: Optional[str] = None,
        answers: Optional[Dict[str, str]] = None,
        cloud_provider: str = "logical"
    ) -> ArchitectureModel:
        if not self.is_configured():
            raise ValueError("OpenAI API key not configured")

        user_content = f"Requirement: {prompt}\nDomain: {application_type or 'Web App'}\nCloud: {cloud_provider}\nAnswers: {json.dumps(answers or {})}"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": ARCHITECTURE_SCHEMA_INSTRUCTION},
                {"role": "user", "content": user_content}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=18.0) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", json=payload, headers=headers)
            if resp.status_code in [429, 402]:
                raise RuntimeError(f"OpenAI quota/rate limit error: HTTP {resp.status_code}")
            resp.raise_for_status()
            data = resp.json()

            raw_json = data["choices"][0]["message"]["content"]
            parsed_data = json.loads(raw_json)
            repaired = repair_architecture_dict(parsed_data)
            return ArchitectureModel.model_validate(repaired)


class GeminiProvider(BaseAIProvider):
    def __init__(self):
        super().__init__("gemini")
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate_architecture(
        self,
        prompt: str,
        application_type: Optional[str] = None,
        answers: Optional[Dict[str, str]] = None,
        cloud_provider: str = "logical"
    ) -> ArchitectureModel:
        if not self.is_configured():
            raise ValueError("Gemini API key not configured")

        user_content = f"Requirement: {prompt}\nDomain: {application_type or 'Web App'}\nCloud: {cloud_provider}\nAnswers: {json.dumps(answers or {})}"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        payload = {
            "systemInstruction": {"parts": [{"text": ARCHITECTURE_SCHEMA_INSTRUCTION}]},
            "contents": [{"parts": [{"text": user_content}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }

        async with httpx.AsyncClient(timeout=18.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code in [429, 402]:
                raise RuntimeError(f"Gemini quota/rate limit exceeded: HTTP {resp.status_code}")
            resp.raise_for_status()
            data = resp.json()

            candidates = data.get("candidates", [])
            if not candidates:
                raise ValueError("No response candidates returned from Gemini")

            raw_json = candidates[0]["content"]["parts"][0]["text"]
            parsed_data = json.loads(raw_json)
            repaired = repair_architecture_dict(parsed_data)
            return ArchitectureModel.model_validate(repaired)


class AnthropicProvider(BaseAIProvider):
    def __init__(self):
        super().__init__("anthropic")
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
        self.model = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307").strip()

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate_architecture(
        self,
        prompt: str,
        application_type: Optional[str] = None,
        answers: Optional[Dict[str, str]] = None,
        cloud_provider: str = "logical"
    ) -> ArchitectureModel:
        if not self.is_configured():
            raise ValueError("Anthropic API key not configured")

        user_content = f"Requirement: {prompt}\nDomain: {application_type or 'Web App'}\nCloud: {cloud_provider}\nAnswers: {json.dumps(answers or {})}"
        payload = {
            "model": self.model,
            "max_tokens": 2048,
            "system": ARCHITECTURE_SCHEMA_INSTRUCTION,
            "messages": [{"role": "user", "content": user_content}],
            "temperature": 0.2
        }

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=18.0) as client:
            resp = await client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers)
            if resp.status_code in [429, 402]:
                raise RuntimeError(f"Anthropic quota error: HTTP {resp.status_code}")
            resp.raise_for_status()
            data = resp.json()

            raw_text = data["content"][0]["text"].strip()
            # If wrapped in markdown code blocks, strip them
            if raw_text.startswith("```"):
                lines = raw_text.splitlines()
                raw_text = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])
            parsed_data = json.loads(raw_text)
            repaired = repair_architecture_dict(parsed_data)
            return ArchitectureModel.model_validate(repaired)


class GroqProvider(BaseAIProvider):
    def __init__(self):
        super().__init__("groq")
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate_architecture(
        self,
        prompt: str,
        application_type: Optional[str] = None,
        answers: Optional[Dict[str, str]] = None,
        cloud_provider: str = "logical"
    ) -> ArchitectureModel:
        if not self.is_configured():
            raise ValueError("Groq API key not configured")

        user_content = f"Requirement: {prompt}\nDomain: {application_type or 'Web App'}\nCloud: {cloud_provider}\nAnswers: {json.dumps(answers or {})}"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": ARCHITECTURE_SCHEMA_INSTRUCTION},
                {"role": "user", "content": user_content}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
            if resp.status_code in [429, 402]:
                raise RuntimeError(f"Groq rate limit: HTTP {resp.status_code}")
            resp.raise_for_status()
            data = resp.json()

            raw_json = data["choices"][0]["message"]["content"]
            parsed_data = json.loads(raw_json)
            repaired = repair_architecture_dict(parsed_data)
            return ArchitectureModel.model_validate(repaired)


class RuleBasedFallbackProvider(BaseAIProvider):
    """
    Guaranteed local rule-based fallback provider.
    Never fails due to quotas, rate limits, or internet connectivity issues.
    """
    def __init__(self):
        super().__init__("rule_based_engine")

    def is_configured(self) -> bool:
        return True

    async def generate_architecture(
        self,
        prompt: str,
        application_type: Optional[str] = None,
        answers: Optional[Dict[str, str]] = None,
        cloud_provider: str = "logical"
    ) -> ArchitectureModel:
        # Import local generator directly
        from backend.services.architecture_generator import generate_architecture_from_requirements
        arch = generate_architecture_from_requirements(
            prompt=prompt,
            application_type=application_type,
            answers=answers or {},
            cloud_provider=cloud_provider
        )
        return arch


class AIProviderManager:
    """
    Coordinates primary, secondary, and rule-based fallback providers.
    Transparently handles quotas, timeouts, and errors.
    """
    def __init__(self):
        self.providers: Dict[str, BaseAIProvider] = {
            "gemini": GeminiProvider(),
            "openai": OpenAIProvider(),
            "anthropic": AnthropicProvider(),
            "groq": GroqProvider(),
            "rule_based_engine": RuleBasedFallbackProvider()
        }

    def _get_provider_chain(self) -> List[BaseAIProvider]:
        primary_name = os.getenv("AI_PRIMARY_PROVIDER", "gemini").lower().strip()
        backup_name = os.getenv("AI_BACKUP_PROVIDER", "openai").lower().strip()

        chain = []
        if primary_name in self.providers and self.providers[primary_name].is_configured():
            chain.append(self.providers[primary_name])

        if backup_name in self.providers and self.providers[backup_name].is_configured():
            if self.providers[backup_name] not in chain:
                chain.append(self.providers[backup_name])

        # Add any other configured external providers
        for name, p in self.providers.items():
            if name != "rule_based_engine" and p.is_configured() and p not in chain:
                chain.append(p)

        # Rule-based fallback is ALWAYS the final guaranteed safety net
        chain.append(self.providers["rule_based_engine"])
        return chain

    async def generate_architecture(
        self,
        prompt: str,
        application_type: Optional[str] = None,
        answers: Optional[Dict[str, str]] = None,
        cloud_provider: str = "logical",
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        answers = answers or {}
        start_time = time.time()

        # 1. Check Response Cache (if not forced refresh)
        if not force_refresh:
            cached_data = response_cache.get(prompt, application_type, answers, cloud_provider)
            if cached_data:
                duration_ms = (time.time() - start_time) * 1000
                usage_manager.record_request(
                    provider=cached_data.get("provider_used", "cached"),
                    success=True,
                    duration_ms=duration_ms,
                    cached=True,
                    prompt_snippet=prompt
                )
                cached_data["cached"] = True
                return cached_data

        # 2. Iterate through provider chain
        chain = self._get_provider_chain()
        attempted_providers = []
        last_error = None
        was_fallback = False

        for idx, provider in enumerate(chain):
            attempted_providers.append(provider.name)
            p_start = time.time()
            try:
                arch_model = await provider.generate_architecture(
                    prompt=prompt,
                    application_type=application_type,
                    answers=answers,
                    cloud_provider=cloud_provider
                )

                # Validate architecture model
                val_res = validate_architecture(arch_model)
                if not val_res.is_valid:
                    raise ValueError(f"Provider '{provider.name}' generated invalid architecture structure")

                duration_ms = (time.time() - p_start) * 1000
                arch_dict = arch_model.model_dump()
                arch_dict["provider_used"] = provider.name
                arch_dict["was_fallback"] = was_fallback
                arch_dict["cached"] = False

                if was_fallback:
                    arch_dict["provider_notice"] = (
                        "Architecture generation is temporarily using an alternative provider."
                        if provider.name != "rule_based_engine"
                        else "Architecture generated using local high-reliability rule engine."
                    )

                # Save valid result to cache
                response_cache.set(prompt, arch_dict, application_type, answers, cloud_provider)

                # Record usage statistics
                usage_manager.record_request(
                    provider=provider.name,
                    success=True,
                    duration_ms=duration_ms,
                    cached=False,
                    was_fallback=was_fallback,
                    prompt_snippet=prompt,
                    tokens=len(prompt.split()) + 350
                )

                return arch_dict

            except Exception as e:
                p_duration = (time.time() - p_start) * 1000
                last_error = str(e)
                was_fallback = True
                logger.warning(f"Provider '{provider.name}' failed: {e}. Trying next provider in chain...")

                usage_manager.record_request(
                    provider=provider.name,
                    success=False,
                    duration_ms=p_duration,
                    cached=False,
                    was_fallback=was_fallback,
                    prompt_snippet=prompt,
                    error_msg=str(e)
                )

        # Fallback to local rule engine directly if entire chain somehow failed
        fallback_p = self.providers["rule_based_engine"]
        arch_model = await fallback_p.generate_architecture(prompt, application_type, answers, cloud_provider)
        arch_dict = arch_model.model_dump()
        arch_dict["provider_used"] = "rule_based_engine"
        arch_dict["was_fallback"] = True
        arch_dict["provider_notice"] = "Architecture generation is temporarily using the local rule engine."
        arch_dict["cached"] = False
        return arch_dict


# Global provider manager singleton
ai_provider_manager = AIProviderManager()
