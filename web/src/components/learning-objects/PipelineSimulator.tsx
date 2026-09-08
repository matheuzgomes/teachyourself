import { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LearningObject, LearningState } from '../../types/learning-object';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PlayIcon,
  RotateCcwIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CpuIcon,
  Layers01Icon,
  InfoIcon,
  CheckmarkCircle01Icon,
  TriangleAlertIcon
} from '@hugeicons/core-free-icons';

interface PipelineSimulatorProps {
  spec: LearningObject;
  className?: string;
  onStateChange?: (stateId: string) => void;
}

const STAGE_NAMES = ['IF', 'ID', 'EX', 'MEM', 'WB'] as const;
const STAGE_LABELS: Record<string, string> = {
  IF: 'Busca de Instrucao',
  ID: 'Decodificacao e Banco',
  EX: 'Execucao na ALU',
  MEM: 'Acesso a Memoria',
  WB: 'Gravacao no Registrador'
};

export default function PipelineSimulator({ spec, className = '', onStateChange }: PipelineSimulatorProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [showFallback, setShowFallback] = useState<boolean>(false);

  const currentState: LearningState = spec.states[currentIndex] || spec.states[0];

  // 3D Three.js Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const stageMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const regMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 5.5, 9.0));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const animFrameRef = useRef<number | null>(null);

  // Navigation handlers
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIdx = Math.min(prev + 1, spec.states.length - 1);
      if (onStateChange) onStateChange(spec.states[nextIdx].id);
      return nextIdx;
    });
  }, [spec.states, onStateChange]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => {
      const prevIdx = Math.max(prev - 1, 0);
      if (onStateChange) onStateChange(spec.states[prevIdx].id);
      return prevIdx;
    });
  }, [spec.states, onStateChange]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
    if (onStateChange) onStateChange(spec.states[0].id);
  }, [spec.states, onStateChange]);

  const handleJumpToState = useCallback((idx: number) => {
    setIsPlaying(false);
    setCurrentIndex(idx);
    if (onStateChange) onStateChange(spec.states[idx].id);
  }, [spec.states, onStateChange]);

  // Autoplay loop
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round(2200 / speedMultiplier);
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= spec.states.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        if (onStateChange) onStateChange(spec.states[next].id);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, spec.states, onStateChange]);

  // Three.js Scene Setup (for interactive-3d mode)
  useEffect(() => {
    if (spec.mode !== 'interactive-3d' || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    const width = container.clientWidth || 700;
    const height = 320;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x13161a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 5.5, 9.0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 3.5;
    controls.maxDistance = 18;
    controlsRef.current = controls;

    // Studio Lighting (Technical Museum Style)
    const keyLight = new THREE.DirectionalLight(0xfffbf0, 1.4);
    keyLight.position.set(5, 10, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0xffffff, 0x1a2420, 0.7);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0x7090b0, 0.4);
    backLight.position.set(-6, 4, -4);
    scene.add(backLight);

    // Silicon Substrate / PCB Base
    const pcbGeo = new THREE.BoxGeometry(12.5, 0.35, 4.5);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x1b3a28,
      roughness: 0.5,
      metalness: 0.08
    });
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
    pcbMesh.position.y = -0.18;
    pcbMesh.receiveShadow = true;
    scene.add(pcbMesh);

    // Grid of copper decorative bus traces
    const busGeo = new THREE.PlaneGeometry(12.0, 3.8);
    const busMat = new THREE.MeshBasicMaterial({
      color: 0x3a5a40,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    busMesh.rotation.x = -Math.PI / 2;
    busMesh.position.y = 0.01;
    scene.add(busMesh);

    // 5 Hardware Stages (IF, ID, EX, MEM, WB)
    const stageXs = [-4.0, -2.0, 0.0, 2.0, 4.0];
    const stageNames = ['stage-if', 'stage-id', 'stage-ex', 'stage-mem', 'stage-wb'];

    stageNames.forEach((name, idx) => {
      const isEx = idx === 2;
      const isId = idx === 1;
      const boxWidth = isEx ? 1.4 : 1.3;
      const boxDepth = isId ? 2.0 : 1.7;
      const geo = new THREE.BoxGeometry(boxWidth, 0.45, boxDepth);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xeae5d9,
        roughness: 0.75,
        metalness: 0.05
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(stageXs[idx], 0.23, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      stageMeshesRef.current.set(name, mesh);

      // Add small IC pin lines on sides
      const pinGeo = new THREE.BoxGeometry(boxWidth + 0.2, 0.06, boxDepth * 0.85);
      const pinMat = new THREE.MeshStandardMaterial({
        color: 0xc89b3c,
        metalness: 0.9,
        roughness: 0.3
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(stageXs[idx], 0.06, 0);
      scene.add(pinMesh);
    });

    // 4 Pipeline Registers Barriers (IF/ID, ID/EX, EX/MEM, MEM/WB)
    const regXs = [-3.0, -1.0, 1.0, 3.0];
    const regNames = ['reg-if-id', 'reg-id-ex', 'reg-ex-mem', 'reg-mem-wb'];

    regNames.forEach((name, idx) => {
      const geo = new THREE.BoxGeometry(0.32, 0.7, 2.2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3b3836,
        roughness: 0.4,
        metalness: 0.7
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(regXs[idx], 0.35, 0);
      mesh.castShadow = true;
      scene.add(mesh);
      regMeshesRef.current.set(name, mesh);

      // Status indicator LED on top
      const ledGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12);
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0x2b4c7e,
        emissive: 0x1d3455,
        emissiveIntensity: 0.8
      });
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(regXs[idx], 0.76, 0);
      scene.add(ledMesh);
    });

    // Write-Back return bus (copper ribbon routing from WB back to ID/RegFile)
    const returnBusPoints = [
      new THREE.Vector3(4.0, 0.05, -1.2),
      new THREE.Vector3(4.0, 0.05, -1.8),
      new THREE.Vector3(-2.0, 0.05, -1.8),
      new THREE.Vector3(-2.0, 0.05, -1.1)
    ];
    const busCurve = new THREE.CatmullRomCurve3(returnBusPoints);
    const busTubeGeo = new THREE.TubeGeometry(busCurve, 32, 0.05, 8, false);
    const busTubeMat = new THREE.MeshStandardMaterial({
      color: 0xc89b3c,
      metalness: 0.85,
      roughness: 0.25
    });
    const busTubeMesh = new THREE.Mesh(busTubeGeo, busTubeMat);
    scene.add(busTubeMesh);

    // Animation render loop
    let running = true;
    const animate = () => {
      if (!running) return;
      controls.update();

      // Smooth camera interpolation towards target
      camera.position.lerp(targetCameraPosRef.current, 0.04);
      controls.target.lerp(targetLookAtRef.current, 0.04);

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      running = false;
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [spec.mode]);

  // Update Three.js highlights and camera targets on step change
  useEffect(() => {
    if (spec.mode !== 'interactive-3d' || !sceneRef.current) return;

    const focusList = currentState.focus || [];
    const isRawHazard = currentState.id.includes('hazard') || currentState.id.includes('stall');
    const isWriteRead = currentState.id.includes('write-then-read');

    // Camera preset logic based on pedagogical focus
    if (isRawHazard) {
      // Focus on ID and EX collision
      targetCameraPosRef.current.set(-1.0, 4.2, 5.8);
      targetLookAtRef.current.set(-1.0, 0.3, 0);
    } else if (isWriteRead) {
      // Elevated angle showing WB bus routing to ID
      targetCameraPosRef.current.set(0.5, 5.0, 6.8);
      targetLookAtRef.current.set(0.0, 0.2, -0.4);
    } else {
      // Balanced overview
      targetCameraPosRef.current.set(0, 5.5, 9.0);
      targetLookAtRef.current.set(0, 0, 0);
    }

    // Material highlights on stage meshes
    stageMeshesRef.current.forEach((mesh, name) => {
      const isFocused = focusList.some((f) => f.includes(name.replace('stage-', '')) || f.includes(name));
      const mat = mesh.material as THREE.MeshStandardMaterial;

      if (isFocused) {
        if (isRawHazard && (name === 'stage-id' || name === 'stage-ex')) {
          mat.color.setHex(name === 'stage-id' ? 0x8b261e : 0x2b4c7e); // Rust warning on ID, Lake blue on EX
        } else if (isWriteRead && (name === 'stage-wb' || name === 'stage-id')) {
          mat.color.setHex(0x2d5a27); // Mint success on WB and ID
        } else {
          mat.color.setHex(0x2b4c7e); // Primary lake blue highlight
        }
      } else {
        mat.color.setHex(0xeae5d9); // Default aged ivory
      }
    });

    // Highlight pipeline registers
    regMeshesRef.current.forEach((mesh, name) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (isRawHazard && (name === 'reg-id-ex' || name === 'reg-if-id')) {
        mat.color.setHex(0x501a18); // Warning rust on frozen registers
      } else {
        mat.color.setHex(0x3b3836);
      }
    });
  }, [currentIndex, currentState, spec.mode]);

  return (
    <div
      className={`my-8 rounded-3xl border border-ash bg-white/95 shadow-monad overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-ash bg-parchment/70 px-5 py-3.5 gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-lake-blue/10 p-2 text-lake-blue">
            <HugeiconsIcon icon={CpuIcon} className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-smoke font-medium">
              Learning Object: {spec.id}
            </div>
            <div className="text-sm font-semibold text-off-black">
              {currentState.title}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-ash/40 px-2.5 py-1 text-[11px] font-mono text-graphite">
            Passo {currentIndex + 1} de {spec.states.length}
          </span>
          <button
            type="button"
            onClick={() => setShowFallback(!showFallback)}
            className="rounded-full border border-ash bg-white px-3 py-1 text-[11px] font-mono text-graphite hover:text-off-black hover:border-graphite transition-colors min-h-[32px] inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
            aria-label="Alternar visualizacao estatica para acessibilidade"
          >
            <HugeiconsIcon icon={Layers01Icon} className="h-3.5 w-3.5" />
            {showFallback ? 'Ver Simulador' : 'Ver Tabela Estatica'}
          </button>
        </div>
      </div>

      {/* Main Content View: 3D Viewport or Static Fallback */}
      {showFallback ? (
        <div className="p-6 bg-parchment/30">
          <div className="mb-3 text-xs font-mono font-medium text-graphite uppercase tracking-wider">
            Fallback de Acessibilidade (Tabela Estatica):
          </div>
          <pre className="rounded-2xl border border-ash bg-off-black p-4 font-mono text-xs text-parchment overflow-x-auto leading-relaxed">
            {spec.accessibilityFallback.staticTableOrDiagram}
          </pre>
          <p className="mt-3 text-xs text-graphite leading-relaxed">
            {spec.accessibilityFallback.description}
          </p>
        </div>
      ) : (
        <>
          {/* 3D Hardware Canvas Viewport (if 3D mode) */}
          {spec.mode === 'interactive-3d' && (
            <div className="relative w-full bg-[#13161a] border-b border-ash">
              <div ref={canvasContainerRef} className="h-[320px] w-full cursor-grab active:cursor-grabbing" />
              
              {/* 3D Viewport Overlay Badges */}
              <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1 text-[10px] font-mono text-parchment/80">
                <span className="rounded bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                  RISC-V 5-STAGE CORE : THREE.JS VIRTUAL INSPECTOR
                </span>
                <span className="text-[9px] text-smoke">
                  Arraste para orbitar • Scroll para aproximar
                </span>
              </div>

              {/* Quick Stage Indicator Pills in 3D */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-ash/20 text-[11px] font-mono">
                {STAGE_NAMES.map((stage) => {
                  const isFocused = (currentState.focus || []).some((f) => f.includes(stage.toLowerCase()));
                  return (
                    <span
                      key={stage}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        isFocused
                          ? 'bg-lake-blue text-white font-bold'
                          : 'text-parchment/60 hover:text-parchment'
                      }`}
                    >
                      {stage}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2D Stage Dataflow Visualizer (if interactive-2d mode) */}
          {spec.mode === 'interactive-2d' && (
            <div className="p-6 bg-parchment/40 border-b border-ash">
              <div className="text-[11px] font-mono uppercase tracking-wider text-smoke mb-3">
                Topologia dos Estagios de Execucao (Fatiamento por Registradores):
              </div>
              <div className="grid grid-cols-5 gap-2 text-center">
                {STAGE_NAMES.map((stage) => {
                  const stageKey = `stage-${stage.toLowerCase()}`;
                  const isActive = (currentState.activeComponents || []).includes(stageKey);
                  const isFocused = (currentState.focus || []).some((f) => f.includes(stage.toLowerCase()));
                  return (
                    <div
                      key={stage}
                      className={`rounded-2xl border p-3 transition-all ${
                        isFocused
                          ? 'border-lake-blue bg-periwinkle-mist/40 text-lake-blue shadow-sm ring-2 ring-lake-blue/20'
                          : isActive
                          ? 'border-ash bg-white text-off-black'
                          : 'border-dashed border-ash/80 bg-white/40 text-smoke'
                      }`}
                    >
                      <div className="font-mono text-sm font-bold">{stage}</div>
                      <div className="text-[10px] text-graphite mt-1 leading-tight">{STAGE_LABELS[stage]}</div>
                      <div className="mt-2 text-[9px] font-mono">
                        {isActive ? (
                          <span className="rounded bg-mint/10 text-mint px-1.5 py-0.5 font-medium">Ocupado</span>
                        ) : (
                          <span className="text-smoke">Vazio</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Stepper Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ash bg-parchment/40 px-5 py-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="rounded-xl border border-ash bg-white p-2 text-off-black hover:bg-parchment active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all min-h-[40px] min-w-[40px] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
                aria-label="Ciclo Anterior"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`rounded-xl px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-all min-h-[40px] inline-flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                  isPlaying
                    ? 'bg-rust text-white hover:bg-rust/90'
                    : 'bg-off-black text-white hover:bg-black'
                }`}
                aria-label={isPlaying ? 'Pausar simulacao' : 'Reproduzir simulacao'}
              >
                <HugeiconsIcon icon={PlayIcon} className="h-3.5 w-3.5" />
                {isPlaying ? 'Pausar' : 'Reproduzir'}
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === spec.states.length - 1}
                className="rounded-xl border border-ash bg-white p-2 text-off-black hover:bg-parchment active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all min-h-[40px] min-w-[40px] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
                aria-label="Proximo Ciclo"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-ash bg-white p-2 text-smoke hover:text-off-black hover:bg-parchment transition-all min-h-[40px] min-w-[40px] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
                aria-label="Reiniciar simulacao"
                title="Reiniciar"
              >
                <HugeiconsIcon icon={RotateCcwIcon} className="h-4 w-4" />
              </button>
            </div>

            {/* Cycle Jumping Pills */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {spec.states.map((state, sIdx) => {
                const isCurrent = sIdx === currentIndex;
                const cycleNum = sIdx + 1;
                return (
                  <button
                    key={state.id}
                    type="button"
                    onClick={() => handleJumpToState(sIdx)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-all min-h-[32px] ${
                      isCurrent
                        ? 'bg-lake-blue text-white shadow-sm font-bold scale-105'
                        : 'bg-white/80 border border-ash text-graphite hover:text-off-black hover:bg-white'
                    }`}
                  >
                    C{cycleNum}
                  </button>
                );
              })}
            </div>

            {/* Speed Toggle */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-smoke">
              <span>Velocidade:</span>
              {[1, 1.5].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setSpeedMultiplier(speed)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    speedMultiplier === speed ? 'bg-ash/70 text-off-black font-bold' : 'hover:text-off-black'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Explanation & Active Annotations Card */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-lake-blue font-semibold">
                  <HugeiconsIcon icon={InfoIcon} className="h-3.5 w-3.5" />
                  Mecanismo no Pipeline:
                </div>
                <p className="text-sm text-off-black leading-relaxed">
                  {currentState.explanation}
                </p>

                {/* Annotations List */}
                {currentState.annotations && currentState.annotations.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {currentState.annotations.map((ann, aIdx) => (
                      <div
                        key={aIdx}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium border ${
                          ann.variant === 'warning'
                            ? 'bg-rust/10 border-rust/30 text-rust'
                            : ann.variant === 'success'
                            ? 'bg-mint/10 border-mint/30 text-mint'
                            : 'bg-periwinkle-mist border-lake-blue/30 text-lake-blue'
                        }`}
                      >
                        {ann.variant === 'warning' ? (
                          <HugeiconsIcon icon={TriangleAlertIcon} className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>{ann.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Metrics Table */}
              {currentState.metrics && (
                <div className="rounded-2xl border border-ash bg-parchment/40 p-3 shrink-0 min-w-[200px]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-smoke mb-2 font-medium">
                    Metricas do Ciclo
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    {Object.entries(currentState.metrics).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <span className="text-graphite">{k}:</span>
                        <span className="font-bold text-off-black">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
