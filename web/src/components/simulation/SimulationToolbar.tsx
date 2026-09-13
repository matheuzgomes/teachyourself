import { HugeiconsIcon } from '@hugeicons/react';
import {
  PlayIcon,
  PauseIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  RotateCcwIcon,
} from '@hugeicons/core-free-icons';
import type { SimulationPlayback } from './useSimulationPlayback';

export interface SimulationToolbarProps {
  playback: SimulationPlayback;
  stepLabels?: string[];
  speeds?: number[];
  showSpeedSelector?: boolean;
  className?: string;
}

export function SimulationToolbar({
  playback,
  stepLabels,
  speeds = [1, 1.5, 2],
  showSpeedSelector = true,
  className = '',
}: SimulationToolbarProps) {
  const {
    currentStep,
    totalSteps,
    isPlaying,
    speedMultiplier,
    isFirstStep,
    isLastStep,
    togglePlay,
    next,
    prev,
    jumpTo,
    setSpeed,
  } = playback;

  return (
    <div
      role="toolbar"
      aria-label="Controles de reprodução da simulação"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ash bg-parchment p-3 font-mono text-xs ${className}`}
    >
      {/* Grupo Principal de Transporte */}
      <div className="flex items-center gap-2">
        {/* Botao Anterior */}
        <button
          type="button"
          onClick={prev}
          disabled={isFirstStep}
          aria-label="Passo anterior"
          title="Passo anterior (Seta para a esquerda)"
          className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-ash bg-white px-4 py-2 font-medium text-graphite hover:border-off-black hover:text-off-black disabled:opacity-40 disabled:hover:border-ash disabled:hover:text-graphite focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all shadow-2xs"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Botao Play / Pause */}
        <button
          type="button"
          onClick={togglePlay}
          aria-pressed={isPlaying}
          aria-label={isPlaying ? 'Pausar simulacao' : 'Iniciar reproducao automatica'}
          title={isPlaying ? 'Pausar (Espaco)' : 'Iniciar (Espaco)'}
          className={`flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 font-semibold text-white transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
            isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-lake-blue hover:bg-lake-blue/90'
          }`}
        >
          <HugeiconsIcon
            icon={isPlaying ? PauseIcon : PlayIcon}
            className="h-4 w-4"
          />
          <span>{isPlaying ? 'Pausar' : 'Animar'}</span>
        </button>

        {/* Botao Proximo */}
        <button
          type="button"
          onClick={next}
          aria-label={isLastStep ? 'Reiniciar simulacao' : 'Proximo passo'}
          title={isLastStep ? 'Reiniciar' : 'Proximo passo (Seta para a direita)'}
          className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-ash bg-white px-4 py-2 font-medium text-off-black hover:border-lake-blue hover:text-lake-blue focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none transition-all shadow-2xs"
        >
          <span className="hidden sm:inline">{isLastStep ? 'Reiniciar' : 'Proximo'}</span>
          <HugeiconsIcon
            icon={isLastStep ? RotateCcwIcon : ArrowRight01Icon}
            className="h-4 w-4"
          />
        </button>
      </div>

      {/* Pilulas de Passos */}
      {totalSteps > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {Array.from({ length: totalSteps }, (_, idx) => {
            const isCurrent = idx === currentStep;
            const label = stepLabels && stepLabels[idx] ? stepLabels[idx] : `P${idx + 1}`;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => jumpTo(idx)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Ir para ${label}`}
                className={`flex min-h-[44px] min-w-[40px] items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
                  isCurrent
                    ? 'bg-lake-blue text-white shadow-xs scale-105'
                    : 'bg-white/80 border border-ash text-graphite hover:text-off-black hover:bg-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Seletor de Velocidade */}
      {showSpeedSelector && (
        <div className="flex items-center gap-2 text-xs text-graphite">
          <span className="hidden md:inline text-smoke">Velocidade:</span>
          <div className="flex items-center rounded-full border border-ash bg-white p-1">
            {speeds.map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSpeed(spd)}
                aria-pressed={speedMultiplier === spd}
                className={`flex min-h-[44px] items-center px-3 py-1 rounded-full font-bold transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
                  speedMultiplier === spd
                    ? 'bg-lake-blue text-white shadow-2xs'
                    : 'text-graphite hover:text-off-black'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
