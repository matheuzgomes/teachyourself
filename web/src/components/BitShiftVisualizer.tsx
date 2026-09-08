import { useState, useMemo } from 'react';

const SlidersHorizontalIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const CpuIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
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

export default function BitShiftVisualizer() {
  const [val, setVal] = useState<number>(-106); // 8-bit: 10010110
  const [shiftAmount, setShiftAmount] = useState<number>(2);

  const analysis = useMemo(() => {
    // 8-bit unsigned
    const u8 = val & 0xff;
    const u8_bin = u8.toString(2).padStart(8, '0');

    // Logical Shift Right (>> k) em unsigned 8 bits
    const logicalShiftVal = u8 >>> shiftAmount;
    const logicalShiftBin = logicalShiftVal.toString(2).padStart(8, '0');

    // Arithmetic Shift Right (>> k) em signed 8 bits
    const signed8 = u8 > 127 ? u8 - 256 : u8;
    const arithShiftVal = signed8 >> shiftAmount;
    const arithShiftU8 = arithShiftVal & 0xff;
    const arithShiftBin = arithShiftU8.toString(2).padStart(8, '0');

    // Divisao com Bias para numero negativo
    const bias = (1 << shiftAmount) - 1;
    const biasedVal = val < 0 ? val + bias : val;
    const biasedResult = biasedVal >> shiftAmount;
    const unBiasedResult = val >> shiftAmount;

    return {
      u8_bin,
      signed8,
      logicalShiftVal,
      logicalShiftBin,
      arithShiftVal,
      arithShiftBin,
      bias,
      biasedVal,
      biasedResult,
      unBiasedResult,
    };
  }, [val, shiftAmount]);

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2b59d1]/10 text-lake-blue">
            <SlidersHorizontalIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-lake-blue">Deslocamentos de Bits</span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
              Simulador de Shifts e Divisao Inteira com Bias
            </h4>
            <p className="font-mono text-xs text-graphite mt-0.5">
              Compare a replicacao do Bit de Sinal no Shift Aritmetico contra o preenchimento de zeros no Shift Logico
            </p>
          </div>
        </div>

        {/* Shift Amount Selector */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-graphite font-medium">Deslocamento (k):</span>
          {[1, 2, 3, 4].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setShiftAmount(k)}
              className={`h-11 w-11 rounded-full font-bold border transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
                shiftAmount === k
                  ? 'bg-lake-blue text-white border-lake-blue shadow-sm'
                  : 'bg-parchment text-graphite border-ash hover:border-off-black hover:text-off-black hover:bg-white'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Values Controls */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-graphite mr-1 text-[11px]">Valor de Teste (8 bits):</span>
        <button
          type="button"
          onClick={() => setVal(-106)}
          className={`min-h-[44px] px-3.5 rounded-full border transition-all ${
            val === -106
              ? 'bg-lake-blue text-white border-lake-blue font-bold shadow-sm'
              : 'bg-parchment text-graphite border-ash hover:border-off-black hover:bg-white'
          }`}
        >
          -106 (Padrao 10010110)
        </button>
        <button
          type="button"
          onClick={() => setVal(-5)}
          className={`min-h-[44px] px-3.5 rounded-full border transition-all ${
            val === -5
              ? 'bg-lake-blue text-white border-lake-blue font-bold shadow-sm'
              : 'bg-parchment text-graphite border-ash hover:border-off-black hover:bg-white'
          }`}
        >
          -5 (Teste Divisao por 2)
        </button>
        <button
          type="button"
          onClick={() => setVal(5)}
          className={`min-h-[44px] px-3.5 rounded-full border transition-all ${
            val === 5
              ? 'bg-lake-blue text-white border-lake-blue font-bold shadow-sm'
              : 'bg-parchment text-graphite border-ash hover:border-off-black hover:bg-white'
          }`}
        >
          +5 (Positivo)
        </button>
        <button
          type="button"
          onClick={() => setVal(120)}
          className={`min-h-[44px] px-3.5 rounded-full border transition-all ${
            val === 120
              ? 'bg-lake-blue text-white border-lake-blue font-bold shadow-sm'
              : 'bg-parchment text-graphite border-ash hover:border-off-black hover:bg-white'
          }`}
        >
          +120
        </button>
      </div>

      {/* Side-by-Side Shift Flow Conveyors */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        {/* Logical Shift Conveyor */}
        <div className="rounded-card border border-ash bg-parchment p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ash/70 pb-3">
            <div>
              <span className="font-bold uppercase tracking-wider text-lake-blue">
                1. Shift Logico (unsigned &gt;&gt; {shiftAmount})
              </span>
              <div className="text-[11px] text-graphite mt-0.5">Operacao SHR no processador</div>
            </div>
            <span className="rounded-full bg-white border border-ash px-2.5 py-1 text-[10px] text-graphite font-bold">
              Preenche com 0
            </span>
          </div>

          {/* Original Register */}
          <div className="space-y-1">
            <div className="text-[11px] text-graphite">Registrador original:</div>
            <div className="flex gap-1">
              {analysis.u8_bin.split('').map((b, i) => (
                <div
                  key={i}
                  className="flex-1 min-h-[38px] rounded-lg border border-ash bg-white flex items-center justify-center font-bold text-off-black"
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Shifted Register with Moving Injection */}
          <div className="space-y-1 pt-2 border-t border-ash/70">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-graphite">Apos deslocar {shiftAmount} casas &rarr;:</span>
              <span className="text-lake-blue flex items-center gap-1 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-lake-blue animate-ping" />
                {shiftAmount} zero(s) injetado(s) a esquerda
              </span>
            </div>
            <div className="flex gap-1">
              {analysis.logicalShiftBin.split('').map((b, i) => (
                <div
                  key={i}
                  className={`flex-1 min-h-[38px] rounded-lg border flex items-center justify-center font-bold ${
                    i < shiftAmount
                      ? 'border-lake-blue bg-lake-blue text-white shadow-sm'
                      : 'border-ash bg-white text-off-black'
                  }`}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-ash/70 flex items-center justify-between">
            <span className="text-graphite">Resultado Decimal:</span>
            <strong className="font-serif text-2xl font-normal text-lake-blue">
              {analysis.logicalShiftVal}
            </strong>
          </div>
        </div>

        {/* Arithmetic Shift Conveyor */}
        <div className="rounded-card border border-ash bg-parchment p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-ash/70 pb-3">
            <div>
              <span className="font-bold uppercase tracking-wider text-off-black">
                2. Shift Aritmetico (signed &gt;&gt; {shiftAmount})
              </span>
              <div className="text-[11px] text-graphite mt-0.5">Operacao SAR no processador</div>
            </div>
            <span className="rounded-full bg-white border border-ash px-2.5 py-1 text-[10px] text-graphite font-bold">
              Replica Bit de Sinal
            </span>
          </div>

          {/* Original Register */}
          <div className="space-y-1">
            <div className="text-[11px] text-graphite">
              Registrador original (Bit de Sinal = {analysis.u8_bin[0]}):
            </div>
            <div className="flex gap-1">
              {analysis.u8_bin.split('').map((b, i) => (
                <div
                  key={i}
                  className={`flex-1 min-h-[38px] rounded-lg border flex items-center justify-center font-bold ${
                    i === 0
                      ? 'border-[#ff9473] bg-[#ff9473]/15 text-[#b93815]'
                      : 'border-ash bg-white text-off-black'
                  }`}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Shifted Register with Moving Injection */}
          <div className="space-y-1 pt-2 border-t border-ash/70">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-graphite">Apos deslocar {shiftAmount} casas &rarr;:</span>
              <span className="text-[#b93815] flex items-center gap-1 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b93815] animate-ping" />
                Sinal &apos;{analysis.u8_bin[0]}&apos; replicado
              </span>
            </div>
            <div className="flex gap-1">
              {analysis.arithShiftBin.split('').map((b, i) => (
                <div
                  key={i}
                  className={`flex-1 min-h-[38px] rounded-lg border flex items-center justify-center font-bold ${
                    i < shiftAmount
                      ? 'border-[#ff9473] bg-[#ff9473]/15 text-[#b93815]'
                      : 'border-ash bg-white text-off-black'
                  }`}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-ash/70 flex items-center justify-between">
            <span className="text-graphite">Resultado Decimal:</span>
            <strong className="font-serif text-2xl font-normal text-off-black">
              {analysis.arithShiftVal}
            </strong>
          </div>
        </div>
      </div>

      {/* Division with Bias Section */}
      <div className="mt-6 rounded-card border border-ash bg-parchment p-6 font-mono text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-ash/70 pb-3">
          <div className="font-semibold text-off-black flex items-center gap-2">
            <CpuIcon className="h-4 w-4 text-lake-blue" />
            Mecanismo de Divisao Inteira por 2^{shiftAmount} com Bias:
          </div>
          <span className="text-[11px] text-graphite">Bias = 2^{shiftAmount} - 1 = {analysis.bias}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="rounded-card border border-ash bg-white p-4 space-y-1">
            <span className="text-[11px] text-graphite uppercase font-bold block">
              Shift Puro sem Bias:
            </span>
            <div className="text-sm font-bold text-off-black">
              {val} &gt;&gt; {shiftAmount} ={' '}
              <strong className="text-[#b93815]">{analysis.unBiasedResult}</strong>
            </div>
            <p className="text-[11px] text-graphite font-sans pt-1">
              Arredonda em direcao a menos infinito (-&infin;). Em C, a divisao inteira requer truncamento em direcao a zero!
            </p>
          </div>

          <div className="rounded-card border border-lake-blue/40 bg-[#2b59d1]/5 p-4 space-y-1">
            <span className="text-[11px] text-lake-blue uppercase font-bold block">
              Com Adicao de Bias (x + {analysis.bias}) &gt;&gt; {shiftAmount}:
            </span>
            <div className="text-sm font-bold text-off-black">
              ({val} + {analysis.bias}) &gt;&gt; {shiftAmount} ={' '}
              <strong className="text-lake-blue">{analysis.biasedResult}</strong>
            </div>
            <p className="text-[11px] text-graphite font-sans pt-1">
              Arredonda com precisao exata em direcao ao zero, atendendo ao padrao ANSI C e ISO/IEC 9899.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
