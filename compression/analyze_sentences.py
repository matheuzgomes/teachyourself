#!/usr/bin/env python3
"""
Analisador Estrutural de Sentencas para o Semantic Compression Pass.
Segmenta prosa em sentencas, calcula o Sentence Utility Score,
detecta os 6 padroes de inchaço semantico e recomenda operacoes de edicao.
"""

import re
import sys
from typing import List, Dict, Any, Tuple

# Padroes de importancia vazia (Empty Importance)
EMPTY_IMPORTANCE_PATTERNS = [
    r"\be\s+(extremamente|muito|altamente)\s+importante\b",
    r"\bpapel\s+(fundamental|crucial|essencial|central)\b",
    r"\be\s+(fundamental|crucial|essencial|vital)\s+para\b",
    r"\be\s+de\s+suma\s+importancia\b",
    r"\bmecanismo\s+(revolucionario|magico|fascinante)\b",
]

# Padroes de nominalizacao prolixa (Verbose Nominalization)
NOMINALIZATION_PATTERNS = [
    (r"\ba\s+realizacao\s+da?\s+(\w+)cao\s+e\s+efetuada\s+pel[ao]\b", r"o/a \1 comuta/executa"),
    (r"\befetua\s+a\s+execucao\s+de\b", "executa"),
    (r"\bfaz\s+a\s+transmissao\s+de\b", "transmite"),
    (r"\bprocede\s+com\s+a\s+leitura\s+de\b", "le"),
    (r"\btem\s+a\s+capacidade\s+de\b", "pode"),
    (r"\bcom\s+o\s+objetivo\s+de\s+fazer\b", "para"),
]

# Padroes de resumo desnecessario / conclusao redundante
SUMMARY_PATTERNS = [
    r"\bem\s+suma\b",
    r"\bconcluindo\b",
    r"\bcomo\s+(vimos|pode-se\s+ver|foi\s+dito)\b",
    r"\bdessa\s+forma,\s+portanto\b",
    r"\bresumidamente\b",
]

# Termos causais
CAUSAL_MARKERS = [
    "porque", "portanto", "visto que", "aciona", "bloqueia", "gera",
    "causa", "impede", "propaga", "comuta", "forca", "elimina", "resulta",
    "resolve", "combina", "encadeia", "consolida", "exige", "antecipa", "aguarda"
]

# Termos de mecanismo
MECHANISM_MARKERS = [
    "multiplexador", "alu", "registrador", "clock", "latch", "flip-flop",
    "barramento", "pipeline", "mmu", "sinal", "transistor", "estagio",
    "banco de registradores", "linha de controle", "bit", "byte",
    "porta", "porta logica", "porta and", "porta or", "porta xor",
    "somador", "meio somador", "carry", "transporte", "circuito",
    "cascata", "ripple-carry", "propagacao", "entrada", "saida"
]

# Termos de prevencao de misconception
MISCONCEPTION_MARKERS = [
    "nao implica", "nao confunda", "nao significa necessariamente",
    "diferente de", "ao contrario do que", "apenas quando", "nem sempre"
]

# Termos de escopo
SCOPE_MARKERS = [
    "mips", "risc-v", "x86", "5 estagios", "cinco estagios", "frequencia",
    "ciclo", "latencia", "hardware", "processador", "in-order", "out-of-order"
]


def segment_into_sentences(text: str) -> List[str]:
    """Segmenta o texto em frases individuais com preservacao de pontuacao."""
    if not text or not text.strip():
        return []
    
    # Tratamento basico para evitar quebras em abreviacoes tecnicas como ex., i.e., vs.
    cleaned = text.replace("ex.", "ex_abbr").replace("i.e.", "ie_abbr").replace("vs.", "vs_abbr")
    
    raw_sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])", cleaned)
    results = []
    for s in raw_sentences:
        s_clean = s.replace("ex_abbr", "ex.").replace("ie_abbr", "i.e.").replace("vs_abbr", "vs.").strip()
        if s_clean:
            results.append(s_clean)
    return results


def calculate_utility_score(sentence: str, required_claims: List[str] = None, is_worked_example: bool = False) -> Tuple[Dict[str, int], int]:
    """Calcula o vetor de utilidade de uma sentenca individual."""
    s_lower = sentence.lower()
    
    # 1. Introduces required claim
    intro_claim = 0
    if required_claims:
        for c in required_claims:
            if c.lower() in s_lower:
                intro_claim = 1
                break
                
    # 2. Explains mechanism
    expl_mech = 1 if any(m in s_lower for m in MECHANISM_MARKERS) else 0
    
    # 3. Establishes causality
    est_causal = 1 if any(c in s_lower for c in CAUSAL_MARKERS) else 0
    
    # 4. Qualifies scope
    qual_scope = 1 if any(sc in s_lower for sc in SCOPE_MARKERS) else 0
    
    # 5. Prevents misconception
    prev_misc = 1 if any(mi in s_lower for mi in MISCONCEPTION_MARKERS) else 0
    
    # 6. Provides required example
    prov_ex = 1 if (is_worked_example or re.search(r"\b(add|sub|lw|sw|mov|xor)\s+[a-z0-9]", s_lower)) else 0
    
    # 7. Enables transition
    enab_trans = 1 if re.match(r"^(alem disso|por outro lado|no entanto|entretanto|assim|contudo)\b", s_lower) else 0
    
    utility = {
        "introduces_required_claim": intro_claim,
        "explains_mechanism": expl_mech,
        "establishes_causality": est_causal,
        "qualifies_scope": qual_scope,
        "prevents_misconception": prev_misc,
        "provides_required_example": prov_ex,
        "enables_transition": enab_trans
    }
    
    total = sum(utility.values())
    return utility, total


