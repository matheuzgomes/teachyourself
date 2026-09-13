#!/usr/bin/env python3
"""
Validador Deterministico Fail-Closed do Semantic Compression Pass.
Audita os Gates C1 a C10 sobre relatorios de compressao e textos transformados.
Axioma: "Compress without reducing the learner model."
"""

import os
import sys
import json
from typing import Dict, Any, Tuple, List
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from compression.analyze_sentences import segment_into_sentences, calculate_utility_score, detect_bloat_patterns


def validate_compression_report(report_data: Dict[str, Any]) -> Tuple[bool, List[str], Dict[str, str]]:
    """
    Valida um dicionario de relatorio de compressao contra os Gates C1 a C10.
    Retorna (is_valid, errors, gate_results).
    """
    errors = []
    gates = {
        "c1_required_claim_preservation": "PASS",
        "c2_scope_preservation": "PASS",
        "c3_causal_preservation": "PASS",
        "c4_qualifier_preservation": "PASS",
        "c5_redundancy_elimination": "PASS",
        "c6_sentence_utility": "PASS",
        "c7_inference_trust": "PASS",
        "c8_pedagogical_repetition_protection": "PASS",
        "c9_no_new_claims": "PASS",
        "c10_learner_model_round_trip": "PASS"
    }

    comp_input = report_data.get("compression_input", {})
    sentences = report_data.get("sentences", [])
    required_claims = comp_input.get("required_claims", [])
    learning_contract = comp_input.get("learning_contract", {})
    protected_elements = comp_input.get("protected_elements", {})

    # Reconstruir o texto comprimido a partir das sentencas com base nas operacoes
    compressed_chunks = []
    kept_count = 0
    deleted_count = 0

    for s in sentences:
        op = s.get("operation", "KEEP")
        orig_text = s.get("original_text", "")
        trans_text = s.get("transformed_text", orig_text)
        
        if op == "DELETE":
            deleted_count += 1
            continue
        elif op in ("KEEP", "REWRITE_SHORTER", "MERGE", "MOVE"):
            kept_count += 1
            compressed_chunks.append(trans_text if trans_text else orig_text)
        else:
            errors.append(f"Operacao desconhecida '{op}' na sentenca {s.get('id', '?')}")

    compressed_prose = " ".join(compressed_chunks)
    compressed_lower = compressed_prose.lower()

    # Zero-Dash check
    for bad_char in ["\u2014", "\u2013"]:
        if bad_char in compressed_prose:
            errors.append(f"[FORBIDDEN_DASH] Texto comprimido contem travessao proibido (U+{ord(bad_char):04X})!")

    # C1: Required Claim Preservation
    # 100% dos claims obrigatorios devem estar presentes
    missing_claims = []
    for c in required_claims:
        # Checar se o claim foi mantido em alguma sentenca preservada
        claim_found = False
        for s in sentences:
            if s.get("operation") != "DELETE":
                if c in s.get("claims_cited", []) or c.lower() in (s.get("transformed_text") or s.get("original_text", "")).lower():
                    claim_found = True
                    break
        if not claim_found:
            missing_claims.append(c)

    if missing_claims:
        gates["c1_required_claim_preservation"] = "FAIL"
        errors.append(f"[C1_REQUIRED_CLAIM_LOSS] Claims obrigatorios perdidos na compressao: {missing_claims}")

    # C2: Scope Preservation
    # Qualificadores de escopo de hardware/modelo nao podem ser suprimidos
    missing_scopes = []
    for q in protected_elements.get("necessary_qualifiers", []):
        if q.lower() not in compressed_lower:
            missing_scopes.append(q)
    if missing_scopes:
        gates["c2_scope_preservation"] = "FAIL"
        errors.append(f"[C2_SCOPE_LOSS] Qualificadores de escopo perdidos na compressao: {missing_scopes}")

    # C3: Causal Preservation
    # Se havia conectivo causal ou explicativo em sentenca deletada com informacao causal unica
    for s in sentences:
        if s.get("operation") == "DELETE":
            ut = s.get("sentence_utility", {})
            if ut.get("establishes_causality") == 1 and ut.get("explains_mechanism") == 1:
                # Perigo: deletou explicacao de mecanismo causal
                # Verificar se o mecanismo ainda e citado no texto comprimido
                words = [w for w in s.get("original_text", "").split() if len(w) > 4]
                if not any(w.lower() in compressed_lower for w in words):
                    gates["c3_causal_preservation"] = "FAIL"
                    errors.append(f"[C3_CAUSAL_LOSS] Sentenca deletada '{s.get('id')}' continha mecanismo causal suprimido!")

    # C4: Qualifier Preservation (Exceptions & Edge cases)
    missing_exceptions = []
    for ex in protected_elements.get("exceptions", []):
        # Checa palavras-chave da excecao
        key_words = [w.lower() for w in ex.split() if len(w) > 3]
        if not all(w in compressed_lower for w in key_words[:3]):
            missing_exceptions.append(ex)
    if missing_exceptions:
        gates["c4_qualifier_preservation"] = "FAIL"
        errors.append(f"[C4_QUALIFIER_LOSS] Excecao ou caso de borda perdido na compressao: {missing_exceptions}")

    # C5: Redundancy Elimination
    # Verificar se restaram sentencas consecutivas com alta redundancia
    comp_sentences = segment_into_sentences(compressed_prose)
    for i in range(len(comp_sentences) - 1):
        s1 = comp_sentences[i].lower()
        s2 = comp_sentences[i+1].lower()
        w1 = set(s1.split())
        w2 = set(s2.split())
        overlap = len(w1.intersection(w2)) / max(len(w1), len(w2)) if w1 and w2 else 0
        if overlap > 0.85:
            gates["c5_redundancy_elimination"] = "FAIL"
            errors.append(f"[C5_REDUNDANCY_REMAINING] Sentencas consecutivas com redundancia excessiva ({round(overlap*100)}%): '{comp_sentences[i]}' e '{comp_sentences[i+1]}'")

    # C6: Sentence Utility
    # Proibido manter sentencas com total_utility_score == 0 ou role == NONE
    zero_utility_kept = []
    for s in sentences:
        if s.get("operation") in ("KEEP", "MOVE"):
            ut = s.get("sentence_utility", {})
            total_u = sum(ut.values())
            if total_u == 0 or s.get("role") == "NONE":
                zero_utility_kept.append(s.get("id"))
    if zero_utility_kept:
        gates["c6_sentence_utility"] = "FAIL"
        errors.append(f"[C6_ZERO_UTILITY_KEPT] Sentencas sem funcao/utilidade mantidas no texto comprimido: {zero_utility_kept}")

    # C7: Inference Trust
    # Checar por repeticoes de deducoes obvias no texto comprimido
    for s in comp_sentences:
        bloats = detect_bloat_patterns(s)
        if "EMPTY_IMPORTANCE" in bloats:
            gates["c7_inference_trust"] = "FAIL"
            errors.append(f"[C7_EMPTY_IMPORTANCE_KEPT] Frase de importancia vazia retida: '{s}'")

    # C8: Pedagogical Repetition Protection
    missing_examples = []
    for ex in protected_elements.get("worked_examples", []):
        if ex.lower() not in compressed_lower:
            missing_examples.append(ex)
    if missing_examples:
        gates["c8_pedagogical_repetition_protection"] = "FAIL"
        errors.append(f"[C8_WORKED_EXAMPLE_LOSS] Exemplo pedagogico ou trace protegido suprimido: {missing_examples}")

    # C9: No New Claims
    # Verifica se o texto comprimido nao inventou claims que nao existiam no original
    orig_prose = comp_input.get("prose", "").lower()
    comp_words = set(compressed_lower.split())
    # Garante que termos tecnicos citados tem respaldo
    # (simplificado: nenhum novo claim id inventado)
    for w in comp_words:
        if w.startswith("claim-") and w not in orig_prose:
            gates["c9_no_new_claims"] = "FAIL"
            errors.append(f"[C9_INVENTED_CLAIM] Claim desconhecido introduzido durante a compressao: '{w}'")

    # C10: Learner Model Round-Trip
    missing_beliefs = []
    for belief in learning_contract.get("learner_should_leave_believing", []):
        belief_tokens = [t.lower() for t in belief.split() if len(t) > 4]
        # Pelo menos 60% dos tokens conceituais essenciais devem estar presentes
        found_tokens = [t for t in belief_tokens if t in compressed_lower]
        if belief_tokens and (len(found_tokens) / len(belief_tokens)) < 0.60:
            missing_beliefs.append(belief)
    if missing_beliefs:
        gates["c10_learner_model_round_trip"] = "FAIL"
        errors.append(f"[C10_LEARNER_MODEL_LOSS] Modelo mental prejudicado; crenca nao preservada: {missing_beliefs}")

    # Status global fail-closed
    overall_ok = (len(errors) == 0) and all(v == "PASS" for v in gates.values())
    return overall_ok, errors, gates


