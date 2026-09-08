import { useState, useEffect } from 'react';

// Icones SVG inline puros sem dependencias externas
const CircleDotIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ChevronLeftIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const PlayIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

interface RingNode {
  bin: string;
  signed: number;
  unsigned: number;
  isTMax?: boolean;
  isTMin?: boolean;
}

export default function TwosComplementDial() {
  const [selectedNum, setSelectedNum] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const ringValues: RingNode[] = [
    { bin: '0000', signed: 0, unsigned: 0 },
    { bin: '0001', signed: 1, unsigned: 1 },
    { bin: '0010', signed: 2, unsigned: 2 },
    { bin: '0011', signed: 3, unsigned: 3 },
    { bin: '0100', signed: 4, unsigned: 4 },
    { bin: '0101', signed: 5, unsigned: 5 },
    { bin: '0110', signed: 6, unsigned: 6 },
    { bin: '0111', signed: 7, unsigned: 7, isTMax: true },
    { bin: '1000', signed: -8, unsigned: 8, isTMin: true },
    { bin: '1001', signed: -7, unsigned: 9 },
    { bin: '1010', signed: -6, unsigned: 10 },
    { bin: '1011', signed: -5, unsigned: 11 },
    { bin: '1100', signed: -4, unsigned: 12 },
    { bin: '1101', signed: -3, unsigned: 13 },
    { bin: '1110', signed: -2, unsigned: 14 },
    { bin: '1111', signed: -1, unsigned: 15 },
  ];

  const currentIdx = ringValues.findIndex((v) => v.signed === selectedNum);
  const current = ringValues[currentIdx >= 0 ? currentIdx : 0];
  const negatedSigned = selectedNum === -8 ? -8 : -selectedNum;
  const negated = ringValues.find((v) => v.signed === negatedSigned);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setSelectedNum((prev) => {
        const idx = ringValues.findIndex((v) => v.signed === prev);
        const nextIdx = (idx + 1) % ringValues.length;
        return ringValues[nextIdx].signed;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const stepForward = () => {
    const nextIdx = (currentIdx + 1) % ringValues.length;
    setSelectedNum(ringValues[nextIdx].signed);
  };

  const stepBackward = () => {
    const prevIdx = (currentIdx - 1 + ringValues.length) % ringValues.length;
    setSelectedNum(ringValues[prevIdx].signed);
  };

  const cx = 170;
  const cy = 170;
  const r = 125;

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2b59d1]/10 text-lake-blue">
            <CircleDotIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-lake-blue">Aritmética Circular</span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
              O Anel Modular de John von Neumann (4 bits)
            </h4>
            <p className="font-mono text-xs text-graphite mt-0.5">
              Subtrair X equivale a somar (16 - X) no ciclo fechado de módulo 16
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={stepBackward}
            aria-label="Passo anterior (-1)"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ash bg-parchment text-off-black hover:border-lake-blue hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex min-h-[44px] items-center gap-2 rounded-full border border-lake-blue bg-lake-blue px-4 py-2 text-xs font-mono font-medium text-white hover:bg-lake-blue/90 focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none shadow-sm transition-all"
          >
            {isPlaying ? (
              <>
                <PauseIcon className="h-3.5 w-3.5" /> Pausar Fluxo
              </>
            ) : (
              <>
                <PlayIcon className="h-3.5 w-3.5" /> Animar Fluxo (+1)
              </>
            )}
          </button>
          <button
            type="button"
            onClick={stepForward}
            aria-label="Proximo passo (+1)"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ash bg-parchment text-off-black hover:border-lake-blue hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* SVG Circular Dial with Moving Pulse Conduits */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-parchment/60 rounded-card border border-ash/70 p-6 relative overflow-hidden">
          <svg viewBox="0 0 340 340" className="w-full max-w-[320px] h-auto select-none">
            {/* Background Track Circle */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#cecac8"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Active Flow Conduit Arc */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#2b59d1"
              strokeWidth="3"
              strokeDasharray="12 12"
              className="animate-[spin_20s_linear_infinite]"
            />

            {/* Fault Line / Discontinuity Indicator between +7 and -8 */}
            <line
              x1={cx + r * Math.sin((7.5 * 2 * Math.PI) / 16)}
              y1={cy - r * Math.cos((7.5 * 2 * Math.PI) / 16) - 14}
              x2={cx + r * Math.sin((7.5 * 2 * Math.PI) / 16)}
              y2={cy - r * Math.cos((7.5 * 2 * Math.PI) / 16) + 14}
              stroke="#ff9473"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Dial Center Hub */}
            <circle cx={cx} cy={cy} r="46" fill="#ffffff" stroke="#cecac8" strokeWidth="1.5" />
            <text
              x={cx}
              y={cy - 10}
              textAnchor="middle"
              className="font-serif text-2xl font-normal fill-off-black"
            >
              {current.signed > 0 ? `+${current.signed}` : current.signed}
            </text>
            <text
              x={cx}
              y={cy + 8}
              textAnchor="middle"
              className="font-mono text-[11px] fill-lake-blue font-bold tracking-wider"
            >
              {current.bin}
            </text>
            <text
              x={cx}
              y={cy + 22}
              textAnchor="middle"
              className="font-mono text-[9px] fill-graphite uppercase"
            >
              unsigned: {current.unsigned}
            </text>

            {/* 16 Radial Value Nodes */}
            {ringValues.map((v, i) => {
              const angle = (i * 2 * Math.PI) / 16 - Math.PI / 2;
              const nx = cx + r * Math.cos(angle);
              const ny = cy + r * Math.sin(angle);
              const isSelected = v.signed === selectedNum;
              const isOpposite = v.signed === negatedSigned;

              return (
                <g
                  key={v.bin}
                  onClick={() => setSelectedNum(v.signed)}
                  className="cursor-pointer transition-all duration-300"
                >
                  {/* Moving beacon halo for active node */}
                  {isSelected && (
                    <circle
                      cx={nx}
                      cy={ny}
                      r="22"
                      fill="#2b59d1"
                      fillOpacity="0.2"
                      className="animate-ping"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={nx}
                    cy={ny}
                    r={isSelected ? '18' : '15'}
                    fill={
                      isSelected
                        ? '#2b59d1'
                        : isOpposite
                        ? '#cfdaf5'
                        : v.isTMin
                        ? '#ff9473'
                        : '#ffffff'
                    }
                    stroke={
                      isSelected
                        ? '#2b59d1'
                        : isOpposite
                        ? '#2b59d1'
                        : v.isTMin
                        ? '#ff9473'
                        : v.isTMax
                        ? '#a7fccd'
                        : '#cecac8'
                    }
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                  />

                  {/* Node Label */}
                  <text
                    x={nx}
                    y={ny + 4}
                    textAnchor="middle"
                    className={`font-mono text-[10px] font-bold ${
                      isSelected ? 'fill-white' : 'fill-off-black'
                    }`}
                  >
                    {v.signed > 0 ? `+${v.signed}` : v.signed}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend and Flow Direction */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-graphite">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-lake-blue" />
              Sentido Horário = +1
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ff9473]" />
              Fronteira Crítica (+7 p/ -8)
            </span>
          </div>
        </div>

        {/* Right Stage: Analysis Panels */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Selection Pills */}
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-graphite mb-2">
              Selecione o estado no registrador:
            </div>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
              {ringValues.map((v) => {
                const isSel = v.signed === selectedNum;
                return (
                  <button
                    key={v.bin}
                    type="button"
                    onClick={() => setSelectedNum(v.signed)}
                    className={`min-h-[44px] rounded-full border text-center transition-all flex flex-col items-center justify-center focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
                      isSel
                        ? 'border-lake-blue bg-lake-blue text-white font-bold shadow-sm'
                        : v.isTMin
                        ? 'border-[#ff9473] bg-[#ff9473]/10 text-off-black hover:border-off-black'
                        : 'border-ash bg-parchment/70 text-graphite hover:border-off-black hover:bg-white'
                    }`}
                  >
                    <span className="text-[11px] font-bold">
                      {v.signed > 0 ? `+${v.signed}` : v.signed}
                    </span>
                    <span className="text-[9px] opacity-70">{v.bin}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Negation Box */}
          <div className="rounded-card border border-ash bg-parchment p-5 space-y-2">
            <div className="flex items-center justify-between border-b border-ash/80 pb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-lake-blue font-bold">
                Regra da Negação (~x + 1)
              </span>
              <span className="font-mono text-xs text-smoke">Simetria Diametral</span>
            </div>
            <div className="font-mono text-xs space-y-1.5 text-off-black pt-1">
              <div>
                Estado original x ={' '}
                <strong className="text-lake-blue font-bold">{current.signed}</strong> (binário:{' '}
                {current.bin})
              </div>
              <div>
                Simétrico ~x + 1 ={' '}
                <strong className="text-[#0e7c54] font-bold">{negatedSigned}</strong> (binário:{' '}
                {negated?.bin})
              </div>
            </div>
            <p className="font-mono text-xs text-graphite leading-relaxed pt-2 border-t border-ash/60">
              Inverter os bits e somar 1 percorre o anel modular exatamente até o ponto diametralmente oposto no anel modular do registrador.
            </p>
          </div>

          {/* TMin Edge Case Alert */}
          <div className="rounded-card border border-[#ff9473]/80 bg-[#ff9473]/10 p-5 space-y-2">
            <div className="font-mono text-xs uppercase tracking-wider text-[#b93815] font-bold">
              Caso de Borda Crítico: TMin (-8)
            </div>
            <p className="text-xs text-off-black leading-relaxed">
              O zero consome uma posição na metade não-negativa (<code className="font-mono font-bold">0000</code>). Logo, o teto positivo é apenas <strong className="font-mono text-lake-blue">+7</strong> (<code className="font-mono">0111</code>).
            </p>
            <p className="text-xs text-off-black leading-relaxed">
              O valor <strong className="font-mono text-[#b93815]">-8</strong> (<code className="font-mono">1000</code>) não tem par positivo simétrico. O cálculo <code className="font-mono font-bold">-(-8)</code> retorna o próprio <strong className="font-mono text-[#b93815]">-8</strong> no hardware e produz comportamento indefinido em C.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
