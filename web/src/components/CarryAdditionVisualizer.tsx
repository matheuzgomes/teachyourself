import { HugeiconsIcon } from '@hugeicons/react';
import { CalculatorIcon } from '@hugeicons/core-free-icons';
import { useSimulationPlayback, SimulationToolbar } from './simulation';

interface AdditionStep {
  col: number;
  title: string;
  carry: [string, string, string];
  result: [string, string, string];
  explanation: string;
  highlightCol: 'units' | 'tens' | 'hundreds' | null;
}

const STEPS: AdditionStep[] = [
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

export default function CarryAdditionVisualizer() {
  const playback = useSimulationPlayback({
    totalSteps: STEPS.length,
    stepIntervalMs: 1800,
    loop: true,
  });

  const current = STEPS[playback.currentStep];

  return (
    <div
      data-visual-model="VIS-09-CARRY-ADDITION"
      className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-periwinkle-mist/40 text-lake-blue">
            <HugeiconsIcon icon={CalculatorIcon} className="h-5 w-5" />
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
      </div>

      {/* Barra de Controles Padronizada com Teclado e Pílulas */}
      <div className="mt-6">
        <SimulationToolbar
          playback={playback}
          stepLabels={['Início', 'Unidades', 'Dezenas', 'Centenas']}
        />
      </div>

      {/* Main Interactive Stage */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Arithmetic Register Stack */}
        <div className="md:col-span-6 rounded-card border border-ash bg-parchment p-6 font-mono text-center relative overflow-hidden">
          {/* Header Bar with Step Indicator & Leap Beacon */}
          <div className="flex items-center justify-between mb-3 min-h-[24px]">
            <span className="text-[10px] uppercase tracking-wider text-smoke font-mono font-medium">Registradores da ALU</span>
            {playback.currentStep === 1 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-lake-blue px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs animate-pulse">
                <span>Carry 1 &larr; Salta para as dezenas</span>
              </span>
            ) : (
              <span className="text-[10px] text-smoke font-mono">
                Coluna ativa: {current.highlightCol ? current.highlightCol.toUpperCase() : 'AGUARDANDO'}
              </span>
            )}
          </div>

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
