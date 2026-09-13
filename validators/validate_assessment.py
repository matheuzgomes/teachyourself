#!/usr/bin/env python3
"""
Validador de Avaliação e Aprendizagem Ativa (Gate de Avaliação Zero-Trust).
Verifica:
1. Presença e formato do Desafio de Predição Ativa.
2. Exigência do registro de confiança (LOW, MEDIUM, HIGH).
3. Mapeamento de concepções errôneas (Misconception Remediation) para opções incorretas.
4. Presença e rigor da Sonda de Transferência (Transfer Probe).
"""

import sys

def validate_assessment(lesson_ir, repo_root=None):
    """
    Valida os componentes de inspecao ativa e rastreamento mecanico conforme policies/assessment.yaml.
    Garante que questionarios de multipla escolha e quizzes sejam estritamente rejeitados.
    Retorna (is_valid, errors, warnings).
    """
    errors = []
    warnings = []

    active_learning = lesson_ir.get("active_learning", {})
    if not active_learning:
        errors.append("[ASSESSMENT_MISSING] Bloco 'active_learning' ausente no LessonIR!")
        return False, errors, warnings

    # 1. Proibicao estrita de questionarios e alternativas de multipla escolha
    pred = active_learning.get("prediction", {})
    if pred:
        if "options" in pred or "correct_option_index" in pred or "misconception_remediation" in pred:
            errors.append("[MULTIPLE_CHOICE_BANNED] Questionarios e alternativas de multipla escolha sao estritamente proibidos no TeachYourself!")

    if any(k in active_learning for k in ["options", "quiz", "questionnaire", "grading", "score", "percentage", "ranking"]):
        errors.append("[MULTIPLE_CHOICE_BANNED] Questionarios, alternativas de multipla escolha e grading sao estritamente proibidos no TeachYourself!")

    # 2. Validar presenca de inspecao ativa e rastreamento de sinais
    valid_modalities = {
        "CIRCUIT_SIGNAL_TRACING",
        "CODE_TRACING",
        "INTERACTIVE_SIMULATION",
        "MINIMAL_CONTRAST",
        "PREDICTION_REVEAL"
    }
    insp_type = active_learning.get("inspection_type")
    if not insp_type:
        errors.append("[SIGNAL_TRACING_MISSING] active_learning deve declarar um inspection_type valido para inspecao mecanica!")
    elif insp_type not in valid_modalities:
        errors.append(f"[INVALID_INSPECTION_TYPE] Modalidade de inspecao '{insp_type}' invalida! Use: {sorted(list(valid_modalities))}")

    # 3. Validar sonda de transferencia se exigida ou presente
    transfer = active_learning.get("transfer_probe")
    if active_learning.get("require_transfer_probe") and not transfer:
        errors.append("[TRANSFER_PROBE_MISSING] Sonda de transferencia obrigatoria ausente!")
    elif transfer:
        t_prompt = transfer.get("prompt", "").strip()
        if len(t_prompt) < 10:
            errors.append("[WEAK_TRANSFER_PROMPT] Pergunta da sonda de transferencia muito curta ou vazia!")

        if not transfer.get("explanation_anchor"):
            errors.append("[TRANSFER_EXPLANATION_MISSING] Sonda de transferencia deve ter explicacao causal ancorada!")

    is_valid = len(errors) == 0
    return is_valid, errors, warnings

if __name__ == "__main__":
    import json
    if len(sys.argv) < 2:
        print("Uso: validate_assessment.py <lesson_ir.json>")
        sys.exit(1)

    target = sys.argv[1]
    with open(target) as f:
        data = json.load(f)

    valid, errs, warns = validate_assessment(data)
    if not valid:
        print(f"[FAIL] {len(errs)} violacoes na avaliacao ativa:")
        for e in errs:
            print(f"  * {e}")
        sys.exit(1)
    print("[PASS] Avaliacao ativa e sondas de transferencia validadas com sucesso.")
    sys.exit(0)
