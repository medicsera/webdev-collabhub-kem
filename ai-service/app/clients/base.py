from abc import ABC, abstractmethod
from typing import Optional
from gigachat import GigaChat
from gigachat.models import Chat, Messages, MessagesRole
from app.core.config import settings

class BaseLLMClient(ABC):
    @abstractmethod
    async def generate_response(
            self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2
    ) -> str:
        pass

client = GigaChat(
    credentials=settings.GIGACHAT_CREDENTIALS,
    scope=settings.GIGACHAT_SCOPE,
    verify_ssl_certs=False
)

def get_all_models() -> list[dict]:
    models_data = client.get_models()
    # Извлекаем идентификатор через id или id_, так как атрибута name в SDK нет
    return [
        {
            "id": getattr(m, "id", getattr(m, "id_", "Unknown")),
            "owned_by": "Sber"
        }
        for m in models_data.data
    ]

def test_ai_connection(prompt_text: str, model_id: str = "GigaChat-2") -> str:
    # Оборачиваем запрос в объект Chat
    payload = Chat(
        messages=[Messages(role=MessagesRole.USER, content=prompt_text)],
        model=model_id
    )
    response = client.chat(payload)
    return response.choices[0].message.content