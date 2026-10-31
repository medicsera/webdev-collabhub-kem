import json
import logging
from typing import Any, Dict, List, Optional
from gigachat import GigaChat
from gigachat.models import Chat, Messages, MessagesRole

from app.clients.base import BaseLLMClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class GigaChatWrapper(BaseLLMClient):
    def __init__(self):
        self.model = settings.DEFAULT_MODEL
        self.client = GigaChat(
            credentials=settings.GIGACHAT_CREDENTIALS,
            scope=settings.GIGACHAT_SCOPE,
            verify_ssl_certs=False
        )

    async def generate_response(
            self,
            prompt: str,
            system_prompt: Optional[str] = None,
            temperature: float = 0.2,
    ) -> str:
        messages = []
        if system_prompt:
            messages.append(Messages(role=MessagesRole.SYSTEM, content=system_prompt))
        messages.append(Messages(role=MessagesRole.USER, content=prompt))

        payload = Chat(
            messages=messages,
            model=self.model,
            temperature=temperature
        )

        try:
            response = await self.client.achat(payload)
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Ошибка при обращении к GigaChat API: {e}")
            raise e

    async def analyze_skill_gaps(
            self,
            student_skills: List[str],
            project_title: str,
            project_description: str,
            project_requirements: List[str],
    ) -> Dict[str, Any]:

        system_prompt = (
            "Ты — ведущий технический эксперт. Твоя задача — объективно оценить соответствие "
            "навыков студента требованиям проекта. "
            "Отвечай строго в формате валидного JSON без markdown-разметки (без ```json)."
        )

        user_prompt = f"""
        Проект: {project_title}
        Требования проекта: {json.dumps(project_requirements, ensure_ascii=False)}
        Навыки студента: {json.dumps(student_skills, ensure_ascii=False)}
        
        Верни JSON со следующей структурой:
        {{
          "summary": "Краткое заключение",
          "matching_skills": ["навыки студента, которые подходят под проект"],
          "missing_skills": ["требования проекта, которых нет у студента"],
          "recommendations": ["конкретный шаг для закрытия пробела 1"]
        }}
        """

        try:
            raw_response = await self.generate_response(
                prompt=user_prompt.strip(),
                system_prompt=system_prompt,
                temperature=0.1,
            )
            cleaned = raw_response.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"Ошибка парсинга ответа GigaChat: {e}")
            return {
                "summary": "Автоматический анализ временно недоступен.",
                "matching_skills": [s for s in student_skills if s in project_requirements],
                "missing_skills": [r for r in project_requirements if r not in student_skills],
                "recommendations": ["Рекомендуется пройти собеседование с куратором."],
            }

gigachat_client = GigaChatWrapper()