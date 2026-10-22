# Абстрактный интерфейс LLMClient
import os
from groq import Groq
from dotenv import load_dotenv

# Загружаем переменные из .env
load_dotenv()

# Инициализируем клиента
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def test_ai_connection(prompt_text: str) -> str:
    """Отправляет тестовый запрос к Llama 3.3 через Groq"""
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt_text}],
        model="llama3-8b-8192",
    )
    return chat_completion.choices[0].message.content