if __name__ == "__main__":
    sample_report = {
        "artifact_id": "sample-compression",
        "compression_input": {
            "prose": "O forwarding envia o dado diretamente para o estagio consumidor. Esse mecanismo e extremamente importante. Forwarding elimina stalls.",
            "required_claims": ["CLAIM-FWD-001"],
            "learning_contract": {
                "learner_should_leave_believing": ["forwarding elimina stalls"],
                "misconceptions_prevented": ["MISC-RAW-STALL"]
            },
            "protected_elements": {
                "technical_terms": ["forwarding", "stall"],
                "necessary_qualifiers": ["estagio consumidor"],
                "exceptions": [],
                "worked_examples": []
            }
        },
        "sentences": [
            {
                "id": "S01",
                "original_text": "O forwarding envia o dado diretamente para o estagio consumidor.",
                "role": "MECHANISM",
                "claims_cited": ["CLAIM-FWD-001"],
                "sentence_utility": {
                    "introduces_required_claim": 1,
                    "explains_mechanism": 1,
                    "establishes_causality": 1,
                    "qualifies_scope": 1,
                    "prevents_misconception": 0,
                    "provides_required_example": 0,
                    "enables_transition": 0
                },
                "operation": "KEEP"
            },
            {
                "id": "S02",
                "original_text": "Esse mecanismo e extremamente importante.",
                "role": "NONE",
                "claims_cited": [],
                "sentence_utility": {
                    "introduces_required_claim": 0,
                    "explains_mechanism": 0,
                    "establishes_causality": 0,
                    "qualifies_scope": 0,
                    "prevents_misconception": 0,
                    "provides_required_example": 0,
                    "enables_transition": 0
                },
                "operation": "DELETE"
            },
            {
                "id": "S03",
                "original_text": "Forwarding elimina stalls entre instrucoes consecutivas.",
                "role": "CAUSE",
                "claims_cited": ["CLAIM-FWD-001"],
                "sentence_utility": {
                    "introduces_required_claim": 1,
                    "explains_mechanism": 0,
                    "establishes_causality": 1,
                    "qualifies_scope": 0,
                    "prevents_misconception": 0,
                    "provides_required_example": 0,
                    "enables_transition": 0
                },
                "operation": "KEEP"
            }
        ],
        "compression_report": {
            "before": {"words": 20, "sentences": 3},
            "after": {"words": 15, "sentences": 2},
            "reduction_pct": 25.0,
            "operations_summary": {"deleted": 1, "merged": 0, "rewritten_shorter": 0, "kept": 2},
            "gates": {},
            "status": "PASS"
        }
    }

    ok, diags, g_res = validate_compression_report(sample_report)
    print("=================================================================")
    print("           VALIDACAO DE EXEMPLO DO COMPRESSION PASS              ")
    print("=================================================================")
    for g, val in g_res.items():
        print(f"  [{val}] {g}")
    print("-----------------------------------------------------------------")
    print(f"Status Geral: {'PASS' if ok else 'FAIL'}")
    if diags:
        print("Erros:")
        for d in diags:
            print(f"  * {d}")
    sys.exit(0 if ok else 1)
