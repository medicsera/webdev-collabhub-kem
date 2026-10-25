# Читает API-ключи
import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings


# Ищет файл .env в корне проекта и загружает из него переменные в систему
load_dotenv()

# Сохраняем ключ для удобного импорта в других модулях
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("Переменная GROQ_API_KEY не найдена в файле .env")


class Settings(BaseSettings):
    PROJECT_NAME: str = "CollabHub AI Service"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_AI_MODEL", "openai/gpt-oss-120b")

    class Config:
        env_file = ".env"

settings = Settings()