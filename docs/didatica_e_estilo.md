# Diretrizes de Didática e Estilo de Engenharia: TeachYourself

Este documento estabelece os critérios permanentes de redação técnica e design instrucional do TeachYourself. Ele orienta autores e revisores a construir explicações que sejam imediatamente compreensíveis para iniciantes inteligentes e tecnicamente rigorosas para engenheiros de sistemas.

---

## 1. Voz e Tom de Escrita

* **A Voz do Autor:** Escreva como um especialista paciente explicando a um iniciante inteligente. Não presuma vocabulário técnico prévio, mas nunca subestime a capacidade de raciocínio lógico do leitor.
* **Sobriedade Técnica vs. Dramatização:** Remova exageros retóricos que distorçam mecanismos ou julguem alternativas de projeto sem justificativa (evite expressões como "desastre de projeto", "armadilha fatal", "colisão de frente" ou "abismo aterrador"). Trate alternativas como hipóteses naturais de engenharia e explique por que outra solução se mostrou superior.
* **Curiosidade e Ritmo Natural:** Preserve a expressividade, o entusiasmo genuíno pela ciência e a variação de ritmo. Evite fórmulas repetitivas onde cada parágrafo segue o mesmo molde artificial.

---

## 2. Precisão Técnica Estrita

* **Distinguir Modelo de Implementação:** Deixe claro quando uma explicação descreve um modelo didático simplificado e quando descreve circuitos reais de produção da indústria.
* **Declarar Condições de Validade:** Condições indispensáveis para que uma afirmação seja verdadeira devem permanecer no texto principal, nunca escondidas em notas de rodapé.
* **Rigor Semântico em Conceitos Centrais:** Em Complemento de Dois, por exemplo, o bit mais significativo faz parte integrante do próprio valor (possui peso posicional negativo, $-2^{w-1}$), e não é um rótulo de sinal colado a posteriori. A ausência de transporte final não deve ser associada implicitamente a resultado negativo.
* **Delimitação de Afirmações de Custo:** Afirmações sobre transistores, latência ou ciclos devem explicitar o escopo exato do circuito comparado.

---

## 3. Caixa de Ferramentas Didáticas

As ferramentas abaixo são recursos de escrita, e não um checklist mecânico obrigatório para cada parágrafo:

1. **Ponto de Partida Concreto:** Comece por um problema real de engenharia, uma observação prática ou uma pergunta investigativa para demonstrar a necessidade do conceito antes de defini-lo formalmente.
2. **Termo Acompanhado de Função:** Apresente todo termo técnico novo acompanhado de seu significado e papel no mecanismo, evitando jargões abstratos no vácuo.
3. **Exemplo Condutor e Teste de Limites:** Acompanhe um exemplo pequeno e consistente ao longo da explicação (o que entrou, o que aconteceu, o que saiu e por que faz sentido). Ao final, aplique uma variação deliberada com função didática clara (ex: resultado zero, resultado negativo ou transbordamento) para consolidar o entendimento.
4. **Fórmula Após o Significado:** Introduza equações matemáticas como o resumo formal de observações que o leitor já fez. Explique o significado físico e intuitivo de cada termo e coeficiente da fórmula.
5. **As Três Camadas Estruturais:**
   * *Estrada Principal:* O caminho explicativo contínuo, autossuficiente e livre de interrupções defensivas.
   * *Aprofundamento:* Provas algébricas, variantes de alta performance e detalhes de fabricação em blocos dedicados.
   * *Limites do Modelo:* Demarcação clara de onde a simplificação pedagógica termina e onde o hardware real se diferencia.
6. **Analogias com Mapeamento e Limites Claros:** Explicite o que corresponde ao quê no circuito real e aponte o ponto exato onde a analogia deixa de ser válida.
7. **Verificação Ativa por Previsão:** Convide o leitor a prever o impacto de pequenas alterações no mecanismo antes de revelar o resultado.

---

## 4. Exemplos de Aplicação (Antes e Depois)

| Contexto | Antes (Dramatizado / Rígido) | Depois (Didático, Sereno e Preciso) |
| :--- | :--- | :--- |
| **Somador no Bit 0** | *"Fazer isso seria um desastre de projeto. Os arquitetos de processadores colocam um Somador Completo também no Bit 0."* | *"Se colocássemos um meio-somador no Bit 0 para economizar portas lógicas, esse estágio não teria como receber um transporte de fora. Ao utilizar um Somador Completo também na primeira coluna, os projetistas deixam uma entrada exposta: o pino inicial $C_0$, que se torna a chave para realizar subtrações."* |
| **Custo de Hardware na ALU** | *"A CPU calcula $A - B$ sem custo de transistores adicionais nem ciclos extras."* | *"Na implementação didática apresentada, portas XOR controlam a inversão de B, e o mesmo sinal de controle fornece o carry inicial $C_0=1$. O circuito reaproveita o somador existente em vez de construir uma unidade subtratora separada."* |
| **Apresentação de Carry-In** | *"O somador completo possui três entradas booleanas: A, B e Cin."* | *"Quando somamos uma coluna no papel, às vezes precisamos incluir o 'vai-um' que veio da coluna anterior. No circuito, cada posição recebe dois bits para somar e pode receber essa terceira entrada, chamada de carry-in ($C_{in}$)."* |
| **Fórmula da Soma Binária** | *"$A + B + C_{in} = S + 2C_{out}$"* | *"Se chegam três bits iguais a 1, a soma total é 3 (em binário, `11`): fica 1 na posição atual e vai 1 para a próxima coluna. Em fórmula: $A + B + C_{in} = Sum + 2 \times C_{out}$. O fator 2 aparece porque o transporte avança para a próxima casa da esquerda, que na base dois vale o dobro da atual."* |

---

## 5. Protocolo de Auditoria do Iniciante Inteligente

Ao revisar qualquer seção do curso, faça três perguntas de validação:

1. **O leitor consegue explicar o mecanismo com as próprias palavras?**
2. **O leitor consegue resolver uma pequena variação do exemplo sem copiar regras mecanicamente?**
3. **Qual foi o primeiro ponto em que o leitor precisou adivinhar uma informação?** (Se houver adivinhação, um passo invisível foi omitido e o raciocínio deve ser explicitado).
