import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

GIGACHAT_CREDENTIALS = os.getenv("GIGACHAT_CREDENTIALS")

if not GIGACHAT_CREDENTIALS:
    raise ValueError("Переменная GIGACHAT_CREDENTIALS не найдена в файле .env")


class Settings(BaseSettings):
    PROJECT_NAME: str = "CollabHub AI Service"
    GIGACHAT_CREDENTIALS: str = os.getenv("GIGACHAT_CREDENTIALS", "")
    GIGACHAT_SCOPE: str = os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_AI_MODEL", "GigaChat-2")
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L12-v2"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
