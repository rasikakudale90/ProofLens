from abc import ABC, abstractmethod
from typing import List, Optional, Type, TypeVar, Dict, Any
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class AIProvider(ABC):
    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Embeds a single query or passage into a float vector."""
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embeds a batch of texts into float vectors."""
        pass

    @abstractmethod
    def generate_structured(
        self,
        system_instruction: str,
        user_prompt: str,
        response_schema: Type[T],
    ) -> T:
        """Generates a structured Pydantic response from the model."""
        pass
