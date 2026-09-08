import { useState, useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CpuIcon,
  DatabaseIcon,
  Layers01Icon,
  RotateCcwIcon,
  PlayIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  ZapIcon,
  ShieldAlertIcon,
  ShieldCheckIcon
} from '@hugeicons/core-free-icons';

interface PageWalkStep {
  level: string;
  index: number;
  tableAddress: string;
  entryContent: string;
  description: string;
}

interface ScenarioConfig {
  id: string;
  name: string;
  address: string;
  mode: 'tlb_hit' | 'page_walk' | 'demand_paging' | 'cow' | 'sigsegv';
  description: string;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'stack_var',
    name: 'Variável na Pilha (TLB Hit)',
    address: '0x00007ffdc3a18040',
    mode: 'tlb_hit',
    description: 'Acesso rápido em espaço de usuário (Ring 3). O TLB retém a tradução com latência de ~1 ciclo.'
  },
  {
    id: 'code_text',
    name: 'Instrução em .text (Page Walk)',
    address: '0x000000401248',
    mode: 'page_walk',
    description: 'TLB miss força o Page Table Walker da MMU a descer pelos 4 níveis da árvore PML4 na memória.'
  },
  {
    id: 'heap_demand',
    name: 'Alocação Sob Demanda (Demand Paging)',
    address: '0x000055555556a000',
    mode: 'demand_paging',
    description: 'Buffer alocado via malloc() com bit Present=0. O primeiro acesso de escrita dispara falta menor para alocar moldura.'
  },
  {
    id: 'fork_cow',
    name: 'Copy-on-Write após fork()',
    address: '0x00007ffff7fa0080',
    mode: 'cow',
    description: 'Página compartilhada marcada como somente leitura (R/W=0). Escrita dispara interrupção 14 para duplicar a moldura física.'
  },
  {
    id: 'kernel_violation',
    name: 'Violação de Isolamento (Kernel / SIGSEGV)',
    address: '0xffff888002400000',
    mode: 'sigsegv',
    description: 'Processo em Ring 3 tenta ler memória reservada ao Supervisor (U/S=0), disparando Page Fault com terminação fatal.'
  },
  {
    id: 'canonical_hole',
    name: 'Buraco Não-Canônico (#GP Fault)',
    address: '0x0001000000000000',
    mode: 'sigsegv',
    description: 'Endereço com extensão de sinal inconsistente. A CPU bloqueia a tradução na origem com falha geral de proteção.'
  }
];

