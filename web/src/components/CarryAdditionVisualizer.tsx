import { useState, useEffect } from 'react';

const CalculatorIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="16" y1="14" x2="16" y2="18" />
    <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
  </svg>
);

const ArrowLeft01Icon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ArrowRight01Icon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
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

const RotateCcwIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

export default function CarryAdditionVisualizer() {
  const [step, setStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const steps = [
    {
      col: -1,
      title: 'Estado Inicial: Dois Numeros para Somar',
      carry: ['', '', ''],
      result: ['', '', ''],
      explanation: 'Para somar 148 + 225, o cérebro humano e o circuito elétrico da CPU iniciam obrigatoriamente pela coluna da direita (as unidades ou LSB).',
      highlightCol: null,
    },
    {
      col: 0,
      title: 'Passo 1: Coluna das Unidades (LSB) : 8 + 5',
      carry: ['', '1', ''],
      result: ['', '', '3'],
      explanation: '8 + 5 = 13. O digito 3 permanece no resultado das unidades e o valor 1 sobe como transporte (Carry) saltando para a coluna das dezenas.',
      highlightCol: 'units',
    },
    {
      col: 1,
      title: 'Passo 2: Coluna das Dezenas : 4 + 2 + Carry(1)',
      carry: ['0', '1', ''],
      result: ['', '7', '3'],
      explanation: '4 + 2 + 1 (transporte) = 7. O digito 7 e gravado nas dezenas e o transporte para as centenas e 0.',
      highlightCol: 'tens',
    },
    {
      col: 2,
      title: 'Passo 3: Coluna das Centenas (MSB) : 1 + 2 + Carry(0)',
      carry: ['0', '1', ''],
      result: ['3', '7', '3'],
      explanation: '1 + 2 + 0 (transporte) = 3. O digito 3 e gravado nas centenas. A soma final consolidada e 373.',
      highlightCol: 'hundreds',
    },
  ];

  const current = steps[step];

  // Auto-play loop
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
    }, 1800);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2b59d1]/10 text-lake-blue">
            <CalculatorIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-lake-blue">Aritmética Mecânica</span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
              A Mecânica do Transporte Aritmético (Carry)
            </h4>
            <p className="font-mono text-xs text-graphite mt-0.5">
              Por que toda soma (no papel ou na CPU) deve iniciar obrigatoriamente pelo LSB
            </p>
          </div>
        </div>

        {/* Step Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setStep((p) => (p > 0 ? p - 1 : 0))}
            disabled={step === 0}
            className="flex h-11 items-center gap-1 rounded-full border border-ash bg-parchment px-3 py-1 text-xs font-mono font-medium text-graphite hover:border-off-black hover:text-off-black hover:bg-white disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
          >
            <ArrowLeft01Icon className="h-3.5 w-3.5" /> Anterior
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex min-h-[44px] items-center gap-2 rounded-full border border-lake-blue bg-lake-blue px-4 py-2 text-xs font-mono font-medium text-white hover:bg-lake-blue/90 focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none shadow-sm transition-all"
          >
            {isPlaying ? (
              <>
                <PauseIcon className="h-3.5 w-3.5" /> Pausar
              </>
            ) : (
              <>
                <PlayIcon className="h-3.5 w-3.5" /> Animar Fluxo
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStep((p) => (p < steps.length - 1 ? p + 1 : 0))}
            className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-ash bg-parchment px-4 py-2 text-xs font-mono font-medium text-off-black hover:border-lake-blue hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
          >
            {step === steps.length - 1 ? (
              <>
                <RotateCcwIcon className="h-3.5 w-3.5" /> Reiniciar
              </>
            ) : (
              <>
                Próximo Passo <ArrowRight01Icon className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Arithmetic Register Stack */}
        <div className="md:col-span-6 rounded-card border border-ash bg-parchment p-6 font-mono text-center relative overflow-hidden">
          {/* Moving Carry Leap Beacon */}
          {step === 1 && (
            <div className="absolute top-4 right-1/4 flex items-center gap-1 rounded-full bg-lake-blue px-2.5 py-0.5 text-[9px] font-bold text-white shadow animate-pulse">
              <span>Carry 1 &larr; Salta</span>
            </div>
          )}

          {/* Carry Row */}
          <div className="grid grid-cols-4 gap-2 text-xs font-bold text-lake-blue h-7 items-center border-b border-ash/50 pb-1">
            <span className="text-[10px] text-graphite font-mono text-left uppercase">Carry:</span>
            <span className="font-bold">{current.carry[0]}</span>
            <span className={`font-bold ${current.carry[1] ? 'text-lake-blue scale-110' : ''}`}>
              {current.carry[1]}
            </span>
            <span>{current.carry[2]}</span>
          </div>

          {/* Number 1 (148) */}
          <div className="grid grid-cols-4 gap-2 text-2xl font-serif font-normal text-off-black py-2 items-center">
            <span className="text-sm text-graphite font-mono text-left"></span>
            <span className={current.highlightCol === 'hundreds' ? 'bg-white rounded-lg border border-lake-blue text-lake-blue' : ''}>1</span>
            <span className={current.highlightCol === 'tens' ? 'bg-white rounded-lg border border-lake-blue text-lake-blue' : ''}>4</span>
            <span className={current.highlightCol === 'units' ? 'bg-white rounded-lg border border-lake-blue text-lake-blue' : ''}>8</span>
          </div>

          {/* Number 2 (+ 225) */}
          <div className="grid grid-cols-4 gap-2 text-2xl font-serif font-normal text-off-black py-2 items-center border-b-2 border-off-black/80">
            <span className="text-lg text-lake-blue font-mono text-left font-bold">+</span>
            <span className={current.highlightCol === 'hundreds' ? 'bg-white rounded-lg border border-lake-blue text-lake-blue' : ''}>2</span>
            <span className={current.highlightCol === 'tens' ? 'bg-white rounded-lg border border-lake-blue text-lake-blue' : ''}>2</span>
            <span className={current.highlightCol === 'units' ? 'bg-white rounded-lg border border-lake-blue text-lake-blue' : ''}>5</span>
          </div>

          {/* Result Row (373) */}
          <div className="grid grid-cols-4 gap-2 text-3xl font-serif font-normal text-lake-blue py-3 items-center">
            <span className="text-sm text-graphite font-mono text-left">=</span>
            <span>{current.result[0] || '·'}</span>
            <span>{current.result[1] || '·'}</span>
            <span>{current.result[2] || '·'}</span>
          </div>

          {/* Column labels */}
          <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-graphite border-t border-ash/70 pt-2">
            <span></span>
            <span>Centenas (MSB)</span>
            <span>Dezenas</span>
            <span>Unidades (LSB)</span>
          </div>
        </div>

        {/* Causal Explanation Panel */}
        <div className="md:col-span-6 rounded-card border border-ash bg-parchment p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-ash/70 pb-3">
            <span className="h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
            <h5 className="font-serif text-lg font-normal text-off-black">
              {current.title}
            </h5>
          </div>

          <p className="text-xs text-graphite leading-relaxed">
            {current.explanation}
          </p>

          <div className="pt-3 border-t border-ash/70 text-xs font-mono text-off-black">
            <div className="font-bold text-lake-blue uppercase tracking-wider text-[11px] mb-1">
              Conexao com o Hardware Little Endian:
            </div>
            <p className="text-graphite leading-relaxed">
              No Little Endian, o endereco base de memoria entrega imediatamente o byte das unidades (LSB). O circuito da CPU comeca a somar no ciclo 1 sem esperar dados adicionais, propagando o carry para os registradores subsequentes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
