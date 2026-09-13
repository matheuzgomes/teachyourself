import type { ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { RotateCcwIcon } from '@hugeicons/core-free-icons';

export interface SimulationCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'alert' | 'success';
  icon?: any;
  onReset?: () => void;
  headerActions?: ReactNode;
  dataVisualModel?: string;
  className?: string;
  children: ReactNode;
}

export function SimulationCard({
  title,
  subtitle,
  badge,
  badgeVariant = 'default',
  icon,
  onReset,
  headerActions,
  dataVisualModel,
  className = '',
  children,
}: SimulationCardProps) {
  const badgeClasses = {
    default: 'bg-periwinkle-mist/40 text-lake-blue border-lake-blue/30',
    alert: 'bg-coral/15 text-crimson border-coral/40',
    success: 'bg-mint/30 text-emerald-800 font-bold border-mint/60',
  }[badgeVariant];

  return (
    <section
      data-visual-model={dataVisualModel}
      className={`my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all ${className}`}
    >
      {/* Cabeçalho Padronizado */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div className="flex items-start gap-3.5">
          {icon && (
            <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20 shrink-0 mt-0.5">
              <HugeiconsIcon icon={icon} className="h-5 w-5" />
            </div>
          )}
          <div>
            {badge && (
              <span
                className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase font-bold tracking-wider mb-1 ${badgeClasses}`}
              >
                {badge}
              </span>
            )}
            <h3 className="font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight leading-snug">
              {title}
            </h3>
            {subtitle && (
              <p className="font-mono text-xs text-graphite mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Ações do Cabeçalho */}
        <div className="flex items-center gap-2">
          {headerActions}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              aria-label="Reiniciar simulação para o estado inicial"
              title="Reiniciar simulação"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-ash bg-parchment p-2 text-graphite hover:border-off-black hover:text-off-black hover:bg-white focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all"
            >
              <HugeiconsIcon icon={RotateCcwIcon} className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo da Simulação */}
      {children}
    </section>
  );
}
