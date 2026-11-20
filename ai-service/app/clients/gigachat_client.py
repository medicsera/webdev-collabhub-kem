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

    @staticmethod
    def _norm(s: str) -> str:
        return s.strip().lower()

    async def analyze_skill_gaps(
            self,
            student_skills: List[str],
            project_title: str,
            project_description: str,
            project_requirements: List[str],
            student_bio: Optional[str] = None,
            match_score: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Gap-анализ. matching/missing считаются детерминированно (множества),
        LLM даёт только summary и recommendations — чтобы не выдумывать
        отсутствующие навыки вроде FastAPI, когда он есть у студента.
        """
        student_set = {self._norm(s) for s in student_skills}
        req_list = [r for r in project_requirements if r and r.strip()]
        req_set = {self._norm(r) for r in req_list}

        matching_skills = [r for r in req_list if self._norm(r) in student_set]
        missing_skills = [r for r in req_list if self._norm(r) not in student_set]

        system_prompt = (
            "Ты — ведущий технический эксперт. Оценивай строго по переданным спискам. "
            "Не выдумывай навыки, которых нет в списке студента, и не объявляй "
            "отсутствующим навык, который есть в списке студента. "
            "Отвечай строго в формате валидного JSON без markdown-разметки (без ```json)."
        )

        bio_line = f"\nБио студента: {student_bio}" if student_bio else ""
        score_line = f"\nОценка семантического соответствия (MiniLM): {match_score:.1f}%/100" if match_score is not None else ""
        user_prompt = f"""
        Проект: {project_title}
        Описание проекта: {project_description}
        Требования проекта: {json.dumps(req_list, ensure_ascii=False)}
        Навыки студента: {json.dumps(list(student_skills), ensure_ascii=False)}{bio_line}{score_line}

        Уже вычислено (не оспаривай):
        - совпадающие требования: {json.dumps(matching_skills, ensure_ascii=False)}
        - отсутствующие требования: {json.dumps(missing_skills, ensure_ascii=False)}

        Верни JSON:
        {{
          "summary": "2-3 предложения: сильные стороны под этот проект и главный пробел (если есть). "
                     "Опирайся только на списки выше.",
          "recommendations": ["1-3 конкретных шага по отсутствующим требованиям; если их нет — что усилить"]
        }}
        """

        fallback = {
            "summary": (
                f"Соответствие требованиям проекта «{project_title}”: "
                f"закрыто {len(matching_skills)} из {len(req_list)}."
                + (f" Пробелы: {', '.join(missing_skills)}." if missing_skills else " Все ключевые требования закрыты.")
            ),
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "recommendations": (
                [f"Изучить: {', '.join(missing_skills)}"] if missing_skills
                else ["Углубить существующие навыки и выложить работы в портфолио."]
            ),
        }

        try:
            raw_response = await self.generate_response(
                prompt=user_prompt.strip(),
                system_prompt=system_prompt,
                temperature=0.1,
            )
            cleaned = raw_response.strip().removeprefix("```json").removesuffix("```").strip()
            parsed = json.loads(cleaned)
            summary = (parsed.get("summary") or fallback["summary"]).strip()
            recs = parsed.get("recommendations") or fallback["recommendations"]
            if not isinstance(recs, list):
                recs = fallback["recommendations"]
            return {
                "summary": summary,
                "matching_skills": matching_skills,
                "missing_skills": missing_skills,
                "recommendations": [str(r) for r in recs],
            }
        except Exception as e:
            logger.warning(f"Ошибка парсинга ответа GigaChat: {e}")
            return fallback

    async def evaluate_competencies(
            self,
            student_skills: List[str],
            project_title: str,
            project_description: str,
            project_requirements: List[str],
            student_bio: Optional[str] = None,
            match_score: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        LLM-сравнение компетенций: что хорошо, что плохо и стоит ли отправлять заявку.
        """
        student_set = {self._norm(s) for s in student_skills}
        req_list = [r for r in project_requirements if r and r.strip()]
        matching_skills = [r for r in req_list if self._norm(r) in student_set]
        missing_skills = [r for r in req_list if self._norm(r) not in student_set]

        # Базовая оценка доли совпадений
        overlap_ratio = len(matching_skills) / max(1, len(req_list))
        calculated_score = match_score if match_score is not None else round(40 + overlap_ratio * 58, 1)

        if calculated_score >= 75:
            default_verdict = "RECOMMENDED"
            default_verdict_title = "Стоит отправлять заявку"
        elif calculated_score >= 50:
            default_verdict = "CONSIDER"
            default_verdict_title = "Стоит попробовать (есть пробелы)"
        else:
            default_verdict = "NOT_RECOMMENDED"
            default_verdict_title = "Лучше подтянуть навыки перед подачей"

        system_prompt = (
            "Ты — ведущий технический IT-эксперт и карьерный наставник. "
            "Твоя задача — объективно сравнить компетенции кандидата с требованиями проекта "
            "и дать честный вердикт: что хорошо, что плохо и стоит ли отправлять заявку. "
            "Отвечай строго в формате валидного JSON без markdown-разметки (без ```json)."
        )

        bio_line = f"\nОпыт и био кандидата: {student_bio}" if student_bio else ""
        score_line = f"\nВекторное соответствие (MiniLM): {calculated_score:.1f}%"
        user_prompt = f"""
        Проект: {project_title}
        Описание: {project_description}
        Требования проекта: {json.dumps(req_list, ensure_ascii=False)}
        Навыки кандидата: {json.dumps(list(student_skills), ensure_ascii=False)}{bio_line}{score_line}

        Фактические совпадения: {json.dumps(matching_skills, ensure_ascii=False)}
        Недостающие требования: {json.dumps(missing_skills, ensure_ascii=False)}

        Верни JSON со следующей структурой:
        {{
          "verdict": "RECOMMENDED" | "CONSIDER" | "NOT_RECOMMENDED",
          "verdict_title": "Краткий емкий вердикт (например: 'Стоит отправлять заявку')",
          "pros": ["2-3 пункта: что хорошо — сильные стороны, совпавшие навыки, почему кандидат подходит"],
          "cons": ["1-3 пункта: что плохо — чего не хватает, критические риски, пробелы в технологиях"],
          "summary": "2-3 предложения с общим выводом от LLM",
          "recommendations": ["1-3 конкретных совета, что доучить или на чем сделать акцент"],
          "cover_letter_tip": "1 конкретный совет для сопроводительного письма (как повысить шансы)"
        }}
        """

        fallback = {
            "verdict": default_verdict,
            "verdict_title": default_verdict_title,
            "pros": (
                [f"Уверенное владение ключевыми навыками: {', '.join(matching_skills)}"]
                if matching_skills
                else ["Базовая теоретическая подготовка по профилю"]
            ),
            "cons": (
                [f"Не хватает практического опыта с технологиями: {', '.join(missing_skills)}"]
                if missing_skills
                else ["Критичных пробелов не обнаружено"]
            ),
            "summary": (
                f"Кандидат закрывает {len(matching_skills)} из {len(req_list)} требований проекта «{project_title}». "
                + ("Рекомендуется подавать заявку, профиль выглядит конкурентным." if calculated_score >= 70 else "Требуется готовность активно изучать недостающие навыки в процессе.")
            ),
            "recommendations": (
                [f"Ознакомиться с базовой документацией: {', '.join(missing_skills)}"]
                if missing_skills
                else ["Подготовить портфолио с примерами релевантных работ."]
            ),
            "cover_letter_tip": (
                f"В сопроводительном письме сделайте акцент на практическом опыте в {', '.join(matching_skills[:3]) if matching_skills else 'своих ключевых технологиях'}"
                + (f" и укажите готовность освоить {missing_skills[0]}." if missing_skills else ".")
            ),
            "match_score": calculated_score,
        }

        try:
            raw_response = await self.generate_response(
                prompt=user_prompt.strip(),
                system_prompt=system_prompt,
                temperature=0.2,
            )
            cleaned = raw_response.strip().removeprefix("```json").removesuffix("```").strip()
            parsed = json.loads(cleaned)
            return {
                "verdict": parsed.get("verdict") or fallback["verdict"],
                "verdict_title": parsed.get("verdict_title") or fallback["verdict_title"],
                "pros": parsed.get("pros") or fallback["pros"],
                "cons": parsed.get("cons") or fallback["cons"],
                "summary": parsed.get("summary") or fallback["summary"],
                "recommendations": parsed.get("recommendations") or fallback["recommendations"],
                "cover_letter_tip": parsed.get("cover_letter_tip") or fallback["cover_letter_tip"],
                "match_score": calculated_score,
            }
        except Exception as e:
            logger.warning(f"Ошибка вызова LLM evaluate_competencies: {e}")
            return fallback


gigachat_client = GigaChatWrapper()