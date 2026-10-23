# Читает API-ключи
import os
from dotenv import load_dotenv

# Ищет файл .env в корне проекта и загружает из него переменные в систему
load_dotenv()

# Сохраняем ключ для удобного импорта в других модулях
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("Переменная GROQ_API_KEY не найдена в файле .env")