import json
import os
import time
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
import numpy as np
from scipy.stats import spearmanr

# 1. Загрузка переменных окружения и инициализация Groq
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY не найден в файле .env")

client = Groq(api_key=api_key)

# Список всех 3 моделей для последовательного бенчмарка
MODELS_TO_BENCHMARK = [
    {
        "id": "qwen/qwen3.8-27b",
        "display_name": "Qwen 3.8 (27B, Groq)",
        "type": "Генеративная LLM (Groq LPU)",
        "license": "Open Weights"
    },
    {
        "id": "openai/gpt-oss-20b",
        "display_name": "GPT-OSS (20B, Groq)",
        "type": "Генеративная LLM (Groq LPU)",
        "license": "Apache 2.0"
    },
    {
        "id": "openai/gpt-oss-120b",
        "display_name": "GPT-OSS (120B MoE, Groq)",
        "type": "Генеративная LLM (Groq LPU)",
        "license": "Apache 2.0"
    }
]

# 2. Поиск и чтение benchmark_dataset.json v2
current_dir = Path(__file__).resolve().parent
dataset_path = current_dir.parent.parent / "data" / "benchmark_dataset.json"
if not dataset_path.exists():
    dataset_path = current_dir / "data" / "benchmark_dataset.json"

if not dataset_path.exists():
    raise FileNotFoundError(f"Файл {dataset_path} не найден! Проверьте путь к data/benchmark_dataset.json")

with open(dataset_path, "r", encoding="utf-8") as f:
    dataset = json.load(f)

students_map = {s["student_id"]: s for s in dataset["students"]}
projects_map = {p["project_id"]: p for p in dataset["projects"]}
pairs = dataset["matching_pairs"]

SYSTEM_PROMPT = """Ты — интеллектуальный модуль сопоставления компетенций в академическом сервисе.
Твоя задача — проанализировать профиль студента и требования IT-проекта, учитывая уровни владения навыками (ADVANCED, INTERMEDIATE, BASIC) и важность требований (CRITICAL: 60%, IMPORTANT: 25%, OPTIONAL: 15%).

Оцени релевантность кандидата проекту по шкале от 0 до 100 баллов:
- 90-100: кандидат закрывает все CRITICAL-навыки на уровне ADVANCED/INTERMEDIATE (Exact match / Overqualified).
- 70-89: смежный стек с потенциалом быстрой адаптации (Skill transfer, напр. Vue -> React).
- 45-69: частичное соответствие (закрыты второстепенные требования, критический стек слабый или базовый).
- 0-30: нерелевантный кандидат или поверхностные общие слова (False positive water).

Сформируй краткий профессиональный отзыв (ai_feedback) с указанием сильных сторон и дефицитов.

Ответь СТРОГО в формате валидного JSON без разметки markdown. Выводи ТОЛЬКО JSON, начиная с символа '{':
{
  "ai_match_score": <число от 0 до 100>,
  "ai_feedback": "<максимум 1-2 предложения, почему выставлен этот балл>"
}
}"""


