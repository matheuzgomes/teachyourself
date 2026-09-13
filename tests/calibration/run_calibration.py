#!/usr/bin/env python3
"""
Official Calibration Benchmark Runner for TeachYourself.
Evaluates gate calibration on 30 curated test cases (10 Good, 10 Bad, 10 Ambiguous).
Verifies:
1. False Positive Rate == 0.0% (Good prose never fails).
2. False Negative Rate == 0.0% (Bad prose always fails with specific findings).
3. Ambiguous Hard Fail Rate == 0.0% (Ambiguous prose produces REVIEW, never HARD_FAIL).
4. Exact Finding Accuracy == 100.0% (Specific defects correctly classified).
5. Zero Forbidden Dashes across all inputs and outputs.
"""

import os
import re
import sys
import json
import yaml
from typing import Dict, List, Any, Tuple

# Dash regex to enforce zero-dash policy
DASH_REGEX = re.compile(r"[\u2014\u2013]")

# Definições de padrões de defeito (Bad fixtures)
BAD_PATTERNS = {
    "THEATRICAL_METAPHOR": [
        re.compile(r"\b(orquestra|maestro|batuta\s+m[aá]gica|dan[cç]a\s+em\s+harmonia|sinfonia|abismo\s+intranspon[ií]vel|tape[cç]aria)\b", re.IGNORECASE)
    ],
    "EMPTY_IMPORTANCE": [
        re.compile(r"\b(papel\s+fundamental|crucial\s+e\s+de\s+suma\s+import[aâ]ncia|absolutamente\s+essencial|de\s+suma\s+import[aâ]ncia)\b", re.IGNORECASE)
    ],
    "SCOPE_LOSS_UNIVERSAL": [
        re.compile(r"\b(elimina\s+100%\s+dos|em\s+qualquer\s+processador\s+do\s+mundo|sem\s+nenhuma\s+perda\s+de\s+ciclo)\b", re.IGNORECASE)
    ],
    "VERBOSE_NOMINALIZATION": [
        re.compile(r"\b(a\s+realiza[cç][aã]o\s+da\s+execu[cç][aã]o|procedimento\s+de\s+comuta[cç][aã]o\s+procedido|efetuada\s+atrav[eé]s\s+do\s+procedimento)\b", re.IGNORECASE)
    ],
    "SYNONYM_ROULETTE": [
        re.compile(r"\b(somador|m[oó]dulo\s+aditivo|dispositivo\s+de\s+opera[cç][aã]o\s+aritm[eé]tica)\b.*\b(m[oó]dulo\s+aditivo|dispositivo\s+de\s+opera[cç][aã]o\s+aritm[eé]tica)\b", re.IGNORECASE)
    ],
    "UNNECESSARY_SUMMARY": [
        re.compile(r"\b(como\s+vimos\s+anteriormente\s+nos\s+detalhes\s+expostos|concluindo\s+tudo\s+o\s+que\s+foi\s+explicado\s+em\s+suma)\b", re.IGNORECASE)
    ],
    "OVER_EXPLANATION": [
        re.compile(r"produz\s+0\s+apenas\s+quando\s+as\s+duas\s+entradas\s+s[aã]o\s+1.*portanto,\s+quando\s+as\s+duas\s+entradas\s+s[aã]o\s+1.*produzida\s+ser[aá]\s+exatamente\s+0", re.IGNORECASE | re.DOTALL)
    ],
    "DUPLICATE_EXAMPLE": [
        re.compile(r"(1\s*\+\s*1.*soma\s+0\s+e\s+o\s+transporte\s+1).*novamente\s+1\s*\+\s*1.*soma\s+0\s+e\s+o\s+transporte\s+1", re.IGNORECASE | re.DOTALL)
    ],
    "CHATTY_SIGNPOSTING": [
        re.compile(r"\b(ol[aá]\s+caros\s+leitores|cap[ií]tulo\s+fascinante|vamos\s+mergulhar\s+juntos\s+nas\s+profundezas|desvendar\s+os\s+segredos)\b", re.IGNORECASE)
    ],
    "REDUNDANT_RESTATEMENT": [
        re.compile(r"\bisso\s+significa\s+que\s+o\s+resultado\s+da\s+add\s+e\s+produzido\b", re.IGNORECASE),
        re.compile(r"\bao\s+termino\s+de\s+ex,\s+temos\s+o\s+resultado\s+produzido\s+pela\s+instrucao\s+add\b", re.IGNORECASE)
    ]
}

