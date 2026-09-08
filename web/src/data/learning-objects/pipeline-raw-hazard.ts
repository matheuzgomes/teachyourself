import type { LearningObject } from "../../types/learning-object";

export const pipelineRawHazardSpec: LearningObject = {
  id: "pipeline-raw-hazard",
  renderer: "pipeline",
  mode: "interactive-3d",
  learningGoal: "Compreender como uma dependencia verdadeira de dados (RAW) cria uma conflito temporal no pipeline, exigindo a retencao da instrucao dependente e a injecao de bolhas de stall",
  whyInteractive: "Permite ao estudante navegar no espaco 3D do nucleo para enxergar a distancia fisica entre a ALU no estagio EX e o Banco de Registradores no estagio ID/WB, inspecionando os registradores de estagio congelados e as bolhas introduzidas nos ciclos 4 e 5",
  initialState: "c1-fetch-add",
  controls: {
    play: true,
    pause: true,
    next: true,
    previous: true,
    reset: true,
    speed: true
  },
  accessibilityFallback: {
    description: "Tabela cronologica exibindo o congelamento de sub no estagio ID durante os ciclos C4 e C5 enquanto add progride ate WB.",
    staticTableOrDiagram: `           C1   C2   C3   C4   C5   C6   C7   C8
add t0      F    D    E    M    W
sub t3           F    D   D*   D*    E    M    W
                          ^    ^
                        Stalls adicionais`
  },
  states: [
    {
      id: "c1-fetch-add",
      title: "Ciclo 1: Busca da Instrucao Produtora (add)",
      explanation: "A instrucao add entra no estagio de Busca (IF). O Program Counter aponta para a instrucao que calculara t0 = t1 + t2.",
      focus: ["stage-if", "instruction-add"],
      show: ["inst-add-if"],
      activeComponents: ["stage-if"],
      metrics: {
        "Ciclo Atual": "C1",
        "add em": "IF",
        "sub em": "Aguardando",
        "Estado da Esteira": "Operacao normal"
      }
    },
    {
      id: "c2-decode-add-fetch-sub",
      title: "Ciclo 2: Decodificacao de add e Busca de sub",
      explanation: "add avanca para Decodificacao (ID) para ler t1 e t2. A instrucao consumidora sub entra no estagio de Busca (IF).",
      focus: ["stage-id", "stage-if"],
      show: ["inst-add-id", "inst-sub-if"],
      activeComponents: ["stage-if", "stage-id"],
      metrics: {
        "Ciclo Atual": "C2",
        "add em": "ID",
        "sub em": "IF",
        "Estado da Esteira": "Operacao normal"
      }
    },
    {
      id: "c3-raw-hazard-detected",
      title: "Ciclo 3: Deteccao da Dependencia RAW",
      explanation: "add esta em Execucao (EX) calculando a soma. sub chega em ID e tenta ler t0 no banco. Mas o novo valor de t0 ainda nao existe no banco de registradores. A unidade de deteccao sinaliza o conflito.",
      focus: ["stage-id", "stage-ex", "regfile"],
      show: ["inst-add-ex", "inst-sub-id"],
      activeComponents: ["stage-id", "stage-ex"],
      annotations: [
        {
          target: "stage-id",
          text: "Conflito RAW: sub tenta ler t0 defasado",
          variant: "warning"
        },
        {
          target: "stage-ex",
          text: "add calculando t0 na ALU",
          variant: "highlight"
        }
      ],
      metrics: {
        "Ciclo Atual": "C3",
        "add em": "EX",
        "sub em": "ID (Hazard detectado)",
        "Estado da Esteira": "Alarme de Hazard ativado"
      }
    },
    {
      id: "c4-stall-bubble-1",
      title: "Ciclo 4: Primeiro Stall e Injetando a Bolha 1",
      explanation: "A escrita no registrador PC e no estagio IF/ID e desativada. sub permanece retida em ID (D*). O registrador de estagio ID/EX recebe sinais zerados (RegWrite = 0, MemWrite = 0), inserindo uma bolha neutra (nop) em EX.",
      focus: ["stage-id", "stage-ex", "bubble-1"],
      show: ["inst-add-mem", "inst-sub-stall-1", "bubble-1-ex"],
      activeComponents: ["stage-id", "stage-ex", "stage-mem"],
      annotations: [
        {
          target: "stage-id",
          text: "sub congelada em ID (Stall 1)",
          variant: "warning"
        },
        {
          target: "stage-ex",
          text: "Bolha (nop) injetada em EX",
          variant: "neutral"
        }
      ],
      metrics: {
        "Ciclo Atual": "C4",
        "add em": "MEM",
        "sub em": "ID (Retida)",
        "Estado da Esteira": "Stall ativo (Bolha em EX)"
      }
    },
    {
      id: "c5-write-then-read",
      title: "Ciclo 5: Segundo Stall e Resolucao no Banco de Registradores",
      explanation: "add atinge o estagio WB. Na primeira metade do ciclo de clock, add grava o novo valor de t0 no banco de registradores. Na segunda metade do mesmo ciclo, sub le com sucesso o valor atualizado de t0.",
      focus: ["stage-wb", "regfile", "stage-id"],
      show: ["inst-add-wb", "inst-sub-stall-2", "bubble-1-mem", "bubble-2-ex"],
      activeComponents: ["stage-id", "stage-ex", "stage-mem", "stage-wb"],
      annotations: [
        {
          target: "stage-wb",
          text: "1a metade do ciclo: add grava t0 no banco",
          variant: "success"
        },
        {
          target: "stage-id",
          text: "2a metade do ciclo: sub le t0 atualizado",
          variant: "success"
        }
      ],
      metrics: {
        "Ciclo Atual": "C5",
        "add em": "WB (Gravando)",
        "sub em": "ID (Lendo dado valido)",
        "Estado da Esteira": "Conflito resolvido no banco"
      }
    },
    {
      id: "c6-sub-advances",
      title: "Ciclo 6: sub Avanca para Execucao",
      explanation: "Com o registrador t0 atualizado em maos, sub finalmente tem autorizacao para avancar para o estagio de Execucao (EX). O pipeline retoma o fluxo normal de processamento.",
      focus: ["stage-ex", "instruction-sub"],
      show: ["inst-sub-ex", "bubble-2-mem"],
      activeComponents: ["stage-ex", "stage-mem"],
      annotations: [
        {
          target: "stage-ex",
          text: "sub executa t0 - t4 com valor correto",
          variant: "success"
        }
      ],
      metrics: {
        "Ciclo Atual": "C6",
        "add em": "Concluido",
        "sub em": "EX",
        "Estado da Esteira": "Execucao retomada com integridade"
      }
    }
  ]
};
