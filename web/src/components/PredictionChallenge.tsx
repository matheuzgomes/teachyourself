import { useState } from 'react';

// Icones SVG inline puros sem dependencias externas
const HelpCircleIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckmarkCircleIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const CancelCircleIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const ArrowRightIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const RotateCcwIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

interface Option {
  id: string;
  label: string;
  explanation: string;
}

interface PredictionChallengeProps {
  question: string;
  options: Option[];
  correctOptionId: string;
  technicalTakeaway: string;
}

export default function PredictionChallenge({
  question,
  options,
  correctOptionId,
  technicalTakeaway,
}: PredictionChallengeProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);

  const isCorrect = selected === correctOptionId;
  const currentOption = options.find((o) => o.id === selected);

  const handleReset = () => {
    setSelected(null);
    setRevealed(false);
  };

  return (
    <div className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all">
      {/* Header do Desafio */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ash pb-4 mb-5">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-lake-blue/10 p-2 text-lake-blue border border-lake-blue/20">
            <HelpCircleIcon className="h-4 w-4" />
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-smoke font-medium">
            Desafio de Previsão Ativa : Engenharia de Sistemas
          </span>
        </div>

        {revealed && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-full border border-ash bg-parchment px-3 py-1 text-xs font-mono text-smoke hover:text-off-black hover:border-lake-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
          >
            <RotateCcwIcon className="h-3.5 w-3.5" /> Reiniciar
          </button>
        )}
      </div>

      {/* Pergunta */}
      <p className="font-serif text-lg font-normal text-off-black leading-relaxed mb-5">
        {question}
      </p>

      {/* Lista de Opções */}
      <div className="space-y-2.5" role="radiogroup" aria-label={question}>
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          let btnClass = 'border-ash bg-parchment text-graphite hover:border-lake-blue hover:text-off-black hover:bg-white cursor-pointer';
          let badgeClass = 'bg-white border-ash text-off-black';

          if (revealed) {
            if (opt.id === correctOptionId) {
              btnClass = 'border-mint bg-mint/25 text-off-black font-medium ring-1 ring-mint';
              badgeClass = 'bg-mint text-off-black border-mint font-bold';
            } else if (isSelected) {
              btnClass = 'border-coral bg-coral/20 text-off-black';
              badgeClass = 'bg-coral text-off-black border-coral font-bold';
            } else {
              btnClass = 'border-ash/50 bg-parchment/60 text-smoke opacity-40';
              badgeClass = 'bg-white/60 border-ash/40 text-smoke';
            }
          } else if (isSelected) {
            btnClass = 'border-lake-blue bg-white text-off-black font-medium ring-2 ring-lake-blue/30 shadow-sm';
            badgeClass = 'bg-lake-blue text-white border-lake-blue shadow-sm font-bold';
          }

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => !revealed && setSelected(opt.id)}
              disabled={revealed}
              className={`w-full text-left rounded-2xl border p-4 text-xs md:text-sm font-mono transition-all flex items-start gap-3.5 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${btnClass}`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs border transition-colors ${badgeClass}`}>
                {opt.id}
              </span>
              <span className="mt-0.5 leading-relaxed">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Botão de Verificação */}
      {!revealed && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => selected && setRevealed(true)}
            disabled={!selected}
            className="rounded-full bg-lake-blue text-white px-6 py-2.5 min-h-[44px] inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-medium shadow-sm hover:bg-lake-blue/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed"
          >
            Verificar Hipótese <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Painel de Revelação / Explicação */}
      {revealed && (
        <div className="mt-5 rounded-2xl border border-ash bg-parchment p-5 text-xs md:text-sm font-mono text-graphite space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <span className="flex items-center gap-1.5 font-medium text-off-black bg-mint/30 border border-mint px-3 py-1 rounded-full text-xs">
                <CheckmarkCircleIcon className="h-4 w-4 text-[#0e7c54]" /> Previsão Exata
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-off-black bg-coral/20 border border-coral px-3 py-1 rounded-full text-xs">
                <CancelCircleIcon className="h-4 w-4 text-crimson" /> Previsão Incorreta
              </span>
            )}
          </div>

          <p className="leading-relaxed">
            {currentOption?.explanation}
          </p>

          <div className="pt-3 border-t border-ash text-xs text-smoke">
            <strong className="text-lake-blue font-medium">Conclusão de Hardware : </strong>
            {technicalTakeaway}
          </div>
        </div>
      )}
    </div>
  );
}