def detect_bloat_patterns(sentence: str, prev_sentence: str = None) -> List[str]:
    """Identifica padroes de inchaço semantico na sentenca."""
    patterns = []
    s_lower = sentence.lower()
    
    # Empty importance
    for pat in EMPTY_IMPORTANCE_PATTERNS:
        if re.search(pat, s_lower):
            patterns.append("EMPTY_IMPORTANCE")
            break
            
    # Unnecessary summary
    for pat in SUMMARY_PATTERNS:
        if re.search(pat, s_lower):
            patterns.append("UNNECESSARY_SUMMARY")
            break
            
    # Verbose nominalization
    for pat, _ in NOMINALIZATION_PATTERNS:
        if re.search(pat, s_lower):
            patterns.append("VERBOSE_NOMINALIZATION")
            break
            
    # Redundant restatement against previous sentence
    if prev_sentence:
        words_curr = set(re.findall(r"\w{4,}", s_lower))
        words_prev = set(re.findall(r"\w{4,}", prev_sentence.lower()))
        if words_curr and words_prev:
            overlap = len(words_curr.intersection(words_prev)) / max(len(words_curr), len(words_prev))
            if overlap > 0.70 and "EMPTY_IMPORTANCE" not in patterns:
                patterns.append("REDUNDANT_RESTATEMENT")
                
    return patterns


def classify_sentence_role(sentence: str, utility: Dict[str, int], bloat: List[str]) -> str:
    """Classifica o papel formal da sentenca."""
    if "EMPTY_IMPORTANCE" in bloat and sum(utility.values()) <= 1:
        return "NONE"
    if "UNNECESSARY_SUMMARY" in bloat:
        return "SUMMARY"
    if utility.get("introduces_required_claim"):
        return "CLAIM"
    if utility.get("provides_required_example"):
        return "EXAMPLE"
    if utility.get("explains_mechanism"):
        return "MECHANISM"
    if utility.get("establishes_causality"):
        return "CAUSE"
    if utility.get("qualifies_scope"):
        return "QUALIFICATION"
    if utility.get("prevents_misconception"):
        return "PEDAGOGICAL_SUPPORT"
    if utility.get("enables_transition"):
        return "TRANSITION"
    return "NONE"


def analyze_sentences(prose: str, required_claims: List[str] = None, is_worked_example: bool = False) -> List[Dict[str, Any]]:
    """Analisa estruturalmente todas as sentencas de um texto ou paragrafo."""
    raw_sentences = segment_into_sentences(prose)
    annotated = []
    
    prev_s = None
    for idx, s in enumerate(raw_sentences):
        sid = f"S{idx+1:02d}"
        utility, total_score = calculate_utility_score(s, required_claims, is_worked_example)
        bloat = detect_bloat_patterns(s, prev_s)
        role = classify_sentence_role(s, utility, bloat)
        
        # Determinar recomendacao inicial de operacao
        if total_score == 0 or role == "NONE":
            op = "DELETE"
        elif total_score == 1 and utility.get("enables_transition") == 1:
            op = "MERGE"
        elif "VERBOSE_NOMINALIZATION" in bloat:
            op = "REWRITE_SHORTER"
        else:
            op = "KEEP"
            
        annotated.append({
            "id": sid,
            "original_text": s,
            "role": role,
            "claims_cited": [c for c in (required_claims or []) if c.lower() in s.lower()],
            "sentence_utility": utility,
            "total_utility_score": total_score,
            "bloat_patterns": bloat,
            "recommended_operation": op
        })
        prev_s = s
        
    return annotated


if __name__ == "__main__":
    sample = (
        "O forwarding envia diretamente o resultado de uma instrucao para o estagio consumidor. "
        "Esse mecanismo e extremamente importante para o funcionamento eficiente do pipeline. "
        "Dessa forma, o registrador nao precisa necessariamente ser escrito antes da leitura. "
        "Portanto, quando a saida esta disponivel ela e encaminhada."
    )
    res = analyze_sentences(sample, required_claims=["CLAIM-FWD-001"])
    print(f"Total de sentencas analisadas: {len(res)}")
    for item in res:
        print(f"[{item['id']}] ({item['role']}) Score={item['total_utility_score']} Op={item['recommended_operation']}")
        print(f"     Texto: '{item['original_text']}'")
        if item['bloat_patterns']:
            print(f"     Bloat: {item['bloat_patterns']}")
