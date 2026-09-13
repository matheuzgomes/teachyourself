#!/usr/bin/env python3
"""
Motor de Revisao e Execucao do Semantic Compression Pass.
Executa a reducao semantica controlada, transformando sentencas com base em utility score,
eliminando inchaço e gerando o ledger de evidencias de compressao.
Axioma: "Compress without reducing the learner model."
"""

import os
import sys
import json
import argparse
from typing import Dict, Any, List
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from compression.analyze_sentences import analyze_sentences, segment_into_sentences, NOMINALIZATION_PATTERNS
from compression.validate_compression import validate_compression_report


def apply_micro_compression(text: str) -> str:
    """Aplica regras deterministas de micro-compressao lexical e sintatica."""
    out = text
    for pat, rep in NOMINALIZATION_PATTERNS:
        import re
        out = re.sub(pat, rep, out, flags=re.IGNORECASE)
    return out


def run_compression_pass(
    prose: str,
    artifact_id: str = "compressed-artifact",
    required_claims: List[str] = None,
    learning_contract: Dict[str, Any] = None,
    protected_elements: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Executa o Compression Pass completo sobre o texto de entrada.
    Gera as sentencas anotadas, executa as operacoes e produz o relatorio final.
    """
    if required_claims is None:
        required_claims = []
    if learning_contract is None:
        learning_contract = {"learner_should_leave_believing": []}
    if protected_elements is None:
        protected_elements = {
            "technical_terms": [],
            "necessary_qualifiers": [],
            "exceptions": [],
            "worked_examples": []
        }

    raw_analysis = analyze_sentences(
        prose,
        required_claims=required_claims,
        is_worked_example=bool(protected_elements.get("worked_examples"))
    )

    # Bind required claims to sentences that explain mechanisms or causality
    for sent in raw_analysis:
        if sent["role"] in ("MECHANISM", "CLAIM", "CAUSE") and not sent["claims_cited"]:
            sent["claims_cited"] = list(required_claims)

    sentences_ledger = []
    before_words = len(prose.split())
    before_sentences = len(raw_analysis)

    ops_summary = {"deleted": 0, "merged": 0, "rewritten_shorter": 0, "kept": 0}

    # Processamento sequencial com suporte a merge de transicoes
    i = 0
    while i < len(raw_analysis):
        curr = raw_analysis[i]
        rec_op = curr["recommended_operation"]

        # Se contem EMPTY_IMPORTANCE mas tem qualificador protegido, reescreve
        has_empty_imp = "EMPTY_IMPORTANCE" in curr.get("bloat_patterns", [])
        has_qualifier = any(q.lower() in curr["original_text"].lower() for q in protected_elements.get("necessary_qualifiers", []))

        if has_empty_imp and has_qualifier:
            # Micro-reescrita para expurgar o autoelogio mantendo o escopo
            cleaned_text = curr["original_text"]
            for pat in [r"\be\s+(extremamente|muito|altamente)\s+importante\s+para\s+o\s+funcionamento\s+eficiente\s+d[oe]\s+\w+\b",
                        r"\be\s+fundamental\b", r"\bpapel\s+crucial\b"]:
                import re
                cleaned_text = re.sub(pat, "aplica-se", cleaned_text, flags=re.IGNORECASE)
            ops_summary["rewritten_shorter"] += 1
            sentences_ledger.append({
                "id": curr["id"],
                "original_text": curr["original_text"],
                "role": "QUALIFICATION",
                "claims_cited": curr["claims_cited"],
                "sentence_utility": curr["sentence_utility"],
                "operation": "REWRITE_SHORTER",
                "transformed_text": cleaned_text
            })
            i += 1
            continue

        # 1. DELETE
        if rec_op == "DELETE" or (has_empty_imp and not has_qualifier):
            # Protecao: nao deletar se tiver claim obrigatorio exclusivo
            if curr["claims_cited"] and not any(s["claims_cited"] for s in raw_analysis if s != curr and s["role"] in ("MECHANISM", "CLAIM")):
                rec_op = "KEEP"
            else:
                ops_summary["deleted"] += 1
                sentences_ledger.append({
                    "id": curr["id"],
                    "original_text": curr["original_text"],
                    "role": curr["role"],
                    "claims_cited": curr["claims_cited"],
                    "sentence_utility": curr["sentence_utility"],
                    "operation": "DELETE",
                    "transformed_text": ""
                })
                i += 1
                continue

        # 2. MERGE (se for apenas transicao e houver proxima sentenca)
        if rec_op == "MERGE" and (i + 1) < len(raw_analysis):
            nxt = raw_analysis[i + 1]
            merged_text = f"{curr['original_text'].rstrip('.')} e {nxt['original_text'][0].lower() + nxt['original_text'][1:]}"
            ops_summary["merged"] += 1
            combined_claims = list(set(curr["claims_cited"] + nxt["claims_cited"]))
            # Atualiza utilidade combinada
            comb_util = {
                k: max(curr["sentence_utility"][k], nxt["sentence_utility"][k])
                for k in curr["sentence_utility"]
            }
            sentences_ledger.append({
                "id": curr["id"],
                "original_text": f"{curr['original_text']} {nxt['original_text']}",
                "role": nxt["role"] if nxt["role"] != "NONE" else curr["role"],
                "claims_cited": combined_claims,
                "sentence_utility": comb_util,
                "operation": "MERGE",
                "transformed_text": merged_text
            })
            i += 2
            continue

        # 3. REWRITE_SHORTER
        if rec_op == "REWRITE_SHORTER":
            shorter = apply_micro_compression(curr["original_text"])
            ops_summary["rewritten_shorter"] += 1
            sentences_ledger.append({
                "id": curr["id"],
                "original_text": curr["original_text"],
                "role": curr["role"],
                "claims_cited": curr["claims_cited"],
                "sentence_utility": curr["sentence_utility"],
                "operation": "REWRITE_SHORTER",
                "transformed_text": shorter
            })
            i += 1
            continue

        # 4. KEEP padrao
        ops_summary["kept"] += 1
        sentences_ledger.append({
            "id": curr["id"],
            "original_text": curr["original_text"],
            "role": curr["role"],
            "claims_cited": curr["claims_cited"],
            "sentence_utility": curr["sentence_utility"],
            "operation": "KEEP",
            "transformed_text": curr["original_text"]
        })
        i += 1

    # Reconstroi o texto comprimido
    after_chunks = [
        s["transformed_text"] if s.get("transformed_text") else s["original_text"]
        for s in sentences_ledger if s["operation"] != "DELETE"
    ]
    after_text = " ".join(after_chunks)
    after_words = len(after_text.split())
    after_sentences = len(after_chunks)

    reduction_pct = round(((before_words - after_words) / before_words) * 100, 2) if before_words > 0 else 0.0

    report_payload = {
        "artifact_id": artifact_id,
        "compression_input": {
            "prose": prose,
            "required_claims": required_claims,
            "learning_contract": learning_contract,
            "protected_elements": protected_elements
        },
        "sentences": sentences_ledger,
        "compression_report": {
            "before": {
                "words": before_words,
                "sentences": before_sentences
            },
            "after": {
                "words": after_words,
                "sentences": after_sentences
            },
            "reduction_pct": reduction_pct,
            "operations_summary": ops_summary,
            "gates": {
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
            },
            "status": "PASS"
        }
    }

    # Valida imediatamente os gates
    is_valid, errs, gate_results = validate_compression_report(report_payload)
    report_payload["compression_report"]["gates"] = gate_results
    report_payload["compression_report"]["status"] = "PASS" if is_valid else "FAIL"

    return report_payload


def main():
    parser = argparse.ArgumentParser(description="Executa o Semantic Compression Pass em arquivo de texto ou LessonIR.")
    parser.add_argument("--input", type=str, help="Caminho do arquivo de texto ou LessonIR")
    parser.add_argument("--output", type=str, help="Caminho de saida para o relatorio JSON")
    args = parser.parse_args()

    sample_prose = (
        "O forwarding envia diretamente o resultado produzido por uma instrucao para o estagio que precisa dele. "
        "Esse mecanismo e extremamente importante para o funcionamento eficiente do processador no pipeline de 5 estagios. "
        "Isso permite que a instrucao consumidora utilize o valor antes que ele seja gravado no banco de registradores. "
        "Dessa forma, a instrucao seguinte nao precisa necessariamente esperar. "
        "Como resultado, determinados stalls podem ser evitados entre instrucoes ALU. "
        "No entanto, o hazard do tipo load-use ainda exige 1 ciclo de stall porque o dado da memoria so fica pronto no fim do estagio MEM."
    )

    req_claims = ["CLAIM-FWD-001"]
    contract = {
        "learner_should_leave_believing": [
            "forwarding elimina stalls entre instrucoes ALU",
            "load-use exige stall"
        ]
    }
    protected = {
        "technical_terms": ["forwarding", "stall", "pipeline"],
        "necessary_qualifiers": ["pipeline de 5 estagios"],
        "exceptions": ["load-use ainda exige 1 ciclo de stall"],
        "worked_examples": []
    }

    report = run_compression_pass(
        sample_prose,
        artifact_id="03-pipelining-forwarding",
        required_claims=req_claims,
        learning_contract=contract,
        protected_elements=protected
    )

    rep = report["compression_report"]
    print("=================================================================")
    print("             RELATORIO DO SEMANTIC COMPRESSION PASS              ")
    print("=================================================================")
    print(f"Artefato: {report['artifact_id']}")
    print(f"Palavras Antes: {rep['before']['words']} | Depois: {rep['after']['words']} (Reducao: {rep['reduction_pct']}%)")
    print(f"Frases Antes:   {rep['before']['sentences']} | Depois: {rep['after']['sentences']}")
    print(f"Operacoes:      Deletadas={rep['operations_summary']['deleted']}, Fundidas={rep['operations_summary']['merged']}, Mantidas={rep['operations_summary']['kept']}")
    print("-----------------------------------------------------------------")
    print("Status dos Portões C1 a C10:")
    for g, res in rep["gates"].items():
        print(f"  [{res}] {g}")
    print("-----------------------------------------------------------------")
    print(f"Decisao Final do Compression Pass: {rep['status']}")
    print("=================================================================")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"Relatorio salvo em: {args.output}")

    sys.exit(0 if rep["status"] == "PASS" else 1)


if __name__ == "__main__":
    main()
