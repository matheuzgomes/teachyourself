"""
Pacote de Compressao Semantica do TeachYourself (Semantic Compression Pass).
Axioma: "Compress without reducing the learner model."
Implementa os Gates C1 a C10, Sentence Utility Score e eliminacao de redundancias.
"""

from .analyze_sentences import analyze_sentences, calculate_utility_score, segment_into_sentences
from .validate_compression import validate_compression_report

__all__ = [
    "analyze_sentences",
    "calculate_utility_score",
    "segment_into_sentences",
    "validate_compression_report"
]
