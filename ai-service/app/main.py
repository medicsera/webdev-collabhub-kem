from fastapi import FastAPI, HTTPException, Query

from app.clients.base import get_all_models, test_ai_connection
from app.schemas.gap_analysis import GapAnalysisRequest, GapAnalysisResponse
from app.services.gap_analysis_llm import perform_gap_analysis_with_llm

app = FastAPI(
    title="AI Microservice - CollabHub",
    description="Интеллектуальный микросервис сопоставления компетенций и гэп-анализа (ВКР CollabHub)",
    version="1.0.0",
)


@app.get("/api/models", tags=["Diagnostic"])
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


@app.get("/api/test-groq", tags=["Diagnostic"])
def test_model(
    model: str = Query(
        default="openai/gpt-oss-120b",
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


@app.post(
    "/api/gap-analysis",
    response_model=GapAnalysisResponse,
    summary="Гэп-анализ компетенций студента и требований проекта",
    tags=["Gap Analysis"],
)
def run_gap_analysis(payload: GapAnalysisRequest) -> GapAnalysisResponse:
    """
    Выполняет анализ соответствия навыков кандидата требованиям проекта:
    1. Векторное сопоставление через all-MiniLM-L12-v2 (матрица близостей, отсечение по порогу threshold, взвешенный расчёт совместимости).
    2. Генерация экспертного структурированного отзыва куратора проекта (summary, strengths, gaps с советами, recommendations).
    """
    try:
        student_skills = [s.model_dump() for s in payload.student_skills]
        project_requirements = [r.model_dump() for r in payload.project_requirements]
        threshold = payload.threshold if payload.threshold is not None else 0.5

        result = perform_gap_analysis_with_llm(
            student_skills=student_skills,
            project_requirements=project_requirements,
            threshold=threshold,
        )
        return GapAnalysisResponse.model_validate(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка выполнения гэп-анализа: {str(e)}")