import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Ищет файл .env в корне проекта и загружает из него переменные
load_dotenv()

GIGACHAT_CREDENTIALS = os.getenv("GIGACHAT_CREDENTIALS")

if not GIGACHAT_CREDENTIALS:
    raise ValueError("Переменная GIGACHAT_CREDENTIALS не найдена в файле .env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "CollabHub AI Service"
    GIGACHAT_CREDENTIALS: str = os.getenv("GIGACHAT_CREDENTIALS", "")
    GIGACHAT_SCOPE: str = os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_AI_MODEL", "GigaChat")
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L12-v2"

    class Config:
        env_file = ".env"

settings = Settings()