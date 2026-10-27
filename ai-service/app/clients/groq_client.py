import json
import logging
from typing import Any, Dict, List, Optional
from groq import AsyncGroq
from app.clients.base import BaseLLMClient
from app.core.config import settings

logger = logging.getLogger(__name__)


class GroqClient(BaseLLMClient):
    def __init__(
            self,
            api_key: Optional[str] = None,
            model: Optional[str] = None,
    ):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")
        self.client = AsyncGroq(api_key=self.api_key)

    async def generate_response(
            self,
            prompt: str,
            system_prompt: Optional[str] = None,
            temperature: float = 0.2,
    ) -> str:
        """Базовый вызов модели с передачей системного и пользовательского промпта."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Ошибка при обращении к Groq API: {e}")
            raise e

    async def analyze_skill_gaps(
            self,
            student_skills: List[str],
            project_title: str,
            project_description: str,
            project_requirements: List[str],
    ) -> Dict[str, Any]:
        """
        Анализ профиля студента под требования конкретного проекта.
        Возвращает структурированный JSON с сильными сторонами, пробелами и рекомендациями.
        """
        system_prompt = (
            "Ты — ведущий технический эксперт и куратор студенческих IT-проектов. "
            "Твоя задача — объективно оценить соответствие навыков студента требованиям проекта, "
            "выявить пробелы (skill gaps) и дать конструктивные рекомендации. "
            "Отвечай строго в формате валидного JSON без markdown-разметки (без ```json)."
        )

        user_prompt = f"""
Проанализируй соответствие кандидата проекту:

Проект: {project_title}
Описание проекта: {project_description}
Требуемые компетенции проекта: {json.dumps(project_requirements, ensure_ascii=False)}

Навыки студента: {json.dumps(student_skills, ensure_ascii=False)}

Верни JSON со следующей структурой:
{{
  "summary": "Краткое заключение (2-3 предложения) о готовности студента к проекту",
  "matching_skills": ["навыки студента, которые идеально подходят под проект"],
  "missing_skills": ["требования проекта, которых нет у студента"],
  "recommendations": [
    "конкретный шаг для закрытия пробела 1",
    "конкретный шаг для закрытия пробела 2"
  ]
}}
"""

        try:
            raw_response = await self.generate_response(
                prompt=user_prompt.strip(),
                system_prompt=system_prompt,
                temperature=0.1,
            )
            # Очистка от случайных markdown-тегов
            cleaned = raw_response.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"Не удалось распарсить JSON от Groq или сервис недоступен: {e}")
            # Безопасный фоллбэк, чтобы API не падало с 500
            return {
                "summary": "Автоматический анализ временно недоступен.",
                "matching_skills": [s for s in student_skills if s in project_requirements],
                "missing_skills": [r for r in project_requirements if r not in student_skills],
                "recommendations": ["Рекомендуется пройти собеседование с куратором проекта."],
            }


# Экземпляр клиента для использования в роутах
groq_client = GroqClient()