export default function VirtualMemoryVisualizer() {
  const [addressInput, setAddressInput] = useState<string>('0x00007ffdc3a18040');
  const [activeMode, setActiveMode] = useState<'tlb_hit' | 'page_walk' | 'demand_paging' | 'cow' | 'sigsegv'>('tlb_hit');
  const [currentWalkStep, setCurrentWalkStep] = useState<number>(4);
  const [writeAttempt, setWriteAttempt] = useState<boolean>(false);

  // Parser do Endereço Virtual de 64 bits
  const parsed = useMemo(() => {
    try {
      const clean = addressInput.trim().toLowerCase();
      const val = BigInt(clean.startsWith('0x') ? clean : '0x' + clean);

      // Fatiamento de 48 bits:
      // Bits [11:0]: Page Offset (12 bits)
      const offset = Number(val & 0xfffn);
      // Bits [20:12]: PT Index (9 bits)
      const ptIndex = Number((val >> 12n) & 0x1ffn);
      // Bits [29:21]: PD Index (9 bits)
      const pdIndex = Number((val >> 21n) & 0x1ffn);
      // Bits [38:30]: PDPT Index (9 bits)
      const pdptIndex = Number((val >> 30n) & 0x1ffn);
      // Bits [47:39]: PML4 Index (9 bits)
      const pml4Index = Number((val >> 39n) & 0x1ffn);
      // Bit 47: Sinal de extensão
      const bit47 = Number((val >> 47n) & 1n);
      // Bits [63:48]: Extensão de sinal (16 bits)
      const signExt = Number((val >> 48n) & 0xffffn);

      // Verificação de endereço canônico x86-64
      // Se bit 47 for 0, bits [63:48] devem ser 0x0000 (metade usuário)
      // Se bit 47 for 1, bits [63:48] devem ser 0xffff (metade supervisor/kernel)
      const isCanonical = (bit47 === 0 && signExt === 0x0000) || (bit47 === 1 && signExt === 0xffff);
      const isKernelSpace = bit47 === 1 && signExt === 0xffff;

      // PPN simulado determinístico
      const simulatedPPN = isCanonical
        ? (0x24a0n + BigInt(pml4Index ^ pdptIndex ^ pdIndex ^ ptIndex)) & 0xfffffffn
        : 0n;

      const physicalAddress = (simulatedPPN << 12n) | BigInt(offset);

      return {
        valid: true,
        val,
        hexFull: '0x' + val.toString(16).padStart(16, '0'),
        signExtHex: '0x' + signExt.toString(16).padStart(4, '0'),
        bit47,
        isCanonical,
        isKernelSpace,
        pml4Index,
        pdptIndex,
        pdIndex,
        ptIndex,
        offset,
        simulatedPPN,
        physicalAddressHex: '0x' + physicalAddress.toString(16).padStart(10, '0')
      };
    } catch {
      return {
        valid: false,
        val: 0n,
        hexFull: '0x0000000000000000',
        signExtHex: '0x0000',
        bit47: 0,
        isCanonical: false,
        isKernelSpace: false,
        pml4Index: 0,
        pdptIndex: 0,
        pdIndex: 0,
        ptIndex: 0,
        offset: 0,
        simulatedPPN: 0n,
        physicalAddressHex: '0x0000000000'
      };
    }
  }, [addressInput]);

  // Flags da Entrada de Tabela (PTE) de acordo com o cenário ativo
  const pteFlags = useMemo(() => {
    if (!parsed.isCanonical) {
      return { p: 0, rw: 0, us: 0, a: 0, d: 0, nx: 1, label: 'Endereço Não-Canônico (Inválido)' };
    }
    if (activeMode === 'demand_paging') {
      return { p: 0, rw: 1, us: 1, a: 0, d: 0, nx: 1, label: 'Desmapeada (Demand Paging: P=0)' };
    }
    if (activeMode === 'cow') {
      return { p: 1, rw: 0, us: 1, a: 1, d: 0, nx: 1, label: 'Somente Leitura Compartilhada (COW: R/W=0)' };
    }
    if (activeMode === 'sigsegv' || parsed.isKernelSpace) {
      return { p: 1, rw: 1, us: 0, a: 1, d: 0, nx: 0, label: 'Supervisor Restrito (Ring 0: U/S=0)' };
    }
    if (addressInput === '0x000000401248') {
      return { p: 1, rw: 0, us: 1, a: 1, d: 0, nx: 0, label: 'Código Executável (.text: R/W=0, NX=0)' };
    }
    return { p: 1, rw: 1, us: 1, a: 1, d: writeAttempt ? 1 : 0, nx: 1, label: 'Página de Dados Normal (P=1, R/W=1, U/S=1)' };
  }, [parsed, activeMode, addressInput, writeAttempt]);

  // Passos de caminhamento da árvore PML4
  const walkSteps: PageWalkStep[] = useMemo(() => {
    return [
      {
        level: 'Nível 4: PML4 (Page Map Level 4)',
        index: parsed.pml4Index,
        tableAddress: '0x00000001000000 (via %cr3)',
        entryContent: `PML4E [${parsed.pml4Index}] -> Aponta para base física da PDPT (0x00000002041000)`,
        description: `Os 9 bits [47:39] indexam a tabela PML4 cuja raiz reside no registrador de controle %cr3.`
      },
      {
        level: 'Nível 3: PDPT (Page Directory Pointer Table)',
        index: parsed.pdptIndex,
        tableAddress: '0x00000002041000',
        entryContent: `PDPTE [${parsed.pdptIndex}] -> Aponta para base física do PD (0x00000003082000)`,
        description: `Os 9 bits [38:30] indexam a tabela de diretórios de páginas apontada pelo PML4E.`
      },
      {
        level: 'Nível 2: PD (Page Directory)',
        index: parsed.pdIndex,
        tableAddress: '0x00000003082000',
        entryContent: `PDE [${parsed.pdIndex}] -> Aponta para base física da PT (0x000000040c3000)`,
        description: `Os 9 bits [29:21] indexam o diretório de páginas. Em Huge Pages de 2 MiB, a tradução terminaria aqui.`
      },
      {
        level: 'Nível 1: PT (Page Table)',
        index: parsed.ptIndex,
        tableAddress: '0x000000040c3000',
        entryContent: `PTE [${parsed.ptIndex}] -> PPN 0x${parsed.simulatedPPN.toString(16)} (Flags: P=${pteFlags.p}, R/W=${pteFlags.rw}, U/S=${pteFlags.us})`,
        description: `Os 9 bits [20:12] indexam a tabela final contendo o número da moldura física (PPN).`
      },
      {
        level: 'Síntese Final: Endereço Físico na RAM',
        index: parsed.offset,
        tableAddress: parsed.physicalAddressHex,
        entryContent: `Base da Moldura (0x${(parsed.simulatedPPN << 12n).toString(16)}) + Deslocamento (${parsed.offset})`,
        description: `Os 12 bits inferiores do deslocamento não sofrem alteração e completam o endereço de 64 bits na RAM.`
      }
    ];
  }, [parsed, pteFlags]);

  // Manipulador de cenário
  const selectScenario = (sc: ScenarioConfig) => {
    setAddressInput(sc.address);
    setActiveMode(sc.mode);
    setCurrentWalkStep(sc.mode === 'page_walk' ? 0 : 4);
    setWriteAttempt(sc.mode === 'demand_paging' || sc.mode === 'cow');
  };

  const handleReset = () => {
    setAddressInput('0x00007ffdc3a18040');
    setActiveMode('tlb_hit');
    setCurrentWalkStep(4);
    setWriteAttempt(false);
  };

  return (
    <div className="my-8 rounded-3xl border border-ash bg-parchment/60 p-6 md:p-8 font-sans shadow-sm">
      {/* Cabeçalho do Visualizador */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-ash pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-lake-blue uppercase tracking-wider">
            <HugeiconsIcon icon={CpuIcon} className="h-4 w-4" />
            <span>Unidade de Gerenciamento de Memória (MMU) &bull; x86-64</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-off-black mt-1">
            Simulador de Paginação e Tradução de Memória Virtual
          </h3>
          <p className="text-xs text-smoke font-mono mt-1">
            Decomposição de 48 bits, árvore esparsa de 4 níveis (%cr3 &rarr; PML4) e ciclo de vida de Page Faults.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-full border border-ash bg-parchment px-3.5 py-2 text-xs font-mono font-medium text-graphite hover:text-off-black hover:border-off-black transition-all min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-off-black self-start md:self-auto"
        >
          <HugeiconsIcon icon={RotateCcwIcon} className="h-3.5 w-3.5 text-smoke" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Seletor de Cenários de Teste */}
      <div className="mb-6 space-y-2">
        <label className="block text-xs font-mono uppercase tracking-wider text-smoke font-medium">
          Cenários Arquiteturais Pré-Configurados:
        </label>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => selectScenario(sc)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-mono transition-all border min-h-[36px] ${
                addressInput.toLowerCase() === sc.address.toLowerCase()
                  ? 'border-lake-blue bg-lake-blue/10 text-lake-blue font-bold shadow-sm'
                  : 'border-ash bg-parchment text-graphite hover:text-off-black hover:border-off-black'
              }`}
            >
              {sc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Painel de Entrada de Endereço */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div className="md:col-span-8 space-y-2">
          <label className="block text-xs font-mono uppercase tracking-wider text-smoke font-medium">
            Endereço Virtual de 64 bits (Hexadecimal):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => {
                setAddressInput(e.target.value);
                setCurrentWalkStep(4);
              }}
              className="flex-1 rounded-xl border border-ash bg-parchment/80 px-4 py-2.5 font-mono text-sm text-off-black focus:border-lake-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-lake-blue"
              placeholder="Ex: 0x00007ffdc3a18040"
            />
            <button
              onClick={() => {
                setActiveMode('page_walk');
                setCurrentWalkStep(0);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-off-black text-white hover:bg-black px-4 py-2.5 text-xs font-mono font-medium transition-all shadow-sm active:scale-[0.98] min-h-[40px]"
            >
              <HugeiconsIcon icon={PlayIcon} className="h-3.5 w-3.5" />
              <span>Page Walk</span>
            </button>
          </div>
        </div>

        {/* Validação de Endereço Canônico */}
        <div className="md:col-span-4 rounded-2xl border border-ash bg-parchment/40 p-3.5 font-mono text-xs flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-smoke">Espaço Canônico:</span>
            {parsed.isCanonical ? (
              <span className="inline-flex items-center gap-1 font-bold text-mint">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-3.5 w-3.5" />
                Válido (48 bits)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-coral">
                <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
                Buraco Não-Canônico
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-smoke">Domínio de Privilégio:</span>
            <span className="font-semibold text-off-black">
              {parsed.isKernelSpace ? 'Kernel (Supervisor)' : 'Usuário (Ring 3)'}
            </span>
          </div>
        </div>
      </div>

      {/* Decomposição Gráfica do Endereço de 48 Bits */}
      <div className="rounded-2xl border border-ash bg-parchment/30 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs text-smoke uppercase tracking-wider font-medium">
            Fatiamento de Hardware x86-64 (Extensão de Sinal + 4 Níveis de 9 bits + Deslocamento de 12 bits):
          </span>
          <span className="font-mono text-xs text-off-black font-semibold">
            {parsed.hexFull}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-2 text-center font-mono text-xs">
          {/* Extensão de Sinal [63:48] */}
          <div className={`col-span-12 sm:col-span-2 rounded-xl border p-2.5 ${
            parsed.isCanonical ? 'border-ash bg-parchment/80' : 'border-coral/50 bg-coral/10 text-coral'
          }`}>
            <span className="block text-[10px] text-smoke font-bold uppercase tracking-wider">
              Sinal [63:48]
            </span>
            <span className="block text-xs font-bold text-graphite mt-1">
              {parsed.signExtHex}
            </span>
            <span className="block text-[9px] text-smoke mt-0.5">
              {parsed.bit47 === 0 ? 'Cópias do bit 47 (=0)' : 'Cópias do bit 47 (=1)'}
            </span>
          </div>

          {/* PML4 Index [47:39] */}
          <div className="col-span-6 sm:col-span-2 rounded-xl border border-lake-blue/40 bg-lake-blue/10 p-2.5">
            <span className="block text-[10px] text-lake-blue font-bold uppercase tracking-wider">
              PML4 [47:39]
            </span>
            <span className="block text-sm font-bold text-lake-blue mt-1">
              Índice {parsed.pml4Index}
            </span>
            <span className="block text-[9px] text-smoke mt-0.5">9 bits (0 a 511)</span>
          </div>

          {/* PDPT Index [38:30] */}
          <div className="col-span-6 sm:col-span-2 rounded-xl border border-gold/40 bg-gold/10 p-2.5">
            <span className="block text-[10px] text-gold font-bold uppercase tracking-wider">
              PDPT [38:30]
            </span>
            <span className="block text-sm font-bold text-off-black mt-1">
              Índice {parsed.pdptIndex}
            </span>
            <span className="block text-[9px] text-smoke mt-0.5">9 bits (0 a 511)</span>
          </div>

          {/* PD Index [29:21] */}
          <div className="col-span-6 sm:col-span-2 rounded-xl border border-mint/40 bg-mint/10 p-2.5">
            <span className="block text-[10px] text-mint font-bold uppercase tracking-wider">
              PD [29:21]
            </span>
            <span className="block text-sm font-bold text-off-black mt-1">
              Índice {parsed.pdIndex}
            </span>
            <span className="block text-[9px] text-smoke mt-0.5">9 bits (0 a 511)</span>
          </div>

          {/* PT Index [20:12] */}
          <div className="col-span-6 sm:col-span-2 rounded-xl border border-coral/40 bg-coral/10 p-2.5">
            <span className="block text-[10px] text-coral font-bold uppercase tracking-wider">
              PT [20:12]
            </span>
            <span className="block text-sm font-bold text-coral mt-1">
              Índice {parsed.ptIndex}
            </span>
            <span className="block text-[9px] text-smoke mt-0.5">9 bits (0 a 511)</span>
          </div>

          {/* Offset [11:0] */}
          <div className="col-span-12 sm:col-span-2 rounded-xl border border-ash bg-white/70 p-2.5">
            <span className="block text-[10px] text-smoke font-bold uppercase tracking-wider">
              Offset [11:0]
            </span>
            <span className="block text-sm font-bold text-off-black mt-1">
              Byte {parsed.offset}
            </span>
            <span className="block text-[9px] text-smoke mt-0.5">12 bits (4096B)</span>
          </div>
        </div>
      </div>

      {/* Painel de Flags da Entrada de Tabela de Páginas (PTE) */}
      <div className="rounded-2xl border border-ash bg-parchment/40 p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <span className="font-mono text-xs text-smoke uppercase tracking-wider font-medium">
            Entrada de Tabela de Páginas (PTE de 64 bits):
          </span>
          <span className="font-mono text-xs text-lake-blue font-semibold">
            {pteFlags.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono text-center">
          {/* Bit P (Present) */}
          <div className={`rounded-xl border p-2.5 ${pteFlags.p === 1 ? 'border-mint/50 bg-mint/10' : 'border-coral/50 bg-coral/10'}`}>
            <span className="block text-[10px] text-smoke font-bold">Bit 0: P (Present)</span>
            <span className={`block text-base font-bold mt-0.5 ${pteFlags.p === 1 ? 'text-mint' : 'text-coral'}`}>
              {pteFlags.p}
            </span>
            <span className="block text-[9px] text-smoke">{pteFlags.p === 1 ? 'Em RAM Física' : 'Desmapeada / Swap'}</span>
          </div>

          {/* Bit R/W (Read/Write) */}
          <div className={`rounded-xl border p-2.5 ${pteFlags.rw === 1 ? 'border-mint/50 bg-mint/10' : 'border-gold/50 bg-gold/10'}`}>
            <span className="block text-[10px] text-smoke font-bold">Bit 1: R/W</span>
            <span className="block text-base font-bold text-off-black mt-0.5">
              {pteFlags.rw}
            </span>
            <span className="block text-[9px] text-smoke">{pteFlags.rw === 1 ? 'Leitura e Escrita' : 'Somente Leitura'}</span>
          </div>

          {/* Bit U/S (User/Supervisor) */}
          <div className={`rounded-xl border p-2.5 ${pteFlags.us === 1 ? 'border-lake-blue/50 bg-lake-blue/10' : 'border-coral/50 bg-coral/10'}`}>
            <span className="block text-[10px] text-smoke font-bold">Bit 2: U/S</span>
            <span className="block text-base font-bold text-off-black mt-0.5">
              {pteFlags.us}
            </span>
            <span className="block text-[9px] text-smoke">{pteFlags.us === 1 ? 'Ring 3 (Usuário)' : 'Ring 0 (Supervisor)'}</span>
          </div>

          {/* Bit A (Accessed) */}
          <div className="rounded-xl border border-ash bg-parchment p-2.5">
            <span className="block text-[10px] text-smoke font-bold">Bit 5: A (Accessed)</span>
            <span className="block text-base font-bold text-off-black mt-0.5">
              {pteFlags.a}
            </span>
            <span className="block text-[9px] text-smoke">Lida pela CPU</span>
          </div>

          {/* Bit D (Dirty) */}
          <div className={`rounded-xl border p-2.5 ${pteFlags.d === 1 ? 'border-gold/50 bg-gold/10' : 'border-ash bg-parchment'}`}>
            <span className="block text-[10px] text-smoke font-bold">Bit 6: D (Dirty)</span>
            <span className="block text-base font-bold text-off-black mt-0.5">
              {pteFlags.d}
            </span>
            <span className="block text-[9px] text-smoke">{pteFlags.d === 1 ? 'Modificada na RAM' : 'Não Alterada'}</span>
          </div>

          {/* Bit NX (No-Execute) */}
          <div className={`rounded-xl border p-2.5 ${pteFlags.nx === 1 ? 'border-lake-blue/50 bg-lake-blue/10' : 'border-ash bg-parchment'}`}>
            <span className="block text-[10px] text-smoke font-bold">Bit 63: NX / XD</span>
            <span className="block text-base font-bold text-off-black mt-0.5">
              {pteFlags.nx}
            </span>
            <span className="block text-[9px] text-smoke">{pteFlags.nx === 1 ? 'Execução Bloqueada' : 'Código Executável'}</span>
          </div>
        </div>
      </div>

      {/* Árvore de Caminhamento (Page Walk Visualizer) */}
      <div className="rounded-2xl border border-ash bg-parchment/50 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Layers01Icon} className="h-4 w-4 text-lake-blue" />
            <span className="font-mono text-xs font-bold text-off-black uppercase tracking-wider">
              Caminhamento em Hardware (Page Table Walk):
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentWalkStep((s) => Math.max(0, s - 1))}
              disabled={currentWalkStep <= 0}
              className="rounded-lg border border-ash bg-parchment px-2 py-1 text-xs font-mono text-graphite disabled:opacity-40"
            >
              &larr; Anterior
            </button>
            <span className="font-mono text-xs text-smoke px-1">
              Passo {currentWalkStep + 1} de 5
            </span>
            <button
              onClick={() => setCurrentWalkStep((s) => Math.min(4, s + 1))}
              disabled={currentWalkStep >= 4}
              className="rounded-lg border border-ash bg-parchment px-2 py-1 text-xs font-mono text-graphite disabled:opacity-40"
            >
              Próximo &rarr;
            </button>
          </div>
        </div>

        {/* Etapas do Caminhamento */}
        <div className="space-y-3">
          {walkSteps.slice(0, currentWalkStep + 1).map((step, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-3.5 font-mono text-xs transition-all ${
                idx === currentWalkStep
                  ? 'border-lake-blue bg-white shadow-sm'
                  : 'border-ash/60 bg-parchment/40 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-ash/40 pb-2 mb-2">
                <span className="font-bold text-off-black">{step.level}</span>
                <span className="text-[11px] text-lake-blue">Tabela Física: {step.tableAddress}</span>
              </div>
              <p className="text-graphite mb-1">{step.entryContent}</p>
              <p className="text-[11px] text-smoke">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Banner de Feedback e Diagnóstico Causal */}
      <div className="rounded-2xl border border-ash bg-parchment/60 p-5 font-mono text-xs space-y-3">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-off-black">
          <HugeiconsIcon icon={ZapIcon} className="h-4 w-4 text-lake-blue" />
          <span>Diagnóstico da Tradução da MMU:</span>
        </div>

        {activeMode === 'tlb_hit' && (
          <div className="rounded-xl border border-mint/50 bg-mint/10 p-4 text-graphite space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-mint">
              <HugeiconsIcon icon={ShieldCheckIcon} className="h-4 w-4" />
              <span>ACERTO DE TLB (TLB Hit) &bull; Latência: ~1 ciclo de clock (~0,3 ns)</span>
            </div>
            <p>
              O par VPN &rarr; PPN foi encontrado diretamente na memória associativa da MMU.
              A CPU obtém o endereço físico <span className="font-bold text-off-black">{parsed.physicalAddressHex}</span> sem
              nenhum caminhamento de árvore na memória RAM.
            </p>
          </div>
        )}

        {activeMode === 'page_walk' && (
          <div className="rounded-xl border border-lake-blue/50 bg-lake-blue/10 p-4 text-graphite space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-lake-blue">
              <HugeiconsIcon icon={DatabaseIcon} className="h-4 w-4" />
              <span>FALHA DE TLB (TLB Miss) &bull; Latência: ~10 a 200 ciclos de clock</span>
            </div>
            <p>
              A MMU acionou o Page Table Walker de hardware. Foram realizadas 4 leituras hierárquicas
              (PML4 &rarr; PDPT &rarr; PD &rarr; PT) para carregar a tradução na cache TLB.
              Endereço físico resolvido: <span className="font-bold text-off-black">{parsed.physicalAddressHex}</span>.
            </p>
          </div>
        )}

        {activeMode === 'demand_paging' && (
          <div className="rounded-xl border border-gold/50 bg-gold/10 p-4 text-graphite space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gold">
              <HugeiconsIcon icon={ShieldAlertIcon} className="h-4 w-4" />
              <span>FALTA MENOR: Alocação Sob Demanda (Demand Paging) &bull; Latência: ~2 µs</span>
            </div>
            <p>
              A MMU detectou o bit <span className="font-bold">Present=0</span> e interrompeu a CPU via vetor 14 (#PF).
              O tratador do kernel verificou a validade da faixa no descritor de memória, alocou uma moldura física livre
              na RAM, gravou a entrada de tabela e reiniciou a instrução de escrita de forma transparente.
            </p>
          </div>
        )}

        {activeMode === 'cow' && (
          <div className="rounded-xl border border-gold/50 bg-gold/10 p-4 text-graphite space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gold">
              <HugeiconsIcon icon={ShieldAlertIcon} className="h-4 w-4" />
              <span>FALTA DE PROTEÇÃO: Copy-on-Write (COW) &bull; Latência: ~3 µs</span>
            </div>
            <p>
              Tentativa de escrita em moldura compartilhada marcada como somente leitura (<span className="font-bold">R/W=0</span>).
              O tratador de interrupção 14 do kernel interceptou a falta, copiou a moldura física de 4 KiB para uma nova área,
              reconfigurou a PTE do processo escritor com <span className="font-bold">R/W=1</span> e retomou a execução.
            </p>
          </div>
        )}

        {activeMode === 'sigsegv' && (
          <div className="rounded-xl border border-coral/50 bg-coral/10 p-4 text-graphite space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-coral">
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
              <span>VIOLAÇÃO FATAL DE SEGURANÇA: Segmentation Fault (SIGSEGV) / #GP</span>
            </div>
            <p>
              O endereço solicitado {parsed.isKernelSpace ? 'pertence ao Supervisor (U/S=0) e foi acessado a partir de Ring 3' : 'viola o espaço canônico de 48 bits'}.
              A MMU impediu a transmissão de dados no barramento e a CPU disparou interrupção fatal. O kernel envia
              o sinal SIGSEGV ao processo, terminando sua execução imediatamente.
            </p>
          </div>
        )}

        {/* Resumo de Latências Arquiteturais */}
        <div className="pt-2 border-t border-ash/40 flex flex-wrap items-center justify-between text-[11px] text-smoke">
          <span>TLB Hit: ~0,3 a 1 ns</span>
          <span>TLB Miss (Caches): ~3 a 8 ns</span>
          <span>TLB Miss (DRAM): ~50 a 100 ns</span>
          <span>Falta Menor (RAM): ~1 a 3 µs</span>
          <span>Falta Maior (Disco): ~10 a 100 ms</span>
        </div>
      </div>
    </div>
  );
}
