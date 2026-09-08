import { useState, useEffect, useCallback } from 'react';

// Pure inline SVG icons - zero external dependencies, zero Vite 504 issues
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

const ArrowRightIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const ArrowLeftIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const CheckIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const AlertIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

type TabMode = 'structure' | 'interactive' | 'steps' | 'table';
type PresetMode = 'set' | 'hold' | 'reset' | 'invalid';

interface StepDetail {
  step: number;
  title: string;
  subtitle: string;
  s: number;
  r: number;
  q: number;
  qBar: number;
  activeWire: 's' | 'nor2' | 'feedbackBottom' | 'nor1' | 'hold';
  explanation: string;
  causalChain: string;
}

const STEPS: StepDetail[] = [
  {
    step: 1,
    title: 'Etapa 1: Pulso de Gravacao na Entrada Set',
    subtitle: 'O sinal externo S sobe para nivel logico 1 (3.3V)',
    s: 1,
    r: 0,
    q: 0,
    qBar: 1,
    activeWire: 's',
    explanation: 'A entrada Set (S) e conectada a linha de alimentacao de 3.3V (nivel 1), enquanto Reset (R) permanece em 0V. O sinal viaja pela linha de entrada inferior ate atingir a porta NOR 2.',
    causalChain: 'S = 1 (3.3V) -> Sinal atinge a entrada da porta NOR 2.',
  },
  {
    step: 2,
    title: 'Etapa 2: A Porta NOR 2 Comuta sua Saida',
    subtitle: 'Qualquer entrada 1 em porta NOR zera a saida imediatamente',
    s: 1,
    r: 0,
    q: 0,
    qBar: 0,
    activeWire: 'nor2',
    explanation: 'Pela regra booleana da porta NOR (negacao do OU), qualquer entrada em nivel alto forca a saida a cair para zero: !(1 OR Q) = 0. A saida Q_negada comuta de 1 para 0.',
    causalChain: 'NOR 2 processa S = 1 -> Saida Q_negada cai para 0V.',
  },
  {
    step: 3,
    title: 'Etapa 3: O Nivel 0 Sobe pela Realimentacao',
    subtitle: 'O fio de feedback transporta o novo estado para a porta superior',
    s: 1,
    r: 0,
    q: 0,
    qBar: 0,
    activeWire: 'feedbackBottom',
    explanation: 'O nivel de tensao zero gerado por Q_negada sobe pelo fio de realimentacao roxo em direcao a entrada da porta NOR 1. Esta e a acao de realimentacao que une as duas portas.',
    causalChain: 'Fio de feedback inferior -> Transporta 0V de Q_negada para a entrada da porta NOR 1.',
  },
  {
    step: 4,
    title: 'Etapa 4: A Porta NOR 1 Estabiliza a Saida Q',
    subtitle: 'Duas entradas em 0 produzem nivel alto na saida NOR: !(0 OR 0) = 1',
    s: 1,
    r: 0,
    q: 1,
    qBar: 0,
    activeWire: 'nor1',
    explanation: 'A porta NOR 1 superior recebe R = 0V e feedback Q_negada = 0V. Com ambas as entradas zeradas, a porta produz nivel alto 1 (3.3V) na saida Q. O bit 1 esta oficialmente gravado!',
    causalChain: 'NOR 1 recebe R = 0 e Q_negada = 0 -> Saida Q sobe para 1 (3.3V, verde).',
  },
  {
    step: 5,
    title: 'Etapa 5: O Pulso Cessa, mas o Circuito Lembra!',
    subtitle: 'Hold autossustentado: a saida Q mantem NOR 2 desligada',
    s: 0,
    r: 0,
    q: 1,
    qBar: 0,
    activeWire: 'hold',
    explanation: 'O comando externo Set desliga e volta para 0V. No entanto, o nivel 1 da saida Q agora desce pelo feedback superior mantendo a porta NOR 2 forçada em 0. O circuito lembra o valor gravado por conta propria, sem nenhuma energia nas entradas de comando!',
    causalChain: 'S volta a 0 -> Feedback de Q = 1 mantem NOR 2 em 0 -> Q_negada permanece 0 -> Q permanece 1.',
  },
];

