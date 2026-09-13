#!/usr/bin/env python3
"""
Executor de Invalidação Retroativa (Retroactive Invalidation Runner).
Quando novas regressões inferenciais, pedagógicas ou epistêmicas são adicionadas
ao repositório (ex: em knowledge/tests/), este executor audita todas as lições
e IRs já existentes para detectar quebras retroativas e marcar módulos como 'DIRTY'.
"""

import glob
import os
import sys

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from validators.validate_lesson_ir import validate_lesson_ir, load_lesson_ir

def run_retroactive_invalidation(repo_path=None):
    """
    Executa a auditoria em lote de todos os LessonIRs presentes em examples/ e tracks/
    contra a versão mais recente das políticas.
    """
    if repo_path is None:
        repo_path = repo_root

    targets = []
    # Buscar todos os arquivos lesson_ir.* ou ir.*
    for pattern in ["examples/*.yaml", "examples/*.json", "tracks/**/*.yaml"]:
        targets.extend(glob.glob(os.path.join(repo_path, pattern), recursive=True))

    results = {
        "audited_count": len(targets),
        "clean_modules": [],
        "dirty_modules": []
    }

    for tpath in targets:
        # Pular arquivos que não são LessonIRs (ex: manifests)
        fname = os.path.basename(tpath)
        if "manifest" in fname or "state" in fname:
            continue

        try:
            ir_data = load_lesson_ir(tpath)
            if not isinstance(ir_data, dict) or "explanation_ladder" not in ir_data:
                continue

            res = validate_lesson_ir(ir_data, repo_path)
            rel = os.path.relpath(tpath, repo_path)
            if res["overall_status"] == "PASS":
                results["clean_modules"].append(rel)
            else:
                results["dirty_modules"].append({
                    "path": rel,
                    "errors": res["all_errors"]
                })
        except Exception as exc:
            results["dirty_modules"].append({
                "path": os.path.relpath(tpath, repo_path),
                "errors": [f"Erro ao processar LessonIR: {exc}"]
            })

    return results

if __name__ == "__main__":
    rep = run_retroactive_invalidation()
    print("=================================================================")
    print("         EXECUTOR DE INVALIDACAO RETROATIVA DE LICOES            ")
    print("=================================================================")
    print(f"- Total de modulos IR auditados: {len(rep['clean_modules']) + len(rep['dirty_modules'])}")
    print(f"- Modulos LIMPOS (Em conformidade): {len(rep['clean_modules'])}")
    print(f"- Modulos DIRTY (Exigem revalidacao): {len(rep['dirty_modules'])}")
    print("-----------------------------------------------------------------")

    if rep["dirty_modules"]:
        print("\n[ALERTA DE REGRESSAO RETROATIVA] Modulos que falharam na nova politica:")
        for item in rep["dirty_modules"]:
            print(f"  * {item['path']}:")
            for err in item["errors"][:3]:
                print(f"      - {err}")
        sys.exit(1)
    else:
        print("[SUCESSO] Todos os modulos existentes permanecem validos sob as politicas atuais.")
        sys.exit(0)
