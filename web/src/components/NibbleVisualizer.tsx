import { useState, useMemo } from 'react';

const HashIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

export default function NibbleVisualizer() {
  const [bits, setBits] = useState<number[]>([1, 1, 0, 1, 1, 0, 1, 0]);

  const toggleBit = (idx: number) => {
    setBits((prev) => {
      const next = [...prev];
      next[idx] = next[idx] === 1 ? 0 : 1;
      return next;
    });
  };

  const setFromHex = (hexStr: string) => {
    const num = parseInt(hexStr, 16) & 0xff;
    const arr = [];
    for (let i = 7; i >= 0; i--) {
      arr.push((num >>> i) & 1);
    }
    setBits(arr);
  };

  const calculation = useMemo(() => {
    const highBits = bits.slice(0, 4);
    const lowBits = bits.slice(4, 8);

    const weights = [8, 4, 2, 1];

    let highVal = 0;
    const highTerms: string[] = [];
    highBits.forEach((b, i) => {
      if (b === 1) {
        highVal += weights[i];
        highTerms.push(String(weights[i]));
      }
    });

    let lowVal = 0;
    const lowTerms: string[] = [];
    lowBits.forEach((b, i) => {
      if (b === 1) {
        lowVal += weights[i];
        lowTerms.push(String(weights[i]));
      }
    });

    const totalVal = (highVal << 4) | lowVal;
    const highHex = highVal.toString(16).toUpperCase();
    const lowHex = lowVal.toString(16).toUpperCase();
    const byteHex = `0x${highHex}${lowHex}`;

    return {
      highBits,
      lowBits,
      highVal,
      lowVal,
      highHex,
      lowHex,
      highTermsStr: highTerms.length > 0 ? highTerms.join(' + ') : '0',
      lowTermsStr: lowTerms.length > 0 ? lowTerms.join(' + ') : '0',
      totalVal,
      byteHex,
    };
  }, [bits]);

  const weights = [8, 4, 2, 1];

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2b59d1]/10 text-lake-blue">
            <HashIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-lake-blue">Decomposicao Binaria</span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
              Anatomia de um Byte: Nibble Alto e Nibble Baixo
            </h4>
            <p className="font-mono text-xs text-graphite mt-0.5">
              Cada grupo de 4 bits usa a regua [ 8 | 4 | 2 | 1 ] para formar 1 digito hexadecimal de 0 a F
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-graphite mr-1 text-[11px]">Presets:</span>
          {['0xDA', '0xFF', '0x80', '0x7F', '0x0F', '0x32'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setFromHex(preset)}
              className="min-h-[44px] px-3.5 rounded-full border border-ash bg-parchment font-bold text-off-black hover:border-lake-blue hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Two Nibbles Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Nibble */}
        <div className="rounded-card border border-ash bg-parchment p-6 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-ash/70 pb-3">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-lake-blue font-bold">
                Nibble Alto (Bits 7..4)
              </span>
              <div className="text-[11px] text-graphite font-mono mt-0.5">
                Regua local: 8, 4, 2, 1 (Multiplicador do byte: &times; 16)
              </div>
            </div>
            <span className="rounded-full bg-white border border-ash px-3 py-1 font-mono text-xs font-bold text-off-black shadow-xs">
              Digito Hex: <strong className="text-lake-blue text-sm">{calculation.highHex}</strong>
            </span>
          </div>

          {/* Local Weight Header Ruler */}
          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            {weights.map((w, idx) => (
              <div key={idx} className="text-[10px] uppercase font-bold text-lake-blue bg-white/70 py-1 rounded border border-ash/50">
                Peso {w}
              </div>
            ))}
          </div>

          {/* Interactive Bit Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {bits.slice(0, 4).map((bit, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleBit(idx)}
                className={`min-h-[58px] rounded-xl flex flex-col items-center justify-center font-mono border transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
                  bit === 1
                    ? 'bg-lake-blue text-white border-lake-blue shadow-sm'
                    : 'bg-white text-graphite border-ash hover:border-off-black'
                }`}
              >
                <span className="text-lg font-bold">{bit}</span>
                <span className="text-[10px] opacity-80">Bit {7 - idx}</span>
                <span className="text-[10px] font-bold opacity-75">
                  {bit === 1 ? `+${weights[idx]}` : '0'}
                </span>
              </button>
            ))}
          </div>

          {/* Flow conduit to Hex digit */}
          <div className="pt-3 border-t border-ash/70 font-mono text-xs space-y-1">
            <div className="flex items-center justify-between text-graphite">
              <span>Soma dos pesos:</span>
              <span className="font-bold text-off-black">
                {calculation.highTermsStr} = {calculation.highVal}
                {calculation.highVal >= 10 ? ` (${calculation.highHex})` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between text-lake-blue text-[11px] font-semibold">
              <span>Impacto no byte total:</span>
              <span>{calculation.highVal} &times; 16 = {calculation.highVal * 16}</span>
            </div>
          </div>
        </div>

        {/* Low Nibble */}
        <div className="rounded-card border border-ash bg-parchment p-6 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-ash/70 pb-3">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-off-black font-bold">
                Nibble Baixo (Bits 3..0)
              </span>
              <div className="text-[11px] text-graphite font-mono mt-0.5">
                Regua local: 8, 4, 2, 1 (Multiplicador do byte: &times; 1)
              </div>
            </div>
            <span className="rounded-full bg-white border border-ash px-3 py-1 font-mono text-xs font-bold text-off-black shadow-xs">
              Digito Hex: <strong className="text-off-black text-sm">{calculation.lowHex}</strong>
            </span>
          </div>

          {/* Local Weight Header Ruler */}
          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            {weights.map((w, idx) => (
              <div key={idx} className="text-[10px] uppercase font-bold text-off-black bg-white/70 py-1 rounded border border-ash/50">
                Peso {w}
              </div>
            ))}
          </div>

          {/* Interactive Bit Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {bits.slice(4, 8).map((bit, idx) => (
              <button
                key={idx + 4}
                type="button"
                onClick={() => toggleBit(idx + 4)}
                className={`min-h-[58px] rounded-xl flex flex-col items-center justify-center font-mono border transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
                  bit === 1
                    ? 'bg-off-black text-white border-off-black shadow-sm'
                    : 'bg-white text-graphite border-ash hover:border-off-black'
                }`}
              >
                <span className="text-lg font-bold">{bit}</span>
                <span className="text-[10px] opacity-80">Bit {3 - idx}</span>
                <span className="text-[10px] font-bold opacity-75">
                  {bit === 1 ? `+${weights[idx]}` : '0'}
                </span>
              </button>
            ))}
          </div>

          {/* Flow conduit to Hex digit */}
          <div className="pt-3 border-t border-ash/70 font-mono text-xs space-y-1">
            <div className="flex items-center justify-between text-graphite">
              <span>Soma dos pesos:</span>
              <span className="font-bold text-off-black">
                {calculation.lowTermsStr} = {calculation.lowVal}
                {calculation.lowVal >= 10 ? ` (${calculation.lowHex})` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between text-graphite text-[11px]">
              <span>Impacto no byte total:</span>
              <span>{calculation.lowVal} &times; 1 = {calculation.lowVal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Moving Flow Merger into Consolidated Byte */}
      <div className="mt-6 rounded-card border border-ash bg-parchment p-6 flex flex-wrap items-center justify-between gap-6 font-mono">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-graphite">
              Byte Consolidado em Memoria:
            </span>
          </div>
          <div className="font-mono text-3xl font-bold text-off-black tracking-wider mt-2">
            0x<span className="text-lake-blue">{calculation.highHex}</span>
            <span className="text-off-black">{calculation.lowHex}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-xs uppercase tracking-wider text-graphite block">
            Calculo Decimal Ponderado:
          </span>
          <span className="font-mono text-sm text-off-black mt-1 block">
            ({calculation.highVal} &times; 16) + {calculation.lowVal} ={' '}
            <strong className="font-serif text-2xl font-normal text-lake-blue">
              {calculation.totalVal}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
