#!/usr/bin/env python3
"""
Agent Compliance Evaluator for TeachYourself Zero-Trust Architecture.
Evaluates agent-generated LessonIR or submission candidates against benchmark tasks and policies.
Calculates Epistemic, Pedagogy, Prose, Visual, and Assessment scores.
"""

import sys
import os
import json
import argparse
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from validators.validate_lesson_ir import validate_lesson_ir, load_lesson_ir
from validators.validate_claims import validate_claims
from validators.validate_pedagogy import validate_pedagogy
from validators.validate_prose import validate_prose
from validators.validate_visuals import validate_visuals
from validators.validate_assessment import validate_assessment


def load_tasks(benchmark_path: Path):
    if not benchmark_path.exists():
        raise FileNotFoundError(f"Benchmark tasks not found: {benchmark_path}")
    with open(benchmark_path, "r", encoding="utf-8") as f:
        return json.load(f)


def evaluate_single_candidate(candidate_path: Path) -> dict:
    """
    Evaluates a candidate LessonIR file against all validator engines.
    Returns scores and gate results.
    """
    if not candidate_path.exists():
        return {
            "candidate": str(candidate_path),
            "status": "ERROR",
            "error": "File does not exist",
            "overall_score": 0.0
        }

    ir_data = load_lesson_ir(str(candidate_path))

    # Run master validator
    res = validate_lesson_ir(ir_data, repo_root=str(REPO_ROOT))
    success = (res.get("overall_status") == "PASS")
    errors = res.get("all_errors", [])

    # Evaluate individual dimensions
    epistemic_ok, epistemic_errs, _ = validate_claims(ir_data, str(REPO_ROOT))
    pedagogy_ok, pedagogy_errs, _ = validate_pedagogy(ir_data, str(REPO_ROOT))
    prose_ok, prose_errs, _ = validate_prose(ir_data, str(REPO_ROOT))
    visuals_ok, visuals_errs, _ = validate_visuals(ir_data, str(REPO_ROOT))
    assessment_ok, assessment_errs, _ = validate_assessment(ir_data, str(REPO_ROOT))

    # Check zero-dash rule
    with open(candidate_path, "r", encoding="utf-8") as f:
        content = f.read()
    dash_violations = 0
    for bad_char in ["\u2014", "\u2013"]:
        dash_violations += content.count(bad_char)

    # Calculate dimensional scores
    def score_dimension(ok: bool, err_count: int, weight: float = 100.0) -> float:
        if ok:
            return weight
        return max(0.0, weight - (err_count * 25.0))

    epistemic_score = score_dimension(epistemic_ok, len(epistemic_errs))
    pedagogy_score = score_dimension(pedagogy_ok, len(pedagogy_errs))
    prose_score = score_dimension(prose_ok, len(prose_errs))
    visuals_score = score_dimension(visuals_ok, len(visuals_errs))
    assessment_score = score_dimension(assessment_ok, len(assessment_errs))
    dash_score = 100.0 if dash_violations == 0 else 0.0

    # Composite Zero-Trust Compliance Index (ZCI)
    # Fail-closed: any dash violation or master failure drops score drastically
    zci = (
        0.20 * epistemic_score +
        0.25 * pedagogy_score +
        0.20 * prose_score +
        0.15 * visuals_score +
        0.20 * assessment_score
    )
    if dash_violations > 0:
        zci = zci * 0.5  # Heavy penalty for punctuation policy violation
    if not success:
        zci = min(zci, 50.0)

    decision = "APPROVED" if (success and dash_violations == 0 and zci >= 90.0) else "REJECTED"

    return {
        "candidate": candidate_path.name,
        "decision": decision,
        "zero_trust_compliance_index": round(zci, 2),
        "scores": {
            "epistemic": round(epistemic_score, 1),
            "pedagogy": round(pedagogy_score, 1),
            "prose": round(prose_score, 1),
            "visuals": round(visuals_score, 1),
            "assessment": round(assessment_score, 1),
            "zero_dash_clean": dash_score
        },
        "errors": {
            "epistemic": epistemic_errs,
            "pedagogy": pedagogy_errs,
            "prose": prose_errs,
            "visuals": visuals_errs,
            "assessment": assessment_errs,
            "total_errors": len(errors)
        }
    }


def run_benchmark_suite(tasks_file: Path, report_output: Path = None):
    print("=" * 65)
    print("     TEACHYOURSELF AGENT COMPLIANCE BENCHMARK RUNNER         ")
    print("=" * 65)

    data = load_tasks(tasks_file)
    tasks = data.get("tasks", [])
    print(f"Versao do Benchmark: {data.get('benchmark_version')}")
    print(f"Total de Tarefas Adversariais: {len(tasks)}")
    print("-" * 65)

    categories = {}
    for task in tasks:
        cat = task.get("category", "OTHER")
        categories[cat] = categories.get(cat, 0) + 1

    for cat, count in categories.items():
        print(f"  Categoria {cat:15}: {count:2} tarefas catalogadas")

    print("-" * 65)
    print("Testando capacidade de deteccao com o Golden Sample:")
    sample_path = REPO_ROOT / "examples" / "lesson_ir_sample.yaml"
    result = evaluate_single_candidate(sample_path)

    print(f"  Golden Sample ({result['candidate']}):")
    print(f"    Decisao: {result['decision']}")
    print(f"    Zero Trust Compliance Index: {result['zero_trust_compliance_index']}%")
    for dim, score in result["scores"].items():
        print(f"      - {dim:16}: {score}%")

    report = {
        "benchmark_version": data.get("benchmark_version"),
        "total_tasks": len(tasks),
        "categories": categories,
        "reference_candidate_evaluation": result
    }

    if report_output:
        with open(report_output, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"\nRelatorio salvo em: {report_output}")

    print("=" * 65)
    if result["decision"] == "APPROVED":
        print("[SUCESSO] O avaliador de conformidade de agentes esta operacional.")
        return 0
    else:
        print("[FALHA] Golden Sample nao alcancou aprovacao no avaliador.")
        return 1


def main():
    parser = argparse.ArgumentParser(description="Evaluate agent compliance against Zero Trust benchmark.")
    parser.add_argument("--candidate", type=str, help="Path to a candidate LessonIR YAML file to evaluate.")
    parser.add_argument("--report", type=str, help="Path to save evaluation report JSON.")
    parser.add_argument("--run-self-test", action="store_true", help="Run benchmark suite validation against reference sample.")
    args = parser.parse_args()

    tasks_file = REPO_ROOT / "benchmarks" / "agent_compliance" / "tasks" / "benchmark_tasks.json"

    if args.candidate:
        cand_path = Path(args.candidate)
        result = evaluate_single_candidate(cand_path)
        print(json.dumps(result, indent=2))
        return 0 if result["decision"] == "APPROVED" else 1

    # Default to self-test
    report_path = Path(args.report) if args.report else None
    return run_benchmark_suite(tasks_file, report_path)


if __name__ == "__main__":
    sys.exit(main())