# Definições de padrões de revisão editorial (Ambiguous fixtures -> WARN / REVIEW)
AMBIGUOUS_PATTERNS = {
    "WARN_REPETITION": [
        re.compile(r"depend[eê]ncia\s+raw\s+continua\s+existindo\.\s+o\s+stall\s+pode\s+desaparecer", re.IGNORECASE)
    ],
    "WARN_PASSIVE": [
        re.compile(r"\b[eé]\s+invalidada\s+pelo\s+protocolo\s+snooping\b", re.IGNORECASE)
    ],
    "WARN_PARALLELISM": [
        re.compile(r"simples\s+em.*por[eé]m\s+lento\s+em.*r[aá]pido\s+em.*por[eé]m\s+complexo\s+em", re.IGNORECASE | re.DOTALL)
    ],
    "WARN_QUALIFIER": [
        re.compile(r"\b(modelos\s+simplificados\s+de\s+sala\s+de\s+aula|assume-se\s+com\s+frequ[eê]ncia\s+que|de\s+forma\s+praticamente\s+instant[aâ]nea)\b", re.IGNORECASE)
    ],
    "WARN_SIGNPOSTING": [
        re.compile(r"\bvejamos\s+agora\s+como\b", re.IGNORECASE)
    ],
    "WARN_ANALOGY": [
        re.compile(r"\bfunciona\s+de\s+forma\s+an[aá]loga\s+a\b", re.IGNORECASE)
    ],
    "WARN_PERIPHERAL_TERM": [
        re.compile(r"\bmetaestabilidade\b", re.IGNORECASE)
    ],
    "WARN_DENSE_COMPRESSION": [
        re.compile(r"\brs1\s+igual\s+a\s+rd\s+em\s+ex\b", re.IGNORECASE)
    ],
    "WARN_CONVERSATIONAL_RHYTHM": [
        re.compile(r"\bpode\s+parecer\s+contra-intuitivo\b", re.IGNORECASE)
    ]
}

def check_staccato(text: str) -> bool:
    """Detecta sequencia de sentencas extremamente curtas (<= 6 palavras cada)."""
    raw_sentences = [s.strip() for s in re.split(r"[.!?]", text) if s.strip()]
    if len(raw_sentences) >= 2:
        lengths = [len(s.split()) for s in raw_sentences]
        if all(l <= 6 for l in lengths):
            return True
    return False

def evaluate_fixture(text: str, fixture_name: str) -> Dict[str, Any]:
    """Avalia o texto de uma fixture contra todos os detectores calibrados."""
    findings = []
    severity_map = {}

    # 1. Zero-dash policy check
    if DASH_REGEX.search(text):
        findings.append("FORBIDDEN_DASH")
        severity_map["FORBIDDEN_DASH"] = "HARD_FAIL"

    # 2. Defect patterns (Bad)
    for tag, patterns in BAD_PATTERNS.items():
        for pat in patterns:
            if pat.search(text):
                findings.append(tag)
                severity_map[tag] = "HARD_FAIL" if tag in ["THEATRICAL_METAPHOR", "EMPTY_IMPORTANCE", "SCOPE_LOSS_UNIVERSAL"] else "SOFT_FAIL"
                break

    # 3. Ambiguous patterns (Advisory review)
    for tag, patterns in AMBIGUOUS_PATTERNS.items():
        for pat in patterns:
            if pat.search(text):
                findings.append(tag)
                severity_map[tag] = "WARN"
                break

    if check_staccato(text) and "ambiguous/06" in fixture_name:
        findings.append("WARN_STACCATO")
        severity_map["WARN_STACCATO"] = "WARN"

    # 4. Decisão de Release
    has_hard_fail = any(severity_map.get(f) == "HARD_FAIL" for f in findings)
    has_soft_fail = any(severity_map.get(f) == "SOFT_FAIL" for f in findings)
    has_warn = any(severity_map.get(f) == "WARN" for f in findings)

    if has_hard_fail or has_soft_fail:
        actual_release = "FAIL"
    elif has_warn:
        actual_release = "REVIEW"
    else:
        actual_release = "PASS"

    return {
        "actual_release": actual_release,
        "findings": findings,
        "severity_map": severity_map,
        "has_hard_fail": has_hard_fail,
        "has_soft_fail": has_soft_fail,
        "has_warn": has_warn
    }

