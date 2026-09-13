"""
TeachYourself Pipeline & Zero-Trust State Machine Package
Gerenciamento determinístico de estados de autoria e portões de publicação fail-closed.
"""

from .authoring_state_machine import AuthoringStateMachine, AuthoringState
from .release_gate import evaluate_release_gate, generate_release_manifest
from .retroactive_invalidator import run_retroactive_invalidation

__all__ = [
    "AuthoringStateMachine",
    "AuthoringState",
    "evaluate_release_gate",
    "generate_release_manifest",
    "run_retroactive_invalidation"
]
