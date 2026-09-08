import { useState, useEffect } from 'react';

const CpuIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2" />
  </svg>
);

const PlayIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const RefreshCwIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);


export default function LogicCircuitsSandbox() {
  const [tab, setTab] = useState<'inverter' | 'nand' | 'adder' | 'flipflop'>('inverter');

  // Inverter states
  const [invIn, setInvIn] = useState<number>(0);

  // NAND states
  const [nandA, setNandA] = useState<number>(1);
  const [nandB, setNandB] = useState<number>(1);

  // Half Adder states
  const [addA, setAddA] = useState<number>(1);
  const [addB, setAddB] = useState<number>(1);

  // Flip-Flop states
  const [ffD, setFfD] = useState<number>(1);
  const [ffClk, setFfClk] = useState<number>(0);
  const [ffQ, setFfQ] = useState<number>(0);
  const [autoClock, setAutoClock] = useState<boolean>(false);
  const [lastEdge, setLastEdge] = useState<string>('Nenhuma borda recente');

  // Computed values
  const invOut = invIn === 0 ? 1 : 0;
  const pmosConduction = invIn === 0;
  const nmosConduction = invIn === 1;

  const nandOut = !(nandA === 1 && nandB === 1) ? 1 : 0;

  const sumBit = addA ^ addB;
  const carryBit = addA & addB;

  // Flip-Flop clock toggle
  const toggleClock = () => {
    setFfClk((prev) => {
      const next = prev === 0 ? 1 : 0;
      if (next === 1) {
        // Borda de subida: captura entrada D
        setFfQ(ffD);
        setLastEdge('Borda de subida detectada: Q capturou D = ' + ffD);
      } else {
        setLastEdge('Borda de descida: Q mantem valor anterior');
      }
      return next;
    });
  };

  useEffect(() => {
    if (!autoClock) return;
    const interval = setInterval(() => {
      toggleClock();
    }, 1200);
    return () => clearInterval(interval);
  }, [autoClock, ffD]);

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2b59d1]/10 text-lake-blue">
            <CpuIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-lake-blue">Simulador Fisico Interativo</span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
              Laboratorio de Circuitos: Da Chave ao Registrador
            </h4>
            <p className="font-mono text-xs text-graphite mt-0.5">
              Experimente a comutacao eletrica dos transistores, portas logicas e a captura do clock
            </p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-ash bg-canvas p-1">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'inverter'}
            onClick={() => setTab('inverter')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-mono transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
              tab === 'inverter'
                ? 'bg-white text-lake-blue font-semibold shadow-xs border border-ash'
                : 'text-graphite hover:text-off-black'
            }`}
          >
            1. Inversor CMOS
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'nand'}
            onClick={() => setTab('nand')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-mono transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
              tab === 'nand'
                ? 'bg-white text-lake-blue font-semibold shadow-xs border border-ash'
                : 'text-graphite hover:text-off-black'
            }`}
          >
            2. Porta NAND
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'adder'}
            onClick={() => setTab('adder')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-mono transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
              tab === 'adder'
                ? 'bg-white text-lake-blue font-semibold shadow-xs border border-ash'
                : 'text-graphite hover:text-off-black'
            }`}
          >
            3. Meio Somador
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'flipflop'}
            onClick={() => setTab('flipflop')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-mono transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
              tab === 'flipflop'
                ? 'bg-white text-lake-blue font-semibold shadow-xs border border-ash'
                : 'text-graphite hover:text-off-black'
            }`}
          >
            4. Flip-Flop D & Clock
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="mt-6">
        {/* ABA 1: INVERSOR CMOS */}
        {tab === 'inverter' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-lg border border-ash bg-canvas p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-ash pb-3 mb-4">
                <span className="font-mono text-xs text-graphite uppercase">Diagrama do Par Complementar CMOS</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-ash text-lake-blue font-semibold">
                  Saida V_out = {invOut} ({invOut === 1 ? '3.3V / VDD' : '0.0V / GND'})
                </span>
              </div>

              {/* Schematic ASCII / Visual Box */}
              <div className="flex flex-col items-center justify-center py-4 font-mono text-xs">
                <div className="px-4 py-1 rounded bg-[#2b59d1]/15 text-lake-blue border border-[#2b59d1]/30 font-bold mb-2">
                  + VDD (Alimentacao: 3.3V)
                </div>
                <div className="h-6 w-0.5 bg-graphite" />
                {/* PMOS Transistor Box */}
                <div
                  className={`w-56 p-3 rounded border text-center transition-all ${
                    pmosConduction
                      ? 'border-forest-green bg-forest-green/10 text-forest-green font-bold shadow-xs'
                      : 'border-ash bg-white text-smoke'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs text-graphite">
                    <span>Transistor PMOS</span>
                    <span>{pmosConduction ? 'FECHADO (Conduz)' : 'ABERTO (Bloqueia)'}</span>
                  </div>
                  <div className="mt-1">
                    Gate = {invIn}V {pmosConduction ? '→ Canal Ativado' : '→ Canal Cortado'}
                  </div>
                </div>

                <div className="h-6 w-0.5 bg-graphite relative flex items-center justify-center">
                  <div className="absolute -right-28 flex items-center gap-2">
                    <span className="h-0.5 w-6 bg-graphite" />
                    <span className="px-3 py-1 rounded bg-white border border-ash font-bold text-off-black">
                      V_out = {invOut}
                    </span>
                  </div>
                </div>

                {/* NMOS Transistor Box */}
                <div
                  className={`w-56 p-3 rounded border text-center transition-all ${
                    nmosConduction
                      ? 'border-terracotta-red bg-terracotta-red/10 text-terracotta-red font-bold shadow-xs'
                      : 'border-ash bg-white text-smoke'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs text-graphite">
                    <span>Transistor NMOS</span>
                    <span>{nmosConduction ? 'FECHADO (Conduz)' : 'ABERTO (Bloqueia)'}</span>
                  </div>
                  <div className="mt-1">
                    Gate = {invIn}V {nmosConduction ? '→ Canal Ativado' : '→ Canal Cortado'}
                  </div>
                </div>

                <div className="h-6 w-0.5 bg-graphite" />
                <div className="px-4 py-1 rounded bg-graphite/15 text-graphite border border-graphite/30 font-bold mt-2">
                  GND (Terra: 0V)
                </div>
              </div>

              <div className="mt-4 rounded border border-ash bg-white p-3 text-xs text-graphite">
                <strong>Invariante Fisico de Potencia:</strong> Em repouso, ou o PMOS conduz ou o NMOS conduz, mas nunca os dois juntos. Nao existe caminho condutor continuo entre VDD e GND. A corrente estatica e nula.
              </div>
            </div>

            {/* Inverter Controls & Truth Table */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="rounded-lg border border-ash bg-white p-5">
                <h5 className="font-serif text-base text-off-black mb-2">Entrada de Tensao (V_in)</h5>
                <p className="text-xs text-graphite mb-4">
                  Alterne a tensao aplicada na porta comum dos transistores:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInvIn(0)}
                    className={`py-3 rounded border font-mono text-sm transition-all ${
                      invIn === 0
                        ? 'border-lake-blue bg-lake-blue/10 text-lake-blue font-bold shadow-xs'
                        : 'border-ash bg-canvas text-graphite hover:border-graphite'
                    }`}
                  >
                    V_in = 0 (GND / 0V)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvIn(1)}
                    className={`py-3 rounded border font-mono text-sm transition-all ${
                      invIn === 1
                        ? 'border-lake-blue bg-lake-blue/10 text-lake-blue font-bold shadow-xs'
                        : 'border-ash bg-canvas text-graphite hover:border-graphite'
                    }`}
                  >
                    V_in = 1 (VDD / 3.3V)
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-ash bg-white p-5">
                <h5 className="font-serif text-base text-off-black mb-2">Tabela-Verdade do Inversor (NOT)</h5>
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-ash text-graphite">
                      <th className="py-2 text-left">V_in</th>
                      <th className="py-2 text-left">PMOS (Pull-up)</th>
                      <th className="py-2 text-left">NMOS (Pull-down)</th>
                      <th className="py-2 text-right">V_out</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={`border-b border-ash/50 ${invIn === 0 ? 'bg-lake-blue/10 font-bold' : ''}`}>
                      <td className="py-2">0</td>
                      <td className="py-2 text-forest-green">Conduz</td>
                      <td className="py-2 text-smoke">Corta</td>
                      <td className="py-2 text-right text-lake-blue">1</td>
                    </tr>
                    <tr className={invIn === 1 ? 'bg-lake-blue/10 font-bold' : ''}>
                      <td className="py-2">1</td>
                      <td className="py-2 text-smoke">Corta</td>
                      <td className="py-2 text-terracotta-red">Conduz</td>
                      <td className="py-2 text-right text-lake-blue">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: PORTA NAND */}
        {tab === 'nand' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-lg border border-ash bg-canvas p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-ash pb-3 mb-4">
                <span className="font-mono text-xs text-graphite uppercase">Estrutura Interna da Porta NAND CMOS</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-ash text-lake-blue font-semibold">
                  Saida NAND(A, B) = {nandOut}
                </span>
              </div>

              <div className="space-y-4 my-2 text-xs font-mono">
                <div className="rounded border border-ash bg-white p-3">
                  <div className="text-graphite font-bold mb-1">Rede Pull-Up (2 Transistores PMOS em Paralelo):</div>
                  <div className="text-off-black">
                    Se A=0 OU B=0, pelo menos um PMOS conduz conectando a saida a VDD.
                    Resultado atual: {nandA === 0 || nandB === 0 ? 'Conducao ativa para VDD' : 'Bloqueado (ambos cortam)'}
                  </div>
                </div>

                <div className="rounded border border-ash bg-white p-3">
                  <div className="text-graphite font-bold mb-1">Rede Pull-Down (2 Transistores NMOS em Serie):</div>
                  <div className="text-off-black">
                    Apenas quando A=1 E B=1 simultaneamente os dois NMOS em serie conduzem, drenando a saida para GND.
                    Resultado atual: {nandA === 1 && nandB === 1 ? 'Conducao ativa para GND (Saida 0)' : 'Circuito aberto para GND (Saida 1)'}
                  </div>
                </div>
              </div>

              <div className="rounded border border-ash bg-white p-3 text-xs text-graphite">
                <strong>Universalidade Funcional:</strong> Conectando as duas entradas da NAND no mesmo sinal A, obtemos um NOT. Invertendo a saida de uma NAND com outra NAND, obtemos um AND. Aplicando as leis de De Morgan, obtemos OR, XOR e qualquer circuito da computacao.
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="rounded-lg border border-ash bg-white p-5">
                <h5 className="font-serif text-base text-off-black mb-2">Entradas da Porta NAND</h5>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-mono text-graphite block mb-1">Entrada A</label>
                    <button
                      type="button"
                      onClick={() => setNandA((v) => (v === 1 ? 0 : 1))}
                      className="w-full py-2.5 rounded border border-ash bg-canvas hover:border-graphite font-mono text-sm font-bold text-off-black"
                    >
                      A = {nandA}
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-graphite block mb-1">Entrada B</label>
                    <button
                      type="button"
                      onClick={() => setNandB((v) => (v === 1 ? 0 : 1))}
                      className="w-full py-2.5 rounded border border-ash bg-canvas hover:border-graphite font-mono text-sm font-bold text-off-black"
                    >
                      B = {nandB}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-ash bg-white p-5">
                <h5 className="font-serif text-base text-off-black mb-2">Tabela-Verdade da Porta NAND</h5>
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-ash text-graphite">
                      <th className="py-2 text-left">A</th>
                      <th className="py-2 text-left">B</th>
                      <th className="py-2 text-left">AND(A, B)</th>
                      <th className="py-2 text-right">NAND(A, B)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [0, 0, 0, 1],
                      [0, 1, 0, 1],
                      [1, 0, 0, 1],
                      [1, 1, 1, 0],
                    ].map(([a, b, andVal, nandVal], i) => {
                      const isActive = nandA === a && nandB === b;
                      return (
                        <tr key={i} className={`border-b border-ash/40 ${isActive ? 'bg-lake-blue/10 font-bold' : ''}`}>
                          <td className="py-1.5">{a}</td>
                          <td className="py-1.5">{b}</td>
                          <td className="py-1.5 text-smoke">{andVal}</td>
                          <td className="py-1.5 text-right text-lake-blue">{nandVal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: MEIO SOMADOR */}
        {tab === 'adder' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-lg border border-ash bg-canvas p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-ash pb-3 mb-4">
                <span className="font-mono text-xs text-graphite uppercase">Circuito do Meio Somador (Half Adder)</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-ash text-lake-blue font-semibold">
                  A + B = Carry({carryBit}) e Soma({sumBit})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 my-3 font-mono text-xs">
                <div className="rounded border border-ash bg-white p-4 text-center">
                  <div className="text-graphite font-bold mb-1">Porta XOR (Calcula a Soma)</div>
                  <div className="text-lg font-bold text-lake-blue my-2">Soma = {sumBit}</div>
                  <div className="text-xs text-smoke">Expressao: S = A ⊕ B</div>
                </div>

                <div className="rounded border border-ash bg-white p-4 text-center">
                  <div className="text-graphite font-bold mb-1">Porta AND (Calcula o Carry)</div>
                  <div className="text-lg font-bold text-terracotta-red my-2">Carry = {carryBit}</div>
                  <div className="text-xs text-smoke">Expressao: C = A · B</div>
                </div>
              </div>

              <div className="rounded border border-ash bg-white p-3 text-xs text-graphite">
                <strong>Construcao Hierarquica:</strong> Um Meio Somador junta 2 bits. Dois Meios Somadores mais uma porta OR formam um Somador Completo (Full Adder), capaz de receber o Carry-in da coluna anterior. Encadear 64 Full Adders forma o somador completo de 64 bits da CPU.
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="rounded-lg border border-ash bg-white p-5">
                <h5 className="font-serif text-base text-off-black mb-2">Bits de Entrada</h5>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-mono text-graphite block mb-1">Bit A</label>
                    <button
                      type="button"
                      onClick={() => setAddA((v) => (v === 1 ? 0 : 1))}
                      className="w-full py-2.5 rounded border border-ash bg-canvas hover:border-graphite font-mono text-sm font-bold text-off-black"
                    >
                      A = {addA}
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-graphite block mb-1">Bit B</label>
                    <button
                      type="button"
                      onClick={() => setAddB((v) => (v === 1 ? 0 : 1))}
                      className="w-full py-2.5 rounded border border-ash bg-canvas hover:border-graphite font-mono text-sm font-bold text-off-black"
                    >
                      B = {addB}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-ash bg-white p-5">
                <h5 className="font-serif text-base text-off-black mb-2">Tabela-Verdade da Soma Binaria</h5>
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-ash text-graphite">
                      <th className="py-2 text-left">A</th>
                      <th className="py-2 text-left">B</th>
                      <th className="py-2 text-center">Carry (C)</th>
                      <th className="py-2 text-right">Soma (S)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [0, 0, 0, 0],
                      [0, 1, 0, 1],
                      [1, 0, 0, 1],
                      [1, 1, 1, 0],
                    ].map(([a, b, c, s], i) => {
                      const isActive = addA === a && addB === b;
                      return (
                        <tr key={i} className={`border-b border-ash/40 ${isActive ? 'bg-lake-blue/10 font-bold' : ''}`}>
                          <td className="py-1.5">{a}</td>
                          <td className="py-1.5">{b}</td>
                          <td className="py-1.5 text-center text-terracotta-red">{c}</td>
                          <td className="py-1.5 text-right text-lake-blue">{s}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: FLIP-FLOP D E CLOCK */}
        {tab === 'flipflop' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-lg border border-ash bg-canvas p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-ash pb-3 mb-4">
                <span className="font-mono text-xs text-graphite uppercase">Flip-Flop D Disparado por Borda (Edge-Triggered)</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-ash text-lake-blue font-semibold">
                  Estado Gravado Q = {ffQ}
                </span>
              </div>

              {/* Flip Flop Graphic */}
              <div className="flex flex-col items-center justify-center py-6 font-mono">
                <div className="w-72 rounded-lg border-2 border-off-black bg-white p-5 shadow-xs relative">
                  <div className="flex justify-between items-center text-xs font-bold text-graphite border-b border-ash pb-2 mb-4">
                    <span>FLIP-FLOP D</span>
                    <span>1 BIT</span>
                  </div>

                  <div className="flex justify-between items-center my-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-graphite font-bold">D:</span>
                      <span className="px-2.5 py-1 rounded bg-canvas border border-ash text-sm font-bold text-off-black">
                        {ffD}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-graphite font-bold">Q:</span>
                      <span className="px-2.5 py-1 rounded bg-lake-blue/15 border border-lake-blue text-sm font-bold text-lake-blue">
                        {ffQ}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-2 border-t border-ash">
                    <span className="text-xs text-graphite font-bold">CLK:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${ffClk === 1 ? 'bg-forest-green text-white' : 'bg-canvas border border-ash text-smoke'}`}>
                      {ffClk === 1 ? 'ALTO (1)' : 'BAIXO (0)'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 font-mono text-xs text-lake-blue font-semibold">
                  {lastEdge}
                </div>
              </div>

              <div className="rounded border border-ash bg-white p-3 text-xs text-graphite">
                <strong>O Poder da Borda de Subida:</strong> O valor na entrada D pode mudar mil vezes enquanto o relogio estiver estavel em 0 ou em 1. O flip-flop ignora completamente. Apenas na transicao exata de 0 para 1 o valor de D e copiado para Q.
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="rounded-lg border border-ash bg-white p-5">
                <h5 className="font-serif text-base text-off-black mb-2">Entrada de Dados (D)</h5>
                <p className="text-xs text-graphite mb-3">
                  Altere o valor preparado na entrada antes do clock bater:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFfD(0)}
                    className={`py-2.5 rounded border font-mono text-sm transition-all ${
                      ffD === 0
                        ? 'border-lake-blue bg-lake-blue/10 text-lake-blue font-bold shadow-xs'
                        : 'border-ash bg-canvas text-graphite hover:border-graphite'
                    }`}
                  >
                    D = 0
                  </button>
                  <button
                    type="button"
                    onClick={() => setFfD(1)}
                    className={`py-2.5 rounded border font-mono text-sm transition-all ${
                      ffD === 1
                        ? 'border-lake-blue bg-lake-blue/10 text-lake-blue font-bold shadow-xs'
                        : 'border-ash bg-canvas text-graphite hover:border-graphite'
                    }`}
                  >
                    D = 1
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-ash bg-white p-5">
                <h5 className="font-serif text-base text-off-black mb-2">Controle do Relogio (Clock)</h5>
                <p className="text-xs text-graphite mb-3">
                  Dispare um pulso manual ou ative o oscilador automatico:
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleClock}
                    className="flex-1 py-2.5 rounded border border-off-black bg-off-black text-white hover:bg-black font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    Bater Clock ({ffClk === 0 ? '0 → 1' : '1 → 0'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoClock((v) => !v)}
                    className={`px-4 py-2.5 rounded border font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      autoClock
                        ? 'border-terracotta-red bg-terracotta-red text-white'
                        : 'border-ash bg-canvas text-graphite hover:border-graphite'
                    }`}
                  >
                    {autoClock ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                    {autoClock ? 'Pausar' : 'Auto'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
