from fastapi import FastAPI, Query
from app.clients.base import get_all_models, test_ai_connection

app = FastAPI(title="AI Microservice - CollabHub")


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