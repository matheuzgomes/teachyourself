import { useState, useEffect, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon, RotateCcwIcon, ArrowRight01Icon, ArrowLeft01Icon, ZapIcon, SparklesIcon, HelpCircleIcon, TerminalIcon } from '@hugeicons/core-free-icons';

interface FlyingOrb {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  val: number;
  progress: number;
  type: 'launch' | 'overflow-carry';
}

const BIT_WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];

export default function KineticBitMachine() {
  // 8 bits do registrador %al: index 0 é b7 (128), index 7 é b0 (1)
  const [bits, setBits] = useState<number[]>([0, 0, 1, 0, 1, 0, 1, 0]); // Padrão inicial: 42 (0x2A)
  const [carryFlag, setCarryFlag] = useState<number>(0);
  const [lastInstruction, setLastInstruction] = useState<string>('movb $0x2A, %al');
  const [explanation, setExplanation] = useState<string>(
    'Estado inicial: O registrador %al armazena o valor decimal 42 (0x2A em hexadecimal) distribuído em 8 gavetas físicas.'
  );
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [activeSlotPulse, setActiveSlotPulse] = useState<number | null>(null);
  const [cfPulse, setCfPulse] = useState<boolean>(false);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [flyingOrb, setFlyingOrb] = useState<FlyingOrb | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cfRef = useRef<HTMLDivElement>(null);

  const checkReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Calcula valores derivados
  const decimalVal = bits.reduce((acc, bit, idx) => acc + bit * BIT_WEIGHTS[idx], 0);
  const hexVal = decimalVal.toString(16).toUpperCase().padStart(2, '0');
  const binaryStr = bits.join('');

  // Animação de voo parabólico do bit
  const animFrameRef = useRef<number | null>(null);

  const getSlotCoord = (targetIdx: number) => {
    if (containerRef.current && slotRefs.current[targetIdx]) {
      const cRect = containerRef.current.getBoundingClientRect();
      const sRect = slotRefs.current[targetIdx]!.getBoundingClientRect();
      const x = ((sRect.left + sRect.width / 2 - cRect.left) / cRect.width) * 100;
      const y = ((sRect.top + sRect.height / 2 - cRect.top) / cRect.height) * 100;
      return { x, y };
    }
    const defaultXs = [24, 32, 40, 48, 56, 64, 72, 80];
    return { x: defaultXs[targetIdx], y: 78 };
  };

  const getCfCoord = () => {
    if (containerRef.current && cfRef.current) {
      const cRect = containerRef.current.getBoundingClientRect();
      const sRect = cfRef.current.getBoundingClientRect();
      const x = ((sRect.left + sRect.width / 2 - cRect.left) / cRect.width) * 100;
      const y = ((sRect.top + sRect.height / 2 - cRect.top) / cRect.height) * 100;
      return { x, y };
    }
    return { x: 11, y: 78 };
  };

  const launchBitToSlot = (targetIdx: number, val: number, nextBitsState?: number[]) => {
    if (checkReducedMotion()) {
      setBits(
        nextBitsState
          ? nextBitsState
          : (prev) => {
              const next = [...prev];
              next[targetIdx] = val;
              return next;
            }
      );
      setActiveSlotPulse(targetIdx);
      setTimeout(() => setActiveSlotPulse(null), 300);
      return;
    }

    if (isAnimating) return;
    setIsAnimating(true);

    const startX = 85; // Porcentagem horizontal do ejetor
    const startY = 15; // Porcentagem vertical do ejetor
    const target = getSlotCoord(targetIdx);

    const startTime = performance.now();
    const duration = 500; // ms

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      if (progress < 1) {
        setFlyingOrb({
          id: Date.now(),
          startX,
          startY,
          targetX: target.x,
          targetY: target.y,
          val,
          progress,
          type: 'launch',
        });
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setFlyingOrb(null);
        setBits(
          nextBitsState
            ? nextBitsState
            : (prev) => {
                const next = [...prev];
                next[targetIdx] = val;
                return next;
              }
        );
        setActiveSlotPulse(targetIdx);
        setTimeout(() => setActiveSlotPulse(null), 350);
        setIsAnimating(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  // Carrega 1 no registrador (movb $1, %al) com semântica correta da CPU
  const handleInjectBit1 = () => {
    setLastInstruction('movb $1, %al');
    setExplanation(
      'Instrução movb $1, %al: Carrega o valor imediato 1 (0x01) no registrador %al. Todos os bits superiores (b7 a b1) são zerados e o bit b0 recebe 1.'
    );
    launchBitToSlot(7, 1, [0, 0, 0, 0, 0, 0, 0, 1]);
  };

  // Deslocamento para a esquerda (SHL): Bit 7 é arremessado no Carry Flag!
  const handleShiftLeft = () => {
    const ejectedBit = bits[0]; // Bit 7 vai para o Carry Flag
    setLastInstruction('shlb $1, %al');

    if (checkReducedMotion()) {
      setCarryFlag(ejectedBit);
      if (ejectedBit === 1) {
        setCfPulse(true);
        setTimeout(() => setCfPulse(false), 400);
      }
      setBits((prev) => [...prev.slice(1), 0]);
      setExplanation(
        ejectedBit === 1
          ? 'Instrução shlb $1, %al: Todos os bits foram deslocados 1 casa à esquerda. O bit mais significativo (b7) foi capturado no Carry Flag (CF).'
          : 'Instrução shlb $1, %al: Todos os bits foram deslocados 1 casa à esquerda. Como b7 continha 0, o Carry Flag permaneceu zerado.'
      );
      return;
    }

    if (isAnimating) return;
    setIsAnimating(true);

    if (ejectedBit === 1) {
      setExplanation(
        'Instrução shlb $1, %al: Todos os bits deslizam para a esquerda. O bit b7 (1) é arremessado para fora da borda e capturado no cesto do Carry Flag (CF)!'
      );

      const start = getSlotCoord(0);
      const target = getCfCoord();
      const startTime = performance.now();
      const duration = 480;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        if (progress < 1) {
          setFlyingOrb({
            id: Date.now(),
            startX: start.x,
            startY: start.y,
            targetX: target.x,
            targetY: target.y,
            val: 1,
            progress,
            type: 'overflow-carry',
          });
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          setFlyingOrb(null);
          setCarryFlag(1);
          setCfPulse(true);
          setTimeout(() => setCfPulse(false), 400);
          setBits((prev) => [...prev.slice(1), 0]);
          setIsAnimating(false);
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    } else {
      setExplanation(
        'Instrução shlb $1, %al: Todos os bits deslizam para a esquerda. O bit b7 continha 0, portanto o Carry Flag permanece zerado.'
      );
      setCarryFlag(0);
      setBits((prev) => [...prev.slice(1), 0]);
      setTimeout(() => setIsAnimating(false), 150);
    }
  };

  // Deslocamento para a direita (SHR): Bit 0 é ejetado no Carry Flag
  const handleShiftRight = () => {
    if (isAnimating) return;
    const ejectedBit = bits[7];
    setLastInstruction('shrb $1, %al');
    setExplanation(
      `Instrução shrb $1, %al: Todos os bits rolam 1 casa para a direita. O bit b0 (${ejectedBit}) é ejetado para o Carry Flag (CF) e um bit 0 é inserido no bit b7.`
    );

    setCarryFlag(ejectedBit);
    if (ejectedBit === 1) {
      setCfPulse(true);
      setTimeout(() => setCfPulse(false), 400);
    }

    setBits((prev) => [0, ...prev.slice(0, 7)]);
  };

  // Inverter bits (NOT)
  const handleInvert = () => {
    if (isAnimating) return;
    setLastInstruction('notb %al');
    setExplanation(
      'Instrução notb %al: Cada transistor inverte sua polaridade lógica. Onde havia esfera ativa (1), agora há vazio (0), e vice-versa.'
    );
    setBits((prev) => prev.map((b) => (b === 1 ? 0 : 1)));
  };

  // Zerar registrador (XOR %al, %al)
  const handleReset = () => {
    if (isAnimating) return;
    setLastInstruction('xorb %al, %al');
    setExplanation(
      'Instrução xorb %al, %al: Todas as gavetas são descarregadas simultaneamente para o terra (GND), zerando o registrador.'
    );
    setBits([0, 0, 0, 0, 0, 0, 0, 0]);
    setCarryFlag(0);
  };

  // Alternar bit manual ao clicar na gaveta
  const toggleSlotManual = (idx: number) => {
    if (isAnimating) return;
    const currentVal = bits[idx];
    const nextVal = currentVal === 1 ? 0 : 1;
    const bitName = `b${7 - idx}`;
    const weight = BIT_WEIGHTS[idx];

    setLastInstruction(`xor $${weight}, %al`);
    setExplanation(
      `Interação manual na gaveta ${bitName} (peso ${weight}): Carga ${nextVal === 1 ? 'inserida' : 'descarregada'}.`
    );

    setBits((prev) => {
      const next = [...prev];
      next[idx] = nextVal;
      return next;
    });

    setActiveSlotPulse(idx);
    setTimeout(() => setActiveSlotPulse(null), 300);
  };

  // Demonstração Guiada: Multiplicação por 2
  const runMultiplicationDemo = async () => {
    if (isAnimating || isDemoRunning) return;
    setIsDemoRunning(true);

    // Passo 1: Injeta 5 (0b00000101)
    setLastInstruction('movb $5, %al');
    setExplanation('Passo 1/3 da Demonstração: Carregamos o valor 5 no registrador (bits 0 e 2 ativados: 4 + 1 = 5).');
    setBits([0, 0, 0, 0, 0, 1, 0, 1]);
    setCarryFlag(0);

    await new Promise((r) => setTimeout(r, 2200));

    // Passo 2: Shift Left vira 10
    setLastInstruction('shlb $1, %al');
    setExplanation(
      'Passo 2/3 da Demonstração: Ao deslocar todas as bolinhas 1 casa para a esquerda, o valor DOBRA instantaneamente: 5 * 2 = 10 (0x0A)!'
    );
    setBits([0, 0, 0, 0, 1, 0, 1, 0]);

    await new Promise((r) => setTimeout(r, 2200));

    // Passo 3: Shift Left vira 20
    setLastInstruction('shlb $1, %al');
    setExplanation(
      'Passo 3/3 da Demonstração: Mais um deslocamento à esquerda e temos 10 * 2 = 20 (0x14). Em hardware, multiplicação por potências de 2 custa apenas 1 ciclo!'
    );
    setBits([0, 0, 0, 1, 0, 1, 0, 0]);

    await new Promise((r) => setTimeout(r, 2000));
    setIsDemoRunning(false);
  };

  // Limpeza de animação
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Atalhos de teclado ergonômicos: [0-7] bits, [S] shl, [M] movb, [R] reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key >= '0' && e.key <= '7') {
        const bitNum = parseInt(e.key, 10);
        const idx = 7 - bitNum;
        toggleSlotManual(idx);
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === 's' || e.key === 'S') {
        handleShiftLeft();
      } else if (e.key === 'm' || e.key === 'M') {
        handleInjectBit1();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bits, isAnimating, isDemoRunning]);

  // Cálculo da posição da bolinha no ar (Trajetória de Bézier)
  const getOrbPosition = (orb: FlyingOrb) => {
    const t = orb.progress;
    // Interpolação de X linear
    const currentX = orb.startX + (orb.targetX - orb.startX) * t;

    // Trajetória de Y: sobe em arco parabólico no meio e desce suavemente
    // Equação de curva: vértice mais alto em t = 0.4
    const peakHeight = orb.type === 'overflow-carry' ? 26 : 38; // Porcentagem de elevação
    const arcOffset = 4 * peakHeight * t * (1 - t);
    const currentY = orb.startY + (orb.targetY - orb.startY) * t - arcOffset;

    return { x: currentX, y: currentY };
  };

  const orbPos = flyingOrb ? getOrbPosition(flyingOrb) : null;

  return (
    <div className="w-full rounded-card border border-ash bg-white p-6 md:p-10 shadow-sm transition-all font-mono">
      {/* Cabeçalho do Simulador Cinético */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-ash mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <HugeiconsIcon icon={ZapIcon} className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-smoke">Simulador Balístico</span>
              <span className="h-1.5 w-1.5 rounded-full bg-mint" />
              <span className="text-[10px] font-mono text-smoke">Hardware Live Lab</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-normal text-off-black tracking-tight mt-0.5 [text-wrap:balance]">
              A Balística do Bit no Registrador
            </h2>
          </div>
        </div>

        {/* Display do Registrador %al em Tempo Real */}
        <div className="flex items-center gap-2 rounded-full border border-ash bg-parchment px-4 py-2 text-xs">
          <span className="text-smoke uppercase text-[10px]">Registrador:</span>
          <span className="font-bold text-off-black font-mono tabular-nums">%al = 0x{hexVal}</span>
          <span className="text-ash">&middot;</span>
          <span className="text-lake-blue font-semibold font-mono tabular-nums">{decimalVal}</span>
          <span className="text-ash">&middot;</span>
          <span className="font-mono text-[11px] text-graphite tracking-wider tabular-nums">[{binaryStr}]₂</span>
        </div>
      </div>

      {/* ÁREA DA PISTA BALÍSTICA E GAVETAS DO REGISTRADOR (SVG + TRILHO FÍSICO) */}
      <div ref={containerRef} className="relative w-full h-[320px] md:h-[340px] rounded-2xl bg-[#faf8f5] border border-ash/80 p-4 md:p-6 overflow-hidden select-none">
        {/* Marca d'água de fundo dos circuitos */}
        <div className="absolute inset-0 opacity-15 pointer-events-none flex flex-col items-center justify-center">
          <span className="text-[clamp(2.5rem,5.5vw,5rem)] font-mono font-bold tracking-widest text-smoke select-none text-center">
            REGISTRADOR %al
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-smoke uppercase tracking-wider -mt-2">
            Byte Inferior do Acumulador %rax
          </span>
        </div>

        {/* Ejetor / Lançador de Bits (Canto Superior Direito) */}
        <div className="absolute top-4 right-6 md:right-10 flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase tracking-wider text-smoke">Injetor de Carga</div>
            <div className="text-[11px] text-graphite">Linha de Dados D0</div>
          </div>
          <div className="relative h-10 w-10 rounded-full border-2 border-lake-blue/40 bg-white flex items-center justify-center shadow-sm">
            <div className="h-5 w-5 rounded-full bg-lake-blue shadow-sm animate-pulse" />
          </div>
        </div>

        {/* Trilho de Cobre / Guia do Barramento (SVG Vetorial) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          {/* Trilho de lançamento curvo do ejetor até b0 */}
          <path
            d="M 85 18 Q 83 45 80 56"
            fill="none"
            stroke="#cecac8"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />

          {/* Trilho de salto do Bit 7 para o Carry Flag */}
          <path
            d="M 24 56 Q 17.5 28 11 56"
            fill="none"
            stroke="#cecac8"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />

          {/* Linha de Barramento Horizontal Conectando as Gavetas */}
          <line x1="8" y1="56" x2="88" y2="56" stroke="#cecac8" strokeWidth="1.5" />
        </svg>

        {/* ESFERA EM VOO BALÍSTICO (Se houver bolinha no ar) */}
        {orbPos && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none transition-transform"
            style={{
              left: `${orbPos.x}%`,
              top: `${orbPos.y}%`
            }}
          >
            <div className="relative">
              {/* Esfera com iluminação volumétrica e contraste editorial */}
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-full shadow-[0_4px_12px_rgba(43,89,209,0.35)] flex items-center justify-center bg-lake-blue ring-1 ring-lake-blue/40">
                <span className="text-[11px] font-bold text-white leading-none font-mono">1</span>
              </div>
              {/* Sombra projetada no chão */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-full bg-black/15 blur-[2px]" />
            </div>
          </div>
        )}

        {/* LINHA DE GAVETAS FÍSICAS (Cesto CF + Bits 7..0) */}
        <div className="absolute bottom-6 left-0 right-0 px-4 md:px-8 flex items-center justify-between gap-1 md:gap-2">
          {/* Cesto do Carry Flag (CF) */}
          <div ref={cfRef} className="flex flex-col items-center flex-1 max-w-[80px]">
            <span className="text-[10px] font-bold text-smoke uppercase tracking-tight mb-1">Carry Flag (CF)</span>
            <div
              className={`relative h-14 w-full rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${
                cfPulse
                  ? 'border-mint bg-mint/30 shadow-[0_0_15px_rgba(167,252,205,0.8)] scale-105'
                  : carryFlag === 1
                  ? 'border-lake-blue bg-periwinkle-mist/40 shadow-sm'
                  : 'border-ash bg-white/80'
              }`}
            >
              {carryFlag === 1 ? (
                <div className="h-7 w-7 rounded-full bg-lake-blue shadow-sm flex items-center justify-center text-white text-[11px] font-bold font-mono">
                  1
                </div>
              ) : (
                <span className="text-xs text-graphite font-mono font-medium">CF: 0</span>
              )}
              <span className="text-[10px] font-mono text-graphite font-medium mt-0.5">bit 0 de %eflags</span>
            </div>
            <span className="text-[10px] text-smoke mt-1">Overflow</span>
          </div>

          <div className="h-10 w-[1px] bg-ash mx-0.5 sm:mx-1" />

          {/* As 8 Gavetas de Bits do Registrador (Bits 7 a 0) */}
          {bits.map((bitVal, idx) => {
            const bitNumber = 7 - idx;
            const weight = BIT_WEIGHTS[idx];
            const isPulsing = activeSlotPulse === idx;

            return (
              <button
                key={bitNumber}
                ref={(el) => {
                  slotRefs.current[idx] = el;
                }}
                onClick={() => toggleSlotManual(idx)}
                aria-label={`Bit ${bitNumber} (peso ${weight}): ${bitVal === 1 ? 'ativo (1)' : 'inativo (0)'}. Clique para alternar.`}
                aria-pressed={bitVal === 1}
                title={`Clique para alternar o bit ${bitNumber} (peso ${weight})`}
                className="flex flex-col items-center flex-1 group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 active:scale-[0.96] transition-transform"
              >
                {/* Etiqueta Superior do Bit */}
                <div className="text-[10px] font-mono text-smoke group-hover:text-lake-blue transition-colors mb-1">
                  b{bitNumber}
                </div>

                {/* Gaveta / Berço do Bit */}
                <div
                  className={`relative h-14 w-full rounded-2xl border transition-all flex flex-col items-center justify-center ${
                    isPulsing
                      ? 'border-lake-blue bg-periwinkle-mist/50 scale-105 shadow-sm'
                      : bitVal === 1
                      ? 'border-lake-blue/80 bg-white shadow-sm ring-1 ring-lake-blue/20'
                      : 'border-ash bg-white/70 hover:border-lake-blue/40'
                  }`}
                >
                  {bitVal === 1 ? (
                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-full shadow-[0_2px_8px_rgba(43,89,209,0.25)] flex items-center justify-center bg-lake-blue transition-transform group-hover:scale-105">
                      <span className="text-[11px] font-bold text-white leading-none font-mono tabular-nums">1</span>
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border border-dashed border-ash flex items-center justify-center text-graphite font-mono font-medium text-[11px] tabular-nums">
                      0
                    </div>
                  )}
                </div>

                {/* Peso Matemático (Potência de 2) */}
                <div className="text-[10px] font-mono text-smoke mt-1 group-hover:text-off-black transition-colors tabular-nums">
                  {weight}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PAINEL DE EXPLICAÇÃO DIDÁTICA E INSTRUÇÃO ASSEMBLY ATIVA */}
      <div className="mt-6 rounded-2xl border border-ash bg-parchment p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-smoke uppercase tracking-wider font-medium mb-1">
            <HugeiconsIcon icon={TerminalIcon} className="h-3.5 w-3.5 text-lake-blue" />
            <span>Última Instrução Executada:</span>
            <code className="rounded bg-white px-2 py-0.5 font-mono text-off-black font-semibold border border-ash">
              {lastInstruction}
            </code>
          </div>
          <p className="text-xs md:text-sm text-graphite leading-relaxed max-w-2xl font-sans [text-wrap:pretty]">
            {explanation}
          </p>
        </div>

        <div className="shrink-0 flex flex-col items-start md:items-end gap-1 text-xs text-smoke border-t md:border-t-0 md:border-l border-ash pt-3 md:pt-0 md:pl-5">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={HelpCircleIcon} className="h-4 w-4 text-lake-blue shrink-0" />
            <span className="text-[11px] leading-tight">
              Clique em qualquer gaveta para carregar ou descarregar o bit.
            </span>
          </div>
          <span className="text-[10px] font-mono text-smoke/90">
            Atalhos: [0-7] bits &middot; [S] shl &middot; [M] mov &middot; [R] xor
          </span>
        </div>
      </div>

      {/* BARRA DE CONTROLES EM PÍLULA (OPERAÇÕES ASSEMBLY) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-ash">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Injetar / Disparar Bit 1 */}
          <button
            onClick={handleInjectBit1}
            disabled={isAnimating || isDemoRunning}
            className="rounded-full bg-off-black text-white hover:bg-black active:scale-[0.98] px-5 py-2.5 min-h-[44px] text-xs font-mono uppercase tracking-wider font-medium inline-flex items-center gap-2 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-off-black disabled:opacity-40"
          >
            <HugeiconsIcon icon={SparklesIcon} className="h-3.5 w-3.5 text-mint" />
            <span>Disparar Bit 1 (mov)</span>
          </button>

          {/* Deslocamento à Esquerda (SHL) */}
          <button
            onClick={handleShiftLeft}
            disabled={isAnimating || isDemoRunning}
            className="rounded-full border border-ash bg-white hover:border-lake-blue active:scale-[0.98] text-off-black px-4 py-2.5 min-h-[44px] text-xs font-mono uppercase tracking-wider font-medium inline-flex items-center gap-1.5 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue disabled:opacity-40"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5 text-lake-blue" />
            <span>Shift &lt;&lt; (shl)</span>
          </button>

          {/* Deslocamento à Direita (SHR) */}
          <button
            onClick={handleShiftRight}
            disabled={isAnimating || isDemoRunning}
            className="rounded-full border border-ash bg-white hover:border-lake-blue active:scale-[0.98] text-off-black px-4 py-2.5 min-h-[44px] text-xs font-mono uppercase tracking-wider font-medium inline-flex items-center gap-1.5 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue disabled:opacity-40"
          >
            <span>Shift &gt;&gt; (shr)</span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="h-3.5 w-3.5 text-lake-blue" />
          </button>

          {/* Inverter (NOT) */}
          <button
            onClick={handleInvert}
            disabled={isAnimating || isDemoRunning}
            className="rounded-full border border-ash bg-white hover:border-lake-blue active:scale-[0.98] text-off-black px-4 py-2.5 min-h-[44px] text-xs font-mono uppercase tracking-wider font-medium inline-flex items-center gap-1.5 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue disabled:opacity-40"
          >
            <span>Inverter (not)</span>
          </button>

          {/* Zerar (XOR) */}
          <button
            onClick={handleReset}
            disabled={isAnimating || isDemoRunning}
            className="rounded-full border border-ash bg-white hover:border-coral active:scale-[0.98] text-graphite hover:text-crimson px-4 py-2.5 min-h-[44px] text-xs font-mono uppercase tracking-wider font-medium inline-flex items-center gap-1.5 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral disabled:opacity-40"
          >
            <HugeiconsIcon icon={RotateCcwIcon} className="h-3.5 w-3.5" />
            <span>Zerar (xor)</span>
          </button>
        </div>

        {/* Demonstração Guiada: Multiplicação por 2 */}
        <div>
          <button
            onClick={runMultiplicationDemo}
            disabled={isAnimating || isDemoRunning}
            className={`rounded-full px-5 py-2.5 min-h-[44px] text-xs font-mono uppercase tracking-wider font-semibold inline-flex items-center gap-2 active:scale-[0.98] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
              isDemoRunning
                ? 'bg-mint text-off-black border border-mint animate-pulse'
                : 'bg-periwinkle-mist text-off-black hover:bg-lake-blue hover:text-white border border-lake-blue/40'
            } disabled:opacity-40`}
          >
            <HugeiconsIcon icon={PlayIcon} className="h-3.5 w-3.5" />
            <span>{isDemoRunning ? 'Multiplicando...' : 'Demo: Multiplicar por 2'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
