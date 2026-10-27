import json
from pathlib import Path
from typing import Any, Dict
import pytest

from app.services.gap_analysis import calculate_gap_analysis, get_default_encoder


@pytest.fixture(scope="session")
def dataset() -> Dict[str, Any]:
    """Загрузка эталонного датасета benchmark_dataset.json."""
    current_dir = Path(__file__).resolve().parent
    candidates = [
        current_dir.parent.parent / "data" / "benchmark_dataset.json",
        current_dir.parent / "data" / "benchmark_dataset.json",
        Path("data/benchmark_dataset.json"),
        Path("../data/benchmark_dataset.json"),
    ]
    for path in candidates:
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    raise FileNotFoundError("Файл data/benchmark_dataset.json не найден")


@pytest.fixture(scope="session")
def encoder():
    """Синглтон энкодера для тестов."""
    return get_default_encoder()


def test_gap_analysis_benchmark(dataset: Dict[str, Any], encoder):
    """
    Прогон чистой логики гэп-анализа по всем кейсам эталонного датасета.
    Вычисляет долю попаданий в допустимый диапазон, MAE и метрики по false_positive_water.
    """
    students = {s["student_id"]: s for s in dataset["students"]}
    projects = {p["project_id"]: p for p in dataset["projects"]}
    pairs = dataset["matching_pairs"]

    hits = 0
    total = len(pairs)
    mae_sum = 0.0
    water_cases = []
    results_summary = []

    for pair in pairs:
        pair_id = pair["pair_id"]
        case_type = pair["case_type"]
        student_id = pair["student_id"]
        project_id = pair["project_id"]
        gt_score = pair["ground_truth_score"]
        low, high = pair["acceptable_range"]

        st_skills = students[student_id]["ground_truth"]["skills"]
        pr_skills = projects[project_id]["ground_truth"]["skills"]

        result = calculate_gap_analysis(st_skills, pr_skills, encoder=encoder)
        pred = result["overall_match_percentage"]

        hit = low <= pred <= high
        if hit:
            hits += 1

        abs_err = abs(pred - gt_score)
        mae_sum += abs_err

        if case_type == "false_positive_water":
            water_cases.append({
                "pair_id": pair_id,
                "student_id": student_id,
                "project_id": project_id,
                "pred": pred,
                "gt": gt_score,
                "range": [low, high],
                "hit": hit,
                "abs_err": round(abs_err, 2),
            })

        results_summary.append({
            "pair_id": pair_id,
            "case_type": case_type,
            "gt": gt_score,
            "range": f"[{low}, {high}]",
            "pred": pred,
            "hit": "✓" if hit else "✗",
            "abs_err": round(abs_err, 2),
        })

    hit_rate = (hits / total) * 100.0
    mae = mae_sum / total

    # Вывод подробного структурированного отчёта
    print("\n" + "=" * 82)
    print("РЕЗУЛЬТАТЫ БЕНЧМАРКА ГЭП-АНАЛИЗА (ЧИСТАЯ ВЕКТОРНАЯ ЛОГИКА БЕЗ LLM)")
    print("=" * 82)
    print(f"{'Pair':<5} | {'Case Type':<21} | {'GT':<4} | {'Range':<10} | {'Pred':<6} | {'Hit':<4} | {'Abs Err':<7}")
    print("-" * 82)
    for r in results_summary:
        print(f"{r['pair_id']:<5} | {r['case_type']:<21} | {r['gt']:<4} | {r['range']:<10} | {r['pred']:<6.1f} | {r['hit']:<4} | {r['abs_err']:<7.1f}")
    print("-" * 82)
    print(f"Всего пар: {total}")
    print(f"Доля попаданий в эталонный диапазон: {hit_rate:.1f}% ({hits}/{total})")
    print(f"Средняя абсолютная ошибка (MAE): {mae:.2f}")
    print("-" * 82)
    print("Результаты по кейсам false_positive_water:")
    for w in water_cases:
        status = "В ДИАПАЗОНЕ (УСПЕХ)" if w["hit"] else "ВНЕ ДИАПАЗОНА"
        print(f"  • {w['pair_id']} ({w['student_id']} -> {w['project_id']}): балл={w['pred']:.1f}, эталон={w['gt']}, диапазон={w['range']} -> {status}")
    print("=" * 82 + "\n")

    assert total == 20, "Датасет должен содержать 20 пар"
    assert len(results_summary) == 20, "Должны быть обработаны все 20 пар"
