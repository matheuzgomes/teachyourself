import { HugeiconsIcon } from '@hugeicons/react';
import {
  InfoIcon,
  TriangleAlertIcon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';

export interface SimulationAnnotation {
  text: string;
  variant?: 'info' | 'warning' | 'success';
}

export interface SimulationExplanationProps {
  stepNumber?: number;
  totalSteps?: number;
  title?: string;
  explanation: string;
  annotations?: SimulationAnnotation[];
  metrics?: Record<string, string | number>;
  className?: string;
}

export function SimulationExplanation({
  stepNumber,
  totalSteps,
  title,
  explanation,
  annotations,
  metrics,
  className = '',
}: SimulationExplanationProps) {
  return (
    <div
      className={`mt-6 rounded-2xl border border-ash bg-parchment p-5 md:p-6 text-xs font-mono ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        {/* Narrativa Pedagógica */}
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2 text-lake-blue font-bold tracking-wider uppercase text-[11px]">
            <HugeiconsIcon icon={InfoIcon} className="h-4 w-4 shrink-0" />
            <span>
              {stepNumber !== undefined
                ? `Passo ${stepNumber}${totalSteps !== undefined ? ` de ${totalSteps}` : ''}: `
                : ''}
              {title || 'Mecanismo em Operação'}
            </span>
          </div>

          <p className="font-sans text-sm md:text-base text-off-black leading-relaxed font-normal">
            {explanation}
          </p>

          {/* Anotações Semânticas */}
          {annotations && annotations.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {annotations.map((ann, idx) => {
                const variant = ann.variant || 'info';
                const style = {
                  info: 'bg-periwinkle-mist/50 border-lake-blue/30 text-lake-blue',
                  warning: 'bg-coral/20 border-coral text-crimson font-bold',
                  success: 'bg-mint/40 border-mint/70 text-emerald-800 font-bold',
                }[variant];

                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] ${style}`}
                  >
                    {variant === 'warning' && (
                      <HugeiconsIcon icon={TriangleAlertIcon} className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {variant === 'success' && (
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {variant === 'info' && (
                      <HugeiconsIcon icon={InfoIcon} className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{ann.text}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel Lateral de Métricas */}
        {metrics && Object.keys(metrics).length > 0 && (
          <div className="rounded-xl border border-ash bg-white p-3.5 shrink-0 min-w-[200px] shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-graphite tracking-wider mb-2.5 pb-1.5 border-b border-ash/70">
              Estado do Hardware
            </div>
            <div className="space-y-1.5">
              {Object.entries(metrics).map(([chave, valor]) => (
                <div key={chave} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-graphite">{chave}:</span>
                  <span className="font-bold text-off-black">{valor}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