export default function SrLatchInteractive() {
  const [tab, setTab] = useState<TabMode>('interactive');
  const [s, setS] = useState<number>(1);
  const [r, setR] = useState<number>(0);
  const [q, setQ] = useState<number>(1);
  const [qBar, setQBar] = useState<number>(0);
  const [preset, setPreset] = useState<PresetMode>('set');

  // Step-by-step state
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Apply state updates based on S and R
  const applyInputs = useCallback((newS: number, newR: number) => {
    setS(newS);
    setR(newR);

    if (newS === 1 && newR === 0) {
      setQ(1);
      setQBar(0);
      setPreset('set');
    } else if (newS === 0 && newR === 1) {
      setQ(0);
      setQBar(1);
      setPreset('reset');
    } else if (newS === 1 && newR === 1) {
      setQ(0);
      setQBar(0);
      setPreset('invalid');
    } else {
      // S = 0, R = 0 (Hold)
      setPreset('hold');
      setQ((prevQ) => {
        if (prevQ === 0 && qBar === 0) {
          setQBar(0);
          return 1;
        }
        return prevQ;
      });
    }
  }, [qBar]);

  // Manual switch toggles
  const toggleS = () => {
    const nextS = s === 1 ? 0 : 1;
    applyInputs(nextS, r);
  };

  const toggleR = () => {
    const nextR = r === 1 ? 0 : 1;
    applyInputs(s, nextR);
  };

  // Step-by-step autoplay timer
  useEffect(() => {
    if (tab !== 'steps' || !isPlaying) return;

    const timer = setInterval(() => {
      setStepIdx((prev) => {
        const next = (prev + 1) % STEPS.length;
        const targetStep = STEPS[next];
        setS(targetStep.s);
        setR(targetStep.r);
        setQ(targetStep.q);
        setQBar(targetStep.qBar);
        return next;
      });
    }, 2200);

    return () => clearInterval(timer);
  }, [tab, isPlaying]);

  const selectStep = (index: number) => {
    setStepIdx(index);
    const targetStep = STEPS[index];
    setS(targetStep.s);
    setR(targetStep.r);
    setQ(targetStep.q);
    setQBar(targetStep.qBar);
  };

  const handleNextStep = () => {
    selectStep((stepIdx + 1) % STEPS.length);
  };

  const handlePrevStep = () => {
    selectStep((stepIdx - 1 + STEPS.length) % STEPS.length);
  };

  const currentStepData = STEPS[stepIdx];

  // Active wire flags
  const isSActive = s === 1;
  const isRActive = r === 1;
  const isQActive = q === 1;
  const isQBarActive = qBar === 1;
  const isInvalid = s === 1 && r === 1;

  // Active feedback flags
  const isFeedbackTopActive = q === 1;
  const isFeedbackBottomActive = qBar === 1;

  return (
    <div
      data-visual-model="VIS-01-SR-LATCH-NOR"
      className="my-8 rounded-card border border-ash bg-white p-5 md:p-8 font-sans shadow-sm"
    >
      <style>{`
        @keyframes circuitDash {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .circuit-flow-dash {
          animation: circuitDash 1.2s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .circuit-flow-dash {
            animation: none;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ash pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-lake-blue font-semibold">
              Card Didatico Interativo em 2D
            </span>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl font-normal text-off-black mt-1">
            Latch SR com Portas NOR: A Memoria por Realimentacao
          </h3>
          <p className="font-mono text-xs text-graphite mt-1">
            Duas portas NOR cruzadas onde cada saida alimenta a entrada oposta para reter 1 bit.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {isInvalid ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f85149]/10 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#f85149] border border-[#f85149]/30">
              <AlertIcon className="h-4 w-4 text-[#f85149]" />
              Estado Invalido (S=1, R=1)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a7f37]/10 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#1a7f37] border border-[#1a7f37]/30">
              <CheckIcon className="h-4 w-4 text-[#1a7f37]" />
              Estado Estavel: Q = {q}, Q̄ = {qBar}
            </span>
          )}
        </div>
      </div>

      {/* Golden Rule Anchor Callout */}
      <div className="mt-4 rounded-2xl border border-ash/80 bg-parchment/60 p-3.5 px-4 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lake-blue/10 text-lake-blue">
          <CpuIcon className="h-4 w-4" />
        </div>
        <p className="font-serif text-sm md:text-base text-off-black leading-snug">
          <strong className="font-semibold text-lake-blue">A Regra de Ouro da Memoria:</strong> O circuito lembra porque a saida volta e influencia a si mesma. Sem realimentacao, a eletricidade nao possui passado.
        </p>
      </div>

      {/* Direct Input Toggles Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lake-blue/30 bg-lake-blue/5 p-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-lake-blue">
            Chaves de Entrada Diretas:
          </span>
          <span className="font-mono text-xs text-graphite hidden sm:inline">
            (Clique para alternar individualmente entre 0V e 3.3V)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle S */}
          <button
            type="button"
            onClick={toggleS}
            className={`min-h-[44px] px-4 py-2 rounded-full font-mono text-xs font-bold flex items-center gap-2 transition-all active:scale-[0.98] ${
              s === 1
                ? 'bg-lake-blue text-white shadow-sm ring-2 ring-lake-blue/40'
                : 'bg-white text-off-black hover:bg-parchment border border-ash/80'
            }`}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-current" />
            Entrada Set (S): {s === 1 ? '1 (3.3V)' : '0 (0V)'}
          </button>

          {/* Toggle R */}
          <button
            type="button"
            onClick={toggleR}
            className={`min-h-[44px] px-4 py-2 rounded-full font-mono text-xs font-bold flex items-center gap-2 transition-all active:scale-[0.98] ${
              r === 1
                ? 'bg-lake-blue text-white shadow-sm ring-2 ring-lake-blue/40'
                : 'bg-white text-off-black hover:bg-parchment border border-ash/80'
            }`}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-current" />
            Entrada Reset (R): {r === 1 ? '1 (3.3V)' : '0 (0V)'}
          </button>
        </div>
      </div>

      {/* Main Diagram Area */}
      <div className="mt-4 rounded-3xl border border-ash/70 bg-[#faf9f7] p-3 md:p-6 overflow-x-auto">
        <div className="min-w-[760px] md:min-w-full">
          <svg
            viewBox="0 0 880 370"
            className="w-full h-auto select-none"
            aria-label="Diagrama esquematico do Latch SR com duas portas NOR cruzadas"
          >
            {/* Background Grid Accent */}
            <defs>
              <pattern id="srGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e8e5e0" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="880" height="370" fill="url(#srGrid)" rx="16" opacity="0.6" />

            {/* ======================================================== */}
            {/* INPUT LINES (R and S) - INTERACTIVE CLICK TARGETS */}
            {/* ======================================================== */}

            {/* Input Reset (R) Wire */}
            <path
              d="M 100 80 L 320 80"
              fill="none"
              stroke={isRActive ? '#2b59d1' : '#cecac8'}
              strokeWidth={isRActive ? '3.5' : '2.2'}
              className="transition-colors duration-300"
            />
            {/* Input R Source Terminal Pin & Clickable Switch */}
            <g
              role="button"
              tabIndex={0}
              onClick={toggleR}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleR();
                }
              }}
              className="cursor-pointer focus:outline-none"
              aria-label="Alternar Entrada Reset (R)"
            >
              <rect x="15" y="50" width="85" height="48" rx="8" fill="#ffffff" stroke={isRActive ? '#2b59d1' : '#cecac8'} strokeWidth="1.5" />
              <text x="57" y="68" textAnchor="middle" className="font-mono text-xs font-semibold fill-off-black">
                Reset (R)
              </text>
              <text x="57" y="86" textAnchor="middle" className={`font-mono text-xs font-bold ${isRActive ? 'fill-lake-blue' : 'fill-graphite'}`}>
                {r === 1 ? '1 (3.3V)' : '0 (0V)'}
              </text>
              <circle
                cx="100"
                cy="80"
                r="7"
                fill={isRActive ? '#2b59d1' : '#cecac8'}
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-colors duration-300"
              />
            </g>

            {/* Input Set (S) Wire */}
            <path
              d="M 100 290 L 320 290"
              fill="none"
              stroke={isSActive ? '#2b59d1' : '#cecac8'}
              strokeWidth={isSActive ? '3.5' : '2.2'}
              className="transition-colors duration-300"
            />
            {/* Input S Source Terminal Pin & Clickable Switch */}
            <g
              role="button"
              tabIndex={0}
              onClick={toggleS}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleS();
                }
              }}
              className="cursor-pointer focus:outline-none"
              aria-label="Alternar Entrada Set (S)"
            >
              <rect x="15" y="260" width="85" height="48" rx="8" fill="#ffffff" stroke={isSActive ? '#2b59d1' : '#cecac8'} strokeWidth="1.5" />
              <text x="57" y="278" textAnchor="middle" className="font-mono text-xs font-semibold fill-off-black">
                Set (S)
              </text>
              <text x="57" y="296" textAnchor="middle" className={`font-mono text-xs font-bold ${isSActive ? 'fill-lake-blue' : 'fill-graphite'}`}>
                {s === 1 ? '1 (3.3V)' : '0 (0V)'}
              </text>
              <circle
                cx="100"
                cy="290"
                r="7"
                fill={isSActive ? '#2b59d1' : '#cecac8'}
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-colors duration-300"
              />
            </g>

            {/* ======================================================== */}
            {/* GATES (NOR 1 and NOR 2) */}
            {/* ======================================================== */}

            {/* Gate NOR 1 (Top) */}
            <g className="transition-transform duration-200">
              <rect
                x="320"
                y="55"
                width="150"
                height="70"
                rx="12"
                fill="#ffffff"
                stroke="#242424"
                strokeWidth="2"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))"
              />
              <text x="395" y="88" textAnchor="middle" className="font-mono text-base font-bold fill-off-black">
                NOR 1
              </text>
              <text x="395" y="107" textAnchor="middle" className="font-mono text-xs font-semibold fill-graphite">
                Q = ¬(R ∨ Q̄)
              </text>
              {/* Inversion Circle Pin */}
              <circle cx="477" cy="90" r="7" fill="#ffffff" stroke="#242424" strokeWidth="2" />
            </g>

            {/* Gate NOR 2 (Bottom) */}
            <g className="transition-transform duration-200">
              <rect
                x="320"
                y="245"
                width="150"
                height="70"
                rx="12"
                fill="#ffffff"
                stroke="#242424"
                strokeWidth="2"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))"
              />
              <text x="395" y="278" textAnchor="middle" className="font-mono text-base font-bold fill-off-black">
                NOR 2
              </text>
              <text x="395" y="297" textAnchor="middle" className="font-mono text-xs font-semibold fill-graphite">
                Q̄ = ¬(S ∨ Q)
              </text>
              {/* Inversion Circle Pin */}
              <circle cx="477" cy="280" r="7" fill="#ffffff" stroke="#242424" strokeWidth="2" />
            </g>

            {/* ======================================================== */}
            {/* OUTPUT WIRES (Q and Q_negada) */}
            {/* ======================================================== */}

            {/* Output Q Wire */}
            <path
              d="M 484 90 L 730 90"
              fill="none"
              stroke={isQActive ? '#1a7f37' : isInvalid ? '#f85149' : '#cecac8'}
              strokeWidth={isQActive ? '3.5' : '2.2'}
              className="transition-colors duration-300"
            />
            {/* Output Q Terminal Pin */}
            <circle
              cx="730"
              cy="90"
              r="6"
              fill={isQActive ? '#1a7f37' : isInvalid ? '#f85149' : '#cecac8'}
              className="transition-colors duration-300"
            />
            <text x="745" y="84" className="font-mono text-base font-bold fill-off-black">
              Saida Q
            </text>
            <text
              x="745"
              y="104"
              className={`font-mono text-sm font-bold ${
                isQActive ? 'fill-[#1a7f37]' : isInvalid ? 'fill-[#f85149]' : 'fill-graphite'
              }`}
            >
              {q === 1 ? '1 (ALTO / 3.3V)' : '0 (BAIXO / 0V)'}
            </text>

            {/* Output Q_negada Wire */}
            <path
              d="M 484 280 L 730 280"
              fill="none"
              stroke={isQBarActive ? '#1a7f37' : isInvalid ? '#f85149' : '#cecac8'}
              strokeWidth={isQBarActive ? '3.5' : '2.2'}
              className="transition-colors duration-300"
            />
            {/* Output Q_negada Terminal Pin */}
            <circle
              cx="730"
              cy="280"
              r="6"
              fill={isQBarActive ? '#1a7f37' : isInvalid ? '#f85149' : '#cecac8'}
              className="transition-colors duration-300"
            />
            <text x="745" y="274" className="font-mono text-base font-bold fill-off-black">
              Saida Q̄ (Q negada)
            </text>
            <text
              x="745"
              y="294"
              className={`font-mono text-sm font-bold ${
                isQBarActive ? 'fill-[#1a7f37]' : isInvalid ? 'fill-[#f85149]' : 'fill-graphite'
              }`}
            >
              {qBar === 1 ? '1 (ALTO / 3.3V)' : '0 (BAIXO / 0V)'}
            </text>

            {/* ======================================================== */}
            {/* FEEDBACK LOOPS (NON-COLLIDING PLANAR TRACKS) */}
            {/* ======================================================== */}

            {/* Feedback 1: From Q down to NOR 2 Upper Pin */}
            <circle
              cx="570"
              cy="90"
              r="4.5"
              fill={isFeedbackTopActive ? '#6f42c1' : '#cecac8'}
              className="transition-colors duration-300"
            />
            <path
              d="M 570 90 L 570 155 L 240 155 L 240 265 L 320 265"
              fill="none"
              stroke={isFeedbackTopActive ? '#6f42c1' : '#cecac8'}
              strokeWidth={isFeedbackTopActive ? '2.8' : '1.8'}
              strokeDasharray={isFeedbackTopActive ? '6 4' : 'none'}
              className={`transition-colors duration-300 ${isFeedbackTopActive ? 'circuit-flow-dash' : ''}`}
            />
            <path
              d="M 405 155 L 395 150 L 395 160 Z"
              fill={isFeedbackTopActive ? '#6f42c1' : '#b5b0ad'}
              className="transition-colors duration-300"
            />
            <text
              x="415"
              y="147"
              className={`font-mono text-xs font-bold ${
                isFeedbackTopActive ? 'fill-[#6f42c1]' : 'fill-smoke'
              }`}
            >
              Realimentacao Q ({q}) para NOR 2
            </text>

            {/* Feedback 2: From Q_negada up to NOR 1 Lower Pin */}
            <circle
              cx="630"
              cy="280"
              r="4.5"
              fill={isFeedbackBottomActive ? '#6f42c1' : '#cecac8'}
              className="transition-colors duration-300"
            />
            <path
              d="M 630 280 L 630 215 L 210 215 L 210 105 L 320 105"
              fill="none"
              stroke={isFeedbackBottomActive ? '#6f42c1' : '#cecac8'}
              strokeWidth={isFeedbackBottomActive ? '2.8' : '1.8'}
              strokeDasharray={isFeedbackBottomActive ? '6 4' : 'none'}
              className={`transition-colors duration-300 ${isFeedbackBottomActive ? 'circuit-flow-dash' : ''}`}
            />
            <path
              d="M 405 215 L 395 210 L 395 220 Z"
              fill={isFeedbackBottomActive ? '#6f42c1' : '#b5b0ad'}
              className="transition-colors duration-300"
            />
            <text
              x="415"
              y="232"
              className={`font-mono text-xs font-bold ${
                isFeedbackBottomActive ? 'fill-[#6f42c1]' : 'fill-smoke'
              }`}
            >
              Realimentacao Q̄ ({qBar}) para NOR 1
            </text>

            {/* Structure Mode Annotations */}
            {tab === 'structure' && (
              <g className="transition-opacity duration-300">
                <rect x="18" y="140" width="175" height="60" rx="8" fill="#2b59d1" fillOpacity="0.08" stroke="#2b59d1" strokeWidth="1" />
                <text x="26" y="160" className="font-mono text-xs font-bold fill-lake-blue">Entradas Externas</text>
                <text x="26" y="176" className="font-mono text-xs fill-graphite">S e R injetam comandos</text>
                <text x="26" y="190" className="font-mono text-xs fill-graphite">de Set e Reset</text>

                <rect x="670" y="140" width="195" height="60" rx="8" fill="#1a7f37" fillOpacity="0.08" stroke="#1a7f37" strokeWidth="1" />
                <text x="680" y="160" className="font-mono text-xs font-bold fill-[#1a7f37]">Saidas Complementares</text>
                <text x="680" y="176" className="font-mono text-xs fill-graphite">Q e Q̄ sempre opostos</text>
                <text x="680" y="190" className="font-mono text-xs fill-graphite">em regime valido</text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Persistent Preset Commands Bar (Available across all modes) */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-parchment/60 p-3.5 rounded-2xl border border-ash/70">
        <span className="font-mono text-xs text-graphite font-semibold px-2">
          Comandos Rapidos:
        </span>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyInputs(1, 0)}
            className={`min-h-[44px] px-4 py-2 rounded-full font-mono text-xs font-semibold transition-all active:scale-[0.98] ${
              preset === 'set'
                ? 'bg-lake-blue text-white shadow-sm ring-2 ring-lake-blue/40'
                : 'bg-white text-off-black hover:bg-parchment border border-ash/70'
            }`}
          >
            Set (S=1, R=0): Gravar 1
          </button>

          <button
            type="button"
            onClick={() => applyInputs(0, 0)}
            className={`min-h-[44px] px-4 py-2 rounded-full font-mono text-xs font-semibold transition-all active:scale-[0.98] ${
              preset === 'hold'
                ? 'bg-off-black text-white shadow-sm ring-2 ring-off-black/30'
                : 'bg-white text-off-black hover:bg-parchment border border-ash/70'
            }`}
          >
            Hold (S=0, R=0): Reter Memoria
          </button>

          <button
            type="button"
            onClick={() => applyInputs(0, 1)}
            className={`min-h-[44px] px-4 py-2 rounded-full font-mono text-xs font-semibold transition-all active:scale-[0.98] ${
              preset === 'reset'
                ? 'bg-graphite text-white shadow-sm ring-2 ring-graphite/40'
                : 'bg-white text-off-black hover:bg-parchment border border-ash/70'
            }`}
          >
            Reset (S=0, R=1): Limpar 0
          </button>

          <button
            type="button"
            onClick={() => applyInputs(1, 1)}
            className={`min-h-[44px] px-4 py-2 rounded-full font-mono text-xs font-semibold transition-all active:scale-[0.98] ${
              preset === 'invalid'
                ? 'bg-[#f85149] text-white shadow-sm ring-2 ring-[#f85149]/40'
                : 'bg-white text-[#f85149] hover:bg-[#f85149]/10 border border-[#f85149]/40'
            }`}
          >
            Invalido (S=1, R=1)
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-ash/50 pb-4">
        <button
          type="button"
          onClick={() => {
            setTab('structure');
            setIsPlaying(false);
          }}
          className={`min-h-[44px] px-5 py-2.5 rounded-full font-mono text-xs transition-all active:scale-[0.98] ${
            tab === 'structure'
              ? 'bg-off-black text-white font-semibold shadow-sm'
              : 'bg-parchment/80 text-graphite hover:bg-parchment hover:text-off-black border border-ash/60'
          }`}
        >
          1. Estrutura do Circuito
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('interactive');
            setIsPlaying(false);
          }}
          className={`min-h-[44px] px-5 py-2.5 rounded-full font-mono text-xs transition-all active:scale-[0.98] ${
            tab === 'interactive'
              ? 'bg-off-black text-white font-semibold shadow-sm'
              : 'bg-parchment/80 text-graphite hover:bg-parchment hover:text-off-black border border-ash/60'
          }`}
        >
          2. Diagnostico Booleano
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('steps');
            selectStep(0);
          }}
          className={`min-h-[44px] px-5 py-2.5 rounded-full font-mono text-xs transition-all active:scale-[0.98] ${
            tab === 'steps'
              ? 'bg-off-black text-white font-semibold shadow-sm'
              : 'bg-parchment/80 text-graphite hover:bg-parchment hover:text-off-black border border-ash/60'
          }`}
        >
          3. Passo a Passo Causal
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('table');
            setIsPlaying(false);
          }}
          className={`min-h-[44px] px-5 py-2.5 rounded-full font-mono text-xs transition-all active:scale-[0.98] ${
            tab === 'table'
              ? 'bg-off-black text-white font-semibold shadow-sm'
              : 'bg-parchment/80 text-graphite hover:bg-parchment hover:text-off-black border border-ash/60'
          }`}
        >
          4. Tabela-Verdade Sincronizada
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: ESTRUTURA */}
      {/* ============================================================ */}
      {tab === 'structure' && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-ash/80 bg-parchment/40 p-4">
              <span className="font-mono text-xs font-bold text-lake-blue uppercase tracking-wider">
                1. As Portas NOR Cruzadas
              </span>
              <p className="font-serif text-sm text-off-black mt-2 leading-relaxed">
                Cada porta NOR realiza a operacao logica de negacao da soma: a saida sera 1 somente se todas as suas entradas forem 0. Qualquer entrada em 1 forca a saida a 0 imediatamente.
              </p>
            </div>

            <div className="rounded-2xl border border-ash/80 bg-parchment/40 p-4">
              <span className="font-mono text-xs font-bold text-[#6f42c1] uppercase tracking-wider">
                2. A Malha de Realimentacao
              </span>
              <p className="font-serif text-sm text-off-black mt-2 leading-relaxed">
                A saida Q da porta superior desce e alimenta a porta inferior. Ao mesmo tempo, a saida Q̄ da porta inferior sobe e alimenta a porta superior. Esse entrelaçamento fecha o ciclo de causalidade.
              </p>
            </div>

            <div className="rounded-2xl border border-ash/80 bg-parchment/40 p-4">
              <span className="font-mono text-xs font-bold text-[#1a7f37] uppercase tracking-wider">
                3. O Ponto de Biestabilidade
              </span>
              <p className="font-serif text-sm text-off-black mt-2 leading-relaxed">
                O circuito possui dois estados fisicos estaveis: (Q=1, Q̄=0) ou (Q=0, Q̄=1). Uma vez colocado em um desses estados, ele se mantem nele indefinidamente atraves da propria circulacao do sinal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: DIAGNOSTICO BOOLEANO */}
      {/* ============================================================ */}
      {tab === 'interactive' && (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-ash/80 bg-white p-5">
            <div className="flex items-center justify-between border-b border-ash/40 pb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-off-black">
                Diagnostico Fisico do Circuito em Tempo Real
              </span>
              <span className="font-mono text-xs text-graphite">
                Entradas: S={s}, R={r} | Saidas: Q={q}, Q̄={qBar}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-ash/60 bg-parchment/30 p-3.5">
                <span className="font-mono text-xs font-semibold text-off-black">
                  Mecanica da Porta NOR 1 (Superior)
                </span>
                <p className="font-serif text-sm text-graphite mt-1.5 leading-relaxed">
                  Entradas atuais: R = {r} e Realimentacao Q̄ = {qBar}. A operacao booleana calculada e ¬({r} ∨ {qBar}) = <strong className="text-off-black">{q}</strong>. Portanto, o fio de saida Q esta em {q === 1 ? '3.3V (Nivel Alto / Verde)' : '0V (Nivel Baixo)'}.
                </p>
              </div>

              <div className="rounded-xl border border-ash/60 bg-parchment/30 p-3.5">
                <span className="font-mono text-xs font-semibold text-off-black">
                  Mecanica da Porta NOR 2 (Inferior)
                </span>
                <p className="font-serif text-sm text-graphite mt-1.5 leading-relaxed">
                  Entradas atuais: S = {s} e Realimentacao Q = {q}. A operacao booleana calculada e ¬({s} ∨ {q}) = <strong className="text-off-black">{qBar}</strong>. Portanto, o fio de saida Q̄ esta em {qBar === 1 ? '3.3V (Nivel Alto / Verde)' : '0V (Nivel Baixo)'}.
                </p>
              </div>
            </div>

            {isInvalid && (
              <div className="mt-4 rounded-xl border border-[#f85149]/40 bg-[#f85149]/10 p-3.5 flex items-start gap-3">
                <AlertIcon className="h-5 w-5 text-[#f85149] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-mono text-xs font-bold text-[#f85149] uppercase tracking-wide">
                    Alerta de Metaestabilidade e Quebra da Invariante Complementar
                  </h4>
                  <p className="font-serif text-sm text-off-black mt-1 leading-relaxed">
                    Quando ambas as entradas S e R recebem 1 ao mesmo tempo, ambas as portas NOR sao forcadas a colocar suas saidas em 0 (Q=0 e Q̄=0). Isso viola a propriedade fundamental de que Q e Q̄ devem ser complementares. Se ambas as entradas voltarem a 0 simultaneamente, o circuito entrara em uma corrida critica (race condition), oscilando de forma imprevisivel antes de cair aleatoriamente em 0 ou 1.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: PASSO A PASSO CAUSAL */}
      {/* ============================================================ */}
      {tab === 'steps' && (
        <div className="mt-6 space-y-5">
          {/* Step Selector Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-parchment/50 p-3.5 rounded-2xl border border-ash/60">
            {/* Step Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-graphite font-semibold mr-1">
                Etapa:
              </span>
              {STEPS.map((st, idx) => (
                <button
                  key={st.step}
                  type="button"
                  onClick={() => {
                    selectStep(idx);
                    setIsPlaying(false);
                  }}
                  className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full font-mono text-xs font-bold transition-all active:scale-[0.98] ${
                    stepIdx === idx
                      ? 'bg-lake-blue text-white shadow-sm ring-2 ring-lake-blue/40'
                      : 'bg-white text-off-black hover:bg-parchment border border-ash/70'
                  }`}
                  aria-label={`Selecionar ${st.title}`}
                >
                  {st.step}
                </button>
              ))}
            </div>

            {/* Play/Pause and Step Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevStep}
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-full bg-white hover:bg-parchment border border-ash/70 text-off-black flex items-center justify-center transition-all active:scale-[0.98]"
                aria-label="Etapa anterior"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`min-h-[44px] px-4 py-2 rounded-full font-mono text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.98] ${
                  isPlaying
                    ? 'bg-[#1a7f37] text-white shadow-sm'
                    : 'bg-off-black text-white shadow-sm'
                }`}
              >
                {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                {isPlaying ? 'Pausar' : 'Reproduzir'}
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-full bg-white hover:bg-parchment border border-ash/70 text-off-black flex items-center justify-center transition-all active:scale-[0.98]"
                aria-label="Proxima etapa"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Current Step Narrative Card */}
          <div className="rounded-2xl border border-lake-blue/30 bg-lake-blue/5 p-5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase font-bold tracking-wider text-lake-blue">
                Sequencia Causal de Propagacao ({currentStepData.step} de {STEPS.length})
              </span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black mt-1">
              {currentStepData.title}
            </h4>
            <p className="font-mono text-xs text-lake-blue mt-0.5">
              {currentStepData.subtitle}
            </p>

            <p className="font-serif text-base text-off-black mt-3 leading-relaxed">
              {currentStepData.explanation}
            </p>

            <div className="mt-4 rounded-xl border border-ash/70 bg-white p-3.5 flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-graphite uppercase shrink-0">
                Cadeia Fisica:
              </span>
              <span className="font-mono text-xs text-off-black">
                {currentStepData.causalChain}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: TABELA-VERDADE SINCRONIZADA */}
      {/* ============================================================ */}
      {tab === 'table' && (
        <div className="mt-6 space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-ash">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-parchment text-graphite border-b border-ash uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 px-4">Entrada S</th>
                  <th className="p-3.5 px-4">Entrada R</th>
                  <th className="p-3.5 px-4">Q (Proximo)</th>
                  <th className="p-3.5 px-4">Q̄ (Proximo)</th>
                  <th className="p-3.5 px-4">Estado Logico</th>
                  <th className="p-3.5 px-4">Descricao Fisica do Sinal</th>
                  <th className="p-3.5 px-4 text-right">Acao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ash/60 bg-white">
                {/* Row 1: Hold */}
                <tr
                  className={`transition-colors ${
                    s === 0 && r === 0 ? 'bg-lake-blue/10 font-bold text-off-black' : 'hover:bg-parchment/40 text-graphite'
                  }`}
                >
                  <td className="p-3.5 px-4">0</td>
                  <td className="p-3.5 px-4">0</td>
                  <td className="p-3.5 px-4 text-[#1a7f37]">Q (retido)</td>
                  <td className="p-3.5 px-4 text-[#1a7f37]">Q̄ (retido)</td>
                  <td className="p-3.5 px-4 font-semibold text-off-black">Hold (Manter)</td>
                  <td className="p-3.5 px-4 font-sans text-xs">
                    Nenhum sinal ativo nas entradas. O loop de realimentacao sustenta o estado estavel anterior.
                  </td>
                  <td className="p-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => applyInputs(0, 0)}
                      className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-ash hover:bg-parchment text-off-black text-xs font-mono font-semibold active:scale-[0.98]"
                    >
                      Aplicar
                    </button>
                  </td>
                </tr>

                {/* Row 2: Set */}
                <tr
                  className={`transition-colors ${
                    s === 1 && r === 0 ? 'bg-lake-blue/10 font-bold text-off-black' : 'hover:bg-parchment/40 text-graphite'
                  }`}
                >
                  <td className="p-3.5 px-4 text-lake-blue font-bold">1</td>
                  <td className="p-3.5 px-4">0</td>
                  <td className="p-3.5 px-4 text-[#1a7f37] font-bold">1</td>
                  <td className="p-3.5 px-4">0</td>
                  <td className="p-3.5 px-4 font-semibold text-lake-blue">Set (Gravar 1)</td>
                  <td className="p-3.5 px-4 font-sans text-xs">
                    NOR 2 zera Q̄, liberando NOR 1 para elevar Q a 1. O bit 1 e registrado no circuito.
                  </td>
                  <td className="p-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => applyInputs(1, 0)}
                      className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-ash hover:bg-parchment text-off-black text-xs font-mono font-semibold active:scale-[0.98]"
                    >
                      Aplicar
                    </button>
                  </td>
                </tr>

                {/* Row 3: Reset */}
                <tr
                  className={`transition-colors ${
                    s === 0 && r === 1 ? 'bg-lake-blue/10 font-bold text-off-black' : 'hover:bg-parchment/40 text-graphite'
                  }`}
                >
                  <td className="p-3.5 px-4">0</td>
                  <td className="p-3.5 px-4 text-lake-blue font-bold">1</td>
                  <td className="p-3.5 px-4">0</td>
                  <td className="p-3.5 px-4 text-[#1a7f37] font-bold">1</td>
                  <td className="p-3.5 px-4 font-semibold text-graphite">Reset (Limpar 0)</td>
                  <td className="p-3.5 px-4 font-sans text-xs">
                    NOR 1 zera Q, liberando NOR 2 para elevar Q̄ a 1. O bit 0 e restaurado no circuito.
                  </td>
                  <td className="p-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => applyInputs(0, 1)}
                      className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-ash hover:bg-parchment text-off-black text-xs font-mono font-semibold active:scale-[0.98]"
                    >
                      Aplicar
                    </button>
                  </td>
                </tr>

                {/* Row 4: Invalid */}
                <tr
                  className={`transition-colors ${
                    s === 1 && r === 1 ? 'bg-[#f85149]/15 font-bold text-[#f85149]' : 'hover:bg-parchment/40 text-graphite'
                  }`}
                >
                  <td className="p-3.5 px-4 text-[#f85149] font-bold">1</td>
                  <td className="p-3.5 px-4 text-[#f85149] font-bold">1</td>
                  <td className="p-3.5 px-4 text-[#f85149] font-bold">0</td>
                  <td className="p-3.5 px-4 text-[#f85149] font-bold">0</td>
                  <td className="p-3.5 px-4 font-semibold text-[#f85149]">Invalido / Proibido</td>
                  <td className="p-3.5 px-4 font-sans text-xs text-[#f85149]">
                    Ambas as saidas caem para 0V. Quebra da simetria complementar. Risco iminente de metaestabilidade.
                  </td>
                  <td className="p-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => applyInputs(1, 1)}
                      className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-[#f85149]/40 bg-[#f85149]/10 hover:bg-[#f85149]/20 text-[#f85149] text-xs font-mono font-semibold active:scale-[0.98]"
                    >
                      Aplicar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="font-mono text-xs text-graphite italic">
            Dica: Clique no botao "Aplicar" de qualquer linha da tabela para injetar esses niveis logicos diretamente no diagrama esquematico superior.
          </p>
        </div>
      )}

      {/* Footer Technical Note */}
      <div className="mt-6 border-t border-ash/60 pt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-graphite">
        <span>Tempo de Propagacao do Silicio: t_prop ≈ 0.8ns a 2.0ns</span>
        <span>Tecnologia CMOS: 4 transistores por porta NOR (total 8 MOSFETs)</span>
      </div>
    </div>
  );
}
