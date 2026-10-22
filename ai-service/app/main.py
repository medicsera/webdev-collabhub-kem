from fastapi import FastAPI
# Отредактируйте импорт под название вашего файла, если назвали его иначе
from app.clients.base import test_ai_connection

app = FastAPI()

@app.get("/api/test-groq")
def check_groq():
    try:
        response = test_ai_connection("Explain the importance of fast language models in 2 sentences.")
        return {"status": "success", "ai_response": response}
    except Exception as e:
        return {"status": "error", "message": str(e)}

    # Добавьте в app/main.py
# Импортируйте вашего клиента (убедитесь, что путь импорта верный)
from app.clients.base import client

@app.get("/api/models")
def get_available_models():
    try:
        models = client.models.list()
        # Извлекаем только названия (id) моделей для удобства
        return {"available_models": [model.id for model in models.data]}
    except Exception as e:
        return {"error": str(e)}