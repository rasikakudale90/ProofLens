import logging
import hashlib
import json
from typing import List, Type, TypeVar
from pydantic import BaseModel
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.errors import AppError
from app.providers.base import AIProvider

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


class GeminiProvider(AIProvider):
    def __init__(
        self,
        api_key: str = settings.GEMINI_API_KEY,
        generation_model: str = settings.GEMINI_GENERATION_MODEL,
        embedding_model: str = settings.GEMINI_EMBEDDING_MODEL,
        dimensions: int = settings.EMBEDDING_DIMENSIONS,
    ):
        self.api_key = api_key
        self.generation_model = generation_model
        self.embedding_model = embedding_model
        self.dimensions = dimensions
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def embed_text(self, text: str) -> List[float]:
        if not self.client:
            return self._mock_embedding(text)

        candidate_models = [self.embedding_model]
        for fallback in ["gemini-embedding-001", "gemini-embedding-2"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        last_error = None
        for model_id in candidate_models:
            try:
                config = types.EmbedContentConfig(output_dimensionality=self.dimensions) if self.dimensions else None
                response = self.client.models.embed_content(
                    model=model_id,
                    contents=text,
                    config=config,
                )
                if hasattr(response, "embeddings") and response.embeddings:
                    return response.embeddings[0].values
                if hasattr(response, "embedding") and response.embedding:
                    return response.embedding.values
            except Exception as e:
                last_error = e
                logger.warning(f"Embedding with model {model_id} failed: {e}")
                continue

        logger.error(f"All Gemini embedding candidate models failed. Last error: {last_error}")
        raise AppError(
            code="PROVIDER_ERROR",
            message=f"Gemini embedding API call failed: {str(last_error)}",
            status_code=502,
        )

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not self.client:
            return [self._mock_embedding(t) for t in texts]

        results: List[List[float]] = []
        for text in texts:
            results.append(self.embed_text(text))
        return results

    def generate_structured(
        self,
        system_instruction: str,
        user_prompt: str,
        response_schema: Type[T],
    ) -> T:
        if not self.client:
            raise AppError(
                code="PROVIDER_CONFIG_ERROR",
                message="GEMINI_API_KEY is not configured.",
                status_code=500,
            )

        candidate_models = [self.generation_model]
        for fallback in ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-lite-latest"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        last_error = None
        for model_id in candidate_models:
            try:
                response = self.client.models.generate_content(
                    model=model_id,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        response_schema=response_schema,
                    ),
                )
                raw_json = response.text
                return response_schema.model_validate_json(raw_json)
            except Exception as e:
                last_error = e
                logger.warning(f"Gemini generation with {model_id} failed: {e}, attempting next model...")
                continue

        logger.error(f"All Gemini generation candidate models failed. Last error: {last_error}")
        raise AppError(
            code="PROVIDER_ERROR",
            message=f"Gemini generation API call failed: {str(last_error)}",
            status_code=502,
        )

    def _mock_embedding(self, text: str) -> List[float]:
        """
        Deterministic mock embedding for offline testing.
        Uses sha256 to generate 768 float values in [-1, 1].
        """
        seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16)
        vec = []
        for i in range(self.dimensions):
            val = ((seed * (i + 1)) % 1000) / 500.0 - 1.0
            vec.append(round(val, 6))
        # Normalize
        norm = sum(x * x for x in vec) ** 0.5 or 1.0
        return [round(x / norm, 6) for x in vec]


def get_ai_provider() -> AIProvider:
    return GeminiProvider()
