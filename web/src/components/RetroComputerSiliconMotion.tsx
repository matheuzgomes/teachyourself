import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PlayIcon,
  PauseIcon,
  CpuIcon,
  ComputerIcon,
  Layers01Icon,
  ViewIcon,
  HelpCircleIcon
} from '@hugeicons/core-free-icons';

type CameraMode = 'overview' | 'motherboard' | 'silicon';
type ClockSpeed = '1hz' | '10hz' | 'turbo';

interface InspectorTarget {
  id: string;
  name: string;
  category: string;
  specs: string;
  voltage: string;
  description: string;
}

const REFERENCE_BYTE = [0, 0, 1, 0, 1, 0, 1, 0]; // 0x2A = 42

const INSPECTOR_DATA: Record<string, InspectorTarget> = {
  cpu: {
    id: 'cpu',
    name: 'Microprocessador i486DX2 (U1)',
    category: 'Unidade Central de Processamento (CPU)',
    specs: 'Socket 3 / 168 pinos PGA / Clock interno 66 MHz (2x 33 MHz)',
    voltage: 'VCC: +5.0V TTL',
    description: 'Processador de 32 bits com unidade de ponto flutuante (FPU) integrada e 8 KB de cache L1 de escrita direta. Executa a instrução movb $0x2A, %al em ciclo determinístico.'
  },
  dram: {
    id: 'dram',
    name: 'Módulo SIMM-72 de Memória DRAM',
    category: 'Memória Principal Volátil',
    specs: '4x Módulos SIMM 72-pin / Tempo de acesso: 60ns Fast Page Mode',
    voltage: 'VCC: +5.0V / Linhas de Dados: 0V (Low) a +4.8V (High)',
    description: 'Bancos de capacitores microscópicos que armazenam o byte 0x2A (binário 00101010) no endereço 0x00401050. Quando o sinal de leitura é ativado, as células descarregam os bits no barramento.'
  },
  databus: {
    id: 'databus',
    name: 'Barramento de Dados DATA[0..7]',
    category: 'Linhas Físicas de Condução Paralela',
    specs: '8 Trilhas de cobre gravadas em PCB com largura de 12 mils e impedância controlada',
    voltage: 'D5, D3, D1 em +4.8V (Nível Alto / Bit 1); D7, D6, D4, D2, D0 em 0V (Bit 0)',
    description: 'As oito linhas condutoras que transportam as cargas elétricas em paralelo. Cada bit 1 é uma onda de elétrons em nível lógico TTL que viaja a cerca de 150.000 km/s no cobre.'
  },
  addrbus: {
    id: 'addrbus',
    name: 'Barramento de Endereços ADDR[0..15]',
    category: 'Linhas de Seleção de Memória',
    specs: 'Linhas paralelas conectadas ao decodificador de linhas da DRAM',
    voltage: 'Endereço 0x00401050 polarizado',
    description: 'Conduz o valor do Program Counter (%rip) para abrir os transistores de acesso da linha de memória correspondente na placa.'
  },
  osc: {
    id: 'osc',
    name: 'Oscilador de Cristal de Quartzo (OSC1)',
    category: 'Gerador de Sinal de Sincronismo (Clock)',
    specs: 'Canister metálico blindado Fox Electronics / Frequência fundamental: 66.0000 MHz',
    voltage: 'Sinal de onda quadrada TTL: 0V a +5.0V / Ciclo de trabalho: 50%',
    description: 'Cristal piezoelétrico de quartzo que vibra em frequência precisa ao receber tensão elétrica, gerando a cadência de pulsos que sincroniza cada transistor do computador.'
  }
};

// Coordenadas calculadas no espaço SVG nativo para enquadramento perfeito (Aspect Ratio: 1.5625)
const CAMERA_VIEWBOXES: Record<CameraMode, [number, number, number, number]> = {
  // Visão global: Enquadra o computador inteiro com o monitor CRT e as sombras da mesa
  overview: [0, 0, 1000, 640],
  // Visão do chassi: Enquadra com exatidão a bandeja de aço, fonte AT, slots ISA, DRAM e CPU
  motherboard: [140, 185, 720, 460],
  // Visão da CPU: Enquadra em close-up extremo o soquete Socket 3, die da CPU, as 8 trilhas de dados e DRAM
  silicon: [215, 295, 375, 240]
};

