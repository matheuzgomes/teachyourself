#!/usr/bin/env python3
"""
Executor da Suíte de Fixtures Adversariais do TeachYourself (Adversarial Suite Runner).
Axioma: Toda fixture com defeito intencional DEVE ser rejeitada pelo validador.
Se qualquer fixture defeituosa for aprovada, o validador foi quebrado e o CI falha.
"""

import os
import sys

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from validators.validate_lesson_ir import validate_lesson_ir, load_lesson_ir

FIXTURES_EXPECTATIONS = [
    {
        "file": "tests/adversarial/epistemic/orphan_claim_fixture.yaml",
        "expected_status": "FAIL",
        "expected_error_tag": "ORPHAN_CLAIM",
        "description": "Rejeicao de claim inexistente / orfao"
    },
    {
        "file": "tests/adversarial/pedagogy/prerequisite_leak_fixture.yaml",
        "expected_status": "FAIL",
        "expected_error_tag": "PREREQUISITE_LEAK",
        "description": "Rejeicao de vazamento de termo proibido"
    },
    {
        "file": "tests/adversarial/pedagogy/missing_transfer_probe_fixture.yaml",
        "expected_status": "FAIL",
        "expected_error_tag": "TRANSFER_PROBE",
        "description": "Rejeicao por ausencia de sonda de transferencia"
    },
    {
        "file": "tests/adversarial/prose/theatrical_metaphor_fixture.yaml",
        "expected_status": "FAIL",
        "expected_error_tag": "THEATRICAL_METAPHOR",
        "description": "Rejeicao de metafora teatral de IA"
    },
    {
        "file": "tests/adversarial/prose/insight_words_fixture.yaml",
        "expected_status": "FAIL",
        "expected_error_tag": "INSIGHT_INFLATION",
        "description": "Rejeicao de palavras de insight vazio ('fundamental')"
    },
    {
        "file": "tests/adversarial/compression/lost_claim_fixture.yaml",
        "type": "compression",
        "expected_status": "FAIL",
        "expected_error_tag": "C1_REQUIRED_CLAIM_LOSS",
        "description": "Rejeicao por perda de claim obrigatorio na compressao"
    },
    {
        "file": "tests/adversarial/compression/scope_loss_fixture.yaml",
        "type": "compression",
        "expected_status": "FAIL",
        "expected_error_tag": "C2_SCOPE_LOSS",
        "description": "Rejeicao por perda de escopo de hardware na compressao"
    },
    {
        "file": "tests/adversarial/compression/zero_utility_fixture.yaml",
        "type": "compression",
        "expected_status": "FAIL",
        "expected_error_tag": "C6_ZERO_UTILITY_KEPT",
        "description": "Rejeicao de sentenca com utilidade zero na compressao"
    },
    {
        "file": "examples/lesson_ir_sample.yaml",
        "expected_status": "PASS",
        "expected_error_tag": None,
        "description": "Controle Positivo: LessonIR completo e conforme"
    }
]

def run_adversarial_suite(repo_path=None):
    if repo_path is None:
        repo_path = repo_root

    passed_tests = 0
    total_tests = len(FIXTURES_EXPECTATIONS)
    failed_diagnostics = []

    print("=================================================================")
    print("      SUITE ADVERSARIAL OBRIGATORIA DE REGRESSOES DO CI          ")
    print("=================================================================")

    for item in FIXTURES_EXPECTATIONS:
        frel = item["file"]
        fpath = os.path.join(repo_path, frel)
        exp_status = item["expected_status"]
        exp_tag = item["expected_error_tag"]
        desc = item["description"]
        fixture_type = item.get("type", "lesson_ir")

        if not os.path.exists(fpath):
            failed_diagnostics.append(f"Arquivo de fixture nao encontrado: {frel}")
            continue

        try:
            if fixture_type == "compression":
                from compression.validate_compression import validate_compression_report
                c_data = load_lesson_ir(fpath)
                c_ok, c_errs, _ = validate_compression_report(c_data)
                actual_status = "PASS" if c_ok else "FAIL"
                all_errors = c_errs
            else:
                ir_data = load_lesson_ir(fpath)
                res = validate_lesson_ir(ir_data, repo_path)
                actual_status = res["overall_status"]
                all_errors = res["all_errors"]

            if actual_status != exp_status:
                failed_diagnostics.append(
                    f"Fixture '{frel}': Esperado status '{exp_status}', obtido '{actual_status}'!"
                )
                print(f"  [FAIL] {desc} (Status incorreto: {actual_status})")
                continue

            # Se esperava FAIL, verificar se a tag de erro esperada foi emitida
            if exp_status == "FAIL" and exp_tag:
                all_err_str = " ".join(all_errors).lower()
                if exp_tag.lower() not in all_err_str:
                    failed_diagnostics.append(
                        f"Fixture '{frel}': Rejeitada com sucesso, mas tag esperada '{exp_tag}' nao encontrada nas mensagens: {all_errors}"
                    )
                    print(f"  [FAIL] {desc} (Tag '{exp_tag}' nao detectada)")
                    continue

            passed_tests += 1
            status_tag = "REJEITADO COM SUCESSO" if exp_status == "FAIL" else "APROVADO COM SUCESSO"
            print(f"  [PASS] {desc.ljust(48)} -> {status_tag}")

        except Exception as exc:
            failed_diagnostics.append(f"Fixture '{frel}' gerou excecao nao tratada: {exc}")
            print(f"  [CRASH] {desc}: {exc}")

    print("-----------------------------------------------------------------")
    print(f"Resultado da Suite: {passed_tests}/{total_tests} fixtures aprovadas")
    print("=================================================================")

    return passed_tests == total_tests, failed_diagnostics

if __name__ == "__main__":
    ok, diags = run_adversarial_suite()
    if not ok:
        print("\n[FALHA FATAL NA SUITE ADVERSARIAL]")
        for d in diags:
            print(f"  * {d}")
        sys.exit(1)
    else:
        print("[SUCESSO] Todos os validadores sao resistentes a manipulacao adversarial.")
        sys.exit(0)
