from typing import Any, Dict, List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer

# Коэффициенты важности требований проекта (из спецификации датасета)
IMPORTANCE_WEIGHTS = {
    "CRITICAL": 0.60,
    "IMPORTANT": 0.25,
    "OPTIONAL": 0.15,
}

# Множители уровней владения навыками студента
PROFICIENCY_MULTIPLIERS = {
    "ADVANCED": 1.0,
    "INTERMEDIATE": 0.8,
    "BASIC": 0.5,
}


class CompetenceEncoder:
    """
    Класс векторного кодирования компетенций с использованием модели all-MiniLM-L12-v2
    и расчёта взвешенной совместимости профилей.
    """

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L12-v2"):
        self.model_name = model_name
        self._model: Optional[SentenceTransformer] = None

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def encoder(self, texts: List[str]) -> np.ndarray:
        """
        Возвращает L2-нормализованные эмбеддинги для списка текстов.
        При нормализации скалярное произведение векторов эквивалентно косинусному сходству.
        """
        if not texts:
            return np.empty((0, 384), dtype=np.float32)

        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
            convert_to_numpy=True,
        )
        return np.asarray(embeddings, dtype=np.float32)

    @staticmethod
    def calculate_similarity(
        requirements_evaluations: List[Dict[str, Any]],
        importance_weights: Optional[Dict[str, float]] = None,
    ) -> float:
        """
        Вычисляет взвешенный процент совпадения на основе важности требований.
        
        Каждый элемент requirements_evaluations должен содержать:
        - importance_level: 'CRITICAL', 'IMPORTANT', 'OPTIONAL' (по умолчанию 'IMPORTANT')
        - score: оценка закрытия требования от 0.0 до 1.0 (или от 0 до 100)
        """
        if not requirements_evaluations:
            return 0.0

        weights = importance_weights or IMPORTANCE_WEIGHTS

        category_scores: Dict[str, List[float]] = {
            "CRITICAL": [],
            "IMPORTANT": [],
            "OPTIONAL": [],
        }

        for item in requirements_evaluations:
            importance = str(item.get("importance_level", "IMPORTANT")).upper()
            if importance not in category_scores:
                importance = "IMPORTANT"

            score = float(item.get("score", 0.0))
            # Если балл передан в шкале 0..100, приводим к 0..1
            if score > 1.0:
                score /= 100.0
            score = max(0.0, min(1.0, score))
            category_scores[importance].append(score)

        weighted_sum = 0.0
        total_active_weight = 0.0

        for category, cat_scores in category_scores.items():
            if cat_scores:
                cat_avg = sum(cat_scores) / len(cat_scores)
                cat_weight = weights.get(category, 0.0)
                weighted_sum += cat_avg * cat_weight
                total_active_weight += cat_weight

        if total_active_weight == 0.0:
            return 0.0

        # Нормализуем на случай, если присутствуют не все 3 категории
        final_percentage = (weighted_sum / total_active_weight) * 100.0
        return round(float(final_percentage), 2)