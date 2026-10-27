import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from pydantic import ValidationError

from app.clients.groq_client import GroqClient
from app.schemas.gap_analysis import GapAnalysisLLMFeedback
from app.services.gap_analysis import calculate_gap_analysis

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "gap_analysis.txt"
_SYSTEM_PROMPT: Optional[str] = None


def get_system_prompt() -> str:
    """Загружает и кэширует системный промпт куратора."""
    global _SYSTEM_PROMPT
    if _SYSTEM_PROMPT is None:
        if _PROMPT_PATH.exists():
            _SYSTEM_PROMPT = _PROMPT_PATH.read_text(encoding="utf-8")
        else:
            raise FileNotFoundError(f"Файл системного промпта не найден: {_PROMPT_PATH}")
    return _SYSTEM_PROMPT


def clean_json_response(raw_text: str) -> str:
    """Удаляет markdown-обёртку (```json ... ```) из ответа модели, если она присутствует."""
    text = raw_text.strip()
    if text.startswith("```"):
        # Удаляем открывающий блок ```json или ```
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def build_user_prompt(
    student_skills: List[Union[Dict[str, Any], str]],
    project_requirements: List[Union[Dict[str, Any], str]],
    matching_result: Dict[str, Any],
) -> str:
    """Формирует структурированный пользовательский запрос для куратора."""
    req_lines = []
    for r in project_requirements:
        if isinstance(r, dict):
            name = r.get("name", "")
            imp = r.get("importance_level", "IMPORTANT")
            req_lines.append(f"- {name} ({imp})")
        else:
            req_lines.append(f"- {r}")

    skill_lines = []
    for s in student_skills:
        if isinstance(s, dict):
            name = s.get("name", "")
            lvl = s.get("proficiency_level", "ADVANCED")
            skill_lines.append(f"- {name} ({lvl})")
        else:
            skill_lines.append(f"- {s}")

    matched_names = [f"{m['requirement']} (закрыт на {m.get('match_percentage', 0)}%)" for m in matching_result.get("matched", [])]
    gap_names = [g["requirement"] for g in matching_result.get("gaps", [])]

    return f"""Входные данные для анализа:

Требования проекта:
{chr(10).join(req_lines)}

Навыки студента:
{chr(10).join(skill_lines)}

Результат предварительного векторного сопоставления компетенций:
- Общий расчётный процент совместимости: {matching_result.get('overall_match_percentage', 0.0)}%
- Закрытые требования: {', '.join(matched_names) if matched_names else 'нет'}
- Выявленные дефициты (гэпы): {', '.join(gap_names) if gap_names else 'нет'}

Проанализируй профиль студента и сформируй экспертный отзыв строго по схеме JSON."""


def parse_and_validate_llm_response(raw_text: str) -> GapAnalysisLLMFeedback:
    """Парсит текст в JSON и валидирует через Pydantic-модель GapAnalysisLLMFeedback."""
    cleaned = clean_json_response(raw_text)
    data = json.loads(cleaned)
    return GapAnalysisLLMFeedback.model_validate(data)


def perform_gap_analysis_with_llm(
    student_skills: List[Union[Dict[str, Any], str]],
    project_requirements: List[Union[Dict[str, Any], str]],
    threshold: float = 0.5,
    groq_client: Optional[GroqClient] = None,
) -> Dict[str, Any]:
    """
    Выполняет полный пайплайн гэп-анализа:
    1. Рассчитывает детерминированное векторное сопоставление (Этап 2).
    2. Подставляет результаты в промпт gap_analysis.txt.
    3. Вызывает GroqClient.generate_response с temperature=0.2.
    4. Парсит JSON и валидирует моделью GapAnalysisLLMFeedback.
    5. При ошибке парсинга — один повтор с напоминанием о формате.
    6. При повторной ошибке или сбое API — возвращает только результат сопоставления.
    """
    # 1. Детерминированный этап сопоставления компетенций
    base_result = calculate_gap_analysis(
        student_skills=student_skills,
        project_requirements=project_requirements,
        threshold=threshold,
    )

    client = groq_client or GroqClient()
    system_prompt = get_system_prompt()
    user_prompt = build_user_prompt(student_skills, project_requirements, base_result)

    ai_feedback: Optional[Dict[str, Any]] = None

    try:
        # 2. Вызов LLM с temperature=0.2
        raw_response = client.generate_response(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.2,
        )

        try:
            # 3. Парсинг и валидация первого ответа
            feedback_obj = parse_and_validate_llm_response(raw_response)
            ai_feedback = feedback_obj.model_dump()
        except (json.JSONDecodeError, ValidationError) as parse_err:
            logger.warning("Ошибка парсинга ответа LLM: %s. Выполняется один повторный запрос...", parse_err)

            # 4. Один повторный запрос с напоминанием о формате
            retry_prompt = f"""Предыдущий ответ вернул невалидный JSON или нарушил требуемую схему.
Текст твоего ответа был:
{raw_response}

Пожалуйста, исправь ошибку и ответь СТРОГО в виде валидного JSON без разметки Markdown по схеме:
{{
  "summary": "...",
  "strengths": ["..."],
  "gaps": [{{"skill": "...", "advice": "..."}}],
  "recommendations": ["..."]
}}"""

            retry_response = client.generate_response(
                prompt=retry_prompt,
                system_prompt=system_prompt,
                temperature=0.2,
            )

            try:
                feedback_obj = parse_and_validate_llm_response(retry_response)
                ai_feedback = feedback_obj.model_dump()
            except (json.JSONDecodeError, ValidationError) as retry_err:
                logger.error("Повторная ошибка парсинга ответа LLM: %s. Возвращаем только результат матчинга.", retry_err)
                ai_feedback = None

    except Exception as api_err:
        logger.error("Ошибка при вызове Groq API: %s. Возвращаем только результат матчинга.", api_err)
        ai_feedback = None

    # Возвращаем результат сопоставления с опциональным отзывом нейросети
    result = dict(base_result)
    result["ai_feedback"] = ai_feedback
    return result
