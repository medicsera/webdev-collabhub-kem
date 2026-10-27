import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# Добавляем путь к корню ai-service
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from app.services.encoder import encoder_service


def run_benchmark():
    # Путь к датасету
    dataset_path = BASE_DIR.parent / "data" / "benchmark_dataset.json"
    if not dataset_path.exists():
        dataset_path = BASE_DIR / "data" / "benchmark_dataset.json"

    if not dataset_path.exists():
        print(f"Файл датасета не найден: {dataset_path}")
        return

    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Индексируем студентов и проекты
    students_map = {
        s["student_id"]: s["ground_truth"]["skills"]
        for s in data.get("students", [])
    }

    projects_map = {
        p["project_id"]: {
            "title": p.get("raw_input", "")[:35] + "...",
            "skills": p["ground_truth"]["skills"]
        }
        for p in data.get("projects", [])
    }

    pairs = data.get("matching_pairs", [])

    print("=" * 80)
    print(f"БЕНЧМАРК ВЕКТОРНОГО ЭНКОДЕРА (MiniLM-L12-v2) НА {len(pairs)} ПАРАХ")
    print("=" * 80)

    total_time = 0.0
    passed_count = 0
    total_abs_error = 0.0
    results_data = []

    print(f"{'ID':<5} | {'Тип кейса':<22} | {'MiniLM':<7} | {'Эталон':<7} | {'Диапазон':<10} | {'Статус':<8} | {'Время':<8}")
    print("-" * 80)

    for pair in pairs:
        pair_id = pair["pair_id"]
        case_type = pair.get("case_type", "unknown")
        s_id = pair["student_id"]
        p_id = pair["project_id"]
        gt_score = pair["ground_truth_score"]
        acc_min, acc_max = pair.get("acceptable_range", [gt_score - 10, gt_score + 10])

        student_skills = students_map.get(s_id, [])
        project_skills = projects_map.get(p_id, {}).get("skills", [])

        start_t = time.perf_counter()
        calc_score = encoder_service.calculate_similarity(student_skills, project_skills)
        elapsed = (time.perf_counter() - start_t) * 1000
        total_time += elapsed

        is_passed = acc_min <= calc_score <= acc_max
        if is_passed:
            passed_count += 1
            status = "OK"
        else:
            status = "FAIL"

        abs_error = abs(calc_score - gt_score)
        total_abs_error += abs_error

        print(
            f"{pair_id:<5} | {case_type:<22} | {calc_score:5.1f}%  | {gt_score:5.1f}%  | "
            f"[{acc_min:2d} - {acc_max:3d}]   | {status:<8} | {elapsed:5.1f} ms"
        )

        # Собираем данные для файла
        results_data.append({
            "pair_id": pair_id,
            "case_type": case_type,
            "calculated_score": calc_score,
            "ground_truth_score": gt_score,
            "acceptable_range": [acc_min, acc_max],
            "status": status,
            "error": round(abs_error, 2),
            "inference_time_ms": round(elapsed, 2)
        })

    avg_time = total_time / len(pairs) if pairs else 0.0
    mae = total_abs_error / len(pairs) if pairs else 0.0
    accuracy_pct = (passed_count / len(pairs) * 100) if pairs else 0.0

    print("=" * 80)
    print("ИТОГИ БЕНЧМАРКА:")
    print(f"- Всего пар:                 {len(pairs)}")
    print(f"- Попаданий в диапазон (Acc): {passed_count}/{len(pairs)} ({accuracy_pct:.1f}%)")
    print(f"- Средняя абсолютная ошибка:  {mae:.2f}%")
    print(f"- Среднее время на пару:     {avg_time:.2f} ms")
    print("=" * 80)

    # === БЛОК СОХРАНЕНИЯ РЕЗУЛЬТАТОВ ===
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_dir = BASE_DIR.parent / "data" / "results"
    results_dir.mkdir(parents=True, exist_ok=True)

    json_path = results_dir / f"encoder_benchmark_{timestamp}.json"
    md_path = results_dir / f"encoder_benchmark_{timestamp}.md"

    summary = {
        "model": "sentence-transformers/all-MiniLM-L12-v2",
        "total_pairs": len(pairs),
        "accuracy": f"{accuracy_pct:.1f}%",
        "mean_absolute_error": round(mae, 2),
        "avg_inference_time_ms": round(avg_time, 2),
        "calibration_method": "Sigmoid (S-Curve) + Взвешивание уровней (CRITICAL/IMPORTANT/OPTIONAL)"
    }

    # 1. Сохранение в JSON
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "results": results_data}, f, ensure_ascii=False, indent=2)

    # 2. Сохранение в Markdown
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(f"# Отчет бенчмарка векторного энкодера\n\n")
        f.write(f"**Модель:** `sentence-transformers/all-MiniLM-L12-v2`\n\n")
        f.write(f"**Дата:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"**Калибровка:** Сигмоидная (S-Curve) + Учет важности требований и владения\n\n")

        f.write(f"## Сводка\n")
        f.write(f"- **Точность (Accuracy):** {passed_count}/{len(pairs)} ({accuracy_pct:.1f}%)\n")
        f.write(f"- **Средняя абсолютная ошибка (MAE):** {mae:.2f}%\n")
        f.write(f"- **Среднее время инференса на пару:** {avg_time:.2f} ms\n\n")

        f.write(f"## Детальные результаты\n\n")
        f.write(f"| ID | Тип кейса | Скор MiniLM | Эталон | Диапазон | Статус | Ошибка | Время (ms) |\n")
        f.write(f"|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|\n")
        for r in results_data:
            icon = "✅" if r['status'] == "OK" else "❌"
            f.write(f"| {r['pair_id']} | `{r['case_type']}` | **{r['calculated_score']}%** | {r['ground_truth_score']}% | [{r['acceptable_range'][0]}-{r['acceptable_range'][1]}] | {icon} | {r['error']}% | {r['inference_time_ms']} |\n")

    print(f"\nОтчеты успешно сохранены:\n- {json_path}\n- {md_path}")


if __name__ == "__main__":
    run_benchmark()