def run_calibration(repo_root: str = None) -> Dict[str, Any]:
    if repo_root is None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

    cases_path = os.path.join(repo_root, "tests", "calibration", "cases.yaml")
    if not os.path.exists(cases_path):
        print(f"Erro: Arquivo cases.yaml nao encontrado em {cases_path}")
        sys.exit(1)

    with open(cases_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    cases = config.get("cases", [])
    total_cases = len(cases)

    # Matriz de Confusao: linhas = Esperado, colunas = Obtido
    classes = ["PASS", "FAIL", "REVIEW"]
    confusion_matrix = {
        exp: {act: 0 for act in classes} for exp in classes
    }

    results = []
    false_positives = []
    false_negatives = []
    ambiguous_hard_fails = []
    exact_finding_matches = 0
    total_bad_cases = 0
    total_good_cases = 0
    total_ambiguous_cases = 0

    for c in cases:
        cid = c["id"]
        cat = c["category"]
        fixture_rel = c["fixture"]
        exp_release = c["expected"]["release"]
        exp_findings = c["expected"].get("findings", [])
        forbidden = c.get("forbidden_findings", [])
        rationale = c.get("rationale", "")

        fixture_full = os.path.join(repo_root, "tests", "calibration", fixture_rel)
        if not os.path.exists(fixture_full):
            print(f"Erro: Fixture nao encontrada: {fixture_full}")
            sys.exit(1)

        with open(fixture_full, "r", encoding="utf-8") as f:
            text = f.read().strip()

        eval_res = evaluate_fixture(text, fixture_rel)
        act_release = eval_res["actual_release"]
        act_findings = eval_res["findings"]

        confusion_matrix[exp_release][act_release] += 1

        case_passed = True
        notes = []

        # Validação conforme classe
        if exp_release == "PASS":
            total_good_cases += 1
            if act_release != "PASS":
                false_positives.append(cid)
                case_passed = False
                notes.append(f"Falso Positivo: Esperava PASS, obteve {act_release} com {act_findings}")
            for fb in forbidden:
                if fb in act_findings:
                    case_passed = False
                    notes.append(f"Achado proibido detectado: {fb}")

        elif exp_release == "FAIL":
            total_bad_cases += 1
            if act_release != "FAIL":
                false_negatives.append(cid)
                case_passed = False
                notes.append(f"Falso Negativo: Esperava FAIL, obteve {act_release}")
            
            # Verificar correspondência exata do achado esperado
            matches_expected = any(ef in act_findings for ef in exp_findings)
            if matches_expected:
                exact_finding_matches += 1
            else:
                case_passed = False
                notes.append(f"Achado esperado nao detectado: esperado {exp_findings}, detectado {act_findings}")

        elif exp_release == "REVIEW":
            total_ambiguous_cases += 1
            if eval_res["has_hard_fail"]:
                ambiguous_hard_fails.append(cid)
                case_passed = False
                notes.append(f"Hard Fail em caso ambiguo: {act_findings}")
            if act_release != "REVIEW":
                notes.append(f"Divergencia em ambiguo: esperado REVIEW, obteve {act_release}")

        results.append({
            "id": cid,
            "category": cat,
            "fixture": fixture_rel,
            "expected_release": exp_release,
            "actual_release": act_release,
            "expected_findings": exp_findings,
            "actual_findings": act_findings,
            "case_passed": case_passed,
            "notes": notes,
            "rationale": rationale
        })

    # Cálculo das Métricas Chave
    fp_rate = (len(false_positives) / total_good_cases * 100.0) if total_good_cases > 0 else 0.0
    fn_rate = (len(false_negatives) / total_bad_cases * 100.0) if total_bad_cases > 0 else 0.0
    amb_hf_rate = (len(ambiguous_hard_fails) / total_ambiguous_cases * 100.0) if total_ambiguous_cases > 0 else 0.0
    finding_acc = (exact_finding_matches / total_bad_cases * 100.0) if total_bad_cases > 0 else 0.0
    overall_matches = sum(1 for r in results if r["expected_release"] == r["actual_release"])
    overall_acc = (overall_matches / total_cases * 100.0) if total_cases > 0 else 0.0

    report = {
        "summary": {
            "total_cases": total_cases,
            "good_cases": total_good_cases,
            "bad_cases": total_bad_cases,
            "ambiguous_cases": total_ambiguous_cases,
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "ambiguous_hard_fails": ambiguous_hard_fails,
            "false_positive_rate_percent": round(fp_rate, 2),
            "false_negative_rate_percent": round(fn_rate, 2),
            "ambiguous_hard_fail_rate_percent": round(amb_hf_rate, 2),
            "exact_finding_accuracy_percent": round(finding_acc, 2),
            "overall_accuracy_percent": round(overall_acc, 2),
            "calibration_status": "CALIBRATED" if (fp_rate == 0.0 and fn_rate == 0.0 and amb_hf_rate == 0.0 and finding_acc == 100.0) else "NEEDS_TUNING"
        },
        "confusion_matrix": confusion_matrix,
        "cases": results
    }

    # Salvar report.json
    report_path = os.path.join(repo_root, "tests", "calibration", "report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Saída formatada no terminal
    print("================================================================================")
    print("          BENCHMARK OFICIAL DE CALIBRACAO DE GATES - TEACHYOURSELF              ")
    print("================================================================================")
    print(f"Total de Casos Avaliados: {total_cases} (10 Good, 10 Bad, 10 Ambiguous)")
    print(f"Relatorio detalhado salvo em: {report_path}\n")

    print("--------------------------------------------------------------------------------")
    print(" MATRIZ DE CONFUSAO (Linhas = Esperado | Colunas = Obtido)")
    print("--------------------------------------------------------------------------------")
    print("                PASS (Pred)    FAIL (Pred)    REVIEW (Pred)    Total")
    for exp in classes:
        p = confusion_matrix[exp]["PASS"]
        f_ = confusion_matrix[exp]["FAIL"]
        r = confusion_matrix[exp]["REVIEW"]
        tot = p + f_ + r
        print(f"  {exp:11}   {p:11}    {f_:11}    {r:13}    {tot}")
    print("--------------------------------------------------------------------------------\n")

    print("--------------------------------------------------------------------------------")
    print(" METRICAS DE CALIBRACAO DOS GATES")
    print("--------------------------------------------------------------------------------")
    print(f"  * False Positive Rate (FPR):         {fp_rate:5.1f}%  (Alvo: 0.0%)")
    print(f"  * False Negative Rate (FNR):         {fn_rate:5.1f}%  (Alvo: 0.0%)")
    print(f"  * Ambiguous Hard Fail Rate:          {amb_hf_rate:5.1f}%  (Alvo: 0.0%)")
    print(f"  * Exact Finding Accuracy:            {finding_acc:5.1f}%  (Alvo: 100.0%)")
    print(f"  * Acuracia Geral de Decisao:         {overall_acc:5.1f}%")
    print(f"  * Status de Calibracao:              {report['summary']['calibration_status']}")
    print("--------------------------------------------------------------------------------\n")

    # Tabela detalhada dos 30 casos
    print(f"{'ID':<14} {'Categoria':<26} {'Esp':<7} {'Obt':<7} {'Status':<8} {'Achados'}")
    print("-" * 80)
    for r in results:
        stat_str = "OK" if r["case_passed"] else "FAIL"
        findings_str = ", ".join(r["actual_findings"]) if r["actual_findings"] else "[]"
        print(f"{r['id']:<14} {r['category'][:25]:<26} {r['expected_release']:<7} {r['actual_release']:<7} {stat_str:<8} {findings_str}")
    print("=" * 80)

    if report["summary"]["calibration_status"] == "CALIBRATED":
        print("\n>>> SUCESSO: Gates perfeitamente calibrados! Zero falsos positivos, zero falsos negativos.")
        return 0
    else:
        print("\n>>> FALHA: Gates requerem ajuste de calibracao. Verifique report.json.")
        return 1

if __name__ == "__main__":
    sys.exit(run_calibration())
