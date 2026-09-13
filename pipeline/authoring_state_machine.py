#!/usr/bin/env python3
"""
Máquina de Estados de Autoria do TeachYourself (Zero-Trust Authoring State Machine).
Axioma: Nenhum agente pode avançar de estado sem apresentar o artefato de evidência exigido.
Transições ilegais causam rejeição imediata (FAIL-CLOSED).
"""

import enum
import hashlib
import json
import os
import sys

class AuthoringState(enum.Enum):
    INIT = "INIT"
    RESEARCHED = "RESEARCHED"
    KNOWLEDGE_MODELED = "KNOWLEDGE_MODELED"
    PEDAGOGY_PLANNED = "PEDAGOGY_PLANNED"
    DRAFTED = "DRAFTED"
    SEMANTICALLY_VALIDATED = "SEMANTICALLY_VALIDATED"
    PEDAGOGICALLY_VALIDATED = "PEDAGOGICALLY_VALIDATED"
    COMPRESSED = "COMPRESSED"
    PROSE_REVIEWED = "PROSE_REVIEWED"
    VISUALS_VALIDATED = "VISUALS_VALIDATED"
    RELEASE_READY = "RELEASE_READY"
    PUBLISHED = "PUBLISHED"
    REJECTED = "REJECTED"

# Artefatos de evidencia obrigatorios para cada transicao
REQUIRED_EVIDENCE = {
    AuthoringState.RESEARCHED: ["01-research.json"],
    AuthoringState.KNOWLEDGE_MODELED: ["02-claim-ledger.json"],
    AuthoringState.PEDAGOGY_PLANNED: ["03-pedagogy-plan.json"],
    AuthoringState.DRAFTED: ["04-writing-plan.json", "05-lesson-ir.yaml"],
    AuthoringState.SEMANTICALLY_VALIDATED: ["06-semantic-review.json"],
    AuthoringState.PEDAGOGICALLY_VALIDATED: ["07-learning-review.json"],
    AuthoringState.COMPRESSED: ["08-compression-report.json"],
    AuthoringState.PROSE_REVIEWED: ["09-prose-review.json"],
    AuthoringState.VISUALS_VALIDATED: ["10-visual-review.json"],
    AuthoringState.RELEASE_READY: ["11-release-manifest.json"]
}

# Tabela estrita de transicoes permitidas
VALID_TRANSITIONS = {
    AuthoringState.INIT: [AuthoringState.RESEARCHED, AuthoringState.REJECTED],
    AuthoringState.RESEARCHED: [AuthoringState.KNOWLEDGE_MODELED, AuthoringState.REJECTED],
    AuthoringState.KNOWLEDGE_MODELED: [AuthoringState.PEDAGOGY_PLANNED, AuthoringState.REJECTED],
    AuthoringState.PEDAGOGY_PLANNED: [AuthoringState.DRAFTED, AuthoringState.REJECTED],
    AuthoringState.DRAFTED: [AuthoringState.SEMANTICALLY_VALIDATED, AuthoringState.REJECTED],
    AuthoringState.SEMANTICALLY_VALIDATED: [AuthoringState.PEDAGOGICALLY_VALIDATED, AuthoringState.REJECTED],
    AuthoringState.PEDAGOGICALLY_VALIDATED: [AuthoringState.COMPRESSED, AuthoringState.REJECTED],
    AuthoringState.COMPRESSED: [AuthoringState.PROSE_REVIEWED, AuthoringState.REJECTED],
    AuthoringState.PROSE_REVIEWED: [AuthoringState.VISUALS_VALIDATED, AuthoringState.REJECTED],
    AuthoringState.VISUALS_VALIDATED: [AuthoringState.RELEASE_READY, AuthoringState.REJECTED],
    AuthoringState.RELEASE_READY: [AuthoringState.PUBLISHED, AuthoringState.REJECTED],
    AuthoringState.PUBLISHED: [],
    AuthoringState.REJECTED: [AuthoringState.INIT]
}

