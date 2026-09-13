import { useState } from 'react';

type FaultType = 'NONE' | 'WIRE_NOISE' | 'ROUTER_RAM' | 'DISK_FAULT';

interface StepState {
  step: number;
  title: string;
  description: string;
  packetAt: 'HOST_A' | 'WIRE_1' | 'ROUTER_1' | 'WIRE_2' | 'ROUTER_2' | 'WIRE_3' | 'HOST_B';
  hopStatus: 'IDLE' | 'OK' | 'RETRY' | 'MISLEADING_OK';
  payloadStatus: 'CLEAN' | 'CORRUPTED';
  hashMatch: boolean | null;
}

export default function EndToEndTransferSimulator() {
  const [fault, setFault] = useState<FaultType>('NONE');
  const [currentStep, setCurrentStep] = useState<number>(0);

  const initialHash = '0x8F3D21';

  const stepsData: Record<FaultType, StepState[]> = {
    NONE: [
      {
        step: 0,
        title: 'Leitura em Disco no Host A',
        description: 'A aplicacao le 1.000 bytes do disco local e calcula o hash global inicial (0x8F3D21).',
        packetAt: 'HOST_A',
        hopStatus: 'IDLE',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 1,
        title: 'Enlace 1: Host A para Roteador 1',
        description: 'O pacote atravessa o cabo Ethernet com FCS de 32 bits valido.',
        packetAt: 'WIRE_1',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 2,
        title: 'Buffer do Roteador 1',
        description: 'Roteador 1 valida o FCS do trecho, devolve ACK local e aloca o pacote no buffer de memoria.',
        packetAt: 'ROUTER_1',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 3,
        title: 'Enlace 2: Roteador 1 para Roteador 2',
        description: 'O pacote e transmitido pelo enlace ponto a ponto. Roteador 2 confirma recepcao local.',
        packetAt: 'WIRE_2',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 4,
        title: 'Enlace 3: Chegada ao Host B',
        description: 'A placa de rede do Host B recebe o quadro, valida o FCS da Ethernet e grava no disco.',
        packetAt: 'WIRE_3',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 5,
        title: 'Validacao Fim a Fim na Aplicacao',
        description: 'A aplicacao no Host B le o arquivo gravado, recalcula o hash (0x8F3D21) e confirma integridade total.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: true,
      },
    ],
    WIRE_NOISE: [
      {
        step: 0,
        title: 'Leitura em Disco no Host A',
        description: 'A aplicacao le os bytes e computa o hash global inicial (0x8F3D21).',
        packetAt: 'HOST_A',
        hopStatus: 'IDLE',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 1,
        title: 'Ruido Eletromagnetico no Enlace 1',
        description: 'Interferencia no cabo corrompe 2 bits do quadro. O FCS de 32 bits detecta o erro no fio.',
        packetAt: 'WIRE_1',
        hopStatus: 'RETRY',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 2,
        title: 'Recuperacao Local Salto a Salto (Hop-by-Hop)',
        description: 'Roteador 1 descarta o quadro corrompido e o enlace 1 retransmite. O quadro chega limpo.',
        packetAt: 'ROUTER_1',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 3,
        title: 'Repasse pelo Roteador 2',
        description: 'O salto local salvou a conexao de uma retransmissao cara de longa distancia: otimizacao de desempenho perfeita.',
        packetAt: 'ROUTER_2',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 4,
        title: 'Recepcao e Gravacao no Host B',
        description: 'O pacote atinge a placa de rede do Host B e e gravado em disco.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 5,
        title: 'Validacao Fim a Fim na Aplicacao',
        description: 'Aplicacao le o disco do Host B e confere o hash: 0x8F3D21 coincide 100%.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: true,
      },
    ],
    ROUTER_RAM: [
      {
        step: 0,
        title: 'Leitura e Envio no Host A',
        description: 'Arquivo original lido em Host A com Hash global (0x8F3D21).',
        packetAt: 'HOST_A',
        hopStatus: 'IDLE',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 1,
        title: 'Enlace 1: Chegada Limpa ao Roteador 1',
        description: 'O quadro chega perfeito ao Roteador 1. O FCS bate e o Roteador 1 envia ACK local de sucesso.',
        packetAt: 'WIRE_1',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 2,
        title: 'A Falha Invisivel: Bitflip na RAM do Roteador 1',
        description: 'Um raio cosmico ou defeito de chip altera um bit na memoria RAM do buffer do Roteador 1.',
        packetAt: 'ROUTER_1',
        hopStatus: 'MISLEADING_OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 3,
        title: 'A Ilusao do Enlace: Novo FCS Gerado para o Dado Corrompido',
        description: 'Ao transmitir para o Enlace 2, a placa gera um NOVO FCS matematicamente correto para o dado estragado! Nenhum comutador percebe o erro.',
        packetAt: 'WIRE_2',
        hopStatus: 'MISLEADING_OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 4,
        title: 'Host B Recebe e Grava sem Saber da Falha',
        description: 'A placa de rede do Host B aceita o quadro (FCS valido no fio) e grava o arquivo corrompido em disco.',
        packetAt: 'HOST_B',
        hopStatus: 'MISLEADING_OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 5,
        title: 'O Resgate Fim a Fim na Camada de Aplicacao',
        description: 'A aplicacao le o disco e calcula o Hash: 0x9E4C10. Nao bate com 0x8F3D21! O principio fim a fim salva o sistema da corrupcao silenciosa.',
        packetAt: 'HOST_B',
        hopStatus: 'MISLEADING_OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: false,
      },
    ],
    DISK_FAULT: [
      {
        step: 0,
        title: 'Leitura em Disco no Host A',
        description: 'Aplicacao le o arquivo com Hash global (0x8F3D21).',
        packetAt: 'HOST_A',
        hopStatus: 'IDLE',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 1,
        title: 'Transito Perfeito pela Rede',
        description: 'O pacote atravessa todos os roteadores e cabos sem nenhuma falha de enlace ou memoria.',
        packetAt: 'WIRE_2',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 2,
        title: 'Chegada a Placa de Rede do Host B',
        description: 'Placa de rede recebe o pacote com 100% de integridade e passa para o driver do sistema operacional.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 3,
        title: 'Falha de Gravacao no Controlador de Disco',
        description: 'O controlador SSD/HDD sofre um erro de escrita no setor magnetico/flash ao persistir os dados.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 4,
        title: 'A Rede Inteira Assinou Sucesso Inutilmente',
        description: 'A pilha de rede concluiu a entrega com sucesso, mas o arquivo repousa corrompido no disco fisico.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 5,
        title: 'Validacao Final pela Aplicacao Receptora',
        description: 'A aplicacao le do disco, computa hash 0x7B2A99, detecta a discrepancia e solicita reenvio do bloco.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: false,
      },
    ],
  };

  const currentStates = stepsData[fault];
  const stepInfo = currentStates[Math.min(currentStep, currentStates.length - 1)];

  const handleFaultSelect = (newFault: FaultType) => {
    setFault(newFault);
    setCurrentStep(0);
  };

  return (
    <div
      data-visual-model="VIS-09-E2E-FUNCTION-PLACEMENT"
      className="my-8 rounded-xl border border-slate-700/60 bg-slate-900/90 p-6 text-slate-200 shadow-2xl backdrop-blur"
    >
      <div className="flex flex-col gap-4 border-b border-slate-700/50 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-amber-300">
              SIMULADOR REATIVO INTERATIVO
            </span>
            <span className="font-mono text-xs text-slate-400">VIS-09: End-to-End vs Hop-by-Hop</span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-slate-100">
            O Experimento de Saltzer: Onde a Garantia Real Reside?
          </h3>
        </div>

        {/* Seletor de Cenario de Falha */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Cenários de falha na transferência fim-a-fim">
          <button
            type="button"
            onClick={() => handleFaultSelect('NONE')}
            className={`min-h-[44px] rounded-xl px-3.5 py-2 font-mono text-xs font-semibold transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-emerald-400 focus-visible:outline-none ${
              fault === 'NONE'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1. Transito Normal
          </button>
          <button
            type="button"
            onClick={() => handleFaultSelect('WIRE_NOISE')}
            className={`min-h-[44px] rounded-xl px-3.5 py-2 font-mono text-xs font-semibold transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-amber-400 focus-visible:outline-none ${
              fault === 'WIRE_NOISE'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2. Ruido no Cabo
          </button>
          <button
            type="button"
            onClick={() => handleFaultSelect('ROUTER_RAM')}
            className={`min-h-[44px] rounded-xl px-3.5 py-2 font-mono text-xs font-semibold transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-rose-400 focus-visible:outline-none ${
              fault === 'ROUTER_RAM'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3. Bitflip em RAM de Roteador
          </button>
          <button
            type="button"
            onClick={() => handleFaultSelect('DISK_FAULT')}
            className={`min-h-[44px] rounded-xl px-3.5 py-2 font-mono text-xs font-semibold transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-purple-400 focus-visible:outline-none ${
              fault === 'DISK_FAULT'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            4. Erro de Disco Destino
          </button>
        </div>
      </div>

      {/* Topologia da Rede em Barra */}
      <div className="my-6 grid grid-cols-1 gap-2 md:grid-cols-4">
        {/* Host A */}
        <div
          className={`rounded-lg border p-4 transition ${
            stepInfo.packetAt === 'HOST_A'
              ? 'border-amber-400 bg-amber-950/30 shadow-md ring-1 ring-amber-400'
              : 'border-slate-700 bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between font-mono text-xs text-slate-400">
            <span>EMISSOR</span>
            <span>Host A</span>
          </div>
          <div className="mt-2 font-bold text-slate-100">Aplicacao Origem</div>
          <div className="mt-2 font-mono text-xs text-slate-300">
            Hash Calculado: <span className="text-amber-400">{initialHash}</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-400">Leitura do Disco: 1000 B</div>
        </div>

        {/* Roteador 1 */}
        <div
          className={`rounded-lg border p-4 transition ${
            stepInfo.packetAt === 'ROUTER_1' || stepInfo.packetAt === 'WIRE_1'
              ? 'border-amber-400 bg-amber-950/30 shadow-md ring-1 ring-amber-400'
              : 'border-slate-700 bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between font-mono text-xs text-slate-400">
            <span>NUCLEO DA REDE</span>
            <span>Roteador 1</span>
          </div>
          <div className="mt-2 font-bold text-slate-100">Gateway de Transito</div>
          <div className="mt-2 font-mono text-xs">
            {fault === 'ROUTER_RAM' && currentStep >= 2 ? (
              <span className="font-semibold text-rose-400">RAM: Bitflip Ocorrido!</span>
            ) : (
              <span className="text-emerald-400">RAM: Buffer Limpo</span>
            )}
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-400">
            ACK Salto 1: {stepInfo.hopStatus === 'RETRY' ? 'FCS Invalido (Reenvio)' : 'OK'}
          </div>
        </div>

        {/* Roteador 2 */}
        <div
          className={`rounded-lg border p-4 transition ${
            stepInfo.packetAt === 'ROUTER_2' || stepInfo.packetAt === 'WIRE_2'
              ? 'border-amber-400 bg-amber-950/30 shadow-md ring-1 ring-amber-400'
              : 'border-slate-700 bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between font-mono text-xs text-slate-400">
            <span>NUCLEO DA REDE</span>
            <span>Roteador 2</span>
          </div>
          <div className="mt-2 font-bold text-slate-100">Gateway de Saida</div>
          <div className="mt-2 font-mono text-xs text-slate-300">
            {fault === 'ROUTER_RAM' && currentStep >= 3 ? (
              <span className="text-rose-400">FCS Recalculado s/ Erro</span>
            ) : (
              <span className="text-slate-300">FCS: Valido no Cabo</span>
            )}
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-400">Comutacao Stateless</div>
        </div>

        {/* Host B */}
        <div
          className={`rounded-lg border p-4 transition ${
            stepInfo.packetAt === 'HOST_B' || stepInfo.packetAt === 'WIRE_3'
              ? 'border-amber-400 bg-amber-950/30 shadow-md ring-1 ring-amber-400'
              : 'border-slate-700 bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between font-mono text-xs text-slate-400">
            <span>RECEPTOR</span>
            <span>Host B</span>
          </div>
          <div className="mt-2 font-bold text-slate-100">Aplicacao Destino</div>
          <div className="mt-2 font-mono text-xs">
            {stepInfo.hashMatch === null ? (
              <span className="text-slate-400">Aguardando arquivo...</span>
            ) : stepInfo.hashMatch ? (
              <span className="font-bold text-emerald-400">Hash Confere (OK)</span>
            ) : (
              <span className="font-bold text-rose-400">Hash Rejeitado (FALHA)</span>
            )}
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-400">Gravacao em Disco</div>
        </div>
      </div>

      {/* Painel de Explicacao Causal e Estado */}
      <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono text-xs">
          <span className="text-amber-300">
            PASSO {currentStep + 1} DE {currentStates.length}: {stepInfo.title}
          </span>
          <span className="text-slate-400">
            Carga Util:{' '}
            <strong className={stepInfo.payloadStatus === 'CLEAN' ? 'text-emerald-400' : 'text-rose-400'}>
              {stepInfo.payloadStatus === 'CLEAN' ? 'INTEGRA' : 'CORROMPIDA'}
            </strong>
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-200">{stepInfo.description}</p>

        {/* Diagnostico Arquitetural */}
        <div className="mt-4 rounded border border-slate-800 bg-slate-900/90 p-3 text-xs">
          <span className="font-bold text-slate-100">Licao do Principio Fim a Fim:</span>
          {fault === 'NONE' && (
            <span className="ml-1 text-slate-300">
              Quando tudo funciona, hop-by-hop e end-to-end parecem redundantes. Mas sistemas de engenharia sao projetados para o modo de falha.
            </span>
          )}
          {fault === 'WIRE_NOISE' && (
            <span className="ml-1 text-slate-300">
              O FCS da Ethernet retransmitiu localmente sem acionar o Host A. O salto local e uma valiosa{' '}
              <strong>otimizacao de desempenho</strong>, mas nao uma garantia formal de entrega do arquivo.
            </span>
          )}
          {fault === 'ROUTER_RAM' && (
            <span className="ml-1 text-slate-300">
              A rede intermediaria declarou sucesso em todos os cabos! Se nao houvesse o hash na aplicacao final, o
              banco de dados gravaria lixo silenciosamente. <strong>Apenas a ponta atesta a corretude.</strong>
            </span>
          )}
          {fault === 'DISK_FAULT' && (
            <span className="ml-1 text-slate-300">
              Mesmo uma rede hipotetica 100% perfeita falharia aqui: a corrupcao ocorreu dentro do host de destino,
              fora do alcance de qualquer protocolo de enlace ou roteador.
            </span>
          )}
        </div>
      </div>

      {/* Botoes de Navegacao Passo a Passo */}
      <div className="mt-5 flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className="min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 font-mono text-xs font-medium text-slate-200 transition hover:bg-slate-700 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-slate-400 focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none"
        >
          &larr; Passo Anterior
        </button>

        <span className="font-mono text-xs text-slate-400">
          Progresso: {currentStep + 1} / {currentStates.length}
        </span>

        <button
          type="button"
          onClick={() => setCurrentStep((prev) => Math.min(currentStates.length - 1, prev + 1))}
          disabled={currentStep === currentStates.length - 1}
          className="min-h-[44px] rounded-xl bg-amber-400 px-5 py-2.5 font-mono text-xs font-bold text-amber-950 transition hover:bg-amber-300 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-amber-400 focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none"
        >
          Proximo Passo &rarr;
        </button>
      </div>
    </div>
  );
}
