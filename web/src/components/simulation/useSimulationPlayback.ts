import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSimulationPlaybackOptions {
  totalSteps: number;
  initialStep?: number;
  stepIntervalMs?: number;
  loop?: boolean;
  autoPlay?: boolean;
  enableHotkeys?: boolean;
  containerRef?: React.RefObject<HTMLElement | null>;
  onStepChange?: (step: number) => void;
}

export interface SimulationPlayback {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speedMultiplier: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  jumpTo: (step: number) => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
}

export function useSimulationPlayback({
  totalSteps,
  initialStep = 0,
  stepIntervalMs = 1800,
  loop = true,
  autoPlay = false,
  enableHotkeys = true,
  containerRef,
  onStepChange,
}: UseSimulationPlaybackOptions): SimulationPlayback {
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (totalSteps <= 0) return 0;
    return Math.max(0, Math.min(initialStep, totalSteps - 1));
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return false;
    }
    return autoPlay;
  });

  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onStepChangeRef = useRef(onStepChange);

  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const jumpTo = useCallback(
    (step: number) => {
      if (totalSteps <= 0) return;
      const bounded = Math.max(0, Math.min(step, totalSteps - 1));
      setCurrentStep(bounded);
      if (onStepChangeRef.current) {
        onStepChangeRef.current(bounded);
      }
    },
    [totalSteps]
  );

  const next = useCallback(() => {
    if (totalSteps <= 0) return;
    setCurrentStep((prev) => {
      const isLast = prev >= totalSteps - 1;
      let nextStep: number;
      if (isLast) {
        if (loop) {
          nextStep = 0;
        } else {
          setIsPlaying(false);
          nextStep = prev;
        }
      } else {
        nextStep = prev + 1;
      }
      if (onStepChangeRef.current && nextStep !== prev) {
        onStepChangeRef.current(nextStep);
      }
      return nextStep;
    });
  }, [totalSteps, loop]);

  const prev = useCallback(() => {
    if (totalSteps <= 0) return;
    setCurrentStep((old) => {
      const prevStep = Math.max(0, old - 1);
      if (onStepChangeRef.current && prevStep !== old) {
        onStepChangeRef.current(prevStep);
      }
      return prevStep;
    });
  }, [totalSteps]);

  const play = useCallback(() => {
    if (totalSteps <= 1) return;
    setIsPlaying(true);
  }, [totalSteps]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((curr) => !curr);
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setIsPlaying(false);
    jumpTo(0);
  }, [clearTimer, jumpTo]);

  const setSpeed = useCallback((speed: number) => {
    if (speed > 0) {
      setSpeedMultiplier(speed);
    }
  }, []);

  // Timer de reprodução contínua com cleanup seguro
  useEffect(() => {
    clearTimer();

    if (isPlaying && totalSteps > 1) {
      const interval = Math.max(200, Math.round(stepIntervalMs / speedMultiplier));
      timerRef.current = setInterval(() => {
        next();
      }, interval);
    }

    return () => {
      clearTimer();
    };
  }, [isPlaying, totalSteps, stepIntervalMs, speedMultiplier, next, clearTimer]);

  // Suporte a atalhos de teclado acessíveis
  useEffect(() => {
    if (!enableHotkeys || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se o foco estiver em inputs de texto
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Se um containerRef for fornecido, apenas reagir se o foco estiver dentro do container
      if (containerRef?.current) {
        if (!containerRef.current.contains(document.activeElement)) {
          return;
        }
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        reset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableHotkeys, containerRef, togglePlay, next, prev, reset]);

  return {
    currentStep,
    totalSteps,
    isPlaying,
    speedMultiplier,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === Math.max(0, totalSteps - 1),
    play,
    pause,
    togglePlay,
    next,
    prev,
    jumpTo,
    reset,
    setSpeed,
  };
}