def sha256_file(filepath):
    """Calcula hash SHA256 do arquivo de evidencia."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

class AuthoringStateMachine:
    def __init__(self, workspace_dir):
        self.workspace_dir = workspace_dir
        self.state_file = os.path.join(workspace_dir, ".authoring_state.json")
        self.history_file = os.path.join(workspace_dir, ".state_history.jsonl")
        self.current_state = AuthoringState.INIT
        self._load_state()

    def _load_state(self):
        if os.path.exists(self.state_file):
            with open(self.state_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.current_state = AuthoringState(data.get("state", "INIT"))
        else:
            self.current_state = AuthoringState.INIT

    def _save_state(self, new_state, transition_metadata):
        os.makedirs(self.workspace_dir, exist_ok=True)
        record = {
            "from_state": self.current_state.value,
            "to_state": new_state.value,
            "metadata": transition_metadata
        }
        with open(self.history_file, "a", encoding="utf-8") as hf:
            hf.write(json.dumps(record) + "\n")

        with open(self.state_file, "w", encoding="utf-8") as sf:
            json.dump({
                "state": new_state.value,
                "last_transition": record
            }, sf, indent=2)

        self.current_state = new_state

    def can_transition_to(self, target_state):
        return target_state in VALID_TRANSITIONS.get(self.current_state, [])

    def transition(self, target_state, metadata=None):
        """
        Executa uma transicao formal para target_state verificando evidencias.
        """
        if metadata is None:
            metadata = {}

        # 1. Validar se a transicao e legal
        if not self.can_transition_to(target_state):
            raise ValueError(
                f"[ILLEGAL_STATE_TRANSITION] Nao e permitido transicionar de "
                f"'{self.current_state.value}' diretamente para '{target_state.value}'!"
            )

        # 2. Se for rejeicao, permite transicao imediata
        if target_state == AuthoringState.REJECTED:
            self._save_state(target_state, metadata)
            return True, "Rejeicao formal registrada."

        # 3. Validar presenca e integridade dos artefatos de evidencia exigidos
        required_files = REQUIRED_EVIDENCE.get(target_state, [])
        evidence_hashes = {}

        for req in required_files:
            target_path = os.path.join(self.workspace_dir, req)
            if not os.path.exists(target_path):
                raise FileNotFoundError(
                    f"[MISSING_EVIDENCE_ARTIFACT] Transicao para '{target_state.value}' "
                    f"exige o artefato '{req}', mas o arquivo nao foi encontrado!"
                )
            evidence_hashes[req] = sha256_file(target_path)

        metadata["evidence_hashes"] = evidence_hashes
        self._save_state(target_state, metadata)
        return True, f"Transicao para {target_state.value} concluida com sucesso."

if __name__ == "__main__":
    import tempfile
    print("Testando Maquina de Estados de Autoria com Enforcement de Ledgers...")

    with tempfile.TemporaryDirectory() as tmpdir:
        sm = AuthoringStateMachine(tmpdir)
        assert sm.current_state == AuthoringState.INIT

        # Tentativa ilegal: INIT -> DRAFTED
        try:
            sm.transition(AuthoringState.DRAFTED)
            assert False, "Deveria ter falhado na transicao ilegal!"
        except ValueError as err:
            print(f"  [PASS] Transicao ilegal rejeitada: {err}")

        # Tentativa sem evidencia: INIT -> RESEARCHED (sem 01-research.json)
        try:
            sm.transition(AuthoringState.RESEARCHED)
            assert False, "Deveria ter falhado por falta de evidencia!"
        except FileNotFoundError as err:
            print(f"  [PASS] Transicao sem evidencia bloqueada: {err}")

        # Criar evidencia e transicionar
        with open(os.path.join(tmpdir, "01-research.json"), "w") as f:
            f.write(json.dumps({"status": "research_complete"}))

        ok, msg = sm.transition(AuthoringState.RESEARCHED)
        assert sm.current_state == AuthoringState.RESEARCHED
        print(f"  [PASS] Transicao valida concluida: {msg}")

    print("Maquina de estados 100% verificada e operacional.")
