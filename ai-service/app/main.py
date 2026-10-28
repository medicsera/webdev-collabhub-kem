
import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.clients.groq_client import groq_client
from app.core.config import settings
from app.services.encoder import encoder_service
from app.clients.base import get_all_models, test_ai_connection

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Competence Matching AI Service",
    description="Микросервис векторизации компетенций и LLM-аналитики для ВКР",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Схемы данных ---

class MatchRequest(BaseModel):
    student_skills: List[str] = Field(..., description="Список навыков и технологий студента")
    project_requirements: List[str] = Field(..., description="Требуемые компетенции проекта")


class MatchResponse(BaseModel):
    match_score: float = Field(..., description="Процент соответствия (0.0 - 100.0)")
    total_skills_count: int
    total_requirements_count: int


class AnalyzeRequest(BaseModel):
    student_skills: List[str]
    project_title: str
    project_description: str
    project_requirements: List[str]


class AnalyzeResponse(BaseModel):
    summary: str
    matching_skills: List[str]
    missing_skills: List[str]
    recommendations: List[str]


class FullPipelineRequest(BaseModel):
    student_skills: List[str]
    project_title: str
    project_description: str
    project_requirements: List[str]


class FullPipelineResponse(BaseModel):
    match_score: float
    analysis: AnalyzeResponse


@app.get("/api/models")
def list_available_models():
    """Эндпоинт для просмотра всех доступных моделей"""
    try:
        models = get_all_models()
        return {
            "status": "success",
            "count": len(models),
            "models": models,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/test-groq")
def test_model(
        model: str = Query(
            default="qwen/qwen3.8-27b",
            description="ID модели из списка /api/models",
        )
):
    """Эндпоинт для проверки генерации ответа конкретной моделью"""
    try:
        response = test_ai_connection(
            prompt_text="Explain the importance of fast language models in 2 sentences.",
            model_id=model,
        )
        return {
            "status": "success",
            "used_model": model,
            "response": response,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/health", status_code=status.HTTP_200_OK, tags=["System"])
async def health_check():
    """Проверка доступности сервиса для Docker healthcheck."""
    return {
        "status": "healthy",
        "model": getattr(encoder_service, "model_name", "MiniLM-L12-v2"),
    }


@app.post("/api/v1/match", response_model=MatchResponse, tags=["Matching"])
async def calculate_match(request: MatchRequest):
    """
    Расчет семантического скора совместимости между навыками студента
    и требованиями проекта через MiniLM-L12-v2.
    """
    try:
        score = encoder_service.calculate_similarity(
            student_skills=request.student_skills,
            project_requirements=request.project_requirements,
        )
        return MatchResponse(
            match_score=score,
            total_skills_count=len(request.student_skills),
            total_requirements_count=len(request.project_requirements),
        )
    except Exception as e:
        logger.error(f"Ошибка при вычислении эмбеддингов: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка расчета совместимости: {str(e)}",
        )


@app.post("/api/v1/analyze", response_model=AnalyzeResponse, tags=["LLM Analysis"])
async def analyze_gaps(request: AnalyzeRequest):
    """
    Качественный анализ пробелов в компетенциях и генерация рекомендаций через Groq.
    """
    try:
        result = await groq_client.analyze_skill_gaps(
            student_skills=request.student_skills,
            project_title=request.project_title,
            project_description=request.project_description,
            project_requirements=request.project_requirements,
        )
        return AnalyzeResponse(**result)
    except Exception as e:
        logger.error(f"Ошибка при формировании ответа LLM: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка генерации анализа: {str(e)}",
        )


@app.post("/api/v1/pipeline", response_model=FullPipelineResponse, tags=["Pipeline"])
async def full_matching_pipeline(request: FullPipelineRequest):
    """
    Комплексный эндпоинт: единовременно возвращает числовой скор и развернутые рекомендации.
    """
    score = encoder_service.calculate_similarity(
        student_skills=request.student_skills,
        project_requirements=request.project_requirements,
    )
    analysis_data = await groq_client.analyze_skill_gaps(
        student_skills=request.student_skills,
        project_title=request.project_title,
        project_description=request.project_description,
        project_requirements=request.project_requirements,
    )
    return FullPipelineResponse(
        match_score=score,
        analysis=AnalyzeResponse(**analysis_data),
    )