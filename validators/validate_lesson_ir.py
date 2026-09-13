#!/usr/bin/env python3
"""
Orquestrador de Validação de LessonIR (Zero-Trust Master Validator).
Executa em cascata fail-closed:
1. Validação estrutural de Schema JSON (schemas/lesson_ir.schema.json).
2. Validação Epistêmica de Claims (validate_claims).
3. Validação Pedagógica e Fechamento de Pré-requisitos (validate_pedagogy).
4. Validação de Prosa, Given->New e Anti-Slop (validate_prose).
5. Validação de Modelos Visuais V1 a V5 (validate_visuals).
6. Validação de Aprendizagem Ativa e Sondas (validate_assessment).
"""

import json
import os
import sys

try:
    import yaml
except ImportError:
    yaml = None

try:
    import jsonschema
except ImportError:
    jsonschema = None

try:
    from .validate_claims import validate_claims
    from .validate_pedagogy import validate_pedagogy
    from .validate_prose import validate_prose
    from .validate_visuals import validate_visuals
    from .validate_assessment import validate_assessment
except (ImportError, ValueError):
    sys.path.insert(0, os.path.dirname(__file__))
    from validate_claims import validate_claims
    from validate_pedagogy import validate_pedagogy
    from validate_prose import validate_prose
    from validate_visuals import validate_visuals
    from validate_assessment import validate_assessment

def load_lesson_ir(target_path):
    """Carrega o LessonIR em formato JSON ou YAML."""
    if not os.path.exists(target_path):
        raise FileNotFoundError(f"Arquivo LessonIR nao encontrado: {target_path}")

    with open(target_path, "r", encoding="utf-8") as f:
        content = f.read()

    if target_path.endswith(".json"):
        return json.loads(content)
    elif yaml:
        return yaml.safe_load(content)
    else:
        from knowledge.tools.validate_kb import parse_yaml_doc
        return parse_yaml_doc(content)

def validate_schema(lesson_ir, repo_root):
    """Valida o LessonIR contra schemas/lesson_ir.schema.json."""
    schema_path = os.path.join(repo_root, "schemas", "lesson_ir.schema.json")
    if not os.path.exists(schema_path):
        return False, [f"Schema nao encontrado em: {schema_path}"]

    with open(schema_path, "r", encoding="utf-8") as sf:
        schema = json.load(sf)

    if jsonschema:
        try:
            jsonschema.validate(instance=lesson_ir, schema=schema)
            return True, []
        except jsonschema.exceptions.ValidationError as e:
            path_str = " -> ".join([str(p) for p in e.path]) or "root"
            return False, [f"[SCHEMA_VALIDATION_ERROR] Em '{path_str}': {e.message}"]
        except Exception as e:
            return False, [f"[SCHEMA_ERROR] Erro ao validar schema: {e}"]
    else:
        # Fallback de checagem estrutural mínima se jsonschema não estiver no path
        missing = []
        for req in schema.get("required", []):
            if req not in lesson_ir:
                missing.append(f"[SCHEMA_MISSING_FIELD] Campo obrigatorio '{req}' ausente no LessonIR!")
        return len(missing) == 0, missing

def validate_lesson_ir(lesson_ir, repo_root=None):
    """
    Executa a bateria completa de validadores Zero-Trust sobre o LessonIR.
    Retorna dicionario de diagnostico com status de cada gate.
    """
    if repo_root is None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    if isinstance(lesson_ir, (str, bytes, os.PathLike)):
        lesson_ir = load_lesson_ir(str(lesson_ir))

    results = {
        "artifact_id": lesson_ir.get("id", "UNKNOWN"),
        "overall_status": "PASS",
        "gates": {},
        "all_errors": [],
        "all_warnings": []
    }

    # 1. Schema Validation Gate
    schema_ok, schema_errs = validate_schema(lesson_ir, repo_root)
    results["gates"]["SCHEMA_VALIDATION"] = "PASS" if schema_ok else "FAIL"
    if not schema_ok:
        results["all_errors"].extend(schema_errs)
        results["overall_status"] = "FAIL"
        # Em falha de schema basico, nao adianta continuar
        return results

    # 2. Epistemic Claims Gate
    claims_ok, claims_errs, claims_warns = validate_claims(lesson_ir, repo_root)
    results["gates"]["EPISTEMIC_PROVENANCE"] = "PASS" if claims_ok else "FAIL"
    results["all_errors"].extend(claims_errs)
    results["all_warnings"].extend(claims_warns)

    # 3. Pedagogy Gate
    ped_ok, ped_errs, ped_warns = validate_pedagogy(lesson_ir, repo_root)
    results["gates"]["PEDAGOGICAL_CLOSURE"] = "PASS" if ped_ok else "FAIL"
    results["all_errors"].extend(ped_errs)
    results["all_warnings"].extend(ped_warns)

    # 4. Prose & Anti-Slop Gate
    prose_ok, prose_errs, prose_warns = validate_prose(lesson_ir, repo_root)
    results["gates"]["PROSE_AND_DISCOURSE"] = "PASS" if prose_ok else "FAIL"
    results["all_errors"].extend(prose_errs)
    results["all_warnings"].extend(prose_warns)

    # 5. Visual Invariants Gate
    vis_ok, vis_errs, vis_warns = validate_visuals(lesson_ir, repo_root)
    results["gates"]["VISUAL_INVARIANTS"] = "PASS" if vis_ok else "FAIL"
    results["all_errors"].extend(vis_errs)
    results["all_warnings"].extend(vis_warns)

    # 6. Assessment Gate
    ass_ok, ass_errs, ass_warns = validate_assessment(lesson_ir, repo_root)
    results["gates"]["ACTIVE_ASSESSMENT"] = "PASS" if ass_ok else "FAIL"
    results["all_errors"].extend(ass_errs)
    results["all_warnings"].extend(ass_warns)

    # Decisao Global Fail-Closed: se qualquer gate != PASS -> FAIL
    if any(status != "PASS" for status in results["gates"].values()):
        results["overall_status"] = "FAIL"

    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: validate_lesson_ir.py <caminho_para_lesson_ir.yaml|json>")
        sys.exit(1)

    target_file = sys.argv[1]
    repo_base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    try:
        ir_data = load_lesson_ir(target_file)
        res = validate_lesson_ir(ir_data, repo_base)

        print("=================================================================")
        print(f"       AUDITORIA ZERO TRUST DE LESSON IR: {res['artifact_id']}   ")
        print("=================================================================")
        for gname, gstatus in res["gates"].items():
            mark = "[PASS]" if gstatus == "PASS" else "[FAIL]"
            print(f"  {mark} {gname.ljust(26)} -> {gstatus}")
        print("-----------------------------------------------------------------")

        if res["all_errors"]:
            print(f"\n[BLOQUEIO] Detectadas {len(res['all_errors'])} violacoes fatais:")
            for err in res["all_errors"]:
                print(f"  * {err}")

        if res["all_warnings"]:
            print(f"\n[AVISOS] {len(res['all_warnings'])} alertas registrados:")
            for w in res["all_warnings"]:
                print(f"  - {w}")

        print("=================================================================")
        if res["overall_status"] == "PASS":
            print("DECISAO ZERO-TRUST: APROVADO PARA COMPILACAO DE MDX")
            sys.exit(0)
        else:
            print("DECISAO ZERO-TRUST: REJEITADO (Release Bloqueado)")
            sys.exit(1)

    except Exception as exc:
        print(f"[FAIL-CLOSED ERROR] Validador falhou com excecao: {exc}")
        sys.exit(1)
