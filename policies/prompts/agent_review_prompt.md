# AGENT AUDIT & REVIEW PROMPT: ZERO-TRUST COMPLIANCE CHECKER
Version: 1.0.0

Execute a verificacao rigorosa contra um artefato LessonIR candidato:

1. Epistemico:
   - Verifique se todos os claims citados existem em `knowledge/`.
   - Rejeite qualquer metrica sem escopo de microarquitetura.
2. Pedagogia:
   - Inspecione se ha vazamento de termos em `prohibited_leaks`.
   - Confirme se os 4 estagios da escada de explicacao estao preenchidos.
3. Prosa:
   - Verifique se ha qualquer travessao tipografico unicode (bloqueio fatal).
   - Identifique metaforas antropomorficas ou palavras de autoelogio.
4. Visual:
   - Confirme se o `visual_model_ref` existe no catalogo `knowledge/visuals/`.
5. Avaliacao e Inspecao:
   - Rejeite sumariamente qualquer artefato que contenha questionarios, perguntas de multipla escolha ou opcoes (A, B, C).
   - Confirme se ha rastreamento de sinais e estados ou simulador manipulavel.
6. Compressao Semantica:
   - Confirme que nao ha sentencas com Sentence Utility Score = 0 ou redundancias obvias retidas.

Se qualquer item falhar, emita veredito REJECTED com a lista exata de infracoes.
