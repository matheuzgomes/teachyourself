# TEACHYOURSELF POLICY REGISTRY REFERENCE
Policy System Version: 1.0.0

## 1. Matriz de Versoes Ativas

| Politica | Versao | Arquivo |
| :--- | :--- | :--- |
| epistemic | 4.2.0 | `policies/epistemic.yaml` |
| pedagogy | 3.0.0 | `policies/pedagogy.yaml` |
| prose | 2.1.0 | `policies/prose.yaml` |
| anti_slop | 2.0.0 | `policies/anti_slop.yaml` |
| visuals | 2.0.0 | `policies/visuals.yaml` |
| assessment | 2.0.0 | `policies/assessment.yaml` |
| compression | 1.0.0 | `policies/compression.yaml` |

## 2. Invariantes Globais Fail-Closed

1. **Zero Travessoes:** Nenhum caractere unicode de travessao (U+2013, U+2014) e tolerado.
2. **Zero Orphan Claims:** Todo paragrafo referencia claims indexados no Evidence Corpus.
3. **LessonIR Exclusivo:** Agentes so geram representacoes intermediarias compilaveis.
4. **Compressao Semantica:** Nenhuma sentenca com Sentence Utility Score = 0 e permitida.
5. **Gate Unanime:** 100% dos gates do Release Gate devem registrar PASS.
