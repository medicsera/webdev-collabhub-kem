from abc import ABC, abstractmethod
from typing import Optional
from groq import Groq
from app.core.config import GROQ_API_KEY

class BaseLLMClient(ABC):
    """Базовый класс для LLM клиентов."""

    @abstractmethod
    async def generate_response(
            self,
            prompt: str,
            system_prompt: Optional[str] = None,
            temperature: float = 0.2,
    ) -> str:
        pass

# Инициализируем клиент с проверенным ключом
client = Groq(api_key=GROQ_API_KEY)

def get_all_models() -> list[dict]:
    """Запрашивает полный список моделей, доступных текущему API-ключу"""
    models_data = client.models.list()
    # Возвращаем форматированный список со сведениями о каждой модели
    return [
        {
            "id": model.id,
            "owned_by": model.owned_by,
            "active": model.active,
            "context_window": getattr(model, "context_window", None),
        }
        for model in models_data.data
    ]

def test_ai_connection(prompt_text: str, model_id: str = "qwen/qwen3.8-27b") -> str:
    """Отправляет тестовый запрос к выбранной модели"""
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt_text}],
        model=model_id,
    )
    return chat_completion.choices[0].message.content