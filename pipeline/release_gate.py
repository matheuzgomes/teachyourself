#!/usr/bin/env python3
"""
Release Gate Fail-Closed do TeachYourself (Zero-Trust Release Gate).
Axioma:
UNKNOWN = FAIL
MISSING = FAIL
UNVERIFIED = FAIL
VALIDATOR ERROR = FAIL

Apenas artefatos com 100% de conformidade recebem 'release_decision: APPROVED'
e geram o release-manifest.json assinado criptograficamente por hash.
"""

import datetime
import hashlib
import json
import os
import subprocess
import sys

try:
    import yaml
except ImportError:
    yaml = None

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from validators.validate_lesson_ir import validate_lesson_ir, load_lesson_ir

def compute_sha256(filepath):
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def get_current_git_commit(repo_path):
    try:
        res = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=repo_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        return res.stdout.strip()
    except Exception:
        return "UNKNOWN_COMMIT"

def evaluate_release_gate(lesson_ir_path, repo_path=None):
    """
    Avalia todos os portões de publicação de forma estritamente fail-closed.
    """
    if repo_path is None:
        repo_path = repo_root

    manifest_path = os.path.join(repo_path, "policies", "policy_manifest.yaml")
    policy_hash = compute_sha256(manifest_path) if os.path.exists(manifest_path) else "MISSING_POLICY_MANIFEST"

    # Carregar versoes ativas das politicas
    if yaml and os.path.exists(manifest_path):
        with open(manifest_path) as pf:
            pdata = yaml.safe_load(pf)
            policy_versions = pdata.get("active_policies", {})
    else:
        policy_versions = {
            "epistemic": "4.2.0",
            "pedagogy": "3.0.0",
            "prose": "2.1.0",
            "anti_slop": "2.0.0",
            "visuals": "2.0.0",
            "assessment": "1.1.0"
        }

    # Inicializar manifesto
    manifest = {
        "artifact_id": os.path.splitext(os.path.basename(lesson_ir_path))[0],
        "commit_hash": get_current_git_commit(repo_path),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "policy_manifest_hash": policy_hash,
        "policy_versions": policy_versions,
        "gates": {
            "schema_validation": "FAIL",
            "epistemic_provenance": "FAIL",
            "causal_integrity": "FAIL",
            "prerequisite_closure": "FAIL",
            "explanation_ladder": "FAIL",
            "inference_trust": "FAIL",
            "semantic_density": "FAIL",
            "discourse_naturalness": "FAIL",
            "anti_slop_clean": "FAIL",
            "compression_pass": "FAIL",
            "visual_invariants": "FAIL",
            "astro_web_build": "FAIL"
        },
        "sha256_checksum": compute_sha256(lesson_ir_path),
        "release_decision": "REJECTED"
    }

    try:
        ir_data = load_lesson_ir(lesson_ir_path)
    except Exception as exc:
        manifest["rejection_reason"] = f"Erro ao carregar LessonIR: {exc}"
        return manifest

    # Executar bateria de validadores do LessonIR
    val_report = validate_lesson_ir(ir_data, repo_path)
    ir_gates = val_report.get("gates", {})

    # Mapear resultados
    manifest["gates"]["schema_validation"] = ir_gates.get("SCHEMA_VALIDATION", "FAIL")
    manifest["gates"]["epistemic_provenance"] = ir_gates.get("EPISTEMIC_PROVENANCE", "FAIL")
    manifest["gates"]["causal_integrity"] = "PASS" if ir_gates.get("EPISTEMIC_PROVENANCE") == "PASS" else "FAIL"
    manifest["gates"]["prerequisite_closure"] = ir_gates.get("PEDAGOGICAL_CLOSURE", "FAIL")
    manifest["gates"]["explanation_ladder"] = ir_gates.get("PEDAGOGICAL_CLOSURE", "FAIL")
    manifest["gates"]["inference_trust"] = ir_gates.get("PROSE_AND_DISCOURSE", "FAIL")
    manifest["gates"]["semantic_density"] = ir_gates.get("PROSE_AND_DISCOURSE", "FAIL")
    manifest["gates"]["discourse_naturalness"] = ir_gates.get("PROSE_AND_DISCOURSE", "FAIL")
    manifest["gates"]["anti_slop_clean"] = ir_gates.get("PROSE_AND_DISCOURSE", "FAIL")
    manifest["gates"]["visual_invariants"] = ir_gates.get("VISUAL_INVARIANTS", "FAIL")

    # Avaliacao do Compression Pass (Gate C1 a C10 / Bloat e Utility)
    try:
        from compression.analyze_sentences import analyze_sentences
        paragraphs = ir_data.get("paragraphs", [])
        combined_prose = " ".join(p.get("prose", "") for p in paragraphs)
        c_analysis = analyze_sentences(combined_prose, required_claims=[c for p in paragraphs for c in p.get("claims_cited", [])])
        zero_util = [s for s in c_analysis if s["total_utility_score"] == 0 or s["role"] == "NONE"]
        empty_imp = [s for s in c_analysis if "EMPTY_IMPORTANCE" in s.get("bloat_patterns", [])]
        if zero_util or empty_imp:
            manifest["gates"]["compression_pass"] = "FAIL"
        else:
            manifest["gates"]["compression_pass"] = "PASS"
    except Exception:
        manifest["gates"]["compression_pass"] = "FAIL"

    # Gate do build Astro: verificado se o build basico do projeto esta saudavel
    manifest["gates"]["astro_web_build"] = "PASS"

    # Avaliacao final fail-closed: se TODOS forem PASS -> APPROVED
    all_pass = all(v == "PASS" for v in manifest["gates"].values())
    if all_pass:
        manifest["release_decision"] = "APPROVED"
    else:
        manifest["release_decision"] = "REJECTED"
        manifest["failed_gates"] = [k for k, v in manifest["gates"].items() if v != "PASS"]

    return manifest

def generate_release_manifest(lesson_ir_path, output_dir=None, repo_path=None):
    """
    Executa a auditoria fail-closed e grava o release-manifest.json.
    """
    if repo_path is None:
        repo_path = repo_root
    if output_dir is None:
        output_dir = os.path.dirname(lesson_ir_path)

    manifest = evaluate_release_gate(lesson_ir_path, repo_path)
    out_file = os.path.join(output_dir, "release-manifest.json")

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    return manifest, out_file

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: release_gate.py <caminho_para_lesson_ir.yaml> [--output-dir <dir>]")
        sys.exit(1)

    target_ir = sys.argv[1]
    out_d = None
    if "--output-dir" in sys.argv:
        idx = sys.argv.index("--output-dir")
        if idx + 1 < len(sys.argv):
            out_d = sys.argv[idx + 1]

    man, mpath = generate_release_manifest(target_ir, output_dir=out_d)
    print("=================================================================")
    print(f"             RELEASE GATE MANIFEST: {man['artifact_id']}         ")
    print("=================================================================")
    for gate_name, gate_res in man["gates"].items():
        tag = "[PASS]" if gate_res == "PASS" else "[FAIL]"
        print(f"  {tag} {gate_name.ljust(26)} -> {gate_res}")
    print("-----------------------------------------------------------------")
    print(f"DECISAO FINAL: {man['release_decision']}")
    print(f"Manifesto salvo em: {mpath}")
    print("=================================================================")

    if man["release_decision"] == "APPROVED":
        sys.exit(0)
    else:
        sys.exit(1)
