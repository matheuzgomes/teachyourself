import type { LearningObject } from "../../types/learning-object";

export const pipelineSteadyStateSpec: LearningObject = {
  id: "pipeline-steady-state",
  renderer: "pipeline",
  mode: "interactive-2d",
  learningGoal: "Compreender como a sobreposicao temporal multiplica a vazao da maquina ate atingir uma instrucao concluida por ciclo a partir do Ciclo 5",
  whyInteractive: "Permite ao estudante avancar os pulsos de clock passo a passo e observar a esteira enchendo ate o regime permanente",
  initialState: "c1-fill",
  controls: {
    play: true,
    pause: true,
    next: true,
    previous: true,
    reset: true,
    speed: true
  },
  accessibilityFallback: {
    description: "Tabela cronologica exibindo 5 instrucoes independentes enchendo os 5 estagios do pipeline ao longo de 7 ciclos de clock.",
    staticTableOrDiagram: `            C1   C2   C3   C4   C5   C6   C7
Instrucao 1  F    D    E    M    W
Instrucao 2       F    D    E    M    W
Instrucao 3            F    D    E    M    W
Instrucao 4                 F    D    E    M    W
Instrucao 5                      F    D    E    M    W`
  },
  states: [
    {
      id: "c1-fill",
      title: "Ciclo 1: Entrada da Primeira Instrucao",
      explanation: "A Instrucao 1 entra no primeiro estagio (Busca / IF). Os demais estagios estao vazios.",
      focus: ["stage-if", "inst-1"],
      show: ["inst-1-if"],
      activeComponents: ["stage-if"],
      metrics: {
        "Instrucoes no Pipeline": 1,
        "Instrucoes Concluidas": 0,
        "Throughput Instantaneo": "0 inst/ciclo"
      }
    },
    {
      id: "c2-fill",
      title: "Ciclo 2: Dois Estagios Ocupados",
      explanation: "A Instrucao 1 avanca para Decodificacao (ID). A Instrucao 2 entra no estagio de Busca (IF).",
      focus: ["stage-id", "stage-if"],
      show: ["inst-1-id", "inst-2-if"],
      activeComponents: ["stage-if", "stage-id"],
      metrics: {
        "Instrucoes no Pipeline": 2,
        "Instrucoes Concluidas": 0,
        "Throughput Instantaneo": "0 inst/ciclo"
      }
    },
    {
      id: "c3-fill",
      title: "Ciclo 3: Tres Instrucoes em Andamento",
      explanation: "Instrucao 1 alcanca Execucao (EX), Instrucao 2 esta em ID e Instrucao 3 entra em IF.",
      focus: ["stage-ex", "stage-id", "stage-if"],
      show: ["inst-1-ex", "inst-2-id", "inst-3-if"],
      activeComponents: ["stage-if", "stage-id", "stage-ex"],
      metrics: {
        "Instrucoes no Pipeline": 3,
        "Instrucoes Concluidas": 0,
        "Throughput Instantaneo": "0 inst/ciclo"
      }
    },
    {
      id: "c4-fill",
      title: "Ciclo 4: Quatro Estagios Ativos",
      explanation: "Instrucao 1 acessa Memoria (MEM), Instrucao 2 esta em EX, Instrucao 3 em ID e Instrucao 4 entra em IF.",
      focus: ["stage-mem", "stage-ex", "stage-id", "stage-if"],
      show: ["inst-1-mem", "inst-2-ex", "inst-3-id", "inst-4-if"],
      activeComponents: ["stage-if", "stage-id", "stage-ex", "stage-mem"],
      metrics: {
        "Instrucoes no Pipeline": 4,
        "Instrucoes Concluidas": 0,
        "Throughput Instantaneo": "0 inst/ciclo"
      }
    },
    {
      id: "c5-steady-state",
      title: "Ciclo 5: Esteira Cheia e Primeira Conclusao",
      explanation: "Todos os 5 estagios estao ocupados. A Instrucao 1 conclui a Gravacao no Banco (WB). O processador entrega sua primeira instrucao finalizada.",
      focus: ["stage-wb", "inst-1"],
      show: ["inst-1-wb", "inst-2-mem", "inst-3-ex", "inst-4-id", "inst-5-if"],
      activeComponents: ["stage-if", "stage-id", "stage-ex", "stage-mem", "stage-wb"],
      annotations: [
        {
          target: "stage-wb",
          text: "Instrucao 1 concluida com sucesso",
          variant: "success"
        }
      ],
      metrics: {
        "Instrucoes no Pipeline": 5,
        "Instrucoes Concluidas": 1,
        "Throughput Instantaneo": "1 inst/ciclo"
      }
    },
    {
      id: "c6-steady-state",
      title: "Ciclo 6: Regime Permanente (1 Conclusao por Ciclo)",
      explanation: "A Instrucao 2 conclui em WB exatamente um ciclo apos a primeira. O hardware entrega a segunda instrucao pronta.",
      focus: ["stage-wb", "inst-2"],
      show: ["inst-2-wb", "inst-3-mem", "inst-4-ex", "inst-5-id"],
      activeComponents: ["stage-id", "stage-ex", "stage-mem", "stage-wb"],
      annotations: [
        {
          target: "stage-wb",
          text: "Instrucao 2 concluida em 1 ciclo apos a anterior",
          variant: "success"
        }
      ],
      metrics: {
        "Instrucoes no Pipeline": 4,
        "Instrucoes Concluidas": 2,
        "Throughput Instantaneo": "1 inst/ciclo"
      }
    },
    {
      id: "c7-steady-state",
      title: "Ciclo 7: Terceira Entrega Consecutiva",
      explanation: "A Instrucao 3 conclui em WB. Em condicoes ideais sem conflitos, a linha de montagem matematicamente conclui uma instrucao a cada pulso de clock.",
      focus: ["stage-wb", "inst-3"],
      show: ["inst-3-wb", "inst-4-mem", "inst-5-ex"],
      activeComponents: ["stage-ex", "stage-mem", "stage-wb"],
      annotations: [
        {
          target: "stage-wb",
          text: "Instrucao 3 concluida: vazao maxima mantida",
          variant: "success"
        }
      ],
      metrics: {
        "Instrucoes no Pipeline": 3,
        "Instrucoes Concluidas": 3,
        "Throughput Instantaneo": "1 inst/ciclo"
      }
    }
  ]
};