def benchmark_single_model(model_info: dict) -> dict:
    model_id = model_info["id"]
    total_pairs = len(pairs)
    valid_json_count = 0
    predicted_scores = []
    ground_truth_scores = []
    detailed_pairs_log = []
    range_hits = 0
    latencies = []

    print(f"\n{'=' * 60}")
    print(f"Запуск бенчмарка: {model_info['display_name']} ({model_id})")
    print(f"{'=' * 60}")

    for idx, pair in enumerate(pairs, 1):
        s_id = pair["student_id"]
        p_id = pair["project_id"]
        st = students_map[s_id]
        pr = projects_map[p_id]
        gt_score = pair["ground_truth_score"]
        acc_range = pair["acceptable_range"]

        user_content = f"""Кандидат ({s_id}):
{st['raw_input']}

Проект ({p_id}):
{pr['raw_input']}"""

        start_time = time.perf_counter()
        pred_score = 0.0
        ai_feedback = ""
        is_valid = False
        try:
            response = client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.0,
                max_tokens=500,  # Ограничение для обхода ошибки 429
                response_format={"type": "json_object"}
            )
            elapsed = time.perf_counter() - start_time
            latencies.append(elapsed)

            raw_text = response.choices[0].message.content
            parsed = json.loads(raw_text)

            # Поддержка как ai_match_score, так и fallback на score
            pred_score = float(parsed.get("ai_match_score", parsed.get("score", 0.0)))
            ai_feedback = parsed.get("ai_feedback", parsed.get("reasoning", ""))
            valid_json_count += 1
            is_valid = True

        except Exception as e:
            elapsed = time.perf_counter() - start_time
            latencies.append(elapsed)
            ai_feedback = f"Ошибка: {str(e)}"
            print(f"  [{pair['pair_id']}] Ошибка: {e}")

        predicted_scores.append(pred_score)
        ground_truth_scores.append(gt_score)

        is_hit = acc_range[0] <= pred_score <= acc_range[1]
        if is_hit:
            range_hits += 1

        status_sym = "✓" if is_hit else "✗"
        print(f"  [{pair['pair_id']}] {s_id}->{p_id}: балл={pred_score:.1f} (эталон={gt_score}) [{status_sym}] {elapsed:.2f}с")

        detailed_pairs_log.append({
            "pair_id": pair["pair_id"],
            "student_id": s_id,
            "project_id": p_id,
            "case_type": pair["case_type"],
            "ground_truth_score": gt_score,
            "acceptable_range": acc_range,
            "predicted_score": pred_score,
            "is_hit": is_hit,
            "ai_feedback": ai_feedback,
            "expected_feedback": pair.get("expected_feedback", ""),
            "latency_sec": round(elapsed, 3),
            "valid_json": is_valid
        })

        # Пауза между запросами для контроля Rate Limits
        time.sleep(2.0)

    # Расчет метрик
    json_validity = (valid_json_count / total_pairs) * 100 if total_pairs > 0 else 0
    mae = float(np.mean(np.abs(np.array(predicted_scores) - np.array(ground_truth_scores))))
    accuracy_hits = (range_hits / total_pairs) * 100 if total_pairs > 0 else 0
    corr, _ = spearmanr(ground_truth_scores, predicted_scores)
    spearman_val = 0.0 if np.isnan(corr) else float(corr)
    avg_latency = float(np.mean(latencies))

    mae_norm = max(0.0, 100.0 - (mae * 2.5))
    final_score = (
            0.10 * json_validity +
            0.35 * accuracy_hits +
            0.35 * max(0.0, spearman_val * 100) +
            0.20 * mae_norm
    )

    return {
        "name": model_info["display_name"],
        "model_id": model_id,
        "type": model_info["type"],
        "license": model_info["license"],
        "json_validity": json_validity,
        "mae": mae,
        "accuracy_hits": accuracy_hits,
        "spearman": spearman_val,
        "avg_latency": avg_latency,
        "vram": "0 ГБ",
        "final_score": final_score,
        "detailed_log": detailed_pairs_log
    }


def save_benchmark_reports(results: list, base_dir: Path):
    """Сохраняет Markdown-таблицу и подробный JSON-дамп в директорию data/results/"""
    results_dir = base_dir.parent.parent.parent / "data" / "results"
    results_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    md_file = results_dir / f"benchmark_results_{timestamp}.md"
    json_file = results_dir / f"benchmark_results_{timestamp}.json"

    # Формирование Markdown-таблицы
    md_content = f"# Результаты тестирования моделей сопоставления компетенций\n"
    md_content += f"*Дата запуска: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n"
    md_content += "| Модель | Тип | Лицензия | Валидность JSON (%) | Ошибка MAE (↓) | Попадание в эталон (%) | Ранжирование Спирмена (↑) | Время ответа | VRAM | Итоговый балл (0-100) |\n"
    md_content += "| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n"

    for r in results:
        md_content += (
            f"| **{r['name']}** | {r['type']} | {r['license']} | "
            f"{r['json_validity']:.1f}% | {r['mae']:.1f}% | {r['accuracy_hits']:.1f}% | "
            f"{r['spearman']:.2f} | ~{r['avg_latency']:.2f} с | {r['vram']} | **{r['final_score']:.1f}** |\n"
        )

    with open(md_file, "w", encoding="utf-8") as f:
        f.write(md_content)

    # Детальный JSON для дальнейшего анализа ai_feedback
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "summary": [
                {k: v for k, v in r.items() if k != "detailed_log"}
                for r in results
            ],
            "models_details": results
        }, f, ensure_ascii=False, indent=2)

    print(f"\nОтчеты успешно сохранены:")
    print(f"  - Markdown: {md_file}")
    print(f"  - Детальный JSON: {json_file}")


def main():
    results = []
    print("Начало комплексного тестирования моделей через Groq API...")

    for model_info in MODELS_TO_BENCHMARK:
        res = benchmark_single_model(model_info)
        results.append(res)
        time.sleep(2.0)

    # Вывод в консоль
    print("\n\n" + "=" * 110)
    print("ИТОГОВАЯ СВОДНАЯ ТАБЛИЦА БЕНЧМАРКА (Markdown для ВКР):")
    print("=" * 110)
    print("| Модель | Тип | Лицензия | Валидность JSON (%) | Ошибка MAE (↓) | Попадание в эталон (%) | Ранжирование Спирмена (↑) | Время ответа | VRAM | Итоговый балл (0-100) |")
    print("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for r in results:
        print(f"| **{r['name']}** | {r['type']} | {r['license']} | {r['json_validity']:.1f}% | {r['mae']:.1f}% | {r['accuracy_hits']:.1f}% | {r['spearman']:.2f} | ~{r['avg_latency']:.2f} с | {r['vram']} | **{r['final_score']:.1f}** |")
    print("=" * 110)

    # Автоматическое сохранение в файл
    save_benchmark_reports(results, current_dir)


if __name__ == "__main__":
    main()