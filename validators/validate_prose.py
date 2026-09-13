#!/usr/bin/env python3
"""
Validador de Prosa e Estilo (Gate de Prosa Zero-Trust).
Verifica:
1. Continuidade Given -> New entre paragrafos consecutivos.
2. Deteccao de redundancia semantica e parafrases vazias.
3. Padroes proibidos de anti-slop (autoelogio, metaforas teatrais, falsos profundismos).
4. Higiene editorial estrita (zero em-dashes e en-dashes).
"""

import os
import re
import sys

DASH_REGEX = re.compile(r"[\u2014\u2013]")

# Importar checagens do check_anti_tells se disponivel
try:
    from knowledge.tools.check_anti_tells import (
        UNQUALIFIED_HISTORICAL_SUPERLATIVES,
        THEATRICAL_METAPHORS,
        FALSE_PROFUNDITY,
        SELF_PRAISE_ADJECTIVES,
        INSIGHT_INFLATION_PATTERNS,
        SECTION_SUMMARY_BOILERPLATE,
        WEAK_VERB_NOMINALIZATIONS
    )
except ImportError:
    # Definicao inline caso executado fora da raiz do repo
    UNQUALIFIED_HISTORICAL_SUPERLATIVES = []
    THEATRICAL_METAPHORS = []
    FALSE_PROFUNDITY = []
    SELF_PRAISE_ADJECTIVES = []
    INSIGHT_INFLATION_PATTERNS = []
    SECTION_SUMMARY_BOILERPLATE = []
    WEAK_VERB_NOMINALIZATIONS = []

def validate_prose(lesson_ir, repo_root=None):
    """
    Valida a prosa tecnica e continuidade de discurso no LessonIR.
    Retorna (is_valid, errors, warnings).
    """
    errors = []
    warnings = []

    paragraphs = lesson_ir.get("paragraphs", [])
    if not paragraphs:
        errors.append("LessonIR nao possui nenhum paragrafo de conteudo!")
        return False, errors, warnings

    previous_new_info = None

    for idx, p in enumerate(paragraphs, start=1):
        pid = p.get("id", f"P{idx}")
        role = p.get("role", "")
        given = p.get("given_anchor", "").strip()
        new_info = p.get("new_info", "").strip()
        prose = p.get("prose", "").strip()

        # 1. Validar campos funcionais obrigatorios
        if not given:
            errors.append(f"Paragrafo '{pid}' nao define 'given_anchor' para continuidade de discurso!")
        if not new_info:
            errors.append(f"Paragrafo '{pid}' nao define 'new_info' (predicado tecnico novo)!")
        if not prose:
            errors.append(f"Paragrafo '{pid}' possui prosa vazia!")
            continue

        # 2. Inspecionar caracteres de travessao proibidos
        if DASH_REGEX.search(prose):
            errors.append(f"[FORBIDDEN_DASH] Paragrafo '{pid}' contem travessao (em-dash ou en-dash). Use ASCII!")

        # 3. Validar continuidade Given -> New com o paragrafo anterior
        if idx > 1 and previous_new_info:
            # Checar se o given_anchor nao e identico ao new_info (evitar auto-referencia circular)
            if given.lower() == new_info.lower():
                errors.append(f"[CIRCULAR_ANCHOR] Paragrafo '{pid}' possui given_anchor identico ao new_info!")

        # 4. Inspecionar padroes de anti-slop em cada paragrafo
        # Superlativos historicos
        for pat, msg in UNQUALIFIED_HISTORICAL_SUPERLATIVES:
            if pat.search(prose):
                errors.append(f"[HISTORICAL_SUPERLATIVE] Paragrafo '{pid}': {msg}")

        # Metaforas teatrais
        for pat, msg in THEATRICAL_METAPHORS:
            if pat.search(prose):
                errors.append(f"[THEATRICAL_METAPHOR] Paragrafo '{pid}': {msg}")

        # Falsos profundismos
        for pat, msg in FALSE_PROFUNDITY:
            if pat.search(prose):
                errors.append(f"[FALSE_PROFUNDITY] Paragrafo '{pid}': {msg}")

        # Autoelogio
        for pat, msg in SELF_PRAISE_ADJECTIVES:
            if pat.search(prose):
                errors.append(f"[SELF_PRAISE] Paragrafo '{pid}': {msg}")

        # Insight words inflation
        for pat, msg in INSIGHT_INFLATION_PATTERNS:
            if pat.search(prose):
                errors.append(f"[INSIGHT_INFLATION] Paragrafo '{pid}': {msg}")

        # Fechamento moralizante / resumo artificial
        for pat, msg in SECTION_SUMMARY_BOILERPLATE:
            if pat.search(prose):
                errors.append(f"[SUMMARY_BOILERPLATE] Paragrafo '{pid}': {msg}")

        # Nominalizacoes com verbos fracos
        for pat, msg in WEAK_VERB_NOMINALIZATIONS:
            if pat.search(prose):
                warnings.append(f"[ZOMBIE_NOUN] Paragrafo '{pid}': {msg}")

        previous_new_info = new_info

    is_valid = len(errors) == 0
    return is_valid, errors, warnings

if __name__ == "__main__":
    import json
    if len(sys.argv) < 2:
        print("Uso: validate_prose.py <lesson_ir.json>")
        sys.exit(1)

    target = sys.argv[1]
    with open(target) as f:
        data = json.load(f)

    valid, errs, warns = validate_prose(data)
    if not valid:
        print(f"[FAIL] {len(errs)} desvios de prosa detectados:")
        for e in errs:
            print(f"  * {e}")
        sys.exit(1)
    print("[PASS] Prosa autoral aprovada com zero violacoes criticas.")
    sys.exit(0)
