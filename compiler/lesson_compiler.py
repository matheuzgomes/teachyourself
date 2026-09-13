#!/usr/bin/env python3
"""
Compilador Determinístico de LessonIR para MDX Publicável.
Regra de Ouro: 'Agents may propose. Only the pipeline may approve.'
Nenhum arquivo MDX é gerado se o LessonIR falhar em qualquer validação.
"""

import json
import os
import re
import sys

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from validators.validate_lesson_ir import validate_lesson_ir, load_lesson_ir

DASH_REGEX = re.compile(r"[\u2014\u2013]")

def clean_prose(text):
    """Garante que a prosa compilada não contenha nenhum travessão não-ASCII."""
    return DASH_REGEX.sub(" - ", text)

def compile_lesson_to_mdx(lesson_ir, repo_root=None):
    """
    Compila uma estrutura de dados LessonIR em conteúdo MDX estrito.
    """
    if repo_root is None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    lid = lesson_ir.get("id")
    title = lesson_ir.get("title")
    track = lesson_ir.get("track")
    ladder = lesson_ir.get("explanation_ladder", {})
    active_learning = lesson_ir.get("active_learning", {})
    visual_ref = lesson_ir.get("visual_spec_ref", "")
    paragraphs = lesson_ir.get("paragraphs", [])

    # Coletar todos os claims citados
    claims = []
    for p in paragraphs:
        for c in p.get("claims_cited", []):
            if c not in claims:
                claims.append(c)

    # Identificar componente visual adequado
    comp_map = {
        "VIS-01-SR-LATCH-NOR": "SrLatchInteractive",
        "VIS-02-MOSFET-TRANSISTOR": "circuits/MosfetTransistorCard",
        "VIS-03-CMOS-INVERTER": "circuits/CmosInverterCard",
        "VIS-04-CMOS-NAND": "circuits/CmosNandCard",
        "VIS-05-ARITHMETIC-ADDERS": "circuits/AdderCircuitsCard",
        "VIS-06-EDGE-TRIGGERED-FLIPFLOP": "circuits/MasterSlaveFlipFlopCard",
        "VIS-07-CLOCK-CHRONOGRAM-SETUP": "circuits/ClockChronogramCard",
        "VIS-08-REGISTER-BANK-64BIT": "circuits/RegisterBankCard",
        "VIS-09-E2E-FUNCTION-PLACEMENT": "EndToEndTransferSimulator",
        "VIS-10-ALU-ADDER-SUBTRACTOR": "AluCircuitVisualizer"
    }
    vis_component = comp_map.get(visual_ref, "PipelineSimulator")

    # Construir o documento MDX
    lines = []
    lines.append("---")
    lines.append(f'title: "{title}"')
    lines.append(f'description: "Módulo compilado via LessonIR: {title}"')
    lines.append(f'layout: "../../../layouts/TrackLayout.astro"')
    lines.append(f'track: "{track}"')
    lines.append(f'lesson_id: "{lid}"')
    lines.append(f'claims_cited: {json.dumps(claims)}')
    lines.append("---")
    lines.append("")
    lines.append(f"import VisualSimulator from '../../../components/{vis_component}.tsx';")
    lines.append("")
    lines.append(f"# {title}")
    lines.append("")

    # Seção 1: Entrada Concreta
    ep = ladder.get("entry_point", {})
    lines.append("## 1. Ponto de Entrada Concreto")
    lines.append("")
    if ep.get("code"):
        lines.append("```assembly")
        lines.append(ep["code"].strip())
        lines.append("```")
        lines.append("")
    lines.append(clean_prose(ep.get("description", "")))
    lines.append("")

    # Seção 2: O Problema Mecânico e Restrições
    prob = ladder.get("problem", {})
    lines.append("## 2. A Restricao Fisica e o Problema")
    lines.append("")
    lines.append(f"**Mecanismo do Conflito:** {clean_prose(prob.get('mechanism', ''))}")
    lines.append("")
    lines.append(f"**Impacto Observavel:** {clean_prose(prob.get('impact', ''))}")
    lines.append("")

    # Parágrafos de desenvolvimento inicial
    for p in paragraphs:
        if p.get("role") in ("PROBLEM", "TRACE"):
            lines.append(clean_prose(p.get("prose", "")))
            lines.append("")

    # Seção 3: O Mecanismo Causal
    mech = ladder.get("core_mechanism", {})
    lines.append("## 3. O Mecanismo Causal no Hardware")
    lines.append("")
    lines.append(f"**Circuito Responsavel:** `{mech.get('circuit_or_protocol', '')}`")
    lines.append("")
    for step in mech.get("causal_steps", []):
        lines.append(f"* {clean_prose(step)}")
    lines.append("")

    # Parágrafos de mecanismo e transição
    for p in paragraphs:
        if p.get("role") in ("MECHANISM", "TRANSITION", "INVARIANT"):
            lines.append(clean_prose(p.get("prose", "")))
            lines.append("")

    # Injeção do Simulador Interativo
    lines.append("### Simulacao Reativa de Hardware")
    lines.append("")
    lines.append("<div class=\"my-8 border border-neutral-800 rounded-xl p-4 bg-neutral-900/50\">")
    lines.append("  <VisualSimulator client:visible />")
    lines.append("</div>")
    lines.append("")

    # Rastreamento de Sinais e Estados
    trace_focus = active_learning.get("trace_focus")
    if trace_focus:
        lines.append("### Rastreamento de Sinais e Estados")
        lines.append("")
        lines.append(f"> **Foco de Inspecao:** {clean_prose(trace_focus)}")
        lines.append("")

    # Seção 4: Condições de Contorno e Sonda de Transferência
    bc = ladder.get("boundary_condition", {})
    lines.append("## 4. Condicoes de Contorno e Limites Fisicos")
    lines.append("")
    lines.append(f"**Excecao de Escopo:** {clean_prose(bc.get('exception', ''))}")
    lines.append("")
    lines.append(f"**Fundamentacao Causal:** {clean_prose(bc.get('reason', ''))}")
    lines.append("")

    for p in paragraphs:
        if p.get("role") in ("QUALIFICATION", "EXAMPLE"):
            lines.append(clean_prose(p.get("prose", "")))
            lines.append("")

    # Sonda de Transferência
    tp = active_learning.get("transfer_probe", {})
    lines.append("> [!TIP]")
    lines.append(f"> **Sonda de Transferencia de Modelo Mental:**")
    lines.append(f"> {clean_prose(tp.get('prompt', ''))}")
    lines.append(">")
    lines.append(f"> *Resolucao Causal:* {clean_prose(tp.get('explanation_anchor', ''))}")
    lines.append("")

    # Rodapé com Proveniência Verificada
    lines.append("---")
    lines.append("### Proveniencia Epistemica Verificada")
    lines.append("Todas as afirmacoes tecnicas nesta licao estao mapeadas para claims verificados:")
    for c in claims:
        lines.append(f"* `{c}`")
    lines.append("")

    mdx_output = "\n".join(lines)
    return mdx_output

