#!/usr/bin/env python3
"""
Validador Pedagógico (Gate Pedagógico Zero-Trust).
Verifica:
1. Fechamento estrito de pré-requisitos (zero vazamentos de termos proibidos).
2. Conformidade com os estágios da Escada da Explicação.
3. Orçamento de conceitos (Concept Load Budget).
4. Presença obrigatória de predição ativa e sondas de transferência.
"""

import os
import re
import sys

try:
    import yaml
except ImportError:
    yaml = None

def _load_yaml_fallback(filepath):
    if yaml:
        with open(filepath, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    from knowledge.tools.validate_kb import parse_yaml_doc
    with open(filepath, "r", encoding="utf-8") as f:
        return parse_yaml_doc(f.read())

def validate_pedagogy(lesson_ir, repo_root=None):
    """
    Valida as regras pedagógicas do LessonIR conforme policies/pedagogy.yaml.
    Retorna (is_valid, errors, warnings).
    """
    errors = []
    warnings = []

    learner_state = lesson_ir.get("learner_state", {})
    prohibited_leaks = learner_state.get("prohibited_leaks", [])
    known_concepts = learner_state.get("known_concepts", [])
    target_concept = learner_state.get("target_concept", "")

    if not target_concept:
        errors.append("LessonIR nao declara target_concept em learner_state!")

    # 1. Rastrear vazamentos de termos proibidos (Prerequisite Closure)
    all_text = []
    # Coletar todo o texto de prosa
    for p in lesson_ir.get("paragraphs", []):
        all_text.append(p.get("prose", ""))
        all_text.append(p.get("new_info", ""))

    # Coletar texto dos estagios da escada
    ladder = lesson_ir.get("explanation_ladder", {})
    for stage_key, stage_val in ladder.items():
        if isinstance(stage_val, dict):
            for k, v in stage_val.items():
                if isinstance(v, str):
                    all_text.append(v)
                elif isinstance(v, list):
                    all_text.extend([str(item) for item in v])
        elif isinstance(stage_val, list):
            all_text.extend([str(item) for item in stage_val])

    full_content = " ".join(all_text).lower()

    for leak in prohibited_leaks:
        leak_clean = leak.replace("_", " ").lower()
        if leak_clean in full_content:
            errors.append(f"[PREREQUISITE_LEAK] Termo proibido '{leak}' detectado no conteudo antes de ser ensinado!")

    # 2. Validar estagios obrigatorios da Escada da Explicacao
    required_stages = ["entry_point", "problem", "core_mechanism", "boundary_condition"]
    for st in required_stages:
        if st not in ladder or not ladder[st]:
            errors.append(f"[EXPLANATION_LADDER_GAP] Estagio obrigatorio '{st}' ausente na Escada da Explicacao!")

    # 3. Validar orcamento cognitivo (Concept Load Budget)
    # Apenas 1 target_concept central
    if isinstance(target_concept, list) and len(target_concept) > 1:
        errors.append(f"[CONCEPT_BUDGET_EXCEEDED] Multiplos conceitos centrais declarados ({len(target_concept)} > 1)!")

    # 4. Validar presenca de aprendizagem ativa intrinseca (sem questionarios)
    active_learning = lesson_ir.get("active_learning", {})
    if not active_learning:
        errors.append("[ACTIVE_LEARNING_MISSING] Bloco active_learning ausente no LessonIR!")
    else:
        if not active_learning.get("inspection_type"):
            errors.append("[SIGNAL_TRACING_MISSING] active_learning deve declarar um inspection_type valido para inspecao mecanica!")
        if "transfer_probe" not in active_learning or not active_learning["transfer_probe"]:
            errors.append("[TRANSFER_PROBE_MISSING] Sonda de transferencia obrigatoria ausente!")

    is_valid = len(errors) == 0
    return is_valid, errors, warnings

if __name__ == "__main__":
    import json
    if len(sys.argv) < 2:
        print("Uso: validate_pedagogy.py <lesson_ir.yaml|json>")
        sys.exit(1)

    target = sys.argv[1]
    if target.endswith(".json"):
        with open(target) as f:
            data = json.load(f)
    else:
        data = _load_yaml_fallback(target)

    valid, errs, warns = validate_pedagogy(data)
    if not valid:
        print(f"[FAIL] {len(errs)} violacoes pedagogicas:")
        for e in errs:
            print(f"  * {e}")
        sys.exit(1)
    print(f"[PASS] Integridade pedagogica aprovada.")
    sys.exit(0)
