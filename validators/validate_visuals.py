#!/usr/bin/env python3
"""
Validador de Modelos Visuais Executáveis (Gates V1 a V5 Zero-Trust).
Integra-se diretamente à engine formal de visual_model.py para validar
os 5 gates visuais sobre o modelo referenciado no LessonIR.
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
    from knowledge.tools.validate_kb import parse_yaml_doc
    with open(filepath, "r", encoding="utf-8") as f:
        return parse_yaml_doc(f.read())

def validate_visuals(lesson_ir, repo_root=None):
    """
    Valida a conformidade da referencia visual do LessonIR conforme policies/visuals.yaml.
    Retorna (is_valid, errors, warnings).
    """
    if repo_root is None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    errors = []
    warnings = []

    visual_ref = lesson_ir.get("visual_spec_ref", "")
    if not visual_ref:
        errors.append("[VISUAL_REF_MISSING] LessonIR nao especifica 'visual_spec_ref'!")
        return False, errors, warnings

    visual_models_dir = os.path.join(repo_root, "knowledge", "visual-models")
    spec_path = os.path.join(visual_models_dir, f"{visual_ref}.yaml")

    if not os.path.exists(spec_path):
        errors.append(f"[ORPHAN_VISUAL_MODEL] Especificacao visual '{visual_ref}.yaml' nao existe em {visual_models_dir}!")
        return False, errors, warnings

    spec_data = _load_yaml_fallback(spec_path)
    if not spec_data:
        errors.append(f"Arquivo de modelo visual '{visual_ref}.yaml' esta vazio ou corrompido!")
        return False, errors, warnings

    # Carregar fontes registradas para o validador V1-V5
    registered_sources = set()
    sources_dir = os.path.join(repo_root, "knowledge", "sources")
    if os.path.exists(sources_dir):
        for root, _, files in os.walk(sources_dir):
            for f in files:
                if f.endswith((".yaml", ".yml")):
                    registered_sources.add(os.path.splitext(f)[0])

    # Carregar claims registrados para o validador V1-V5
    registered_claims = set()
    concepts_dir = os.path.join(repo_root, "knowledge", "concepts")
    if os.path.exists(concepts_dir):
        for root, _, files in os.walk(concepts_dir):
            for f in files:
                if f.endswith(".md"):
                    import re
                    with open(os.path.join(root, f), "r", encoding="utf-8", errors="ignore") as fh:
                        for m in re.finditer(r"\b(CLAIM-[A-Z0-9_-]+)\b", fh.read()):
                            registered_claims.add(m.group(1))

    # Garantir repo_root no sys.path
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    try:
        from knowledge.tools.semantic.visual_model import validate_visual_model
        v_errors = validate_visual_model(spec_data, registered_sources, registered_claims, repo_root)
        if v_errors:
            errors.extend(v_errors)
    except Exception as exc:
        errors.append(f"[VISUAL_VALIDATOR_ERROR] Falha ao executar validacao V1 a V5: {exc}")

    is_valid = len(errors) == 0
    return is_valid, errors, warnings

if __name__ == "__main__":
    import json
    if len(sys.argv) < 2:
        print("Uso: validate_visuals.py <lesson_ir.json>")
        sys.exit(1)

    target = sys.argv[1]
    with open(target) as f:
        data = json.load(f)

    valid, errs, warns = validate_visuals(data)
    if not valid:
        print(f"[FAIL] {len(errs)} violacoes no modelo visual:")
        for e in errs:
            print(f"  * {e}")
        sys.exit(1)
    print("[PASS] Modelo visual validado nos Gates V1 a V5.")
    sys.exit(0)
