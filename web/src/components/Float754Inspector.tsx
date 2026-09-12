import { useState, useMemo } from 'react';

const BinaryCodeIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

export default function Float754Inspector() {
  // Bits de 31 a 0 (Array de 32 booleans)
  // Inicializado com 3.1415927f (0x40490fdb -> [0, 10000000, 10010010000111111011011])
  const [bits, setBits] = useState<number[]>(() => {
    const buffer = new ArrayBuffer(4);
    const floatView = new Float32Array(buffer);
    const intView = new Uint32Array(buffer);
    floatView[0] = 3.1415927;
    const u32 = intView[0];
    const arr = [];
    for (let i = 31; i >= 0; i--) {
      arr.push((u32 >>> i) & 1);
    }
    return arr;
  });

  // Alterna um bit individual
  const toggleBit = (index: number) => {
    setBits((prev) => {
      const next = [...prev];
      next[index] = next[index] === 1 ? 0 : 1;
      return next;
    });
  };

  // Carrega número float arbitrário
  const setFromNumber = (val: number) => {
    const buffer = new ArrayBuffer(4);
    const floatView = new Float32Array(buffer);
    const intView = new Uint32Array(buffer);
    floatView[0] = val;
    const u32 = intView[0];
    const arr = [];
    for (let i = 31; i >= 0; i--) {
      arr.push((u32 >>> i) & 1);
    }
    setBits(arr);
  };

  // Análise detalhada dos campos IEEE 754
  const analysis = useMemo(() => {
    let u32 = 0;
    for (let i = 0; i < 32; i++) {
      u32 = (u32 << 1) | bits[i];
    }
    u32 = u32 >>> 0;

    const signBit = bits[0];
    const expBits = bits.slice(1, 9);
    const fracBits = bits.slice(9, 32);

    let expVal = 0;
    for (const b of expBits) expVal = (expVal << 1) | b;

    let fracVal = 0;
    for (const b of fracBits) fracVal = (fracVal << 1) | b;

    const buffer = new ArrayBuffer(4);
    const intView = new Uint32Array(buffer);
    const floatView = new Float32Array(buffer);
    intView[0] = u32;
    const decimalValue = floatView[0];

    let regime = 'NORMALIZADO';
    let E = expVal - 127;
    let description = '';

    if (expVal === 0) {
      if (fracVal === 0) {
        regime = signBit === 0 ? 'ZERO POSITIVO (+0.0)' : 'ZERO NEGATIVO (-0.0)';
        E = 0;
        description = 'Zero com sinal. Permite preservar direções de limites em cálculo infinitesimal.';
      } else {
        regime = 'DESNORMALIZADO (SUBNORMAL)';
        E = 1 - 127; // -126
        description = 'Subnormal Gradual. Preenche o intervalo entre zero e o menor número normalizado sem bit implícito 1.';
      }
    } else if (expVal === 255) {
      if (fracVal === 0) {
        regime = signBit === 0 ? '+INFINITO (+∞)' : '-INFINITO (-∞)';
        E = Infinity;
        description = 'Estouro de magnitude (overflow em ponto flutuante, como 1.0 / 0.0).';
      } else {
        regime = 'NaN (NOT A NUMBER)';
        E = NaN;
        description = 'Operação matematicamente indefinida (ex: 0.0 / 0.0 ou sqrt(-1)). Comparações com NaN são sempre falsas.';
      }
    } else {
      regime = 'NORMALIZADO';
      E = expVal - 127;
      description = 'Representação padrão. Mantissa possui bit 1 implícito à esquerda (1.frac), ganhando 1 bit extra de precisão gratuita.';
    }

    return {
      signBit,
      expBits: expBits.join(''),
      fracBits: fracBits.join(''),
      expVal,
      fracVal,
      E,
      decimalValue,
      regime,
      description,
      hex: `0x${u32.toString(16).padStart(8, '0').toUpperCase()}`,
    };
  }, [bits]);

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2b59d1]/10 text-lake-blue">
            <BinaryCodeIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-lake-blue">Aritmética IEEE 754</span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
              Manipulador de Bits IEEE 754 (Precisao Simples - 32 bits)
            </h4>
            <p className="font-mono text-xs text-graphite mt-0.5">
              Alterne qualquer bit individual para observar a desconstrucao causal em tempo real
            </p>
          </div>
        </div>

        <div className="font-mono text-xs font-bold text-off-black bg-parchment px-4 py-2 rounded-full border border-ash">
          Hexadecimal: {analysis.hex}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-graphite mr-1 text-[11px]">Presets Historicos:</span>
        <button
          type="button"
          onClick={() => setFromNumber(3.1415927)}
          className="min-h-[44px] px-3.5 rounded-full border border-ash bg-parchment text-off-black hover:border-lake-blue hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
        >
          &pi; (3.14159)
        </button>
        <button
          type="button"
          onClick={() => setFromNumber(0.1)}
          className="min-h-[44px] px-3.5 rounded-full border border-ash bg-parchment text-off-black hover:border-lake-blue hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
        >
          0.1 (Patriot Scud Drift)
        </button>
        <button
          type="button"
          onClick={() => setFromNumber(0.0)}
          className="min-h-[44px] px-3.5 rounded-full border border-ash bg-parchment text-off-black hover:border-lake-blue hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
        >
          +0.0
        </button>
        <button
          type="button"
          onClick={() => setFromNumber(-0.0)}
          className="min-h-[44px] px-3.5 rounded-full border border-ash bg-parchment text-off-black hover:border-lake-blue hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
        >
          -0.0
        </button>
        <button
          type="button"
          onClick={() => setFromNumber(Infinity)}
          className="min-h-[44px] px-3.5 rounded-full border border-ash bg-parchment text-off-black hover:border-lake-blue hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
        >
          +Infinito
        </button>
        <button
          type="button"
          onClick={() => setFromNumber(NaN)}
          className="min-h-[44px] px-3.5 rounded-full border border-ash bg-parchment text-off-black hover:border-lake-blue hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
        >
          NaN
        </button>
      </div>

      {/* 32 Bits Interactive Strip */}
      <div className="mt-8 overflow-x-auto pb-2 pt-1">
        <div className="min-w-[760px] space-y-2">
          {/* Field Labels Header - aligned in exact 1:8:23 proportion */}
          <div className="flex gap-1 text-[11px] font-mono font-bold">
            <div className="flex-[1] min-w-[22px] text-center border-b-2 border-coral pb-1">
              <span className="text-coral block truncate text-[10px]">S (1b)</span>
            </div>
            <div className="flex-[8] text-center border-b-2 border-lake-blue pb-1">
              <span className="text-lake-blue block truncate">Expoente com Bias (Bits 30..23 &bull; 8 bits)</span>
            </div>
            <div className="flex-[23] text-center border-b-2 border-off-black pb-1">
              <span className="text-off-black block truncate">Mantissa / Fração Normalizada (Bits 22..0 &bull; 23 bits)</span>
            </div>
          </div>

          {/* 32 Bits Button Grid */}
          <div className="flex gap-1">
            {bits.map((bit, idx) => {
              const isSign = idx === 0;
              const isExp = idx >= 1 && idx <= 8;

              let colorClass = 'border-ash bg-white text-graphite hover:border-off-black';
              if (bit === 1) {
                if (isSign) {
                  colorClass = 'border-[#ff9473] bg-[#ff9473]/20 text-[#b93815] font-bold shadow-sm';
                } else if (isExp) {
                  colorClass = 'border-lake-blue bg-lake-blue text-white font-bold shadow-sm';
                } else {
                  colorClass = 'border-off-black bg-off-black text-white font-bold shadow-sm';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleBit(idx)}
                  title={`Bit ${31 - idx} (${isSign ? 'Sinal' : isExp ? 'Expoente' : 'Mantissa'})`}
                  className={`flex-1 min-w-[22px] min-h-[44px] rounded-lg flex flex-col items-center justify-center border text-xs font-mono transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${colorClass}`}
                >
                  <span className="text-xs">{bit}</span>
                  <span className="text-[10px] opacity-75">{31 - idx}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Moving Reconstruction Pipeline Flow */}
      <div className="mt-6 rounded-card border border-ash bg-parchment p-6 font-mono text-xs space-y-4">
        <div className="flex items-center justify-between border-b border-ash/70 pb-3">
          <span className="font-bold text-off-black uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
            Dutos de Reconstrucao do Valor Flutuante:
          </span>
          <span className="text-graphite text-[11px]">
            Formula: (-1)^s &times; M &times; 2^E
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stream 1: Signal */}
          <div className="rounded-card border border-ash bg-white p-4 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-graphite uppercase font-bold">
              <span>1. Duto do Sinal</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#b93815] animate-ping" />
            </div>
            <div className="text-lg font-serif font-normal text-off-black">
              s = {analysis.signBit} &rarr;{' '}
              <strong className={analysis.signBit === 1 ? 'text-[#b93815]' : 'text-[#0e7c54]'}>
                {analysis.signBit === 1 ? 'Multiplicador (-1)' : 'Multiplicador (+1)'}
              </strong>
            </div>
            <p className="text-[11px] text-graphite font-sans">
              Bit 31 isolado define a polaridade matematica direta.
            </p>
          </div>

          {/* Stream 2: Exponent with Bias */}
          <div className="rounded-card border border-ash bg-white p-4 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-graphite uppercase font-bold">
              <span>2. Duto do Expoente</span>
              <span className="h-1.5 w-1.5 rounded-full bg-lake-blue animate-ping" />
            </div>
            <div className="text-lg font-serif font-normal text-off-black">
              E = {analysis.expVal} - 127 = <strong className="text-lake-blue">{analysis.E}</strong>
            </div>
            <p className="text-[11px] text-graphite font-sans">
              Fator de escala da potencia: 2^({analysis.E})
            </p>
          </div>

          {/* Stream 3: Mantissa Normalizer */}
          <div className="rounded-card border border-ash bg-white p-4 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-graphite uppercase font-bold">
              <span>3. Duto da Mantissa</span>
              <span className="h-1.5 w-1.5 rounded-full bg-off-black animate-ping" />
            </div>
            <div className="text-lg font-serif font-normal text-off-black">
              Regime: <strong className="text-off-black">{analysis.regime}</strong>
            </div>
            <p className="text-[11px] text-graphite font-sans">
              Bit 1 implicito: {analysis.expVal > 0 && analysis.expVal < 255 ? '1.frac' : '0.frac (subnormal)'}
            </p>
          </div>
        </div>
      </div>

      {/* Final Reconstructed Value Card */}
      <div className="mt-6 rounded-card border border-ash bg-parchment p-6 flex flex-wrap items-center justify-between gap-4 font-mono">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-graphite block">
            Valor Decimal Decodificado pelo Coprocessador:
          </span>
          <span className="font-serif text-3xl font-normal text-lake-blue mt-1 block break-all">
            {Number.isNaN(analysis.decimalValue) ? 'NaN' : analysis.decimalValue.toString()}
          </span>
        </div>

        <div className="text-right max-w-sm">
          <span className="font-mono text-xs uppercase tracking-wider text-graphite block">
            Diagnostico Fisico:
          </span>
          <p className="text-xs text-graphite font-sans mt-1 leading-relaxed">
            {analysis.description}
          </p>
        </div>
      </div>
    </div>
  );
}
