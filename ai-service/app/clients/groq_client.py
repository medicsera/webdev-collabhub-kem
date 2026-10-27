import os
from typing import Optional
from groq import Groq
from app.core.config import settings, GROQ_API_KEY


class GroqClient:
    """
    Клиент для взаимодействия с моделями генерации через Groq API.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or GROQ_API_KEY or settings.GROQ_API_KEY
        self.default_model = model or settings.DEFAULT_MODEL
        self._client: Optional[Groq] = None

    @property
    def client(self) -> Groq:
        if self._client is None:
            self._client = Groq(api_key=self.api_key)
        return self._client

    def generate_response(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = 0.2,
        model: Optional[str] = None,
    ) -> str:
        """
        Отправляет запрос к Groq Chat Completions API и возвращает сгенерированный текст.
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        target_model = model or self.default_model
        chat_completion = self.client.chat.completions.create(
            messages=messages,
            model=target_model,
            temperature=temperature,
        )
        return chat_completion.choices[0].message.content or ""
