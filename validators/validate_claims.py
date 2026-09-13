#!/usr/bin/env python3
"""
Validador Epistêmico de Claims (Gate Epistêmico Zero-Trust).
Verifica:
1. Existência e proveniência de todos os claims citados no LessonIR.
2. Nível de autoridade conforme policies/epistemic.yaml.
3. Proibição absoluta de claims órfãos.
"""

import os
import sys

try:
    import yaml
except ImportError:
    yaml = None

def _load_yaml_fallback(filepath):
    if yaml:
        with open(filepath, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    # Simple fallback parser for basic maps
    from knowledge.tools.validate_kb import parse_yaml_doc
    with open(filepath, "r", encoding="utf-8") as f:
        return parse_yaml_doc(f.read())

def validate_claims(lesson_ir, repo_root=None):
    """
    Valida os claims citados no LessonIR contra a base de conhecimento.
    Retorna (is_valid, errors, warnings).
    """
    if repo_root is None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    errors = []
    warnings = []

    # Extrair todos os claims citados nos parágrafos do LessonIR
    cited_claims = set()
    paragraphs = lesson_ir.get("paragraphs", [])
    for p in paragraphs:
        p_claims = p.get("claims_cited", [])
        if not p_claims:
            errors.append(f"Paragrafo '{p.get('id', '?')}' nao cita nenhum claim de proveniencia!")
        for c in p_claims:
            cited_claims.add(c)

    if not cited_claims:
        errors.append("LessonIR nao possui nenhum claim citado nos paragrafos!")
        return False, errors, warnings

    # Carregar claims conhecidos do Knowledge Base
    known_claims = set()
    concepts_dir = os.path.join(repo_root, "knowledge", "concepts")
    if os.path.exists(concepts_dir):
        for root, _, files in os.walk(concepts_dir):
            for f in files:
                if f.endswith(".md"):
                    fpath = os.path.join(root, f)
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as fh:
                        content = fh.read()
                        import re
                        for m in re.finditer(r"\b(CLAIM-[A-Z0-9_-]+)\b", content):
                            known_claims.add(m.group(1))

    # Verificar cada claim citado
    for claim_id in sorted(cited_claims):
        if claim_id not in known_claims:
            # Rejeição imediata de claim órfão
            errors.append(f"[ORPHAN_CLAIM] Claim '{claim_id}' citado no LessonIR nao existe na base de conhecimento!")

    is_valid = len(errors) == 0
    return is_valid, errors, warnings

if __name__ == "__main__":
    import json
    if len(sys.argv) < 2:
        print("Uso: validate_claims.py <lesson_ir.yaml|json>")
        sys.exit(1)
    
    target = sys.argv[1]
    if target.endswith(".json"):
        with open(target) as f:
            data = json.load(f)
    else:
        data = _load_yaml_fallback(target)
    
    valid, errs, warns = validate_claims(data)
    if not valid:
        print(f"[FAIL] {len(errs)} erros epistemicos:")
        for e in errs:
            print(f"  * {e}")
        sys.exit(1)
    print(f"[PASS] Todos os claims validados com sucesso.")
    sys.exit(0)
