import { useState, useEffect, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CpuIcon,
  Layers01Icon,
  RotateCcwIcon,
  ZapIcon,
  ArrowRight01Icon,
  PlayIcon,
  PauseIcon
} from '@hugeicons/core-free-icons';

type SimulatorTab = 'mesi' | 'false_sharing';
type MesiState = 'M' | 'E' | 'S' | 'I';

interface CacheLine {
  address: string;
  state: MesiState;
  value: number;
}

interface BusMessage {
  type: 'BusRd' | 'BusRdX' | 'BusInv' | 'IDLE';
  initiator: 'Core 0' | 'Core 1' | 'Nenhum';
  address: string;
  description: string;
}

export default function MesiCacheSimulator() {
  const [activeTab, setActiveTab] = useState<SimulatorTab>('mesi');

  // =========================================================================
  // ESTADO DO PROTOCOLO MESI (ABA 1)
  // =========================================================================
  const [core0Cache, setCore0Cache] = useState<{ [addr: string]: CacheLine }>({
    '0x1000': { address: '0x1000', state: 'I', value: 0 },
    '0x1040': { address: '0x1040', state: 'I', value: 0 }
  });

  const [core1Cache, setCore1Cache] = useState<{ [addr: string]: CacheLine }>({
    '0x1000': { address: '0x1000', state: 'I', value: 0 },
    '0x1040': { address: '0x1040', state: 'I', value: 0 }
  });

  const [ramMemory, setRamMemory] = useState<{ [addr: string]: number }>({
    '0x1000': 0,
    '0x1040': 0
  });

  const [busMessage, setBusMessage] = useState<BusMessage>({
    type: 'IDLE',
    initiator: 'Nenhum',
    address: '',
    description: 'Barramento em repouso. Aguardando operações dos núcleos.'
  });

  const [eventLog, setEventLog] = useState<string[]>([
    'Simulador inicializado: Todas as linhas nas caches L1 estão no estado Inválido (I).'
  ]);

  const addLog = (msg: string) => {
    setEventLog((prev) => [msg, ...prev.slice(0, 19)]);
  };

  const resetMesi = () => {
    setCore0Cache({
      '0x1000': { address: '0x1000', state: 'I', value: 0 },
      '0x1040': { address: '0x1040', state: 'I', value: 0 }
    });
    setCore1Cache({
      '0x1000': { address: '0x1000', state: 'I', value: 0 },
      '0x1040': { address: '0x1040', state: 'I', value: 0 }
    });
    setRamMemory({ '0x1000': 0, '0x1040': 0 });
    setBusMessage({
      type: 'IDLE',
      initiator: 'Nenhum',
      address: '',
      description: 'Barramento reinicializado.'
    });
    setEventLog(['Caches e memória RAM reinicializadas.']);
  };

  const handleMesiRead = (core: 0 | 1, addr: string) => {
    const isCore0 = core === 0;
    const myCache = isCore0 ? core0Cache : core1Cache;
    const otherCache = isCore0 ? core1Cache : core0Cache;
    const myLine = myCache[addr];
    const otherLine = otherCache[addr];

    // Se já temos a linha válida, é um acerto local (Cache Hit)
    if (myLine.state === 'M' || myLine.state === 'E' || myLine.state === 'S') {
      setBusMessage({
        type: 'IDLE',
        initiator: isCore0 ? 'Core 0' : 'Core 1',
        address: addr,
        description: `Leitura local em Cache Hit: Linha já válida no estado ${myLine.state}. Zero tráfego de barramento.`
      });
      addLog(`[Core ${core}] Leitura em ${addr} (Acerto L1 no estado ${myLine.state}, valor=${myLine.value}).`);
      return;
    }

    // Caso de Falha de Leitura (Cache Miss): Emite BusRd no barramento
    let nextMyState: MesiState = 'E';
    let nextOtherState: MesiState = otherLine.state;
    let loadedValue = ramMemory[addr];
    let desc = '';

    if (otherLine.state === 'M') {
      // O outro núcleo tem dado modificado: ele descarrega na RAM e passa para Shared
      loadedValue = otherLine.value;
      setRamMemory((prev) => ({ ...prev, [addr]: loadedValue }));
      nextOtherState = 'S';
      nextMyState = 'S';
      desc = `BusRd emitido: Core ${1 - core} interceptou no estado M, gravou na RAM e compartilhou o bloco (S).`;
    } else if (otherLine.state === 'E' || otherLine.state === 'S') {
      // O outro núcleo tem a linha limpa: ambos ficam Shared
      nextOtherState = 'S';
      nextMyState = 'S';
      loadedValue = otherLine.value;
      desc = `BusRd emitido: Linha encontrada no Core ${1 - core}. Ambos transicionam para Compartilhado (S).`;
    } else {
      // Nenhum outro núcleo tem: linha carregada da RAM no estado Exclusivo
      nextMyState = 'E';
      desc = `BusRd emitido: Nenhum outro núcleo possui a linha. Bloco carregado da DRAM no estado Exclusivo (E).`;
    }

    if (isCore0) {
      setCore0Cache((prev) => ({ ...prev, [addr]: { address: addr, state: nextMyState, value: loadedValue } }));
      setCore1Cache((prev) => ({ ...prev, [addr]: { ...prev[addr], state: nextOtherState } }));
    } else {
      setCore1Cache((prev) => ({ ...prev, [addr]: { address: addr, state: nextMyState, value: loadedValue } }));
      setCore0Cache((prev) => ({ ...prev, [addr]: { ...prev[addr], state: nextOtherState } }));
    }

    setBusMessage({
      type: 'BusRd',
      initiator: isCore0 ? 'Core 0' : 'Core 1',
      address: addr,
      description: desc
    });
    addLog(`[Core ${core}] Leitura em ${addr}: Falha L1 -> BusRd emitido. Novo estado: ${nextMyState}.`);
  };

  const handleMesiWrite = (core: 0 | 1, addr: string) => {
    const isCore0 = core === 0;
    const myCache = isCore0 ? core0Cache : core1Cache;
    const otherCache = isCore0 ? core1Cache : core0Cache;
    const myLine = myCache[addr];
    const otherLine = otherCache[addr];
    const newValue = myLine.value + 1;

    let nextOtherState: MesiState = otherLine.state;
    let msgType: 'BusRdX' | 'BusInv' | 'IDLE' = 'IDLE';
    let desc = '';

    if (myLine.state === 'M') {
      // Já é exclusivo modificado: escrita local imediata sem barramento
      msgType = 'IDLE';
      desc = `Escrita local em estado Modificado (M): Linha exclusiva privada. Zero mensagens de barramento.`;
    } else if (myLine.state === 'E') {
      // É exclusivo limpo: transiciona silenciosamente para Modificado sem emitir no barramento
      msgType = 'IDLE';
      desc = `Escrita em estado Exclusivo (E): Transição direta para Modificado (M). Zero tráfego de barramento.`;
    } else if (myLine.state === 'S') {
      // Está compartilhado: precisa invalidar cópias dos outros núcleos
      msgType = 'BusInv';
      nextOtherState = 'I';
      desc = `BusInv emitido: Linha estava Compartilhada (S). Core ${1 - core} teve sua cópia invalidada (I).`;
    } else {
      // Está inválido: emite BusRdX (Read With Intent to Modify)
      msgType = 'BusRdX';
      nextOtherState = 'I';
      desc = `BusRdX (RWITM) emitido: Leitura com intenção de escrita. Linha obtida e cópia do Core ${1 - core} invalidada (I).`;
    }

    if (isCore0) {
      setCore0Cache((prev) => ({ ...prev, [addr]: { address: addr, state: 'M', value: newValue } }));
      setCore1Cache((prev) => ({ ...prev, [addr]: { ...prev[addr], state: nextOtherState } }));
    } else {
      setCore1Cache((prev) => ({ ...prev, [addr]: { address: addr, state: 'M', value: newValue } }));
      setCore0Cache((prev) => ({ ...prev, [addr]: { ...prev[addr], state: nextOtherState } }));
    }

    setBusMessage({
      type: msgType,
      initiator: isCore0 ? 'Core 0' : 'Core 1',
      address: addr,
      description: desc
    });
    addLog(`[Core ${core}] Escrita em ${addr} (novo valor=${newValue}): Linha agora no estado Modificado (M).`);
  };

  // =========================================================================
  // ESTADO DO FALSO COMPARTILHAMENTO (ABA 2)
  // =========================================================================
  const [isPadded, setIsPadded] = useState<boolean>(false);
  const [varX, setVarX] = useState<number>(0);
  const [varY, setVarY] = useState<number>(0);
  const [fsCore0LineState, setFsCore0LineState] = useState<MesiState>('I');
  const [fsCore1LineState, setFsCore1LineState] = useState<MesiState>('I');
  const [totalOperations, setTotalOperations] = useState<number>(0);
  const [invalidationCount, setInvalidationCount] = useState<number>(0);
  const [cacheMissCount, setCacheMissCount] = useState<number>(0);
  const [autoRunning, setAutoRunning] = useState<boolean>(false);
  const nextCoreRef = useRef<0 | 1>(0);

  const resetFalseSharing = () => {
    setAutoRunning(false);
    setVarX(0);
    setVarY(0);
    setFsCore0LineState('I');
    setFsCore1LineState('I');
    setTotalOperations(0);
    setInvalidationCount(0);
    setCacheMissCount(0);
    nextCoreRef.current = 0;
  };

  const stepFalseSharing = () => {
    const currentCore = nextCoreRef.current;
    nextCoreRef.current = currentCore === 0 ? 1 : 0;

    setTotalOperations((prev) => prev + 1);

    if (currentCore === 0) {
      setVarX((prev) => prev + 1);
    } else {
      setVarY((prev) => prev + 1);
    }

    if (!isPadded) {
      // Mesma linha de 64 bytes: cada escrita invalida o outro núcleo
      if (currentCore === 0) {
        setFsCore0LineState('M');
        if (fsCore1LineState !== 'I') {
          setInvalidationCount((prev) => prev + 1);
          setCacheMissCount((prev) => prev + 1);
        }
        setFsCore1LineState('I');
      } else {
        setFsCore1LineState('M');
        if (fsCore0LineState !== 'I') {
          setInvalidationCount((prev) => prev + 1);
          setCacheMissCount((prev) => prev + 1);
        }
        setFsCore0LineState('I');
      }
    } else {
      // Linhas separadas por alignas(64): zero invalidações espúrias
      setFsCore0LineState('M');
      setFsCore1LineState('M');
    }
  };

  useEffect(() => {
    let timer: any = null;
    if (autoRunning) {
      timer = setInterval(() => {
        stepFalseSharing();
      }, 350);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoRunning, isPadded, fsCore0LineState, fsCore1LineState]);

  // Função auxiliar de cor de estado MESI
  const getBadgeStyle = (state: MesiState) => {
    switch (state) {
      case 'M':
        return 'bg-coral/20 text-coral border-coral/40';
      case 'E':
        return 'bg-amber-600/20 text-amber-700 border-amber-600/40';
      case 'S':
        return 'bg-moss/20 text-moss border-moss/40';
      case 'I':
        return 'bg-smoke/20 text-smoke border-smoke/40';
    }
  };

  return (
    <div className="w-full my-8 bg-[#fbf9f5] border border-stone/20 rounded-xl overflow-hidden shadow-sm font-sans">
      {/* Cabeçalho do Componente */}
      <div className="px-6 py-4 bg-[#f3efe8] border-b border-stone/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-parchment rounded-lg border border-stone/20 text-off-black">
            <HugeiconsIcon icon={CpuIcon} size={20} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-off-black">
              Laboratório Interativo de Coerência de Cache e Falso Compartilhamento
            </h3>
            <p className="text-xs text-graphite">
              Simulação determinística do protocolo MESI no barramento de hardware e do fenômeno de contenção de linha de 64 bytes.
            </p>
          </div>
        </div>

        {/* Seleção de Abas */}
        <div className="flex items-center gap-1 bg-parchment p-1 rounded-lg border border-stone/20" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'mesi'}
            onClick={() => setActiveTab('mesi')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-md transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral ${
              activeTab === 'mesi'
                ? 'bg-[#e2ddd5] text-off-black font-semibold shadow-xs'
                : 'text-graphite hover:text-off-black'
            }`}
          >
            1. Protocolo MESI
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'false_sharing'}
            onClick={() => setActiveTab('false_sharing')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-md transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral ${
              activeTab === 'false_sharing'
                ? 'bg-[#e2ddd5] text-off-black font-semibold shadow-xs'
                : 'text-graphite hover:text-off-black'
            }`}
          >
            2. Falso Compartilhamento
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: PROTOCOLO MESI */}
      {activeTab === 'mesi' && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NÚCLEO 0 */}
            <div className="bg-parchment p-5 rounded-lg border border-stone/20 space-y-4">
              <div className="flex items-center justify-between border-b border-stone/15 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-700"></span>
                  <span className="font-mono text-sm font-bold text-off-black">Núcleo 0 (Core 0)</span>
                </div>
                <span className="text-xs font-mono text-smoke">Cache Privada L1 (64B / linha)</span>
              </div>

              {/* Linhas de Cache do Core 0 */}
              <div className="space-y-3">
                {['0x1000', '0x1040'].map((addr) => {
                  const line = core0Cache[addr];
                  return (
                    <div key={addr} className="p-3 bg-white/70 border border-stone/15 rounded-md space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-off-black">Endereço {addr}</span>
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getBadgeStyle(line.state)}`}>
                          Estado: {line.state}
                        </span>
                      </div>
                      <div className="text-xs text-graphite flex justify-between items-center">
                        <span>Valor em Cache: <strong className="font-mono text-off-black">{line.value}</strong></span>
                        <span className="text-[11px] text-smoke">
                          {line.state === 'I' ? 'Linha Inválida' : line.state === 'M' ? 'Modificado (Sujo)' : 'Limpo (Espelha RAM)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleMesiRead(0, addr)}
                          className="flex-1 py-1.5 px-2 bg-[#f3efe8] hover:bg-[#e9e3da] text-off-black text-xs font-mono font-medium rounded border border-stone/20 transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral"
                          aria-label={`Core 0: Ler endereço ${addr}`}
                        >
                          Ler ({addr})
                        </button>
                        <button
                          onClick={() => handleMesiWrite(0, addr)}
                          className="flex-1 py-1.5 px-2 bg-coral/10 hover:bg-coral/20 text-coral text-xs font-mono font-bold rounded border border-coral/30 transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral"
                          aria-label={`Core 0: Escrever no endereço ${addr}`}
                        >
                          Escrever ({addr})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NÚCLEO 1 */}
            <div className="bg-parchment p-5 rounded-lg border border-stone/20 space-y-4">
              <div className="flex items-center justify-between border-b border-stone/15 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-700"></span>
                  <span className="font-mono text-sm font-bold text-off-black">Núcleo 1 (Core 1)</span>
                </div>
                <span className="text-xs font-mono text-smoke">Cache Privada L1 (64B / linha)</span>
              </div>

              {/* Linhas de Cache do Core 1 */}
              <div className="space-y-3">
                {['0x1000', '0x1040'].map((addr) => {
                  const line = core1Cache[addr];
                  return (
                    <div key={addr} className="p-3 bg-white/70 border border-stone/15 rounded-md space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-off-black">Endereço {addr}</span>
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getBadgeStyle(line.state)}`}>
                          Estado: {line.state}
                        </span>
                      </div>
                      <div className="text-xs text-graphite flex justify-between items-center">
                        <span>Valor em Cache: <strong className="font-mono text-off-black">{line.value}</strong></span>
                        <span className="text-[11px] text-smoke">
                          {line.state === 'I' ? 'Linha Inválida' : line.state === 'M' ? 'Modificado (Sujo)' : 'Limpo (Espelha RAM)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleMesiRead(1, addr)}
                          className="flex-1 py-1.5 px-2 bg-[#f3efe8] hover:bg-[#e9e3da] text-off-black text-xs font-mono font-medium rounded border border-stone/20 transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral"
                          aria-label={`Core 1: Ler endereço ${addr}`}
                        >
                          Ler ({addr})
                        </button>
                        <button
                          onClick={() => handleMesiWrite(1, addr)}
                          className="flex-1 py-1.5 px-2 bg-coral/10 hover:bg-coral/20 text-coral text-xs font-mono font-bold rounded border border-coral/30 transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral"
                          aria-label={`Core 1: Escrever no endereço ${addr}`}
                        >
                          Escrever ({addr})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BARRAMENTO CENTRAL DE INTERCONEXÃO E SNOOPING */}
          <div className="p-4 bg-white rounded-lg border-2 border-dashed border-stone/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-off-black text-parchment text-xs font-mono font-bold rounded">
                  BARRAMENTO DE SNOOPING
                </span>
                <span className="text-xs text-graphite font-mono">
                  Última Transação: <strong className="text-coral">{busMessage.type}</strong> por {busMessage.initiator}
                </span>
              </div>
              <button
                onClick={resetMesi}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f3efe8] hover:bg-[#e9e3da] text-off-black text-xs font-mono font-medium rounded border border-stone/20 transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral"
                aria-label="Reinicializar simulador MESI"
              >
                <HugeiconsIcon icon={RotateCcwIcon} size={14} />
                Reinicializar
              </button>
            </div>
            <p className="text-xs font-mono text-off-black bg-[#fbf9f5] p-2.5 rounded border border-stone/15">
              {busMessage.description}
            </p>
          </div>

          {/* MEMÓRIA PRINCIPAL DRAM */}
          <div className="p-4 bg-[#f3efe8] rounded-lg border border-stone/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={Layers01Icon} size={18} className="text-graphite" />
              <div>
                <span className="text-xs font-mono font-bold text-off-black">Memória Principal (DRAM Compartilhada)</span>
                <p className="text-[11px] text-smoke">Valores salvos na memória externa quando linhas em estado M são descarregadas.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs">
              <span className="px-3 py-1 bg-white rounded border border-stone/20 text-off-black">
                Endereço 0x1000: <strong className="text-coral">{ramMemory['0x1000']}</strong>
              </span>
              <span className="px-3 py-1 bg-white rounded border border-stone/20 text-off-black">
                Endereço 0x1040: <strong className="text-coral">{ramMemory['0x1040']}</strong>
              </span>
            </div>
          </div>

          {/* HISTÓRICO DE MENSAGENS E TRANSIÇÕES */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-off-black">Log Sequencial de Eventos de Coerência:</span>
            <div className="p-3 bg-white rounded-lg border border-stone/20 max-h-36 overflow-y-auto space-y-1 font-mono text-xs text-graphite">
              {eventLog.map((log, i) => (
                <div key={i} className="leading-relaxed border-b border-stone/10 pb-1 last:border-0">
                  <span className="text-smoke mr-2">[{eventLog.length - i}]</span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: FALSO COMPARTILHAMENTO */}
      {activeTab === 'false_sharing' && (
        <div className="p-6 space-y-6">
          {/* Seletor de Modo: Vulnerável vs alignas(64) */}
          <div className="p-4 bg-white rounded-lg border border-stone/20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-off-black">Topologia de Memória:</span>
              <p className="text-xs text-graphite">
                {isPadded
                  ? 'Variáveis isoladas em linhas físicas separadas de 64 bytes via alignas(64).'
                  : 'Variáveis vizinhas alocadas consecutivamente dentro da mesma linha física de 64 bytes.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsPadded(false); resetFalseSharing(); }}
                className={`px-3 py-2 text-xs font-mono font-medium rounded-md border transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral ${
                  !isPadded
                    ? 'bg-coral/15 text-coral border-coral font-bold shadow-xs'
                    : 'bg-[#f3efe8] text-graphite border-stone/20'
                }`}
                aria-label="Selecionar modo sem preenchimento"
              >
                Mesma Linha (Vulnerável)
              </button>
              <button
                onClick={() => { setIsPadded(true); resetFalseSharing(); }}
                className={`px-3 py-2 text-xs font-mono font-medium rounded-md border transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral ${
                  isPadded
                    ? 'bg-moss/20 text-moss border-moss font-bold shadow-xs'
                    : 'bg-[#f3efe8] text-graphite border-stone/20'
                }`}
                aria-label="Selecionar modo com alinhamento de 64 bytes"
              >
                Linhas Separadas (alignas(64))
              </button>
            </div>
          </div>

          {/* VISUALIZAÇÃO FÍSICA DA LINHA DE CACHE */}
          <div className="p-5 bg-parchment rounded-lg border border-stone/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-off-black">Layout Físico das Linhas de Cache de 64 Bytes:</span>
              <span className="text-[11px] font-mono text-smoke">Tamanho do Bloco = 64B</span>
            </div>

            {!isPadded ? (
              // Modo Vulnerável: Mesma Linha
              <div className="p-4 bg-white rounded-lg border-2 border-coral/40 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-coral font-bold">
                  <span>Linha Física 0x2000 (64 Bytes Compartilhados)</span>
                  <span>CONFLITO ATIVO DE CACHE PING-PONG</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-cyan-700/10 border border-cyan-700/30 rounded">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-cyan-900">Variável X (8 Bytes)</span>
                      <span className="text-smoke">Offset +0B</span>
                    </div>
                    <p className="text-xs text-graphite mt-1">
                      Mutada pelo <strong className="text-cyan-900">Núcleo 0</strong>: valor = {varX}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-700/10 border border-amber-700/30 rounded">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-amber-900">Variável Y (8 Bytes)</span>
                      <span className="text-smoke">Offset +8B</span>
                    </div>
                    <p className="text-xs text-graphite mt-1">
                      Mutada pelo <strong className="text-amber-900">Núcleo 1</strong>: valor = {varY}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-coral font-mono">
                  Toda gravação do Núcleo 0 invalida a linha inteira no Núcleo 1, e toda gravação do Núcleo 1 invalida a linha inteira no Núcleo 0!
                </p>
              </div>
            ) : (
              // Modo Alinhado: Linhas Separadas
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border-2 border-moss/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-moss font-bold">
                    <span>Linha Física 0x2000 (64 Bytes)</span>
                    <span>ISOLADO</span>
                  </div>
                  <div className="p-3 bg-cyan-700/10 border border-cyan-700/30 rounded">
                    <span className="font-bold font-mono text-xs text-cyan-900">alignas(64) uint64_t x</span>
                    <p className="text-xs text-graphite mt-1">
                      Exclusivo do Núcleo 0: valor = {varX}
                    </p>
                  </div>
                  <p className="text-[11px] text-smoke font-mono">56 bytes de preenchimento (padding) inseridos pelo compilador.</p>
                </div>

                <div className="p-4 bg-white rounded-lg border-2 border-moss/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-moss font-bold">
                    <span>Linha Física 0x2040 (64 Bytes)</span>
                    <span>ISOLADO</span>
                  </div>
                  <div className="p-3 bg-amber-700/10 border border-amber-700/30 rounded">
                    <span className="font-bold font-mono text-xs text-amber-900">alignas(64) uint64_t y</span>
                    <p className="text-xs text-graphite mt-1">
                      Exclusivo do Núcleo 1: valor = {varY}
                    </p>
                  </div>
                  <p className="text-[11px] text-smoke font-mono">Linha independente. Zero invalidações cruzadas de barramento.</p>
                </div>
              </div>
            )}
          </div>

          {/* CONTADORES DE DESPERDÍCIO E PERFORMANCE */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border border-stone/20 text-center">
              <span className="text-[11px] font-mono text-smoke uppercase tracking-wider">Operações Totais</span>
              <p className="text-2xl font-mono font-bold text-off-black mt-1">{totalOperations}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-stone/20 text-center">
              <span className="text-[11px] font-mono text-smoke uppercase tracking-wider">Invalidações de Barramento</span>
              <p className={`text-2xl font-mono font-bold mt-1 ${invalidationCount > 0 ? 'text-coral' : 'text-moss'}`}>
                {invalidationCount}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-stone/20 text-center">
              <span className="text-[11px] font-mono text-smoke uppercase tracking-wider">Falhas Forçadas (Misses)</span>
              <p className={`text-2xl font-mono font-bold mt-1 ${cacheMissCount > 0 ? 'text-coral' : 'text-moss'}`}>
                {cacheMissCount}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-stone/20 text-center">
              <span className="text-[11px] font-mono text-smoke uppercase tracking-wider">Ciclos Desperdiçados</span>
              <p className={`text-2xl font-mono font-bold mt-1 ${invalidationCount > 0 ? 'text-coral' : 'text-moss'}`}>
                ~{invalidationCount * 150}
              </p>
            </div>
          </div>

          {/* CONTROLES DE SIMULAÇÃO */}
          <div className="p-4 bg-[#f3efe8] rounded-lg border border-stone/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={stepFalseSharing}
                className="flex items-center gap-1.5 px-4 py-2 bg-parchment hover:bg-[#e9e3da] text-off-black text-xs font-mono font-semibold rounded-md border border-stone/20 transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral"
                aria-label="Executar um ciclo de escrita"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                Executar 1 Passo
              </button>
              <button
                onClick={() => {
                  for (let i = 0; i < 10; i++) stepFalseSharing();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-parchment hover:bg-[#e9e3da] text-off-black text-xs font-mono font-semibold rounded-md border border-stone/20 transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral"
                aria-label="Executar dez ciclos de escrita"
              >
                <HugeiconsIcon icon={ZapIcon} size={16} />
                Executar 10 Passos
              </button>
              <button
                onClick={() => setAutoRunning((prev) => !prev)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold rounded-md border transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral ${
                  autoRunning
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-off-black text-white border-off-black hover:bg-graphite'
                }`}
                aria-label={autoRunning ? 'Pausar simulação automática' : 'Iniciar simulação contínua'}
              >
                <HugeiconsIcon icon={autoRunning ? PauseIcon : PlayIcon} size={16} />
                {autoRunning ? 'Pausar' : 'Simulação Contínua'}
              </button>
            </div>

            <button
              onClick={resetFalseSharing}
              className="flex items-center gap-1.5 px-3 py-2 bg-parchment hover:bg-[#e9e3da] text-graphite hover:text-off-black text-xs font-mono font-medium rounded-md border border-stone/20 transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-coral"
              aria-label="Zerar contadores de falso compartilhamento"
            >
              <HugeiconsIcon icon={RotateCcwIcon} size={14} />
              Zerar Contadores
            </button>
          </div>
        </div>
      )}

      {/* RODAPÉ EXPLICATIVO */}
      <div className="px-6 py-3 bg-[#f3efe8] border-t border-stone/20 flex items-center justify-between text-xs text-smoke font-mono">
        <span>Invariante: Coerência opera na granularidade indivisível de 64B.</span>
        <span>TeachYourself: Sistemas de Computação</span>
      </div>
    </div>
  );
}