def compile_lesson_ir(input_path, output_path=None, dry_run=False, repo_root=None):
    """
    Compila o LessonIR em arquivo MDX garantindo passagem 100% pelos validadores.
    """
    if repo_root is None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    ir_data = load_lesson_ir(input_path)

    # 1. Validacao Estrita Zero-Trust (Fail-Closed)
    val_result = validate_lesson_ir(ir_data, repo_root)
    if val_result["overall_status"] != "PASS":
        print(f"[COMPILATION_ABORTED] O LessonIR '{input_path}' foi rejeitado pelo Policy Engine:")
        for err in val_result["all_errors"]:
            print(f"  * {err}")
        return False, val_result

    # 2. Compilar para MDX
    mdx_content = compile_lesson_to_mdx(ir_data, repo_root)

    # 3. Verificacao Final de Higiene Editorial do Conteúdo Gerado
    if DASH_REGEX.search(mdx_content):
        raise ValueError("Falha no compilador: caracteres de travessao proibidos detectados no output!")

    if dry_run:
        print(f"[DRY-RUN] MDX compilado com sucesso ({len(mdx_content)} bytes). Nenhuma gravacao realizada.")
        return True, mdx_content

    if output_path is None:
        track = ir_data.get("track", "01-hardware-and-os")
        lid = ir_data.get("id", "lesson")
        output_path = os.path.join(repo_root, "web", "src", "pages", "tracks", track, f"{lid}.mdx")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as out_f:
        out_f.write(mdx_content)

    print(f"[COMPILED] Licao compilada e salva em: {output_path}")
    return True, output_path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: lesson_compiler.py <input_lesson_ir.yaml> [--output <dest.mdx>] [--dry-run]")
        sys.exit(1)

    in_path = sys.argv[1]
    is_dry = "--dry-run" in sys.argv
    out_target = None
    if "--output" in sys.argv:
        idx = sys.argv.index("--output")
        if idx + 1 < len(sys.argv):
            out_target = sys.argv[idx + 1]

    ok, res = compile_lesson_ir(in_path, output_path=out_target, dry_run=is_dry)
    if not ok:
        sys.exit(1)
    sys.exit(0)
