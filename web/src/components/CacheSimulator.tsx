import { useState, useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CpuIcon,
  RotateCcwIcon,
  PlayIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon
} from '@hugeicons/core-free-icons';

interface CacheLine {
  valid: boolean;
  dirty: boolean;
  tag: bigint;
  age: number; // Maior idade = menos recentemente usado
}

const SETS_COUNT = 4;
const WAYS_COUNT = 2;
const BLOCK_SIZE = 64; // 64 bytes
const OFFSET_BITS = 6; // 2^6 = 64
const SET_BITS = 2;    // 2^2 = 4

export default function CacheSimulator() {
  // Endereço físico de 64 bits em hex
  const [addressInput, setAddressInput] = useState<string>('0x00000040');
  const [accessMode, setAccessMode] = useState<'read' | 'write'>('read');

  // Estado da Cache: 4 Sets x 2 Ways
  const [cache, setCache] = useState<CacheLine[][]>(() =>
    Array.from({ length: SETS_COUNT }, () =>
      Array.from({ length: WAYS_COUNT }, () => ({
        valid: false,
        dirty: false,
        tag: 0n,
        age: 0,
      }))
    )
  );

  // Histórico de métricas
  const [stats, setStats] = useState({
    reads: 0,
    writes: 0,
    hits: 0,
    misses: 0,
    compulsoryMisses: 0,
    conflictMisses: 0,
    dramWritebacks: 0,
  });

  // Último resultado
  const [lastResult, setLastResult] = useState<{
    type: 'HIT' | 'MISS' | null;
    setIndex: number;
    wayIndex: number;
    evicted: boolean;
    evictedDirty: boolean;
    message: string;
  }>({
    type: null,
    setIndex: 0,
    wayIndex: 0,
    evicted: false,
    evictedDirty: false,
    message: 'Insira um endereço hexadecimal ou selecione um cenário pré-configurado.',
  });

  // Parser do endereço
  const parsedAddress = useMemo(() => {
    try {
      const clean = addressInput.trim().toLowerCase();
      const val = BigInt(clean.startsWith('0x') ? clean : '0x' + clean);
      const offset = Number(val & 0x3fn); // 6 bits (0 a 5)
      const setIndex = Number((val >> 6n) & 0x3n); // 2 bits (6 e 7)
      const tag = val >> 8n; // bits 8 adiante
      return {
        valid: true,
        val,
        offset,
        setIndex,
        tag,
        hexFull: '0x' + val.toString(16).padStart(8, '0'),
        hexTag: '0x' + tag.toString(16),
      };
    } catch {
      return {
        valid: false,
        val: 0n,
        offset: 0,
        setIndex: 0,
        tag: 0n,
        hexFull: '0x00000000',
        hexTag: '0x0',
      };
    }
  }, [addressInput]);

  // Execução do acesso
  const handleAccess = (forcedAddress?: string, forcedMode?: 'read' | 'write') => {
    const addrStr = forcedAddress || addressInput;
    const mode = forcedMode || accessMode;

    let val = 0n;
    try {
      const clean = addrStr.trim().toLowerCase();
      val = BigInt(clean.startsWith('0x') ? clean : '0x' + clean);
    } catch {
      return;
    }

    const offset = Number(val & 0x3fn);
    const setIndex = Number((val >> 6n) & 0x3n);
    const tag = val >> 8n;

    setCache((prevCache) => {
      const newCache = prevCache.map((set) => set.map((line) => ({ ...line })));
      const targetSet = newCache[setIndex];

      // 1. Procurar por Hit
      let hitWay = -1;
      for (let w = 0; w < WAYS_COUNT; w++) {
        if (targetSet[w].valid && targetSet[w].tag === tag) {
          hitWay = w;
          break;
        }
      }

      if (hitWay !== -1) {
        // CACHE HIT
        // Atualizar idade: a linha acessada fica com age 0; a outra envelhece
        targetSet[hitWay].age = 0;
        const otherWay = 1 - hitWay;
        targetSet[otherWay].age += 1;

        if (mode === 'write') {
          targetSet[hitWay].dirty = true;
        }

        setStats((prev) => ({
          ...prev,
          reads: mode === 'read' ? prev.reads + 1 : prev.reads,
          writes: mode === 'write' ? prev.writes + 1 : prev.writes,
          hits: prev.hits + 1,
        }));

        setLastResult({
          type: 'HIT',
          setIndex,
          wayIndex: hitWay,
          evicted: false,
          evictedDirty: false,
          message: `ACERTO (Cache Hit): Bloco encontrado no Conjunto ${setIndex}, Via ${hitWay}. Latência: ~4 ciclos de clock.`,
        });

        return newCache;
      }

      // CACHE MISS
      // Procurar via livre ou aplicar LRU
      let replaceWay = -1;
      for (let w = 0; w < WAYS_COUNT; w++) {
        if (!targetSet[w].valid) {
          replaceWay = w;
          break;
        }
      }

      let isEviction = false;
      let evictedDirty = false;

      if (replaceWay === -1) {
        // Ambas ocupadas: expulsar a com maior age (LRU)
        replaceWay = targetSet[0].age >= targetSet[1].age ? 0 : 1;
        isEviction = true;
        evictedDirty = targetSet[replaceWay].dirty;
      }

      // Atualizar dados da linha
      targetSet[replaceWay].valid = true;
      targetSet[replaceWay].tag = tag;
      targetSet[replaceWay].dirty = mode === 'write';
      targetSet[replaceWay].age = 0;

      const otherWay = 1 - replaceWay;
      targetSet[otherWay].age += 1;

      setStats((prev) => ({
        ...prev,
        reads: mode === 'read' ? prev.reads + 1 : prev.reads,
        writes: mode === 'write' ? prev.writes + 1 : prev.writes,
        misses: prev.misses + 1,
        compulsoryMisses: !isEviction ? prev.compulsoryMisses + 1 : prev.compulsoryMisses,
        conflictMisses: isEviction ? prev.conflictMisses + 1 : prev.conflictMisses,
        dramWritebacks: evictedDirty ? prev.dramWritebacks + 1 : prev.dramWritebacks,
      }));

      setLastResult({
        type: 'MISS',
        setIndex,
        wayIndex: replaceWay,
        evicted: isEviction,
        evictedDirty,
        message: isEviction
          ? `FALHA DE CONFLITO (Miss): Conjunto ${setIndex} cheio. Linha da Via ${replaceWay} expulsa via LRU.${
              evictedDirty ? ' Linha estava suja: gravada na DRAM (Write-Back).' : ''
            } Latência: ~100 ciclos.`
          : `FALHA COMPULSÓRIA (Cold Miss): Primeiro acesso ao bloco no Conjunto ${setIndex}. Bloco carregado na Via ${replaceWay}. Latência: ~100 ciclos.`,
      });

      return newCache;
    });
  };

  // Reset do simulador
  const handleReset = () => {
    setCache(
      Array.from({ length: SETS_COUNT }, () =>
        Array.from({ length: WAYS_COUNT }, () => ({
          valid: false,
          dirty: false,
          tag: 0n,
          age: 0,
        }))
      )
    );
    setStats({
      reads: 0,
      writes: 0,
      hits: 0,
      misses: 0,
      compulsoryMisses: 0,
      conflictMisses: 0,
      dramWritebacks: 0,
    });
    setLastResult({
      type: null,
      setIndex: 0,
      wayIndex: 0,
      evicted: false,
      evictedDirty: false,
      message: 'Simulador reiniciado. Todas as linhas marcadas como inválidas.',
    });
  };

  // Cenário: Varredura Linear em Vetor (Row-Major)
  const runSequentialScenario = () => {
    handleReset();
    const addresses = ['0x00000040', '0x00000044', '0x00000050', '0x00000078', '0x00000080'];
    addresses.forEach((addr, idx) => {
      setTimeout(() => {
        setAddressInput(addr);
        handleAccess(addr, 'read');
      }, idx * 300);
    });
  };

  // Cenário: Conflito de Conjunto (Thrashing no Set 0)
  const runConflictScenario = () => {
    handleReset();
    // Três endereços distintos com mesmo Set Index 00: 0x000, 0x100, 0x200
    const addresses = ['0x00000000', '0x00000100', '0x00000200', '0x00000000'];
    addresses.forEach((addr, idx) => {
      setTimeout(() => {
        setAddressInput(addr);
        handleAccess(addr, 'read');
      }, idx * 350);
    });
  };

  const totalAccesses = stats.hits + stats.misses;
  const hitRate = totalAccesses > 0 ? ((stats.hits / totalAccesses) * 100).toFixed(1) : '0.0';
  const amatEst =
    totalAccesses > 0
      ? (1 + (stats.misses / totalAccesses) * 100).toFixed(1)
      : '1.0';

  return (
    <div className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <HugeiconsIcon icon={CpuIcon} className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
              Simulador Interativo: Anatomia da Cache e Decomposição de Endereço
            </h4>
            <p className="font-mono text-xs text-smoke mt-0.5">
              Cache Associativa em Conjunto (4 Conjuntos, 2 Vias por Conjunto, Linhas de 64 Bytes)
            </p>
          </div>
        </div>

        {/* Botão de Reset */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-full border border-ash bg-parchment px-3.5 py-2 text-xs font-mono font-medium text-graphite hover:text-off-black hover:border-off-black transition-all min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-off-black"
        >
          <HugeiconsIcon icon={RotateCcwIcon} className="h-3.5 w-3.5 text-smoke" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Painel de Controle e Entrada */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        {/* Entrada do Endereço */}
        <div className="md:col-span-7 space-y-3">
          <label className="block text-xs font-mono uppercase tracking-wider text-smoke font-medium">
            Endereço de Memória (Hexadecimal):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="flex-1 rounded-xl border border-ash bg-parchment/60 px-4 py-2.5 font-mono text-sm text-off-black focus:border-lake-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-lake-blue"
              placeholder="Ex: 0x00000040"
            />
            <div className="flex rounded-xl border border-ash bg-parchment p-1">
              <button
                type="button"
                onClick={() => setAccessMode('read')}
                className={`rounded-lg px-3 py-2 min-h-[44px] inline-flex items-center text-xs font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
                  accessMode === 'read' ? 'bg-white text-off-black shadow-sm' : 'text-smoke hover:text-off-black'
                }`}
              >
                Leitura
              </button>
              <button
                type="button"
                onClick={() => setAccessMode('write')}
                className={`rounded-lg px-3 py-2 min-h-[44px] inline-flex items-center text-xs font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
                  accessMode === 'write' ? 'bg-white text-off-black shadow-sm' : 'text-smoke hover:text-off-black'
                }`}
              >
                Escrita
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleAccess()}
              className="flex items-center gap-1.5 rounded-xl bg-off-black text-white hover:bg-black px-4 py-2.5 min-h-[44px] text-xs font-mono font-medium transition-all shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2"
            >
              <HugeiconsIcon icon={PlayIcon} className="h-3.5 w-3.5" />
              <span>Acessar</span>
            </button>
          </div>

          {/* Botões de Cenários Rápidos */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-smoke">Cenários:</span>
            <button
              type="button"
              onClick={runSequentialScenario}
              className="rounded-full border border-ash bg-parchment px-3.5 py-2 min-h-[44px] inline-flex items-center text-xs font-mono text-graphite hover:text-off-black hover:border-off-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2"
            >
              Varredura Linear (Row-Major)
            </button>
            <button
              type="button"
              onClick={runConflictScenario}
              className="rounded-full border border-ash bg-parchment px-3.5 py-2 min-h-[44px] inline-flex items-center text-xs font-mono text-graphite hover:text-off-black hover:border-off-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2"
            >
              Conflito no Set 0 (Thrashing)
            </button>
          </div>
        </div>

        {/* Métricas Dinâmicas */}
        <div className="md:col-span-5 rounded-2xl border border-ash bg-parchment/40 p-4 font-mono text-xs space-y-2">
          <div className="flex justify-between items-center border-b border-ash/50 pb-2">
            <span className="text-smoke">Acessos Totais:</span>
            <span className="font-bold text-off-black">{totalAccesses}</span>
          </div>
          <div className="flex justify-between items-center border-b border-ash/50 pb-2">
            <span className="text-smoke">Taxa de Acerto (Hit Rate):</span>
            <span className={`font-bold ${Number(hitRate) > 70 ? 'text-mint' : 'text-coral'}`}>
              {hitRate}% ({stats.hits} hits / {stats.misses} misses)
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-ash/50 pb-2">
            <span className="text-smoke">Tempo Médio (AMAT Est.):</span>
            <span className="font-bold text-lake-blue">{amatEst} ciclos</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-smoke">Write-Backs na DRAM:</span>
            <span className="font-medium text-graphite">{stats.dramWritebacks}</span>
          </div>
        </div>
      </div>

      {/* Decomposição do Endereço em Bits */}
      <div className="rounded-2xl border border-ash bg-parchment/30 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs text-smoke uppercase tracking-wider font-medium">
            Decomposição de Hardware do Endereço de 64 bits:
          </span>
          <span className="font-mono text-xs text-off-black font-semibold">
            {parsedAddress.hexFull}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-2 text-center font-mono text-xs">
          {/* Tag */}
          <div className="col-span-8 rounded-xl border border-lake-blue/40 bg-lake-blue/10 p-3">
            <span className="block text-[10px] text-lake-blue font-bold uppercase tracking-wider">
              Tag (56 bits: [63:8])
            </span>
            <span className="block text-sm font-bold text-lake-blue mt-1">
              {parsedAddress.hexTag}
            </span>
            <span className="block text-[10px] text-smoke mt-0.5">Identificador do Bloco</span>
          </div>

          {/* Set Index */}
          <div className="col-span-2 rounded-xl border border-gold/40 bg-gold/10 p-3">
            <span className="block text-[10px] text-gold font-bold uppercase tracking-wider">
              Set (2 bits: [7:6])
            </span>
            <span className="block text-sm font-bold text-off-black mt-1">
              Set {parsedAddress.setIndex}
            </span>
            <span className="block text-[10px] text-smoke mt-0.5">Índice do Conjunto</span>
          </div>

          {/* Offset */}
          <div className="col-span-2 rounded-xl border border-coral/40 bg-coral/10 p-3">
            <span className="block text-[10px] text-coral font-bold uppercase tracking-wider">
              Offset (6 bits: [5:0])
            </span>
            <span className="block text-sm font-bold text-coral mt-1">
              Byte {parsedAddress.offset}
            </span>
            <span className="block text-[10px] text-smoke mt-0.5">Na Linha de 64B</span>
          </div>
        </div>
      </div>

      {/* Banner de Feedback do Acesso */}
      {lastResult.type && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 mb-6 transition-all ${
            lastResult.type === 'HIT'
              ? 'border-mint/50 bg-mint/10 text-off-black'
              : 'border-coral/50 bg-coral/10 text-off-black'
          }`}
        >
          <div className="mt-0.5">
            <HugeiconsIcon
              icon={lastResult.type === 'HIT' ? CheckmarkCircle01Icon : Cancel01Icon}
              className={`h-5 w-5 ${lastResult.type === 'HIT' ? 'text-mint' : 'text-coral'}`}
            />
          </div>
          <div className="text-xs font-mono space-y-0.5">
            <span className="font-bold uppercase tracking-wider">
              {lastResult.type === 'HIT' ? 'Acerto na Cache' : 'Falha na Cache (Miss)'}
            </span>
            <p className="text-graphite">{lastResult.message}</p>
          </div>
        </div>
      )}

      {/* Tabela Física dos Conjuntos da Cache */}
      <div className="rounded-2xl border border-ash overflow-hidden">
        <div className="bg-parchment border-b border-ash px-4 py-3 flex items-center justify-between text-xs font-mono text-smoke">
          <span>Estrutura Física da Cache L1 (4 Conjuntos x 2 Vias)</span>
          <span>Linha Atômica: 64 Bytes</span>
        </div>

        <div className="divide-y divide-ash">
          {cache.map((set, setIdx) => {
            const isTargetSet = parsedAddress.setIndex === setIdx;
            return (
              <div
                key={setIdx}
                className={`p-4 transition-all ${
                  isTargetSet ? 'bg-parchment/70 ring-1 ring-gold/40' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                        isTargetSet ? 'bg-gold text-off-black' : 'bg-ash text-graphite'
                      }`}
                    >
                      Conjunto {setIdx}
                    </span>
                    {isTargetSet && (
                      <span className="text-[10px] font-mono text-off-black font-semibold">
                        &larr; Alvo do Endereço
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-smoke">
                    {set.filter((l) => l.valid).length} / 2 vias ocupadas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                  {set.map((line, wayIdx) => {
                    const isTargetWay =
                      lastResult.type &&
                      lastResult.setIndex === setIdx &&
                      lastResult.wayIndex === wayIdx;

                    return (
                      <div
                        key={wayIdx}
                        className={`rounded-xl border p-3 transition-all ${
                          isTargetWay
                            ? lastResult.type === 'HIT'
                              ? 'border-mint bg-mint/10'
                              : 'border-coral bg-coral/10'
                            : line.valid
                            ? 'border-ash bg-parchment/40'
                            : 'border-dashed border-ash/70 bg-white text-smoke'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-ash/40 pb-2 mb-2">
                          <span className="font-bold text-off-black">Via {wayIdx}</span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                line.valid ? 'bg-mint/20 text-mint' : 'bg-ash text-smoke'
                              }`}
                            >
                              {line.valid ? 'Válido' : 'Vazio'}
                            </span>
                            {line.valid && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  line.dirty ? 'bg-coral/20 text-coral' : 'bg-ash text-graphite'
                                }`}
                              >
                                {line.dirty ? 'Sujo (Dirty)' : 'Limpo'}
                              </span>
                            )}
                          </div>
                        </div>

                        {line.valid ? (
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-smoke">Tag:</span>
                              <span className="font-bold text-lake-blue">
                                0x{line.tag.toString(16)}
                              </span>
                            </div>
                            <div className="flex justify-between text-smoke">
                              <span>Idade LRU:</span>
                              <span>{line.age === 0 ? 'Recente (MRU)' : 'Mais Antigo (LRU)'}</span>
                            </div>
                            <div className="flex justify-between text-smoke">
                              <span>Conteúdo:</span>
                              <span>Bloco de 64 bytes</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 text-center text-smoke text-[11px]">
                            Nenhum bloco mapeado
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
