# Настройка векторного енкодера MiniLM-L12-v2

import numpy as np
from typing import List, Union, Optional, Dict
from sentence_transformers import SentenceTransformer
from app.core.config import settings


class CompetenceEncoder:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L12-v2"):
        # Если в settings задано имя модели, берем его, иначе дефолт MiniLM-L12-v2
        self.model_name = getattr(settings, "EMBEDDING_MODEL_NAME", model_name)
        self.model = SentenceTransformer(self.model_name)

    def encoder(self, texts: Union[str, List[str]]) -> np.ndarray:
        """Получение L2-нормализованных векторных представлений текстов."""
        if isinstance(texts, str):
            texts = [texts]

        # normalize_embeddings=True гарантирует единичную норму,
        # благодаря чему скалярное произведение сразу равно косинусному сходству
        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            convert_to_numpy=True
        )
        return embeddings

    def calculate_similarity(
            self,
            student_skills: Union[List[str], List[Dict[str, any]]],
            project_requirements: Union[List[str], List[Dict[str, any]]],
            weights: Optional[List[float]] = None,
    ) -> float:
        """
        Взвешенный расчет процента совпадения компетенций (0.0 - 100.0%)
        с учетом критичности требований и уровней владения навыками.
        """
        if not student_skills or not project_requirements:
            return 0.0

        # 1. Извлечение названий и множителей уровня студента
        stud_texts = []
        stud_multipliers = []
        prof_map = {"ADVANCED": 1.0, "INTERMEDIATE": 0.95, "BASIC": 0.80}

        if isinstance(student_skills[0], dict):
            for s in student_skills:
                stud_texts.append(s["name"])
                lvl = s.get("proficiency_level", "ADVANCED")
                stud_multipliers.append(prof_map.get(lvl, 1.0))
        else:
            stud_texts = student_skills
            stud_multipliers = [1.0] * len(stud_texts)

        # 2. Извлечение требований проекта и весов критичности
        req_texts = []
        req_weights = []
        imp_map = {
            "CRITICAL": 0.55,
            "IMPORTANT": 0.30,
            "OPTIONAL": 0.15,
        }

        if isinstance(project_requirements[0], dict):
            for r in project_requirements:
                req_texts.append(r["name"])
                imp = r.get("importance_level", "IMPORTANT")
                req_weights.append(imp_map.get(imp, 0.30))
            total_w = sum(req_weights)
            req_weights = [w / total_w for w in req_weights]
        else:
            req_texts = project_requirements
            if weights:
                total_w = sum(weights)
                req_weights = [w / total_w for w in weights]
            else:
                req_weights = [1.0 / len(req_texts)] * len(req_texts)

        # 3. Эмбеддинги
        student_vecs = self.encoder(stud_texts)
        project_vecs = self.encoder(req_texts)

        # 4. Косинусное сходство: матрица (M_requirements, N_student_skills)
        sim_matrix = np.dot(project_vecs, student_vecs.T)

        # Умножаем сходство на уровень владения студентом данным навыком
        mult_matrix = sim_matrix * np.array(stud_multipliers)

        # Для каждого требования находим максимальное совпадение среди навыков
        raw_max_matches = np.max(mult_matrix, axis=1)

        # 5. Мягкая нелинейная калибровка (подавление шума < 0.25 без среза близких технологий)
        # Формула f(x): значения 0.9+ остаются 0.9+, значения 0.6 остаются ~0.55, а 0.25 падают до ~0.08
        k = 10.0
        x0 = 0.42

        # Защита от переполнения экспоненты
        clipped_matches = np.clip(raw_max_matches, 0.0, 1.0)
        calibrated = 1.0 / (1.0 + np.exp(-k * (clipped_matches - x0)))

        # Небольшая нормализация, чтобы 1.0 оставалась 1.0, а 0.0 -> 0.0
        min_val = 1.0 / (1.0 + np.exp(-k * (0.0 - x0)))
        max_val = 1.0 / (1.0 + np.exp(-k * (1.0 - x0)))
        calibrated = (calibrated - min_val) / (max_val - min_val)

        final_score = float(np.sum(calibrated * np.array(req_weights)))
        return round(float(np.clip(final_score * 100, 0.0, 100.0)), 1)


# Синглтон для импорта в эндпоинты
encoder_service = CompetenceEncoder()