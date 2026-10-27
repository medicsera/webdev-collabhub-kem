from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class StudentSkillInput(BaseModel):
    name: str = Field(..., example="Vue 3", description="Наименование навыка")
    proficiency_level: Optional[str] = Field(
        default="ADVANCED",
        example="ADVANCED",
        description="Уровень владения: ADVANCED (1.0), INTERMEDIATE (0.8), BASIC (0.5)",
    )


class ProjectRequirementInput(BaseModel):
    name: str = Field(..., example="Vue 3", description="Наименование требуемого навыка")
    importance_level: Optional[str] = Field(
        default="IMPORTANT",
        example="CRITICAL",
        description="Важность требования: CRITICAL (60%), IMPORTANT (25%), OPTIONAL (15%)",
    )


class GapItem(BaseModel):
    skill: str = Field(description="Наименование технологии или навыка")
    advice: str = Field(description="Практический совет куратора по закрытию гэпа")


class GapAnalysisLLMFeedback(BaseModel):
    """Схема валидации структурированного отзыва куратора из этапа 4."""
    summary: str = Field(description="Краткое экспертное заключение")
    strengths: List[str] = Field(default_factory=list, description="Сильные стороны кандидата")
    gaps: List[GapItem] = Field(default_factory=list, description="Выявленные дефициты компетенций и советы")
    recommendations: List[str] = Field(default_factory=list, description="Рекомендации по адаптации и развитию")


class MatchedSkill(BaseModel):
    requirement: str
    importance_level: str
    matched_skill: str
    proficiency_level: str
    similarity: float
    match_percentage: float


class GapRequirement(BaseModel):
    requirement: str
    importance_level: str
    best_candidate_skill: Optional[str] = None
    best_similarity: float = 0.0


class GapAnalysisRequest(BaseModel):
    student_skills: List[StudentSkillInput]
    project_requirements: List[ProjectRequirementInput]
    threshold: Optional[float] = Field(
        default=0.5,
        description="Порог косинусного сходства для отнесения навыка к matched",
        example=0.5,
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "student_skills": [
                    {"name": "Vue 3", "proficiency_level": "ADVANCED"},
                    {"name": "TypeScript", "proficiency_level": "ADVANCED"},
                    {"name": "Pinia", "proficiency_level": "ADVANCED"},
                    {"name": "SCSS", "proficiency_level": "ADVANCED"},
                    {"name": "Git", "proficiency_level": "ADVANCED"}
                ],
                "project_requirements": [
                    {"name": "Vue 3", "importance_level": "CRITICAL"},
                    {"name": "TypeScript", "importance_level": "CRITICAL"},
                    {"name": "Pinia", "importance_level": "CRITICAL"},
                    {"name": "REST API", "importance_level": "IMPORTANT"},
                    {"name": "Jira", "importance_level": "OPTIONAL"}
                ],
                "threshold": 0.5
            }
        }
    }


class GapAnalysisResponse(BaseModel):
    overall_match_percentage: float = Field(description="Итоговый процент совместимости (0-100)")
    matched: List[MatchedSkill] = Field(description="Закрытые требования выше порога")
    gaps: List[GapRequirement] = Field(description="Выявленные дефициты компетенций")
    threshold: float = Field(description="Применённый порог отсечения")
    ai_feedback: Optional[GapAnalysisLLMFeedback] = Field(
        default=None,
        description="Экспертный отзыв нейросетевого куратора",
    )