export default function RetroComputerSiliconMotion() {
  const reducedMotion = useReducedMotion();

  // Estados de controle de câmera e animação
  const [cameraMode, setCameraMode] = useState<CameraMode>('overview');
  const [isPlayingTour, setIsPlayingTour] = useState<boolean>(true);
  const [clockSpeed, setClockSpeed] = useState<ClockSpeed>('10hz');
  const [clockTick, setClockTick] = useState<number>(0);
  const [activeCyclePhase, setActiveCyclePhase] = useState<number>(0);
  const [selectedInspector, setSelectedInspector] = useState<InspectorTarget>(INSPECTOR_DATA.databus);

  // Animação de câmera fluida diretamente pelo viewBox nativo do SVG
  const currentVbRef = useRef<[number, number, number, number]>([0, 0, 1000, 640]);
  const [viewBoxStr, setViewBoxStr] = useState<string>('0 0 1000 640');

  const busData = REFERENCE_BYTE;

  // Ciclo das 4 fases da máquina de estados de hardware
  const cyclePhases = [
    {
      id: 'fetch',
      phaseNum: 'T1',
      name: 'Busca de Endereço (Fetch)',
      desc: 'O Program Counter (%rip = 0x00401050) coloca o endereço no barramento ADDR_BUS e sinaliza a linha ADS# (Address Strobe).',
      signal: 'ADDR_BUS: 0x00401050 · ADS# = LOW',
      activeComponent: 'addrbus'
    },
    {
      id: 'ram_access',
      phaseNum: 'T2',
      name: 'Acesso à DRAM (Memory Read)',
      desc: 'A memória RAM decodifica o endereço, ativa os amplificadores de leitura e prepara o byte 0x2A nas saídas de dados.',
      signal: 'RAS#/CAS# = ATIVO · DRAM D0..D7 PRONTOS',
      activeComponent: 'dram'
    },
    {
      id: 'bus_transfer',
      phaseNum: 'T3',
      name: 'Transferência no Barramento (Data Transfer)',
      desc: 'Cargas elétricas correm pelas trilhas de cobre: as linhas D5, D3 e D1 sobem para +5V, conduzindo o número 42 até a CPU.',
      signal: 'DATA_BUS: 0x2A [00101010]₂ · 32+8+2=42',
      activeComponent: 'databus'
    },
    {
      id: 'execute',
      phaseNum: 'T4',
      name: 'Gravação no Acumulador (Writeback)',
      desc: 'O decodificador da CPU polariza os transistores do registrador %al, travando o valor 42 no byte inferior do acumulador.',
      signal: '%al = 0x2A (dec: 42) · FLAGS: ZF=0, CF=0',
      activeComponent: 'cpu'
    }
  ];

  // Animação suave e contínua do ViewBox com interpolação de alta performance
  useEffect(() => {
    const target = CAMERA_VIEWBOXES[cameraMode];

    if (reducedMotion) {
      currentVbRef.current = target;
      setViewBoxStr(target.join(' '));
      return;
    }

    const start = [...currentVbRef.current];
    const startTime = performance.now();
    const duration = 750; // ms de transição cinematográfica

    let animId: number;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Curva de desaceleração suave quíntica (ease-out quintic)
      const ease = 1 - Math.pow(1 - progress, 5);

      const current: [number, number, number, number] = [
        start[0] + (target[0] - start[0]) * ease,
        start[1] + (target[1] - start[1]) * ease,
        start[2] + (target[2] - start[2]) * ease,
        start[3] + (target[3] - start[3]) * ease
      ];

      currentVbRef.current = current;
      setViewBoxStr(`${current[0].toFixed(1)} ${current[1].toFixed(1)} ${current[2].toFixed(1)} ${current[3].toFixed(1)}`);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [cameraMode, reducedMotion]);

  // Oscilador de Clock
  useEffect(() => {
    const intervals: Record<ClockSpeed, number> = {
      '1hz': 1200,
      '10hz': 380,
      turbo: 90
    };

    const interval = setInterval(() => {
      setClockTick((t) => (t + 1) % 1000000);
      setActiveCyclePhase((p) => (p + 1) % 4);
    }, intervals[clockSpeed]);

    return () => clearInterval(interval);
  }, [clockSpeed]);

  // Tour cinematográfico automático entre as 3 câmeras
  useEffect(() => {
    if (!isPlayingTour || reducedMotion) return;

    const tourDurations: Record<CameraMode, number> = {
      overview: 6000,
      motherboard: 5500,
      silicon: 7000
    };

    const nextModes: Record<CameraMode, CameraMode> = {
      overview: 'motherboard',
      motherboard: 'silicon',
      silicon: 'overview'
    };

    const timer = setTimeout(() => {
      setCameraMode((curr) => nextModes[curr]);
    }, tourDurations[cameraMode]);

    return () => clearTimeout(timer);
  }, [cameraMode, isPlayingTour, reducedMotion]);

  // Atalhos de teclado ergonômicos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === '1') {
        setIsPlayingTour(false);
        setCameraMode('overview');
      } else if (e.key === '2') {
        setIsPlayingTour(false);
        setCameraMode('motherboard');
      } else if (e.key === '3') {
        setIsPlayingTour(false);
        setCameraMode('silicon');
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPlayingTour((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        setIsPlayingTour(false);
        setActiveCyclePhase((p) => (p + 1) % 4);
        setClockTick((t) => t + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentPhaseData = cyclePhases[activeCyclePhase];
  const isDataTransferActive = activeCyclePhase === 2;
  const isAddrTransferActive = activeCyclePhase === 0;

  return (
    <div className="w-full rounded-card border border-ash bg-white p-6 md:p-10 shadow-sm transition-all font-mono">
      {/* CABEÇALHO DO LABORATÓRIO CINÉTICO */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-ash mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <HugeiconsIcon icon={ComputerIcon} className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-smoke">Hardware Clássico 1994</span>
              <span className="h-1.5 w-1.5 rounded-full bg-mint" />
              <span className="text-[10px] font-mono text-smoke">Engenharia 3D & Hardware</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-normal text-off-black tracking-tight mt-0.5 [text-wrap:balance]">
              O Computador dos Anos 90 em Perspectiva 3D
            </h2>
          </div>
        </div>

        {/* TELEMETRIA DA MÁQUINA EM TEMPO REAL */}
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-ash bg-parchment px-4 py-2 text-xs">
          <span className="text-smoke uppercase text-[10px]">CPU:</span>
          <span className="font-bold text-off-black font-mono">80486DX2</span>
          <span className="text-ash">·</span>
          <span className="text-lake-blue font-semibold font-mono">66 MHz</span>
          <span className="text-ash">·</span>
          <span className="font-mono text-[11px] text-graphite tabular-nums">
            CLK: {clockTick % 2 === 0 ? 'HIGH (5V)' : 'LOW (0V)'}
          </span>
          <span className="text-ash">·</span>
          <span className="rounded bg-white px-2 py-0.5 text-[10px] font-mono font-medium text-off-black border border-ash">
            Fase: {currentPhaseData.phaseNum}
          </span>
        </div>
      </div>

      {/* BARRA DE CONTROLE DE CÂMERA, TEMPO E VELOCIDADE */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-parchment border border-ash text-xs">
        {/* Seletor de Câmera Espacial */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] font-mono text-smoke uppercase tracking-wider hidden sm:inline mr-1">
            Perspectiva:
          </span>
          <button
            onClick={() => {
              setIsPlayingTour(false);
              setCameraMode('overview');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all min-h-[38px] inline-flex items-center gap-1.5 active:scale-[0.98] ${
              cameraMode === 'overview'
                ? 'bg-off-black text-white font-medium shadow-sm'
                : 'bg-white text-graphite border border-ash hover:border-lake-blue'
            }`}
          >
            <HugeiconsIcon icon={ComputerIcon} className="h-3.5 w-3.5" />
            <span>1. Gabinete 3D Anos 90</span>
          </button>

          <button
            onClick={() => {
              setIsPlayingTour(false);
              setCameraMode('motherboard');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all min-h-[38px] inline-flex items-center gap-1.5 active:scale-[0.98] ${
              cameraMode === 'motherboard'
                ? 'bg-off-black text-white font-medium shadow-sm'
                : 'bg-white text-graphite border border-ash hover:border-lake-blue'
            }`}
          >
            <HugeiconsIcon icon={Layers01Icon} className="h-3.5 w-3.5" />
            <span>2. Chassi Aberto & Placa-Mãe</span>
          </button>

          <button
            onClick={() => {
              setIsPlayingTour(false);
              setCameraMode('silicon');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all min-h-[38px] inline-flex items-center gap-1.5 active:scale-[0.98] ${
              cameraMode === 'silicon'
                ? 'bg-off-black text-white font-medium shadow-sm'
                : 'bg-white text-graphite border border-ash hover:border-lake-blue'
            }`}
          >
            <HugeiconsIcon icon={CpuIcon} className="h-3.5 w-3.5" />
            <span>3. Barramento & Processador</span>
          </button>
        </div>

        {/* Controles de Execução e Clock */}
        <div className="flex items-center gap-2">
          {/* Botão de Tour Cinematográfico Automático */}
          <button
            onClick={() => setIsPlayingTour(!isPlayingTour)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all min-h-[38px] inline-flex items-center gap-1.5 active:scale-[0.98] ${
              isPlayingTour
                ? 'bg-mint/20 text-emerald-800 border border-mint font-medium'
                : 'bg-white text-graphite border border-ash hover:border-lake-blue'
            }`}
            title="Alternar tour cinematográfico automático (Espaço)"
          >
            <HugeiconsIcon icon={isPlayingTour ? PauseIcon : PlayIcon} className="h-3.5 w-3.5" />
            <span>{isPlayingTour ? 'Pausar Tour' : 'Tour Contínuo'}</span>
          </button>

          {/* Botão de Passo Único de Clock */}
          <button
            onClick={() => {
              setIsPlayingTour(false);
              setActiveCyclePhase((p) => (p + 1) % 4);
              setClockTick((t) => t + 1);
            }}
            className="px-3 py-1.5 rounded-full text-xs font-mono bg-white text-graphite border border-ash hover:border-lake-blue transition-all min-h-[38px] inline-flex items-center gap-1 active:scale-[0.98]"
            title="Avançar 1 ciclo de clock manualmente (Tecla S)"
          >
            <span>Passo (S)</span>
          </button>

          {/* Seletor de Frequência */}
          <div className="flex items-center rounded-full bg-white border border-ash p-0.5 text-xs font-mono">
            <button
              onClick={() => setClockSpeed('1hz')}
              className={`px-2.5 py-1 text-[11px] rounded-full transition-colors ${
                clockSpeed === '1hz' ? 'bg-lake-blue text-white font-semibold' : 'text-graphite hover:text-off-black'
              }`}
              title="Velocidade didática lenta (1 Hz)"
            >
              1 Hz
            </button>
            <button
              onClick={() => setClockSpeed('10hz')}
              className={`px-2.5 py-1 text-[11px] rounded-full transition-colors ${
                clockSpeed === '10hz' ? 'bg-lake-blue text-white font-semibold' : 'text-graphite hover:text-off-black'
              }`}
              title="Velocidade intermediária padrão"
            >
              10 Hz
            </button>
            <button
              onClick={() => setClockSpeed('turbo')}
              className={`px-2.5 py-1 text-[11px] rounded-full transition-colors ${
                clockSpeed === 'turbo' ? 'bg-lake-blue text-white font-semibold' : 'text-graphite hover:text-off-black'
              }`}
              title="Modo Turbo clássico de 66 MHz"
            >
              Turbo (66M)
            </button>
          </div>
        </div>
      </div>

      {/* PALCO VISUAL CINEMATOGRÁFICO COM ENQUADRAMENTO VETORIAL PURO */}
      <div className="relative w-full h-[440px] sm:h-[500px] md:h-[560px] rounded-2xl bg-[#0b0d10] border border-ash/80 overflow-hidden select-none shadow-inner flex items-center justify-center">
        {/* Grade de bancada de laboratório de hardware */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Indicador de Câmera no Canto Superior Esquerdo */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-[11px]">
          <HugeiconsIcon icon={ViewIcon} className="h-3.5 w-3.5 text-mint" />
          <span className="text-white/70">Câmera Atual:</span>
          <span className="font-bold text-white uppercase tracking-wider">
            {cameraMode === 'overview' && 'Macro 1x: Gabinete 3D Retrô'}
            {cameraMode === 'motherboard' && 'Meso 1.5x: Chassi de Aço & Placa-Mãe'}
            {cameraMode === 'silicon' && 'Micro 2.7x: Barramento & CPU Die'}
          </span>
        </div>

        {/* Indicador de Frequência do Clock no Canto Superior Direito */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-[11px]">
          <span className={`h-2 w-2 rounded-full ${clockTick % 2 === 0 ? 'bg-mint animate-ping' : 'bg-mint/40'}`} />
          <span className="font-mono text-mint font-bold">CRISTAL: 66.000 MHz</span>
        </div>

        {/* Dica de interação interativa no rodapé do visor */}
        <div className="absolute bottom-3 left-4 z-20 text-[10px] text-white/50 font-mono hidden sm:flex items-center gap-1.5 pointer-events-none">
          <HugeiconsIcon icon={HelpCircleIcon} className="h-3 w-3 text-lake-blue" />
          <span>Dica: Clique no CPU, Memória ou Barramento para inspecionar sua física. Atalhos: [1-3] zoom · [Espaço] pausa · [S] passo</span>
        </div>

        {/* MUNDO VETORIAL INTEGRADO COM CÂMERA VIEWBOX 100% NATIVA */}
        <svg
          viewBox={viewBoxStr}
          className="w-full h-full max-w-[1000px] max-h-[640px] overflow-hidden"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Shading 3D do Gabinete Bege: Face Superior Iluminada */}
            <linearGradient id="chassis3DTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8f4ec" />
              <stop offset="50%" stopColor="#ebe2d0" />
              <stop offset="100%" stopColor="#ddd1bd" />
            </linearGradient>

            {/* Shading 3D do Gabinete Bege: Face Frontal */}
            <linearGradient id="chassis3DFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e5dbca" />
              <stop offset="60%" stopColor="#d3c7b2" />
              <stop offset="100%" stopColor="#c0b39c" />
            </linearGradient>

            {/* Shading 3D do Gabinete Bege: Face Lateral Direita Sombreada */}
            <linearGradient id="chassis3DSide" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#a89981" />
              <stop offset="60%" stopColor="#8c7d67" />
              <stop offset="100%" stopColor="#6f624d" />
            </linearGradient>

            {/* Monitor CRT 3D: Teto da Carcaça */}
            <linearGradient id="crtTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f4eee2" />
              <stop offset="60%" stopColor="#ded3bf" />
              <stop offset="100%" stopColor="#ccbfab" />
            </linearGradient>

            {/* Monitor CRT 3D: Lateral Direita */}
            <linearGradient id="crtSideGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9e8f77" />
              <stop offset="100%" stopColor="#756752" />
            </linearGradient>

            {/* Substrato da Placa-Mãe Verde Industrial */}
            <linearGradient id="pcb3DSurface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1f4d32" />
              <stop offset="60%" stopColor="#143924" />
              <stop offset="100%" stopColor="#0a2215" />
            </linearGradient>

            {/* Fundo Curvo do Tubo CRT com Fósforo Verde */}
            <radialGradient id="crtScreen3DGlow" cx="48%" cy="42%" r="62%">
              <stop offset="0%" stopColor="#1e462c" />
              <stop offset="65%" stopColor="#0d2516" />
              <stop offset="100%" stopColor="#030b05" />
            </radialGradient>

            {/* Reflexo Especular de Vidro Curvo */}
            <linearGradient id="crtGlassReflect" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>

            {/* Cerâmica Escura do Encapsulamento PGA da CPU */}
            <linearGradient id="cpuCeramic3D" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#36312a" />
              <stop offset="65%" stopColor="#1e1b16" />
              <stop offset="100%" stopColor="#0e0d0b" />
            </linearGradient>

            {/* Brilho Quântico dos Pulsos de Dados */}
            <filter id="bloom3D" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* ======================================================================= */}
          {/* SOMBRAS DE CONTATO NO PISO DA MESA                                      */}
          {/* ======================================================================= */}
          <g id="deskGroundShadows">
            <ellipse cx="510" cy="565" rx="380" ry="24" fill="#030406" opacity="0.85" />
            <polygon points="210,540 690,540 820,480 340,480" fill="#020304" opacity="0.5" />
          </g>

          {/* ======================================================================= */}
          {/* CAMADA 1: O COMPUTADOR RETRÔ EM PERSPECTIVA 3D (MODO GERAL OVERVIEW)     */}
          {/* ======================================================================= */}
          <motion.g
            animate={{
              opacity: cameraMode === 'overview' ? 1 : 0
            }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            style={{ pointerEvents: cameraMode === 'overview' ? 'auto' : 'none' }}
          >
            {/* --------------------------------------------------------------------- */}
            {/* 1.1 GABINETE DESKTOP HORIZONTAL 3D                                    */}
            {/* Dimensões: Frente X: 230..690 (L:460), Y: 390..540 (A:150)           */}
            {/* Vetor de Profundidade: dx = +110, dy = -55                            */}
            {/* --------------------------------------------------------------------- */}
            <g id="cabinet3DGroup">
              {/* Pés de Borracha Sob o Gabinete */}
              <rect x="250" y="538" width="30" height="8" rx="2" fill="#15171b" />
              <rect x="640" y="538" width="30" height="8" rx="2" fill="#15171b" />
              <polygon points="760,483 785,483 775,489 750,489" fill="#0f1114" />

              {/* Face Lateral Direita Sombreada (Right Side Face) */}
              <polygon
                points="690,390 800,335 800,485 690,540"
                fill="url(#chassis3DSide)"
                stroke="#574c3b"
                strokeWidth="1.5"
              />
              {/* Ranhuras de ventilação na lateral direita */}
              <g stroke="#453c2e" strokeWidth="2" opacity="0.85">
                <line x1="720" y1="390" x2="775" y2="362" />
                <line x1="720" y1="410" x2="775" y2="382" />
                <line x1="720" y1="430" x2="775" y2="402" />
                <line x1="720" y1="450" x2="775" y2="422" />
              </g>

              {/* Face Superior Iluminada (Top Lid Face) */}
              <polygon
                points="230,390 340,335 800,335 690,390"
                fill="url(#chassis3DTop)"
                stroke="#ab9f8c"
                strokeWidth="1.5"
              />
              {/* Linha de reflexo especular na aresta superior esquerda */}
              <line x1="240" y1="387" x2="345" y2="338" stroke="#ffffff" strokeWidth="1.2" opacity="0.75" />

              {/* Face Frontal Principal (Front Bezel Face) */}
              <polygon
                points="230,390 690,390 690,540 230,540"
                fill="url(#chassis3DFront)"
                stroke="#8f826d"
                strokeWidth="1.5"
              />
              {/* Chanfro de luz na aresta superior frontal */}
              <line x1="230" y1="391" x2="690" y2="391" stroke="#ffffff" strokeWidth="1.5" opacity="0.85" />
              {/* Sombra de oclusão na aresta inferior frontal */}
              <line x1="230" y1="539" x2="690" y2="539" stroke="#685d4d" strokeWidth="2" />

              {/* Grelha de Ventilação Frontal (Lado Esquerdo) */}
              <g fill="#6a5d4b">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <rect key={i} x={250 + i * 13} y="415" width="6" height="80" rx="2" />
                ))}
              </g>

              {/* PAINEL CENTRAL 3D: DISPLAY 7 SEGMENTOS, CHAVES E EMBLEMA */}
              <g transform="translate(360, 410)">
                {/* Display Digital de LED Verde com Moldura Recuada */}
                <rect x="0" y="0" width="84" height="50" rx="4" fill="#0d1012" stroke="#4f4637" strokeWidth="1.5" />
                <rect x="3" y="3" width="78" height="44" rx="2" fill="#14181a" />
                {/* Dígito Digital Verde Turbo 66 */}
                <text x="12" y="36" fill="#4ade80" fontSize="32" fontFamily="monospace" fontWeight="bold" filter="url(#bloom3D)">
                  66
                </text>
                <text x="52" y="44" fill="#22c55e" fontSize="8.5" fontFamily="monospace" fontWeight="bold">MHz</text>

                {/* Botões Turbo e Reset em 3D */}
                <g transform="translate(94, 2)">
                  {/* Botão Turbo com chanfro */}
                  <rect x="0" y="0" width="30" height="19" rx="2" fill="#c4b7a4" stroke="#706451" strokeWidth="1" />
                  <line x1="1" y1="1" x2="29" y2="1" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
                  <text x="3" y="13" fill="#2d2821" fontSize="7" fontFamily="monospace" fontWeight="bold">TURBO</text>

                  {/* Botão Reset com reentrância */}
                  <rect x="0" y="25" width="30" height="19" rx="2" fill="#b5a794" stroke="#706451" strokeWidth="1" />
                  <line x1="1" y1="26" x2="29" y2="26" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                  <text x="3" y="38" fill="#2d2821" fontSize="7" fontFamily="monospace" fontWeight="bold">RESET</text>
                </g>

                {/* Chave de Força Principal (Power Rocker Vermelha 3D) */}
                <g transform="translate(132, 2)">
                  <rect x="0" y="0" width="38" height="44" rx="3" fill="#1a1815" stroke="#423a2f" strokeWidth="1.5" />
                  {/* Metade superior pressionada */}
                  <polygon points="3,3 35,3 35,21 3,18" fill="#dc2626" />
                  {/* Metade inferior saliente */}
                  <polygon points="3,18 35,21 35,41 3,41" fill="#991b1b" />
                  <line x1="19" y1="7" x2="19" y2="15" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="19" cy="31" r="3.5" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                </g>

                {/* LEDs de Atividade em Tempo Real */}
                <g transform="translate(0, 64)">
                  <circle cx="8" cy="8" r="4" fill="#4ade80" filter="url(#bloom3D)" />
                  <text x="16" y="11" fill="#695d4b" fontSize="8" fontFamily="monospace" fontWeight="bold">PWR</text>

                  <circle cx="50" cy="8" r="4" fill={clockTick % 2 === 0 ? '#f97316' : '#7c2d12'} filter="url(#bloom3D)" />
                  <text x="58" y="11" fill="#695d4b" fontSize="8" fontFamily="monospace" fontWeight="bold">TURBO</text>

                  <circle cx="98" cy="8" r="4" fill={clockTick % 4 === 0 ? '#f59e0b' : '#78350f'} filter="url(#bloom3D)" />
                  <text x="106" y="11" fill="#695d4b" fontSize="8" fontFamily="monospace" fontWeight="bold">HDD</text>
                </g>

                {/* Emblema Metálico de Identidade */}
                <g transform="translate(0, 88)">
                  <rect x="0" y="0" width="135" height="22" rx="2" fill="#d8cdbc" stroke="#877a67" strokeWidth="1" />
                  <line x1="1" y1="1" x2="134" y2="1" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
                  <text x="8" y="15" fill="#2d2820" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    TEACHYOURSELF
                  </text>
                  <text x="110" y="15" fill="#2563eb" fontSize="9" fontFamily="sans-serif" fontWeight="bold">
                    486
                  </text>
                </g>
              </g>

              {/* BAIA SUPERIOR 5.25" (DISQUETE 1.2MB COM RELEVO CHANFRADO) */}
              <g transform="translate(535, 405)">
                {/* Caixa recuada com sombra interna */}
                <rect x="0" y="0" width="140" height="42" rx="2" fill="#1a1916" stroke="#5a5040" strokeWidth="1.5" />
                <rect x="3" y="3" width="134" height="36" rx="1.5" fill="#cfc3af" />
                {/* Fenda preta do disco */}
                <rect x="12" y="13" width="116" height="6" rx="1" fill="#0e0f11" />
                {/* Alavanca mecânica de rotação */}
                <rect x="60" y="21" width="22" height="13" rx="1.5" fill="#36322a" stroke="#504a3e" strokeWidth="1" />
                <circle cx="20" cy="28" r="2.5" fill="#203d27" />
                <text x="26" y="30" fill="#635847" fontSize="7" fontFamily="monospace" fontWeight="bold">5.25" 1.2MB</text>
              </g>

              {/* BAIA INFERIOR 3.5" (DISQUETE 1.44MB COM BOTÃO EJETOR) */}
              <g transform="translate(535, 460)">
                <rect x="0" y="0" width="140" height="40" rx="2" fill="#1a1916" stroke="#5a5040" strokeWidth="1.5" />
                <rect x="3" y="3" width="134" height="34" rx="1.5" fill="#cfc3af" />
                {/* Ranhura com aba metálica */}
                <rect x="12" y="12" width="116" height="5" rx="1" fill="#0e0f11" />
                {/* Botão ejetor com sombra tátil */}
                <rect x="98" y="21" width="26" height="11" rx="1.5" fill="#443f36" stroke="#5f584b" strokeWidth="1" />
                {/* LED de atividade */}
                <circle cx="20" cy="26" r="3" fill={clockTick % 3 === 0 ? '#4ade80' : '#1b3420'} filter="url(#bloom3D)" />
                <text x="28" y="29" fill="#635847" fontSize="7" fontFamily="monospace" fontWeight="bold">3.5" 1.44MB</text>
              </g>
            </g>

            {/* --------------------------------------------------------------------- */}
            {/* 1.2 MONITOR CRT 3D EM PERSPECTIVA RIGOROSA                            */}
            {/* Posição frontal: X: 280..640 (L:360), Y: 115..335 (A:220)             */}
            {/* Cone Traseiro: X: 420..720 (L:300), Y: 80..240 (A:160)               */}
            {/* --------------------------------------------------------------------- */}
            <g id="monitorCRT3DGroup">
              {/* Pedestal Giratório 3D com Sombra de Contato no Gabinete */}
              <ellipse cx="490" cy="365" rx="75" ry="15" fill="#1c1914" opacity="0.65" />
              <ellipse cx="490" cy="360" rx="70" ry="13" fill="#c2b5a1" stroke="#877a67" strokeWidth="1.5" />
              <rect x="460" y="335" width="60" height="28" rx="4" fill="#a49783" stroke="#6e6250" strokeWidth="1.5" />

              {/* Carcaça do Monitor: Teto Afunilado em Perspectiva (Top Hood) */}
              <polygon
                points="280,115 420,80 720,80 640,115"
                fill="url(#crtTopGrad)"
                stroke="#a39682"
                strokeWidth="1.5"
              />
              {/* Aletas de ventilação no teto do monitor */}
              <g stroke="#7e725f" strokeWidth="2" opacity="0.75">
                <line x1="390" y1="96" x2="630" y2="96" />
                <line x1="380" y1="104" x2="640" y2="104" />
              </g>

              {/* Carcaça do Monitor: Lateral Direita Afunilada (Right Cheek) */}
              <polygon
                points="640,115 720,80 720,240 640,335"
                fill="url(#crtSideGrad)"
                stroke="#6b5e4c"
                strokeWidth="1.5"
              />

              {/* Moldura Frontal Externa do Monitor (Front Bezel) */}
              <rect x="280" y="115" width="360" height="220" rx="14" fill="url(#chassis3DFront)" stroke="#7e715d" strokeWidth="2" />
              {/* Destaque de luz chanfrada no topo da moldura */}
              <line x1="288" y1="117" x2="632" y2="117" stroke="#ffffff" strokeWidth="1.5" opacity="0.85" />

              {/* Chanfro Interno Recuado em 4 Biséis Mitrados (Beveled CRT Frame) */}
              <polygon points="302,130 618,130 598,148 322,148" fill="#ded4c1" />
              <polygon points="302,308 618,308 598,290 322,290" fill="#827462" />
              <polygon points="302,130 322,148 322,290 302,308" fill="#b5a48f" />
              <polygon points="618,130 598,148 598,290 618,308" fill="#6e6150" />

              {/* VIDRO CURVO DO TUBO CRT (CRT BULB GLOW) */}
              <rect x="322" y="148" width="276" height="142" rx="8" fill="url(#crtScreen3DGlow)" />

              {/* Linhas de Varredura Físicas (Scanlines de Fósforo) */}
              <g opacity="0.16" fill="#000000">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
                  <rect key={i} x="322" y={148 + i * 10} width="276" height="2" />
                ))}
              </g>

              {/* Reflexo Especular de Vidro Abaulado (Convex Glint) */}
              <path
                d="M 324 150 L 480 150 Q 400 200 324 230 Z"
                fill="url(#crtGlassReflect)"
                pointerEvents="none"
              />

              {/* TEXTO DO TERMINAL BIOS NO MONITOR CRT */}
              <g fill="#4ade80" fontFamily="monospace" fontSize="8.5" opacity="0.95">
                <text x="334" y="166" fill="#86efac" fontWeight="bold">TEACHYOURSELF BIOS v4.06 (1994)</text>
                <text x="334" y="178">CPU: Intel 80486DX2 at 66 MHz · 8KB L1</text>
                <text x="334" y="190">Memory: 16384 KB OK · VLB 32-bit Bus</text>
                <text x="334" y="200" fill="#ffffff" opacity="0.35">-------------------------------------</text>
                <text x="334" y="214" fill="#a7f3d0">teachyourself:~$ ./executar_ciclo</text>
                <text x="334" y="228" fill="#facc15">&gt; [T1/T2] ADDR: 0x00401050 (DRAM)</text>
                <text x="334" y="242" fill="#38bdf8">&gt; [T3] DATA: 0x2A [00101010]₂ (42)</text>
                <text x="334" y="256" fill="#4ade80">&gt; [T4] %al = 0x2A · movb {clockTick % 2 === 0 ? '█' : ' '}</text>
              </g>

              {/* Controles do Monitor na Borda Inferior */}
              <circle cx="585" cy="322" r="3.5" fill="#36322b" />
              <circle cx="598" cy="322" r="3.5" fill="#36322b" />
              <rect x="548" y="318" width="12" height="7" rx="1.5" fill="#22c55e" filter="url(#bloom3D)" />
            </g>
          </motion.g>

          {/* ======================================================================= */}
          {/* CAMADA 2 E 3: O CHASSI DE AÇO ABERTO E A PLACA-MÃE                      */}
          {/* Visível perfeitamente nas câmeras 'motherboard' e 'silicon'             */}
          {/* ======================================================================= */}
          <motion.g
            animate={{
              opacity: cameraMode === 'overview' ? 0 : 1
            }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            style={{ pointerEvents: cameraMode === 'overview' ? 'none' : 'auto' }}
          >
            {/* BANDEJA METÁLICA DE AÇO EM PERSPECTIVA AXONOMÉTRICA */}
            <g id="openSteelChassisGroup">
              {/* Parede Traseira do Chassi (Rear Metal Wall) */}
              <polygon
                points="180,310 300,250 820,250 710,310"
                fill="#2a2f36"
                stroke="#474e59"
                strokeWidth="1.5"
              />

              {/* Parede Lateral Direita do Chassi (Right Metal Wall) */}
              <polygon
                points="710,310 820,250 820,450 710,520"
                fill="#181a1f"
                stroke="#353b44"
                strokeWidth="1.5"
              />

              {/* Fonte de Alimentação AT Metálica (PSU 250W no Canto Traseiro Direito) */}
              <g transform="translate(630, 260)">
                <polygon points="0,35 65,5 160,5 100,35" fill="#757d88" stroke="#4c525b" strokeWidth="1" />
                <polygon points="100,35 160,5 160,75 100,105" fill="#444952" stroke="#31363d" strokeWidth="1" />
                <polygon points="0,35 100,35 100,105 0,105" fill="#585f6a" stroke="#393e46" strokeWidth="1" />
                {/* Grade do ventilador da fonte */}
                <circle cx="50" cy="70" r="22" fill="#26292e" stroke="#757d88" strokeWidth="1" />
                <line x1="32" y1="70" x2="68" y2="70" stroke="#757d88" strokeWidth="1.5" />
                <line x1="50" y1="52" x2="50" y2="88" stroke="#757d88" strokeWidth="1.5" />
                <text x="18" y="50" fill="#ced3da" fontSize="7" fontFamily="monospace" fontWeight="bold">PSU 250W</text>
                {/* Chicote de cabos coloridos da fonte */}
                <path d="M 0 85 Q -30 90 -40 120 Q -50 140 -80 150" fill="none" stroke="#ef4444" strokeWidth="3" />
                <path d="M 0 90 Q -25 95 -35 125 Q -45 145 -75 155" fill="none" stroke="#eab308" strokeWidth="2.5" />
                <path d="M 0 95 Q -20 100 -30 130 Q -40 150 -70 160" fill="none" stroke="#18181b" strokeWidth="3" />
              </g>

              {/* SUBSTRATO DA PLACA-MÃE (PCB VERDE INDUSTRIAL EM PERSPECTIVA) */}
              {/* Localização exata: X: 190..700, Y: 300..550 */}
              <g id="motherboardPCBGroup" transform="translate(190, 300)">
                {/* Placa Verde Substrato */}
                <polygon
                  points="0,55 110,5 510,5 510,240 400,285 0,285"
                  fill="url(#pcb3DSurface)"
                  stroke="#235c39"
                  strokeWidth="2.5"
                />

                {/* Silkscreen Técnico na Placa */}
                <text x="20" y="35" fill="#ffffff" opacity="0.3" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
                  TEACHYOURSELF 486-DX2 MOTHERBOARD · REV 3.2
                </text>
                <text x="20" y="48" fill="#ffffff" opacity="0.2" fontSize="7.5" fontFamily="monospace">
                  SOCKET 3 · VESA LOCAL BUS · 32-BIT HIGH SPEED CONDUIT
                </text>

                {/* SLOTS DE EXPANSÃO ISA E VLB (CANTO INFERIOR ESQUERDO) */}
                <g transform="translate(20, 155)">
                  {[0, 1, 2].map((slotIdx) => (
                    <g key={slotIdx} transform={`translate(0, ${slotIdx * 36})`}>
                      <rect x="0" y="0" width="160" height="22" rx="2" fill="#121315" stroke="#423b30" strokeWidth="1.5" />
                      <line x1="8" y1="11" x2="152" y2="11" stroke="#d4af37" strokeWidth="1.8" strokeDasharray="3 2" />
                      <text x="168" y="15" fill="#9c8b70" fontSize="7.5" fontFamily="monospace">
                        {slotIdx === 0 ? 'SLOT_0 VLB 32-BIT' : `SLOT_${slotIdx} ISA 16-BIT`}
                      </text>
                    </g>
                  ))}
                </g>

                {/* BANCOS DE MEMÓRIA DRAM (4x PENTES SIMM-72 - LADO DIREITO) */}
                <g
                  transform="translate(360, 35)"
                  className="cursor-pointer group"
                  onClick={() => setSelectedInspector(INSPECTOR_DATA.dram)}
                >
                  <rect x="-8" y="-16" width="150" height="165" rx="6" fill="none" stroke={selectedInspector.id === 'dram' ? '#38bdf8' : 'transparent'} strokeWidth="2" strokeDasharray="3 3" />
                  <text x="0" y="-4" fill="#fde68a" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    BANCO DRAM (4x SIMM 16MB)
                  </text>

                  {[0, 1, 2, 3].map((bank) => (
                    <g key={bank} transform={`translate(0, ${bank * 34})`}>
                      {/* Soquete plástico em perspectiva */}
                      <rect x="0" y="0" width="135" height="26" rx="2" fill="#222426" stroke="#5a5750" strokeWidth="1.5" />
                      {/* Placa verde do SIMM */}
                      <rect x="5" y="4" width="125" height="18" rx="1" fill="#17472c" stroke="#2d7c4e" strokeWidth="1" />
                      {/* Chips pretos de memória */}
                      {[0, 1, 2, 3].map((chip) => (
                        <rect
                          key={chip}
                          x={10 + chip * 28}
                          y="6"
                          width="22"
                          height="13"
                          rx="1"
                          fill="#111214"
                          stroke="#3b3f47"
                          strokeWidth="1"
                        />
                      ))}
                      {/* Contatos banhados a ouro */}
                      <line x1="8" y1="22" x2="127" y2="22" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="2 1" />
                    </g>
                  ))}
                </g>

                {/* OSCILADOR DE CRISTAL DE QUARTZO METÁLICO (CENTRO INFERIOR) */}
                <g
                  transform="translate(230, 205)"
                  className="cursor-pointer"
                  onClick={() => setSelectedInspector(INSPECTOR_DATA.osc)}
                >
                  <rect x="-4" y="-4" width="94" height="52" rx="6" fill="none" stroke={selectedInspector.id === 'osc' ? '#38bdf8' : 'transparent'} strokeWidth="2" strokeDasharray="3 3" />
                  <rect x="0" y="0" width="86" height="44" rx="5" fill="#a8aeb8" stroke="#4f545f" strokeWidth="1.8" />
                  <rect x="4" y="4" width="78" height="36" rx="3.5" fill="#c7ccd5" />
                  <text x="12" y="22" fill="#15171a" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    FOX 66.000
                  </text>
                  <text x="24" y="33" fill="#3d424d" fontSize="7" fontFamily="monospace">
                    MHz OSC1
                  </text>
                  {/* Trilha do sinal de clock rumo à CPU */}
                  <path
                    d="M 43 0 L 43 -35 L 140 -35 L 140 -65"
                    fill="none"
                    stroke={clockTick % 2 === 0 ? '#60a5fa' : '#1e385b'}
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                </g>

                {/* SOQUETE ZIF E MICROPROCESSADOR INTEL 486DX2 (LADO ESQUERDO) */}
                <g
                  transform="translate(50, 45)"
                  className="cursor-pointer"
                  onClick={() => setSelectedInspector(INSPECTOR_DATA.cpu)}
                >
                  <rect x="-8" y="-8" width="176" height="166" rx="8" fill="none" stroke={selectedInspector.id === 'cpu' ? '#38bdf8' : 'transparent'} strokeWidth="2" strokeDasharray="4 3" />

                  {/* Base Plástica do Soquete ZIF Socket 3 */}
                  <rect x="0" y="0" width="160" height="150" rx="5" fill="#d7cebd" stroke="#7d7360" strokeWidth="2" />
                  {/* Alavanca ZIF de fixação dourada */}
                  <rect x="154" y="10" width="6" height="130" rx="2" fill="#bfa052" stroke="#6d5722" strokeWidth="1" />

                  {/* Encapsulamento Cerâmico 3D da CPU */}
                  <rect x="14" y="12" width="132" height="126" rx="4" fill="url(#cpuCeramic3D)" stroke="#423a2e" strokeWidth="2" />

                  {/* Dissipador Central com Gravações Douradas */}
                  <rect x="25" y="22" width="110" height="104" rx="3" fill="#13120f" stroke="#d4af37" strokeWidth="1.5" />
                  <text x="34" y="46" fill="#fcd34d" fontSize="10.5" fontFamily="monospace" fontWeight="bold" letterSpacing="1">
                    TEACHYOURSELF
                  </text>
                  <text x="34" y="63" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    i486™ DX2
                  </text>
                  <text x="34" y="78" fill="#9ca3af" fontSize="7.5" fontFamily="monospace">
                    CLOCK: 66 MHz · 32-BIT
                  </text>
                  <text x="34" y="93" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                    %al: 0x2A (42)
                  </text>
                  <text x="34" y="108" fill="#34d399" fontSize="7" fontFamily="monospace">
                    FASE: {currentPhaseData.phaseNum} {currentPhaseData.name.split(' ')[0]}
                  </text>

                  {/* Ponto 1 de Indexação Dourado no Canto */}
                  <polygon points="16,14 24,14 16,22" fill="#fbbf24" />

                  {/* Núcleo de Silício / Die (Pulso Ativo na Execução) */}
                  {cameraMode === 'silicon' && (
                    <rect
                      x="45"
                      y="112"
                      width="68"
                      height="8"
                      rx="1.5"
                      fill={activeCyclePhase === 3 ? '#38bdf8' : '#1c3349'}
                      filter={activeCyclePhase === 3 ? 'url(#bloom3D)' : undefined}
                    />
                  )}
                </g>

                {/* ================================================================= */}
                {/* TRILHAS DE COBRE ROTEADAS DO BARRAMENTO (DATA & ADDRESS BUS)      */}
                {/* Conectam a CPU (X≈210) à DRAM (X≈360)                             */}
                {/* ================================================================= */}
                <g id="copperBusSystemGroup">
                  {/* BARRAMENTO DE ENDEREÇOS (ADDR_BUS[0..15] - 4 Trilhas Superiores) */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedInspector(INSPECTOR_DATA.addrbus)}
                  >
                    {[0, 1, 2, 3].map((idx) => {
                      const y = 60 + idx * 8;
                      return (
                        <g key={`addr-trace-${idx}`}>
                          {/* Trilha com roteamento a 45 graus */}
                          <path
                            d={`M 210 ${y} L 265 ${y} L 295 ${y - 18} L 360 ${y - 18}`}
                            fill="none"
                            stroke={isAddrTransferActive ? '#facc15' : '#6b5220'}
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <circle cx="265" cy={y} r="1.8" fill="#143924" stroke="#d4af37" strokeWidth="1" />
                          <circle cx="295" cy={y - 18} r="1.8" fill="#143924" stroke="#d4af37" strokeWidth="1" />

                          {/* Pulso de Carga Elétrica na Busca de Endereço */}
                          {isAddrTransferActive && (
                            <motion.circle
                              r="3.2"
                              fill="#ffffff"
                              stroke="#facc15"
                              strokeWidth="2"
                              filter="url(#bloom3D)"
                              animate={{
                                cx: [210, 265, 295, 360],
                                cy: [y, y, y - 18, y - 18]
                              }}
                              transition={{
                                duration: clockSpeed === '1hz' ? 0.9 : clockSpeed === '10hz' ? 0.3 : 0.08,
                                repeat: Infinity,
                                ease: 'linear'
                              }}
                            />
                          )}
                        </g>
                      );
                    })}
                    <text x="240" y="50" fill="#facc15" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      ADDR_BUS [0x00401050]
                    </text>
                  </g>

                  {/* BARRAMENTO DE DADOS (DATA_BUS[0..7] - 8 Trilhas de Bits Paralelas) */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedInspector(INSPECTOR_DATA.databus)}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((bitIdx) => {
                      const isHigh = busData[bitIdx] === 1;
                      const y = 98 + bitIdx * 9;

                      return (
                        <g key={`data-trace-${bitIdx}`}>
                          {/* Trilha de Cobre gravada na placa */}
                          <path
                            d={`M 360 ${y} L 305 ${y} L 275 ${y + 16} L 210 ${y + 16}`}
                            fill="none"
                            stroke={isHigh ? (isDataTransferActive ? '#38bdf8' : '#1e608f') : '#1e382b'}
                            strokeWidth={isHigh ? 2.4 : 1.5}
                            strokeLinecap="round"
                          />
                          <circle cx="305" cy={y} r="1.8" fill="#143924" stroke={isHigh ? '#38bdf8' : '#334155'} strokeWidth="1" />
                          <circle cx="275" cy={y + 16} r="1.8" fill="#143924" stroke={isHigh ? '#38bdf8' : '#334155'} strokeWidth="1" />

                          {/* Rótulo do bit */}
                          <text
                            x="365"
                            y={y + 3}
                            fill={isHigh ? '#38bdf8' : '#64748b'}
                            fontSize="7"
                            fontFamily="monospace"
                            fontWeight={isHigh ? 'bold' : 'normal'}
                          >
                            D{7 - bitIdx}={busData[bitIdx]}
                          </text>

                          {/* Pulso de Carga Elétrica na Transferência de Dados */}
                          {isDataTransferActive && isHigh && (
                            <motion.circle
                              r="3.8"
                              fill="#ffffff"
                              stroke="#38bdf8"
                              strokeWidth="2"
                              filter="url(#bloom3D)"
                              animate={{
                                cx: [360, 305, 275, 210],
                                cy: [y, y, y + 16, y + 16]
                              }}
                              transition={{
                                duration: clockSpeed === '1hz' ? 0.9 : clockSpeed === '10hz' ? 0.3 : 0.08,
                                repeat: Infinity,
                                ease: 'linear'
                              }}
                            />
                          )}
                        </g>
                      );
                    })}
                    <text x="235" y="195" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      DATA_BUS [D0..D7 = 0x2A]
                    </text>
                  </g>
                </g>
              </g>
            </g>
          </motion.g>
        </svg>
      </div>

      {/* PAINEL DE TELEMETRIA E INSPEÇÃO DETALHADA DO COMPONENTE SELECIONADO */}
      <div className="mt-6 rounded-2xl border border-ash bg-parchment/60 p-5 md:p-6 transition-all">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-ash">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-lake-blue font-bold">
                {selectedInspector.category}
              </span>
              <span className="h-1 w-1 rounded-full bg-smoke" />
              <span className="text-[10px] font-mono text-smoke">{selectedInspector.voltage}</span>
            </div>
            <h3 className="font-serif text-lg md:text-xl font-medium text-off-black mt-0.5">
              {selectedInspector.name}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-smoke">Fase da Máquina:</span>
            <span className="px-2.5 py-1 rounded-full bg-white border border-ash text-xs font-mono font-bold text-off-black shadow-xs">
              {currentPhaseData.phaseNum}: {currentPhaseData.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs font-mono">
          <div className="md:col-span-2 space-y-2">
            <p className="text-graphite leading-relaxed text-[13px] font-sans">
              {selectedInspector.description}
            </p>
            <div className="p-2.5 rounded-lg bg-white border border-ash text-[11px] text-off-black font-mono">
              <span className="text-smoke">Sinal Lógico Atual: </span>
              <span className="font-bold text-lake-blue">{currentPhaseData.signal}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-ash flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-smoke tracking-wider block">Telemetria de Barramento</span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-graphite">Byte Transferido:</span>
                <span className="font-bold text-lake-blue">0x2A (Decimal 42)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-graphite">Binário D7..D0:</span>
                <span className="font-bold text-off-black">00101010</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-graphite">Linhas Ativas (+5V):</span>
                <span className="font-bold text-emerald-700">D5, D3, D1</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-ash/80 flex items-center justify-between text-[11px] text-smoke">
              <span>Especificação:</span>
              <span className="text-off-black font-medium">{selectedInspector.specs.split('/')[0]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
