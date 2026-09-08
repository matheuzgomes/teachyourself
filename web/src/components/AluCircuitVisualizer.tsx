import { useState, useMemo, useEffect } from 'react';

const CpuIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);

const RefreshCwIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export default function AluCircuitVisualizer() {
  const [isSub, setIsSub] = useState<boolean>(true);
  const [valA, setValA] = useState<number>(5);
  const [valB, setValB] = useState<number>(3);
  const [activeStage, setActiveStage] = useState<number>(4); // 0..3 for bits, 4 for complete
  const [isPropagating, setIsPropagating] = useState<boolean>(false);

  const circuit = useMemo(() => {
    const a3 = (valA >>> 3) & 1;
    const a2 = (valA >>> 2) & 1;
    const a1 = (valA >>> 1) & 1;
    const a0 = valA & 1;

    const b3 = (valB >>> 3) & 1;
    const b2 = (valB >>> 2) & 1;
    const b1 = (valB >>> 1) & 1;
    const b0 = valB & 1;

    const subBit = isSub ? 1 : 0;

    const xorB3 = b3 ^ subBit;
    const xorB2 = b2 ^ subBit;
    const xorB1 = b1 ^ subBit;
    const xorB0 = b0 ^ subBit;

    const sum0_raw = a0 + xorB0 + subBit;
    const s0 = sum0_raw & 1;
    const c0 = (sum0_raw >>> 1) & 1;

    const sum1_raw = a1 + xorB1 + c0;
    const s1 = sum1_raw & 1;
    const c1 = (sum1_raw >>> 1) & 1;

    const sum2_raw = a2 + xorB2 + c1;
    const s2 = sum2_raw & 1;
    const c2 = (sum2_raw >>> 1) & 1;

    const sum3_raw = a3 + xorB3 + c2;
    const s3 = sum3_raw & 1;
    const c3 = (sum3_raw >>> 1) & 1;

    const rawResult = (s3 << 3) | (s2 << 2) | (s1 << 1) | s0;
    const signedResult = s3 === 1 ? rawResult - 16 : rawResult;

    return {
      a: [a3, a2, a1, a0],
      b: [b3, b2, b1, b0],
      xorB: [xorB3, xorB2, xorB1, xorB0],
      s: [s3, s2, s1, s0],
      carries: [c3, c2, c1, c0, subBit],
      subBit,
      rawResult,
      signedResult,
    };
  }, [isSub, valA, valB]);

  // Propagation animation cycle (bit 0 -> bit 1 -> bit 2 -> bit 3 -> done)
  useEffect(() => {
    if (!isPropagating) return;
    setActiveStage(0);
    const interval = setInterval(() => {
      setActiveStage((prev) => {
        if (prev >= 3) {
          setIsPropagating(false);
          return 4;
        }
        return prev + 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [isPropagating]);

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2b59d1]/10 text-lake-blue">
            <CpuIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-lake-blue">Circuito Aritmetico</span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
              O Circuito Somador e Subtrator Unificado na ALU
            </h4>
            <p className="font-mono text-xs text-graphite mt-0.5">
              Portas XOR e a linha Carry-In unificam adicao e subtracao sem duplicar hardware
            </p>
          </div>
        </div>

        {/* Mode Toggle & Propagation Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-ash bg-parchment p-1">
            <button
              type="button"
              onClick={() => {
                setIsSub(false);
                setIsPropagating(true);
              }}
              className={`min-h-[38px] px-4 rounded-full font-mono text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
                !isSub
                  ? 'bg-lake-blue text-white shadow-sm'
                  : 'text-graphite hover:text-off-black'
              }`}
            >
              Adicao (SUB = 0)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSub(true);
                setIsPropagating(true);
              }}
              className={`min-h-[38px] px-4 rounded-full font-mono text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
                isSub
                  ? 'bg-lake-blue text-white shadow-sm'
                  : 'text-graphite hover:text-off-black'
              }`}
            >
              Subtracao (SUB = 1)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPropagating(true)}
            className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-ash bg-parchment px-4 py-2 text-xs font-mono font-medium text-off-black hover:border-lake-blue hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
          >
            <RefreshCwIcon className={`h-3.5 w-3.5 text-lake-blue ${isPropagating ? 'animate-spin' : ''}`} />
            Propagar Carry
          </button>
        </div>
      </div>

      {/* Inputs Operands Stage */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div className="rounded-card border border-ash bg-parchment p-4 flex items-center justify-between">
          <span className="text-graphite font-medium">Operando A:</span>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={-8}
              max={7}
              value={valA}
              onChange={(e) => setValA(parseInt(e.target.value) || 0)}
              className="w-16 rounded-full border border-ash bg-white px-3 py-1.5 text-center font-mono font-bold text-off-black focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none"
            />
            <span className="rounded-full bg-white border border-ash px-2.5 py-1 font-bold text-lake-blue">
              [{circuit.a.join('')}]
            </span>
          </div>
        </div>

        <div className="rounded-card border border-ash bg-parchment p-4 flex items-center justify-between">
          <span className="text-graphite font-medium">Operando B:</span>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={-8}
              max={7}
              value={valB}
              onChange={(e) => setValB(parseInt(e.target.value) || 0)}
              className="w-16 rounded-full border border-ash bg-white px-3 py-1.5 text-center font-mono font-bold text-off-black focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none"
            />
            <span className="rounded-full bg-white border border-ash px-2.5 py-1 font-bold text-off-black">
              [{circuit.b.join('')}]
            </span>
          </div>
        </div>
      </div>

      {/* Ripple Carry Schematic Stage */}
      <div className="mt-6 rounded-card border border-ash bg-parchment p-6 font-mono text-xs">
        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b border-ash/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-graphite">Linha de Controle SUB:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
              isSub
                ? 'bg-lake-blue text-white'
                : 'bg-white border border-ash text-graphite'
            }`}>
              SUB = {circuit.subBit} {isSub ? '(Inverte B via XOR e injeta Cin = 1)' : '(Mantem B e Cin = 0)'}
            </span>
          </div>
          <div className="text-graphite text-[11px]">
            Fluxo do Carry: Bit 0 (LSB) &rarr; Bit 3 (MSB)
          </div>
        </div>

        {/* Ripple-Carry Chain Flow Graphic */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[3, 2, 1, 0].map((bitIdx) => {
            const arrIdx = 3 - bitIdx;
            const bitA = circuit.a[arrIdx];
            const bitB = circuit.b[arrIdx];
            const bitXorB = circuit.xorB[arrIdx];
            const sumBit = circuit.s[arrIdx];
            const isLsb = bitIdx === 0;
            const isStageActive = activeStage === bitIdx || activeStage === 4;
            const carryOut = circuit.carries[arrIdx];

            return (
              <div
                key={bitIdx}
                className={`relative rounded-card border p-4 space-y-3 transition-all duration-300 ${
                  isStageActive
                    ? 'border-lake-blue bg-white shadow-sm'
                    : 'border-ash bg-white/70 opacity-60'
                }`}
              >
                {/* Moving Carry Wave Indicator */}
                {activeStage === bitIdx && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-lake-blue px-2 py-0.5 text-[9px] font-bold text-white shadow">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    Propagando
                  </span>
                )}

                <div className="flex items-center justify-between border-b border-ash/60 pb-2">
                  <span className="font-bold text-off-black">Bit {bitIdx}</span>
                  <span className="text-[10px] text-graphite">
                    {isLsb ? 'LSB (Entrada Cin)' : `Estagio ${bitIdx}`}
                  </span>
                </div>

                {/* Signals A & B */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-graphite">A{bitIdx}:</span>
                    <span className="font-bold text-lake-blue">{bitA}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-graphite">B{bitIdx}:</span>
                    <span className="font-bold text-off-black">{bitB}</span>
                  </div>
                </div>

                {/* XOR Inverter Gate */}
                <div className="rounded-full border border-ash bg-parchment px-2.5 py-1 text-center text-[10px] flex items-center justify-between">
                  <span className="text-graphite">XOR (B{bitIdx} ^ SUB):</span>
                  <strong className="text-lake-blue">{bitXorB}</strong>
                </div>

                {/* Full Adder Unit */}
                <div className="rounded-xl border border-lake-blue/30 bg-[#2b59d1]/5 p-2 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-lake-blue font-bold">
                    Full Adder {bitIdx}
                  </div>
                  <div className="text-[9px] text-graphite mt-0.5">
                    Cin = {circuit.carries[arrIdx + 1]} &rarr; Cout = {carryOut}
                  </div>
                </div>

                {/* Sum Output */}
                <div className="flex items-center justify-between pt-2 border-t border-ash/60">
                  <span className="text-graphite font-medium">Saida S{bitIdx}:</span>
                  <span className="font-serif text-lg font-normal text-lake-blue">
                    {sumBit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Result Deck */}
      <div className="mt-6 rounded-card border border-ash bg-parchment p-5 flex flex-wrap items-center justify-between gap-4 font-mono">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-graphite block">
            Expressao Executada na ALU:
          </span>
          <span className="font-serif text-2xl font-normal text-off-black mt-1 block">
            {valA} {isSub ? '-' : '+'} {valB} ={' '}
            <strong className="text-lake-blue font-semibold">{circuit.signedResult}</strong>
          </span>
        </div>

        <div className="text-right">
          <span className="font-mono text-xs uppercase tracking-wider text-graphite block">
            Barramento de Saida dos 4 Somadores:
          </span>
          <span className="font-mono text-xl font-bold text-off-black tracking-widest mt-1 block">
            [{circuit.s.join('')}]₂
          </span>
        </div>
      </div>
    </div>
  );
}

