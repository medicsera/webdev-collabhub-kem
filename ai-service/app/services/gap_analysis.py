from typing import Any, Dict, List, Optional, Union
import numpy as np

from app.services.encoder import (
    CompetenceEncoder,
    IMPORTANCE_WEIGHTS,
    PROFICIENCY_MULTIPLIERS,
)

# Начальный порог отсечения нерелевантных навыков (косинусное сходство)
THRESHOLD: float = 0.5

_default_encoder: Optional[CompetenceEncoder] = None


def get_default_encoder() -> CompetenceEncoder:
    """Возвращает лениво инициализированный синглтон энкодера компетенций."""
    global _default_encoder
    if _default_encoder is None:
        _default_encoder = CompetenceEncoder()
    return _default_encoder


def calculate_gap_analysis(
    student_skills: List[Union[Dict[str, Any], str]],
    project_requirements: List[Union[Dict[str, Any], str]],
    threshold: float = THRESHOLD,
    encoder: Optional[CompetenceEncoder] = None,
) -> Dict[str, Any]:
    """
    Выполняет сопоставление навыков студента и требований проекта (гэп-анализ).

    Алгоритм:
    1. Закодировать все названия навыков и требований одним вызовом encoder().
    2. Построить матрицу близостей через скалярное произведение L2-нормализованных векторов.
    3. Для каждого требования найти максимум среди навыков студента.
    4. Сравнить максимум с порогом threshold.
    5. Требования выше порога отнести в matched (с процентом закрытия), остальные — в gaps.
    6. Рассчитать общий процент совместимости через calculate_similarity с учётом весов важности.
    """
    # Нормализация формата входных данных
    normalized_student_skills: List[Dict[str, Any]] = [
        {"name": s, "proficiency_level": "ADVANCED"} if isinstance(s, str) else dict(s)
        for s in student_skills
    ]
    normalized_requirements: List[Dict[str, Any]] = [
        {"name": r, "importance_level": "IMPORTANT"} if isinstance(r, str) else dict(r)
        for r in project_requirements
    ]

    if not normalized_requirements:
        return {
            "matched": [],
            "gaps": [],
            "overall_match_percentage": 0.0,
            "threshold": threshold,
        }

    if not normalized_student_skills:
        # Если у студента нет навыков, все требования проекта уходят в гэпы
        gaps = [
            {
                "requirement": req["name"],
                "importance_level": req.get("importance_level", "IMPORTANT"),
                "best_candidate_skill": None,
                "best_similarity": 0.0,
            }
            for req in normalized_requirements
        ]
        return {
            "matched": [],
            "gaps": gaps,
            "overall_match_percentage": 0.0,
            "threshold": threshold,
        }

    enc = encoder or get_default_encoder()

    student_names = [s["name"] for s in normalized_student_skills]
    project_names = [r["name"] for r in normalized_requirements]

    # 1. Закодировать все названия одним вызовом encoder()
    all_names = student_names + project_names
    all_embeddings = enc.encoder(all_names)

    num_student_skills = len(student_names)
    student_embeddings = all_embeddings[:num_student_skills]
    project_embeddings = all_embeddings[num_student_skills:]

    # 2. Построить матрицу близостей через скалярное произведение (L2-нормализованные векторы)
    # Форма матрицы: (num_requirements, num_student_skills)
    similarity_matrix = np.dot(project_embeddings, student_embeddings.T)

    matched: List[Dict[str, Any]] = []
    gaps: List[Dict[str, Any]] = []
    requirements_evaluations: List[Dict[str, Any]] = []

    # 3. Для каждого требования взять максимум по навыкам студента
    for i, req in enumerate(normalized_requirements):
        req_name = req["name"]
        importance = req.get("importance_level", "IMPORTANT")

        row_similarities = similarity_matrix[i]
        best_student_idx = int(np.argmax(row_similarities))
        best_sim = float(row_similarities[best_student_idx])
        best_skill = normalized_student_skills[best_student_idx]
        best_skill_name = best_skill["name"]
        proficiency = str(best_skill.get("proficiency_level", "ADVANCED")).upper()
        proficiency_multiplier = PROFICIENCY_MULTIPLIERS.get(proficiency, 1.0)

        # 4. Сравнить с THRESHOLD
        if best_sim >= threshold:
            # Процент закрытия требования с учётом близости и подтверждённого уровня
            closure_score = best_sim * proficiency_multiplier
            matched_percent = round(closure_score * 100.0, 1)

            matched.append({
                "requirement": req_name,
                "importance_level": importance,
                "matched_skill": best_skill_name,
                "proficiency_level": proficiency,
                "similarity": round(best_sim, 3),
                "match_percentage": matched_percent,
            })

            requirements_evaluations.append({
                "importance_level": importance,
                "score": closure_score,
            })
        else:
            gaps.append({
                "requirement": req_name,
                "importance_level": importance,
                "best_candidate_skill": best_skill_name,
                "best_similarity": round(best_sim, 3),
            })

            requirements_evaluations.append({
                "importance_level": importance,
                "score": 0.0,
            })

    # 5. Итоговый процент считать как в calculate_similarity
    overall_match_percentage = CompetenceEncoder.calculate_similarity(requirements_evaluations)

    return {
        "matched": matched,
        "gaps": gaps,
        "overall_match_percentage": overall_match_percentage,
        "threshold": threshold,
    }


# Псевдоним функции для удобства вызовов
analyze_gaps = calculate_gap_analysis
gap_analysis = calculate_gap_analysis
