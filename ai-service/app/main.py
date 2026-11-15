import logging
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.clients.base import get_all_models, test_ai_connection
from app.clients.gigachat_client import gigachat_client
from app.core.config import settings
from app.services.encoder import encoder_service

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Competence Matching AI Service",
    description="Микросервис векторизации компетенций и LLM-аналитики для ВКР (GigaChat)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MatchRequest(BaseModel):
    student_skills: List[str] = Field(
        ..., description="Список навыков и технологий студента"
    )
    project_requirements: List[str] = Field(
        ..., description="Требуемые компетенции проекта"
    )


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
    # Эмбеддинги текста студента и проекта (строки "[..]" для pgvector)
    student_embedding: Optional[str] = None
    project_embedding: Optional[str] = None


class EmbedRequest(BaseModel):
    text: Optional[str] = Field(default=None, description="Один текст")
    texts: Optional[List[str]] = Field(default=None, description="Пакет текстов")


class EmbedResponse(BaseModel):
    embeddings: List[str]
    model: str
    dimensions: int



@app.get("/api/models")
def list_available_models():
    try:
        models = get_all_models()
        return {
            "status": "success",
            "count": len(models),
            "models": models,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/test-gigachat")
def test_model(
    model: str = Query(
        default="GigaChat-2",
        description="ID модели из списка /api/models",
    ),
):
    try:
        response = test_ai_connection(
            prompt_text="Объясни важность быстрых языковых моделей в 2 предложениях.",
            model_id=model,
        )
        return {
            "status": "success",
            "used_model": model,
            "response": response,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/v1/health", status_code=status.HTTP_200_OK, tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "model": getattr(encoder_service, "model_name", "MiniLM-L12-v2"),
    }


def _vector_to_pg_string(vec) -> str:
    """numpy array → строка вида "[0.1,0.2,...]" для колонки vector(384)."""
    return "[" + ",".join(f"{float(x):.6f}" for x in vec) + "]"


@app.post("/api/v1/embed", response_model=EmbedResponse, tags=["Embeddings"])
async def embed_texts(request: EmbedRequest):
    """Векторизация текста для сохранения в pgvector и семантического поиска."""
    if not request.text and not request.texts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Укажите text или texts",
        )

    texts = request.texts if request.texts is not None else [request.text]
    texts = [t for t in texts if t and t.strip()]
    if not texts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нет непустых текстов для векторизации",
        )

    try:
        vectors = encoder_service.encoder(texts)
        embeddings = [_vector_to_pg_string(v) for v in vectors]
        return EmbedResponse(
            embeddings=embeddings,
            model=encoder_service.model_name,
            dimensions=len(embeddings[0].split(",")) if embeddings else 0,
        )
    except Exception as e:
        logger.error(f"Ошибка векторизации: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка векторизации: {str(e)}",
        )


@app.post("/api/v1/match", response_model=MatchResponse, tags=["Matching"])
async def calculate_match(request: MatchRequest):
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
    try:
        result = await gigachat_client.analyze_skill_gaps(
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
    score = encoder_service.calculate_similarity(
        student_skills=request.student_skills,
        project_requirements=request.project_requirements,
    )
    analysis_data = await gigachat_client.analyze_skill_gaps(
        student_skills=request.student_skills,
        project_title=request.project_title,
        project_description=request.project_description,
        project_requirements=request.project_requirements,
    )

    # Эмбеддинги для pgvector: профиль студента и карточка проекта
    student_text = ", ".join(request.student_skills) or request.project_title
    project_text = (
        f"{request.project_title}. {request.project_description}. "
        f"Требования: {', '.join(request.project_requirements)}"
    )
    try:
        student_vec, project_vec = encoder_service.encoder([student_text, project_text])
        student_embedding = _vector_to_pg_string(student_vec)
        project_embedding = _vector_to_pg_string(project_vec)
    except Exception as e:
        logger.warning(f"Не удалось построить эмбеддинги в pipeline: {e}")
        student_embedding = None
        project_embedding = None

    return FullPipelineResponse(
        match_score=score,
        analysis=AnalyzeResponse(**analysis_data),
        student_embedding=student_embedding,
        project_embedding=project_embedding,
    )
