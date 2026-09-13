import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { NetworkIcon } from '@hugeicons/core-free-icons';
import { useSimulationPlayback, SimulationToolbar } from './simulation';

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

const FAULT_OPTIONS: { id: FaultType; label: string }[] = [
  { id: 'NONE', label: '1. Trânsito Normal' },
  { id: 'WIRE_NOISE', label: '2. Ruído no Cabo' },
  { id: 'ROUTER_RAM', label: '3. Bitflip em RAM de Roteador' },
  { id: 'DISK_FAULT', label: '4. Erro de Disco Destino' },
];

export default function EndToEndTransferSimulator() {
  const [fault, setFault] = useState<FaultType>('NONE');

  const initialHash = '0x8F3D21';

  const stepsData: Record<FaultType, StepState[]> = {
    NONE: [
      {
        step: 0,
        title: 'Leitura em Disco no Host A',
        description: 'A aplicação lê 1.000 bytes do disco local e calcula o hash global inicial (0x8F3D21).',
        packetAt: 'HOST_A',
        hopStatus: 'IDLE',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 1,
        title: 'Enlace 1: Host A para Roteador 1',
        description: 'O pacote atravessa o cabo Ethernet com FCS de 32 bits válido.',
        packetAt: 'WIRE_1',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 2,
        title: 'Buffer do Roteador 1',
        description: 'Roteador 1 valida o FCS do trecho, devolve ACK local e aloca o pacote no buffer de memória.',
        packetAt: 'ROUTER_1',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 3,
        title: 'Enlace 2: Roteador 1 para Roteador 2',
        description: 'O pacote é transmitido pelo enlace ponto a ponto. Roteador 2 confirma recepção local.',
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
        title: 'Validação Fim a Fim na Aplicação',
        description: 'A aplicação no Host B lê o arquivo gravado, recalcula o hash (0x8F3D21) e confirma integridade total.',
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
        description: 'A aplicação lê os bytes e computa o hash global inicial (0x8F3D21).',
        packetAt: 'HOST_A',
        hopStatus: 'IDLE',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 1,
        title: 'Ruído Eletromagnético no Enlace 1',
        description: 'Interferência no cabo corrompe 2 bits do quadro. O FCS de 32 bits detecta o erro no fio.',
        packetAt: 'WIRE_1',
        hopStatus: 'RETRY',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 2,
        title: 'Recuperação Local Salto a Salto (Hop-by-Hop)',
        description: 'Roteador 1 descarta o quadro corrompido e o enlace 1 retransmite. O quadro chega limpo.',
        packetAt: 'ROUTER_1',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 3,
        title: 'Repasse pelo Roteador 2',
        description: 'O salto local salvou a conexão de uma retransmissão custosa de longa distância: otimização de desempenho perfeita.',
        packetAt: 'ROUTER_2',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 4,
        title: 'Recepção e Gravação no Host B',
        description: 'O pacote atinge a placa de rede do Host B e é gravado em disco.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 5,
        title: 'Validação Fim a Fim na Aplicação',
        description: 'Aplicação lê o disco do Host B e confere o hash: 0x8F3D21 coincide 100%.',
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
        title: 'A Falha Invisível: Bitflip na RAM do Roteador 1',
        description: 'Um evento térmico ou defeito de semicondutor altera um bit na memória RAM do buffer do Roteador 1.',
        packetAt: 'ROUTER_1',
        hopStatus: 'MISLEADING_OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 3,
        title: 'A Ilusão do Enlace: Novo FCS Gerado para o Dado Corrompido',
        description: 'Ao transmitir para o Enlace 2, a placa gera um NOVO FCS matematicamente correto para o dado estragado! Nenhum comutador percebe o erro.',
        packetAt: 'WIRE_2',
        hopStatus: 'MISLEADING_OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 4,
        title: 'Host B Recebe e Grava sem Saber da Falha',
        description: 'A placa de rede do Host B aceita o quadro (FCS válido no fio) e grava o arquivo corrompido em disco.',
        packetAt: 'HOST_B',
        hopStatus: 'MISLEADING_OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 5,
        title: 'O Resgate Fim a Fim na Camada de Aplicação',
        description: 'A aplicação lê o disco e calcula o Hash: 0x9E4C10. Não bate com 0x8F3D21! O princípio fim a fim salva o sistema da corrupção silenciosa.',
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
        description: 'Aplicação lê o arquivo com Hash global (0x8F3D21).',
        packetAt: 'HOST_A',
        hopStatus: 'IDLE',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 1,
        title: 'Trânsito Perfeito pela Rede',
        description: 'O pacote atravessa todos os roteadores e cabos sem nenhuma falha de enlace ou memória.',
        packetAt: 'WIRE_2',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 2,
        title: 'Chegada à Placa de Rede do Host B',
        description: 'Placa de rede recebe o pacote com 100% de integridade e passa para o driver do sistema operacional.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CLEAN',
        hashMatch: null,
      },
      {
        step: 3,
        title: 'Falha de Gravação no Controlador de Disco',
        description: 'O controlador SSD/HDD sofre um erro de escrita no setor flash/magnético ao persistir os dados.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 4,
        title: 'A Rede Inteira Assinou Sucesso Inutilmente',
        description: 'A pilha de rede concluiu a entrega com sucesso, mas o arquivo repousa corrompido no disco físico.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: null,
      },
      {
        step: 5,
        title: 'Validação Final pela Aplicação Receptora',
        description: 'A aplicação lê do disco, computa hash 0x7B2A99, detecta a discrepância e solicita reenvio do bloco.',
        packetAt: 'HOST_B',
        hopStatus: 'OK',
        payloadStatus: 'CORRUPTED',
        hashMatch: false,
      },
    ],
  };

  const currentStates = stepsData[fault];

  const playback = useSimulationPlayback({
    totalSteps: currentStates.length,
    stepIntervalMs: 2800,
    loop: false,
  });

  const { currentStep } = playback;
  const stepInfo = currentStates[Math.min(currentStep, currentStates.length - 1)];

  const handleFaultSelect = (newFault: FaultType) => {
    setFault(newFault);
    playback.reset();
  };

  return (
    <div
      data-visual-model="VIS-09-E2E-FUNCTION-PLACEMENT"
      className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all"
    >
      {/* Cabeçalho e Seletor de Cenários */}
      <div className="flex flex-col gap-4 border-b border-ash pb-5 mb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <HugeiconsIcon icon={NetworkIcon} className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-lake-blue font-medium uppercase tracking-wider">
                VIS-09: End-to-End vs Hop-by-Hop
              </span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
              O Experimento de Saltzer: Onde a Garantia Real Reside?
            </h4>
          </div>
        </div>

        {/* Toolbar de Playback com atalhos de teclado */}
        <SimulationToolbar playback={playback} />
      </div>

      {/* Seletor de Cenários de Falha em Pílulas */}
      <div className="mb-6">
        <div className="text-xs font-mono text-smoke uppercase tracking-wider mb-2">
          Selecione o cenário de transmissão:
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Cenários de falha na transferência fim a fim">
          {FAULT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleFaultSelect(opt.id)}
              className={`min-h-[44px] rounded-full px-4 py-2 font-mono text-xs transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                fault === opt.id
                  ? 'bg-lake-blue text-white border-lake-blue shadow-sm font-semibold'
                  : 'bg-parchment text-graphite border-ash hover:border-lake-blue/50 hover:text-off-black'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topologia da Rede em Nós Monad */}
      <div className="my-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        {/* Host A */}
        <div
          className={`rounded-2xl border p-4 transition-all ${
            stepInfo.packetAt === 'HOST_A'
              ? 'border-lake-blue bg-white shadow-sm ring-2 ring-lake-blue/20'
              : 'border-ash bg-parchment/60'
          }`}
        >
          <div className="flex items-center justify-between font-mono text-xs text-smoke">
            <span>EMISSOR</span>
            <span>Host A</span>
          </div>
          <div className="mt-2 font-serif text-base font-normal text-off-black">Aplicação Origem</div>
          <div className="mt-2 font-mono text-xs text-graphite">
            Hash Calculado: <span className="text-lake-blue font-semibold">{initialHash}</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-smoke">Leitura do Disco: 1000 B</div>
        </div>

        {/* Roteador 1 */}
        <div
          className={`rounded-2xl border p-4 transition-all ${
            stepInfo.packetAt === 'ROUTER_1' || stepInfo.packetAt === 'WIRE_1'
              ? 'border-lake-blue bg-white shadow-sm ring-2 ring-lake-blue/20'
              : 'border-ash bg-parchment/60'
          }`}
        >
          <div className="flex items-center justify-between font-mono text-xs text-smoke">
            <span>NÚCLEO DA REDE</span>
            <span>Roteador 1</span>
          </div>
          <div className="mt-2 font-serif text-base font-normal text-off-black">Gateway de Trânsito</div>
          <div className="mt-2 font-mono text-xs">
            {fault === 'ROUTER_RAM' && currentStep >= 2 ? (
              <span className="font-semibold text-crimson">RAM: Bitflip Ocorrido!</span>
            ) : (
              <span className="text-emerald-700 font-semibold">RAM: Buffer Limpo</span>
            )}
          </div>
          <div className="mt-1 font-mono text-[11px] text-smoke">
            ACK Salto 1: {stepInfo.hopStatus === 'RETRY' ? 'FCS Inválido (Reenvio)' : 'OK'}
          </div>
        </div>

        {/* Roteador 2 */}
        <div
          className={`rounded-2xl border p-4 transition-all ${
            stepInfo.packetAt === 'ROUTER_2' || stepInfo.packetAt === 'WIRE_2'
              ? 'border-lake-blue bg-white shadow-sm ring-2 ring-lake-blue/20'
              : 'border-ash bg-parchment/60'
          }`}
        >
          <div className="flex items-center justify-between font-mono text-xs text-smoke">
            <span>NÚCLEO DA REDE</span>
            <span>Roteador 2</span>
          </div>
          <div className="mt-2 font-serif text-base font-normal text-off-black">Gateway de Saída</div>
          <div className="mt-2 font-mono text-xs">
            {fault === 'ROUTER_RAM' && currentStep >= 3 ? (
              <span className="text-crimson font-semibold">FCS Recalculado s/ Erro</span>
            ) : (
              <span className="text-graphite font-semibold">FCS: Válido no Cabo</span>
            )}
          </div>
          <div className="mt-1 font-mono text-[11px] text-smoke">Comutação Stateless</div>
        </div>

        {/* Host B */}
        <div
          className={`rounded-2xl border p-4 transition-all ${
            stepInfo.packetAt === 'HOST_B' || stepInfo.packetAt === 'WIRE_3'
              ? 'border-lake-blue bg-white shadow-sm ring-2 ring-lake-blue/20'
              : 'border-ash bg-parchment/60'
          }`}
        >
          <div className="flex items-center justify-between font-mono text-xs text-smoke">
            <span>RECEPTOR</span>
            <span>Host B</span>
          </div>
          <div className="mt-2 font-serif text-base font-normal text-off-black">Aplicação Destino</div>
          <div className="mt-2 font-mono text-xs">
            {stepInfo.hashMatch === null ? (
              <span className="text-smoke">Aguardando arquivo...</span>
            ) : stepInfo.hashMatch ? (
              <span className="font-bold text-emerald-700">Hash Confere (OK)</span>
            ) : (
              <span className="font-bold text-crimson">Hash Rejeitado (FALHA)</span>
            )}
          </div>
          <div className="mt-1 font-mono text-[11px] text-smoke">Gravação em Disco</div>
        </div>
      </div>

      {/* Painel de Explicação Causal e Estado */}
      <div className="rounded-2xl border border-ash bg-parchment p-5 md:p-6">
        <div className="flex items-center justify-between border-b border-ash pb-3 font-mono text-xs">
          <span className="text-lake-blue font-semibold uppercase tracking-wider">
            Passo {currentStep + 1} de {currentStates.length}: {stepInfo.title}
          </span>
          <span className="text-smoke">
            Carga Útil:{' '}
            <strong className={stepInfo.payloadStatus === 'CLEAN' ? 'text-emerald-700' : 'text-crimson'}>
              {stepInfo.payloadStatus === 'CLEAN' ? 'ÍNTREGRA' : 'CORROMPIDA'}
            </strong>
          </span>
        </div>

        <p className="mt-3 text-xs md:text-sm font-mono leading-relaxed text-graphite">{stepInfo.description}</p>

        {/* Diagnóstico Arquitetural */}
        <div className="mt-4 rounded-xl border border-ash bg-white p-4 text-xs font-mono text-graphite">
          <span className="font-bold text-off-black">Lição do Princípio Fim a Fim:</span>
          {fault === 'NONE' && (
            <span className="ml-1 text-graphite">
              {' '}Quando tudo funciona, salto a salto e fim a fim parecem redundantes. Mas sistemas de engenharia são projetados para o modo de falha.
            </span>
          )}
          {fault === 'WIRE_NOISE' && (
            <span className="ml-1 text-graphite">
              {' '}O FCS da Ethernet retransmitiu localmente sem acionar o Host A. O salto local é uma valiosa{' '}
              <strong className="text-off-black">otimização de desempenho</strong>, mas não uma garantia formal de entrega do arquivo.
            </span>
          )}
          {fault === 'ROUTER_RAM' && (
            <span className="ml-1 text-graphite">
              {' '}A rede intermediária declarou sucesso em todos os cabos! Se não houvesse o hash na aplicação final, o
              banco de dados gravaria dados corrompidos silenciosamente. <strong className="text-off-black">Apenas a ponta atesta a corretude.</strong>
            </span>
          )}
          {fault === 'DISK_FAULT' && (
            <span className="ml-1 text-graphite">
              {' '}Mesmo uma rede hipotética 100% perfeita falharia aqui: a corrupção ocorreu dentro do host de destino,
              fora do alcance de qualquer protocolo de enlace ou roteador.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
