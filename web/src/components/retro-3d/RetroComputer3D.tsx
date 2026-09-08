import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createCRTTexture,
  createMotherboardTexture,
  createCpuTexture,
  createHddTexture,
  createPsuLabelTexture,
  createCapacitorTopTexture,
  createBiosLabelTexture,
  createPlasticBumpTexture,
  createBrushedMetalBumpTexture,
  createPcbBumpTexture,
  createContactShadowTexture,
  createScrewHeadTexture,
  createDallasRtcTexture,
  createChipsetTexture,
  createSramTexture,
  createSevenSegmentTexture,
  createBadgeTexture
} from './textures';
import { HARDWARE_DATA, type HardwareInspectorData } from './types';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ComputerIcon,
  Layers01Icon,
  InfoIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon
} from '@hugeicons/core-free-icons';

type ViewMode = 'closed' | 'open';
type FocusTarget =
  | 'overview'
  | 'cpu'
  | 'gpu'
  | 'dram'
  | 'ide_cable'
  | 'psu_harness'
  | 'hdd'
  | 'caps'
  | 'databus'
  | 'osc'
  | 'vlb'
  | 'cache_l2'
  | 'chipset'
  | 'rtc'
  | 'front_panel';

const tagInteractive = (object: THREE.Object3D, componentId: string) => {
  object.userData = { componentId };
  object.traverse((child) => {
    child.userData = { componentId };
  });
};

export default function RetroComputer3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ViewMode>('open');
  const modeRef = useRef<ViewMode>('open');
  const [activeFocus, setActiveFocus] = useState<FocusTarget>('overview');
  const [selectedComponent, setSelectedComponent] = useState<HardwareInspectorData>(HARDWARE_DATA.cpu);

  // Referencias mutaveis Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Maquina de estados de camera
  const isTransitioningCamera = useRef<boolean>(false);

  // Partes moveis da abertura do gabinete
  const topLidMeshRef = useRef<THREE.Mesh | null>(null);
  const monitorGroupRef = useRef<THREE.Group | null>(null);
  const chassisLightRef = useRef<THREE.PointLight | null>(null);
  const busParticlesRef = useRef<THREE.Points | null>(null);
  const vlbCardGroupRef = useRef<THREE.Group | null>(null);

  // Alvos de interpolacao de camera e abertura (Placa-mae centralizada em X = -0.65, Z = -0.11)
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(-0.65, 3.10, 2.50));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(-0.65, -0.45, -0.11));
  const animOpenProgress = useRef<number>(1.0); // 0 = fechado, 1 = aberto

  const cameraPresets: Record<ViewMode, { pos: THREE.Vector3; look: THREE.Vector3 }> = {
    closed: {
      pos: new THREE.Vector3(3.8, 2.3, 4.4),
      look: new THREE.Vector3(0, 0.5, 0)
    },
    open: {
      // Perfeitamente centralizado sobre a placa-mae
      pos: new THREE.Vector3(-0.65, 3.10, 2.50),
      look: new THREE.Vector3(-0.65, -0.45, -0.11)
    }
  };

  const focusPresets: Record<FocusTarget, { pos: THREE.Vector3; look: THREE.Vector3 }> = {
    overview: {
      pos: new THREE.Vector3(-0.65, 3.10, 2.50),
      look: new THREE.Vector3(-0.65, -0.45, -0.11)
    },
    cpu: {
      // Enquadramento elevado sobre o Socket 3, chip 486 e dissipador preto aletado
      pos: new THREE.Vector3(-0.81, 0.95, 1.85),
      look: new THREE.Vector3(-0.81, -0.45, 0.78)
    },
    gpu: {
      // Visao lateral traseira angular mostrando o encaixe no slot e a saida de video VGA
      pos: new THREE.Vector3(-2.35, 0.75, -0.85),
      look: new THREE.Vector3(-1.35, -0.28, -0.85)
    },
    vlb: {
      // Visao inclinada sobre os 7 slots de expansao e as extensoes marrons VLB
      pos: new THREE.Vector3(-1.40, 1.45, 0.35),
      look: new THREE.Vector3(-1.00, -0.38, -0.35)
    },
    dram: {
      // Enquadramento sobre os 4 pentes de memoria SIMM-72
      pos: new THREE.Vector3(0.15, 1.15, 1.75),
      look: new THREE.Vector3(0.11, -0.42, 0.70)
    },
    cache_l2: {
      // Enquadramento sobre os 8 chips SRAM e chip TAG
      pos: new THREE.Vector3(-0.70, 0.95, 1.10),
      look: new THREE.Vector3(-0.70, -0.50, 0.18)
    },
    chipset: {
      // Visao zenital inclinada sobre os chips SiS 496 e SiS 497
      pos: new THREE.Vector3(0.05, 1.05, -0.25),
      look: new THREE.Vector3(-0.017, -0.52, -0.87)
    },
    rtc: {
      // Visao sobre o modulo Dallas RTC e BIOS ROM
      pos: new THREE.Vector3(-1.65, 0.85, 1.85),
      look: new THREE.Vector3(-1.63, -0.48, 0.89)
    },
    ide_cable: {
      // Visao angular da fita ribbon cinza cruzando a placa
      pos: new THREE.Vector3(0.35, 1.15, 1.55),
      look: new THREE.Vector3(0.00, -0.40, 0.80)
    },
    psu_harness: {
      // Enquadramento da fonte de alimentacao AT e chicote P8/P9
      pos: new THREE.Vector3(1.10, 1.25, -0.15),
      look: new THREE.Vector3(0.85, -0.25, -0.80)
    },
    hdd: {
      // Enquadramento do disco rigido 3.5" na baia interna
      pos: new THREE.Vector3(1.65, 0.85, 1.65),
      look: new THREE.Vector3(1.35, -0.40, 0.65)
    },
    caps: {
      // Close nos capacitores eletroliticos azuis ao redor da CPU
      pos: new THREE.Vector3(-0.85, 0.75, 1.25),
      look: new THREE.Vector3(-0.80, -0.50, 0.45)
    },
    databus: {
      // Visao das trilhas de comunicacao e fluxo de particulas
      pos: new THREE.Vector3(-0.81, 0.85, 1.25),
      look: new THREE.Vector3(-0.81, -0.52, 0.49)
    },
    osc: {
      // Close no cristal de quartzo prateado de 66 MHz
      pos: new THREE.Vector3(0.45, 0.65, -0.65),
      look: new THREE.Vector3(0.28, -0.50, -0.87)
    },
    front_panel: {
      // Visao frontal do gabinete e baias 3D
      pos: new THREE.Vector3(0.00, 0.50, 4.20),
      look: new THREE.Vector3(0.00, 0.10, 1.88)
    }
  };

  const switchMode = (newMode: ViewMode) => {
    setMode(newMode);
    modeRef.current = newMode;
    setActiveFocus('overview');
    const preset = cameraPresets[newMode];
    targetCamPos.current.copy(preset.pos);
    targetLookAt.current.copy(preset.look);
    isTransitioningCamera.current = true;
  };

  const handleFocus = (focus: FocusTarget) => {
    if (focus !== 'front_panel' && modeRef.current !== 'open') {
      setMode('open');
      modeRef.current = 'open';
    }
    setActiveFocus(focus);
    const preset = focusPresets[focus] || focusPresets.overview;
    targetCamPos.current.copy(preset.pos);
    targetLookAt.current.copy(preset.look);
    isTransitioningCamera.current = true;
  };

  const handleFocusRef = useRef(handleFocus);
  handleFocusRef.current = handleFocus;
  const setSelectedComponentRef = useRef(setSelectedComponent);
  setSelectedComponentRef.current = setSelectedComponent;

  // Funcoes dedicadas de zoom e reset de camera
  const handleZoomIn = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    isTransitioningCamera.current = false;
    const cam = cameraRef.current;
    const target = controlsRef.current.target;
    const dir = new THREE.Vector3().subVectors(cam.position, target);
    const newLen = Math.max(0.4, dir.length() * 0.78);
    dir.setLength(newLen);
    cam.position.copy(target).add(dir);
    controlsRef.current.update();
    targetCamPos.current.copy(cam.position);
    targetLookAt.current.copy(target);
  };

  const handleZoomOut = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    isTransitioningCamera.current = false;
    const cam = cameraRef.current;
    const target = controlsRef.current.target;
    const dir = new THREE.Vector3().subVectors(cam.position, target);
    const newLen = Math.min(16.0, dir.length() * 1.28);
    dir.setLength(newLen);
    cam.position.copy(target).add(dir);
    controlsRef.current.update();
    targetCamPos.current.copy(cam.position);
    targetLookAt.current.copy(target);
  };

  const handleResetCamera = () => {
    switchMode(mode);
  };

  // Inicializacao estavel da cena Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Cena e Renderizador WebGL com Tone Mapping e Sombras Suaves
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0d12);

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 40.0);
    camera.position.copy(targetCamPos.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 2. Ambiente de Estudio Fotografico Realista (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTexture;

    // 3. Controles Orbitais
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.85;
    controls.minDistance = 0.35;
    controls.maxDistance = 16.0;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.target.copy(targetLookAt.current);
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      isTransitioningCamera.current = false;
    });

    controls.addEventListener('end', () => {
      targetCamPos.current.copy(camera.position);
      targetLookAt.current.copy(controls.target);
    });

    // 4. Iluminacao Direcional e Pontual de Estudio
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.3);
    keyLight.position.set(6, 9, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.00005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.near = 2.0;
    keyLight.shadow.camera.far = 20.0;
    keyLight.shadow.camera.left = -3.8;
    keyLight.shadow.camera.right = 3.8;
    keyLight.shadow.camera.top = 3.8;
    keyLight.shadow.camera.bottom = -3.8;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbfdbfe, 0.75);
    fillLight.position.set(-6, 5, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef08a, 0.5);
    rimLight.position.set(0, 7, -6);
    scene.add(rimLight);

    const crtGlow = new THREE.PointLight(0x4ade80, 1.2, 4.0);
    crtGlow.position.set(0, 2.2, 1.35);
    scene.add(crtGlow);

    const chassisLight = new THREE.PointLight(0xffedd5, 1.8, 3.8);
    chassisLight.position.set(-0.2, 0.8, 0.2);
    chassisLightRef.current = chassisLight;
    scene.add(chassisLight);

    // 5. Bancada de Trabalho com Sombra de Contato Suave
    const deskGeo = new THREE.PlaneGeometry(32, 32);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x0f131a,
      roughness: 0.88,
      metalness: 0.1
    });
    const deskMesh = new THREE.Mesh(deskGeo, deskMat);
    deskMesh.rotation.x = -Math.PI / 2;
    deskMesh.position.y = -0.85;
    deskMesh.receiveShadow = true;
    scene.add(deskMesh);

    const contactShadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const shadowPlaneGeo = new THREE.PlaneGeometry(6.4, 5.8);
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -0.84, 0);
    scene.add(shadowPlane);

    // 6. Materiais Fisicos PBR
    const plasticBump = createPlasticBumpTexture();
    const metalBump = createBrushedMetalBumpTexture();
    const pcbBump = createPcbBumpTexture();
    const screwTex = createScrewHeadTexture();

    const beigeMat = new THREE.MeshStandardMaterial({
      color: 0xe6dfd1,
      roughness: 0.62,
      metalness: 0.05,
      bumpMap: plasticBump,
      bumpScale: 0.005
    });

    const darkBeigeMat = new THREE.MeshStandardMaterial({
      color: 0xb8a892,
      roughness: 0.68,
      metalness: 0.08,
      bumpMap: plasticBump,
      bumpScale: 0.006
    });

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x98a0ab,
      roughness: 0.28,
      metalness: 0.88,
      bumpMap: metalBump,
      bumpScale: 0.012
    });

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.32,
      metalness: 0.78
    });

    const blackPlasticMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.78,
      metalness: 0.06,
      bumpMap: plasticBump,
      bumpScale: 0.004
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.18,
      metalness: 0.96
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.12,
      metalness: 0.98
    });

    const screwMat = new THREE.MeshStandardMaterial({
      map: screwTex,
      roughness: 0.2,
      metalness: 0.92
    });

    const vlbBrownMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.55,
      metalness: 0.1
    });

    const whiteNylonMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.42
    });

    const redPlasticMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.52
    });

    const jumperBlueMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.5
    });

    const jumperYellowMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.5
    });

    // 7. CHASSI FIXO INFERIOR
    const chassisGroup = new THREE.Group();
    scene.add(chassisGroup);

    const trayGeo = new RoundedBoxGeometry(4.2, 0.08, 3.8, 3, 0.03);
    const trayMesh = new THREE.Mesh(trayGeo, steelMat);
    trayMesh.position.set(0, -0.68, 0);
    trayMesh.receiveShadow = true;
    chassisGroup.add(trayMesh);

    const leftRailGeo = new RoundedBoxGeometry(0.06, 0.32, 3.76, 2, 0.015);
    const leftRail = new THREE.Mesh(leftRailGeo, steelMat);
    leftRail.position.set(-2.07, -0.53, 0);
    chassisGroup.add(leftRail);

    const rightRail = leftRail.clone();
    rightRail.position.set(2.07, -0.53, 0);
    chassisGroup.add(rightRail);

    const rearPanelGeo = new RoundedBoxGeometry(4.2, 0.95, 0.06, 2, 0.015);
    const rearPanel = new THREE.Mesh(rearPanelGeo, steelMat);
    rearPanel.position.set(0, -0.22, -1.87);
    rearPanel.castShadow = true;
    chassisGroup.add(rearPanel);

    const dinGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 24);
    const dinMesh = new THREE.Mesh(dinGeo, chromeMat);
    dinMesh.rotation.x = Math.PI / 2;
    dinMesh.position.set(0.1, -0.42, -1.9);
    chassisGroup.add(dinMesh);

    const bracketGeo = new RoundedBoxGeometry(0.12, 0.65, 0.02, 2, 0.005);
    const rearSlotPositions = [-1.545, -1.354, -1.163, -0.972, -0.781, -0.590, -0.399];
    for (let i = 0; i < 7; i++) {
      const bx = rearSlotPositions[i];
      // O Slot 2 (i = 1) e ocupado pelo espelho da placa de video VLB instalada
      if (i === 1) continue;
      const bracketMesh = new THREE.Mesh(bracketGeo, chromeMat);
      bracketMesh.position.set(bx, -0.25, -1.87);
      chassisGroup.add(bracketMesh);

      const sMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), screwMat);
      sMesh.rotation.x = Math.PI / 2;
      sMesh.position.set(bx, 0.1, -1.87);
      chassisGroup.add(sMesh);
    }

    // 8. PAINEL FRONTAL FULL 3D (Substitui a face 2D chapada por montagem volumetrica)
    const frontGroup = new THREE.Group();
    frontGroup.position.set(0, 0.02, 1.88);
    tagInteractive(frontGroup, "front_panel");
    chassisGroup.add(frontGroup);

    // 8.1 Moldura Principal Bege com Cantos Arredondados
    const mainBezelGeo = new RoundedBoxGeometry(4.24, 1.45, 0.12, 4, 0.05);
    const mainBezelMesh = new THREE.Mesh(mainBezelGeo, beigeMat);
    mainBezelMesh.castShadow = true;
    frontGroup.add(mainBezelMesh);

    // 8.2 Venezianas de Ventilacao 3D Inferiores Esquerdas (Aletas com fendas reais)
    const ventCavityGeo = new RoundedBoxGeometry(0.92, 0.58, 0.06, 2, 0.01);
    const ventCavityMesh = new THREE.Mesh(ventCavityGeo, blackPlasticMat);
    ventCavityMesh.position.set(-1.35, -0.32, 0.05);
    frontGroup.add(ventCavityMesh);

    const slatGeo = new RoundedBoxGeometry(0.88, 0.028, 0.055, 2, 0.005);
    for (let s = 0; s < 8; s++) {
      const sy = -0.52 + s * 0.06;
      const slatMesh = new THREE.Mesh(slatGeo, beigeMat);
      slatMesh.position.set(-1.35, sy, 0.08);
      slatMesh.rotation.x = 0.55; // Angulo de 32 graus para sombreamento real
      slatMesh.castShadow = true;
      frontGroup.add(slatMesh);
    }

    // 8.3 Emblema Metalico Superior Esquerdo
    const badgeTex = createBadgeTexture();
    const badgeMat = new THREE.MeshStandardMaterial({
      map: badgeTex,
      roughness: 0.28,
      metalness: 0.85
    });
    const badgeGeo = new RoundedBoxGeometry(1.04, 0.26, 0.03, 2, 0.008);
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(-1.35, 0.44, 0.07);
    badgeMesh.castShadow = true;
    frontGroup.add(badgeMesh);

    // 8.4 Baia 5.25" Superior (Drive de Disquete 1.2 MB de 1994)
    const fdd525Group = new THREE.Group();
    fdd525Group.position.set(1.24, 0.38, 0.06);

    const bay525Bezel = new THREE.Mesh(
      new RoundedBoxGeometry(1.48, 0.48, 0.05, 2, 0.015),
      darkBeigeMat
    );
    fdd525Group.add(bay525Bezel);

    // Fenda do disquete 5.25"
    const slot525 = new THREE.Mesh(
      new RoundedBoxGeometry(1.22, 0.055, 0.08, 2, 0.005),
      blackPlasticMat
    );
    slot525.position.set(0, 0.08, 0.02);
    fdd525Group.add(slot525);

    // Alavanca rotativa fisica de travamento em L
    const latchPivot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16),
      darkMetalMat
    );
    latchPivot.rotation.x = Math.PI / 2;
    latchPivot.position.set(0, -0.05, 0.04);
    fdd525Group.add(latchPivot);

    const latchArm = new THREE.Mesh(
      new RoundedBoxGeometry(0.24, 0.08, 0.04, 2, 0.008),
      blackPlasticMat
    );
    latchArm.position.set(0, -0.05, 0.055);
    latchArm.castShadow = true;
    fdd525Group.add(latchArm);

    // LED retangular ambar de leitura do 5.25"
    const led525Mat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85
    });
    const led525 = new THREE.Mesh(
      new RoundedBoxGeometry(0.07, 0.04, 0.03, 1, 0.005),
      led525Mat
    );
    led525.position.set(-0.54, -0.12, 0.035);
    fdd525Group.add(led525);

    frontGroup.add(fdd525Group);

    // 8.5 Baia 3.5" Inferior (Drive de Disquete 1.44 MB Teac/Sony)
    const fdd35Group = new THREE.Group();
    fdd35Group.position.set(1.24, -0.22, 0.06);

    const bay35Bezel = new THREE.Mesh(
      new RoundedBoxGeometry(1.48, 0.46, 0.05, 2, 0.015),
      darkBeigeMat
    );
    fdd35Group.add(bay35Bezel);

    // Fenda do disquete 3.5" com portinhola metalica anti-poeira rebaixada
    const slot35 = new THREE.Mesh(
      new RoundedBoxGeometry(1.18, 0.045, 0.06, 2, 0.005),
      blackPlasticMat
    );
    slot35.position.set(0, 0.08, 0.02);
    fdd35Group.add(slot35);

    const dustFlap = new THREE.Mesh(
      new THREE.PlaneGeometry(1.16, 0.038),
      steelMat
    );
    dustFlap.position.set(0, 0.08, 0.035);
    fdd35Group.add(dustFlap);

    // Botao ejetor retangular proeminente (projetado 5mm para fora)
    const ejectBtn = new THREE.Mesh(
      new RoundedBoxGeometry(0.22, 0.12, 0.08, 2, 0.01),
      darkBeigeMat
    );
    ejectBtn.position.set(0.48, -0.1, 0.05);
    ejectBtn.castShadow = true;
    fdd35Group.add(ejectBtn);

    // LED de leitura circular verde
    const led35Mat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 0.9
    });
    const led35 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.03, 16),
      led35Mat
    );
    led35.rotation.x = Math.PI / 2;
    led35.position.set(-0.52, -0.1, 0.04);
    fdd35Group.add(led35);

    frontGroup.add(fdd35Group);

    // 8.6 Display LED 7 Segmentos 66 MHz sob Lente Fumê Reflexiva
    const displayGroup = new THREE.Group();
    displayGroup.position.set(-0.16, 0.38, 0.07);

    // Moldura preta biselada
    const dispFrame = new THREE.Mesh(
      new RoundedBoxGeometry(0.96, 0.54, 0.04, 2, 0.012),
      blackPlasticMat
    );
    displayGroup.add(dispFrame);

    // Placa emissiva dos digitos "66 MHz"
    const segTex = createSevenSegmentTexture();
    const segMat = new THREE.MeshStandardMaterial({
      map: segTex,
      emissive: 0x22c55e,
      emissiveIntensity: 0.75,
      roughness: 0.2
    });
    const segScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.86, 0.44),
      segMat
    );
    segScreen.position.set(0, 0, 0.021);
    displayGroup.add(segScreen);

    // Lente de acrilico fume protetora
    const acrylicMat = new THREE.MeshPhysicalMaterial({
      color: 0x050805,
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 0.9,
      transmission: 0.45,
      opacity: 0.88,
      transparent: true
    });
    const acrylicLens = new THREE.Mesh(
      new RoundedBoxGeometry(0.88, 0.46, 0.015, 2, 0.008),
      acrylicMat
    );
    acrylicLens.position.set(0, 0, 0.032);
    displayGroup.add(acrylicLens);

    frontGroup.add(displayGroup);

    // 8.7 Controles Centrais Inferiores (Chave Rocker, Turbo, Reset, Keylock, LEDs)
    const controlsGroup = new THREE.Group();
    controlsGroup.position.set(-0.16, -0.24, 0.07);

    // Chave Rocker de Energia Vermelha (Power Switch)
    const switchBezel = new THREE.Mesh(
      new RoundedBoxGeometry(0.42, 0.52, 0.05, 2, 0.01),
      blackPlasticMat
    );
    switchBezel.position.set(0.48, 0, 0);
    controlsGroup.add(switchBezel);

    // Duas facetas anguladas da gangorra rocker
    const rockerTop = new THREE.Mesh(
      new RoundedBoxGeometry(0.32, 0.2, 0.04, 2, 0.008),
      redPlasticMat
    );
    rockerTop.position.set(0.48, 0.09, 0.03);
    rockerTop.rotation.x = -0.25;
    rockerTop.castShadow = true;
    controlsGroup.add(rockerTop);

    const rockerBottom = new THREE.Mesh(
      new RoundedBoxGeometry(0.32, 0.2, 0.04, 2, 0.008),
      redPlasticMat
    );
    rockerBottom.position.set(0.48, -0.09, 0.02);
    rockerBottom.rotation.x = 0.15;
    controlsGroup.add(rockerBottom);

    // Botao Turbo Quadrado Saliente
    const turboBtn = new THREE.Mesh(
      new RoundedBoxGeometry(0.32, 0.18, 0.055, 2, 0.008),
      darkBeigeMat
    );
    turboBtn.position.set(0.04, 0.12, 0.035);
    turboBtn.castShadow = true;
    controlsGroup.add(turboBtn);

    // Botao Reset Embutido com Anel Protetor
    const resetGuard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16),
      blackPlasticMat
    );
    resetGuard.rotation.x = Math.PI / 2;
    resetGuard.position.set(0.04, -0.14, 0.02);
    controlsGroup.add(resetGuard);

    const resetBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.03, 16),
      darkBeigeMat
    );
    resetBtn.rotation.x = Math.PI / 2;
    resetBtn.position.set(0.04, -0.14, 0.025);
    controlsGroup.add(resetBtn);

    // Fechadura Tubular Metalica (Keylock)
    const keylockCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.04, 20),
      chromeMat
    );
    keylockCyl.rotation.x = Math.PI / 2;
    keylockCyl.position.set(-0.38, 0.12, 0.03);
    keylockCyl.castShadow = true;
    controlsGroup.add(keylockCyl);

    const keySlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.08, 0.05),
      blackPlasticMat
    );
    keySlot.position.set(-0.38, 0.12, 0.035);
    controlsGroup.add(keySlot);

    // Tres LEDs Indicadores Salientes (Power, Turbo, HDD)
    const ledPwrMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 0.95
    });
    const ledTurboMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.95
    });
    const ledHddMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.8
    });

    const leds = [
      { mat: ledPwrMat, y: -0.04 },
      { mat: ledTurboMat, y: -0.14 },
      { mat: ledHddMat, y: -0.24 }
    ];
    leds.forEach((ld) => {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.038, 0.02, 16),
        blackPlasticMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(-0.38, ld.y, 0.025);
      controlsGroup.add(ring);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 16, 12),
        ld.mat
      );
      dome.position.set(-0.38, ld.y, 0.04);
      controlsGroup.add(dome);
    });

    frontGroup.add(controlsGroup);

    // 8.8 Gaiola metalica interna para perifericos
    const cageGeo = new RoundedBoxGeometry(1.35, 1.15, 1.8, 2, 0.025);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x767f8a,
      roughness: 0.32,
      metalness: 0.86,
      bumpMap: metalBump,
      bumpScale: 0.01
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    cageMesh.position.set(1.35, -0.05, 0.85);
    chassisGroup.add(cageMesh);

    // 9. FONTE DE ALIMENTACAO AT 250W
    const psuGroup = new THREE.Group();
    const psuGeo = new RoundedBoxGeometry(1.35, 0.95, 1.35, 3, 0.035);
    const psuLabelTex = createPsuLabelTexture();
    const psuLabelMat = new THREE.MeshStandardMaterial({
      map: psuLabelTex,
      roughness: 0.42,
      metalness: 0.1
    });
    const psuBoxMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.26,
      metalness: 0.9,
      bumpMap: metalBump,
      bumpScale: 0.012
    });
    const psuMesh = new THREE.Mesh(psuGeo, [
      psuBoxMat, psuBoxMat, psuLabelMat, psuBoxMat, psuBoxMat, psuBoxMat
    ]);
    psuMesh.castShadow = true;
    psuGroup.add(psuMesh);

    const fanRingGeo = new THREE.RingGeometry(0.18, 0.42, 32);
    const fanRingMesh = new THREE.Mesh(fanRingGeo, blackPlasticMat);
    fanRingMesh.rotation.y = Math.PI;
    fanRingMesh.position.set(0, 0, -0.68);
    psuGroup.add(fanRingMesh);

    const iecGeo = new RoundedBoxGeometry(0.32, 0.22, 0.05, 2, 0.02);
    const iecMesh = new THREE.Mesh(iecGeo, blackPlasticMat);
    iecMesh.position.set(0.35, 0.2, -0.68);
    psuGroup.add(iecMesh);

    const voltGeo = new RoundedBoxGeometry(0.16, 0.1, 0.04, 2, 0.01);
    const voltMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    const voltMesh = new THREE.Mesh(voltGeo, voltMat);
    voltMesh.position.set(-0.35, 0.2, -0.68);
    psuGroup.add(voltMesh);

    const grommetGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 20);
    const grommetMesh = new THREE.Mesh(grommetGeo, blackPlasticMat);
    grommetMesh.position.set(-0.45, -0.28, 0.68);
    psuGroup.add(grommetMesh);

    psuGroup.position.set(1.35, -0.15, -1.15);
    tagInteractive(psuGroup, "psu_harness");
    chassisGroup.add(psuGroup);

    // 10. PLACA-MAE BABY-AT (1994) HISTORICAMENTE FIEL (LAYOUT ZERO-COLISOES)
    const moboTex = createMotherboardTexture();
    const moboMat = new THREE.MeshStandardMaterial({
      map: moboTex,
      bumpMap: pcbBump,
      bumpScale: 0.025,
      roughness: 0.38,
      metalness: 0.15
    });
    // Placa-mae Baby-AT: 220mm (W=2.40) x 280mm (D=3.05) x 0.04
    const moboGeo = new RoundedBoxGeometry(2.40, 0.04, 3.05, 2, 0.015);
    const moboMesh = new THREE.Mesh(moboGeo, moboMat);
    moboMesh.position.set(-0.65, -0.58, -0.11);
    moboMesh.receiveShadow = true;
    chassisGroup.add(moboMesh);

    // Parafusos de fixacao da placa com arruelas vermelhas isolantes
    const screwGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 14);
    const washerGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.015, 14);
    const washerMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });

    const screwPositions: [number, number][] = [
      [-1.72, -1.25], [0.44, -1.47], [-1.72, -0.11], [-1.74, 1.34], [0.44, 1.34]
    ];
    screwPositions.forEach(([sx, sz]) => {
      const washer = new THREE.Mesh(washerGeo, washerMat);
      washer.position.set(sx, -0.55, sz);
      chassisGroup.add(washer);

      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.position.set(sx, -0.535, sz);
      chassisGroup.add(screw);
    });

    // 10.05 Conector DIN-5 do Teclado no vertice traseiro esquerdo da placa Baby-AT
    const din5BarrelGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.16, 20);
    const din5Barrel = new THREE.Mesh(din5BarrelGeo, chromeMat);
    din5Barrel.rotation.x = Math.PI / 2;
    din5Barrel.position.set(-1.719, -0.44, -1.570);
    din5Barrel.castShadow = true;
    chassisGroup.add(din5Barrel);

    const din5PinShieldGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
    const din5PinShield = new THREE.Mesh(din5PinShieldGeo, blackPlasticMat);
    din5PinShield.rotation.x = Math.PI / 2;
    din5PinShield.position.set(-1.719, -0.44, -1.660);
    chassisGroup.add(din5PinShield);

    // 10.1 Slots de Expansao Hibridos: 7 Slots (Slots 1 e 2 VLB 32-bit; Slots 3 a 7 ISA 16/8-bit)
    const slotXPositions = [-1.545, -1.354, -1.163, -0.972, -0.781, -0.590, -0.399];
    const isaSlotBodyGeo = new RoundedBoxGeometry(0.11, 0.22, 1.30, 2, 0.015);
    const isaSlotGoldGeo = new THREE.BoxGeometry(0.03, 0.05, 1.24);
    const isa8SlotBodyGeo = new RoundedBoxGeometry(0.11, 0.22, 1.00, 2, 0.015);
    const isa8SlotGoldGeo = new THREE.BoxGeometry(0.03, 0.05, 0.94);
    const vlbExtGeo = new RoundedBoxGeometry(0.11, 0.22, 0.50, 2, 0.015);
    const vlbGoldGeo = new THREE.BoxGeometry(0.03, 0.05, 0.44);

    slotXPositions.forEach((sx, idx) => {
      // Slot 6 (idx 5) e ISA de 8 bits mais curto
      if (idx === 5) {
        const isa8Mesh = new THREE.Mesh(isa8SlotBodyGeo, blackPlasticMat);
        isa8Mesh.position.set(sx, -0.45, -0.818);
        isa8Mesh.castShadow = true;
        tagInteractive(isa8Mesh, "vlb");
        chassisGroup.add(isa8Mesh);

        const gold8 = new THREE.Mesh(isa8SlotGoldGeo, goldMat);
        gold8.position.set(sx, -0.33, -0.818);
        tagInteractive(gold8, "vlb");
        chassisGroup.add(gold8);
      } else {
        const isaMesh = new THREE.Mesh(isaSlotBodyGeo, blackPlasticMat);
        isaMesh.position.set(sx, -0.45, -0.682);
        isaMesh.castShadow = true;
        tagInteractive(isaMesh, "vlb");
        chassisGroup.add(isaMesh);

        const gold = new THREE.Mesh(isaSlotGoldGeo, goldMat);
        gold.position.set(sx, -0.33, -0.682);
        tagInteractive(gold, "vlb");
        chassisGroup.add(gold);
      }

      // Slots 1 e 2 possuem extensao VLB marrom de 112 pinos na ponta frontal
      if (idx < 2) {
        const vlbMesh = new THREE.Mesh(vlbExtGeo, vlbBrownMat);
        vlbMesh.position.set(sx, -0.45, 0.270);
        vlbMesh.castShadow = true;
        tagInteractive(vlbMesh, "vlb");
        chassisGroup.add(vlbMesh);

        const vlbGold = new THREE.Mesh(vlbGoldGeo, goldMat);
        vlbGold.position.set(sx, -0.33, 0.270);
        tagInteractive(vlbGold, "vlb");
        chassisGroup.add(vlbGold);
      }
    });

    // 10.2 Placa de Video VLB 32-bit (Tseng ET4000) Perfeitamente Encaixada no Slot 2
    const vlbCardGroup = new THREE.Group();
    vlbCardGroupRef.current = vlbCardGroup;

    // Espelho metalico traseiro preso firmemente a chapa do chassi (Z = -1.87)
    const vgaBracketGeo = new RoundedBoxGeometry(0.02, 0.58, 0.12, 2, 0.005);
    const vgaBracketMesh = new THREE.Mesh(vgaBracketGeo, chromeMat);
    vgaBracketMesh.position.set(-1.354, -0.22, -1.87);
    vgaBracketMesh.castShadow = true;
    vlbCardGroup.add(vgaBracketMesh);

    // Parafuso de fixacao superior do espelho no chassi
    const vgaBracketScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), screwMat);
    vgaBracketScrew.rotation.x = Math.PI / 2;
    vgaBracketScrew.position.set(-1.354, 0.09, -1.87);
    vlbCardGroup.add(vgaBracketScrew);

    // Moldura trapezoidal metalica externa da saida DB-15 VGA
    const vgaShellGeo = new RoundedBoxGeometry(0.05, 0.095, 0.18, 2, 0.005);
    const vgaShell = new THREE.Mesh(vgaShellGeo, chromeMat);
    vgaShell.position.set(-1.354, -0.22, -1.895);
    vlbCardGroup.add(vgaShell);

    // Conector azul celeste VGA DB-15 visivel na traseira
    const vgaPortGeo = new RoundedBoxGeometry(0.045, 0.085, 0.16, 2, 0.008);
    const vgaPortMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.45 });
    const vgaPortMesh = new THREE.Mesh(vgaPortGeo, vgaPortMat);
    vgaPortMesh.position.set(-1.354, -0.22, -1.905);
    vlbCardGroup.add(vgaPortMesh);

    // Porcas sextavadas de fixacao do cabo VGA nas laterais da porta
    const standoffGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 6);
    const standoffMat = chromeMat;
    const nutLeft = new THREE.Mesh(standoffGeo, standoffMat);
    nutLeft.rotation.x = Math.PI / 2;
    nutLeft.position.set(-1.305, -0.22, -1.905);
    vlbCardGroup.add(nutLeft);

    const nutRight = nutLeft.clone();
    nutRight.position.set(-1.403, -0.22, -1.905);
    vlbCardGroup.add(nutRight);

    // Plugue azul de cabo VGA (Macho DB-15) conectado na saida de video
    const vgaPlugGeo = new RoundedBoxGeometry(0.06, 0.10, 0.14, 2, 0.01);
    const vgaPlugMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.40 });
    const vgaPlug = new THREE.Mesh(vgaPlugGeo, vgaPlugMat);
    vgaPlug.position.set(-1.354, -0.22, -1.98);
    vlbCardGroup.add(vgaPlug);

    // Parafusos manuais de aperto com cabeca azul estriada do conector VGA
    const thumbScrewGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 12);
    const thumbLeft = new THREE.Mesh(thumbScrewGeo, darkMetalMat);
    thumbLeft.rotation.x = Math.PI / 2;
    thumbLeft.position.set(-1.305, -0.22, -1.98);
    vlbCardGroup.add(thumbLeft);

    const thumbRight = thumbLeft.clone();
    thumbRight.position.set(-1.403, -0.22, -1.98);
    vlbCardGroup.add(thumbRight);

    // Cabo de video grosso emborrachado ligando a saida da placa ao monitor CRT
    const vgaCableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.354, -0.22, -2.06),
      new THREE.Vector3(-1.45, 0.20, -2.00),
      new THREE.Vector3(-1.10, 0.90, -1.90),
      new THREE.Vector3(-0.45, 1.40, -1.85),
      new THREE.Vector3(0.0, 1.65, -1.80)
    ]);
    const vgaCableGeo = new THREE.TubeGeometry(vgaCableCurve, 28, 0.022, 10, false);
    const vgaCableMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const vgaCableMesh = new THREE.Mesh(vgaCableGeo, vgaCableMat);
    vgaCableMesh.castShadow = true;
    vlbCardGroup.add(vgaCableMesh);

    // 1. Corpo principal superior do PCB (repousa apoiado na face superior dos slots em Y = -0.34)
    // Altura esguia de 0.22 (de Y = -0.34 ate Y = -0.12), mantendo o perfil fiel e elegante
    const vgaPcbMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.38,
      metalness: 0.2,
      bumpMap: pcbBump,
      bumpScale: 0.015
    });
    const vgaMainPcbGeo = new RoundedBoxGeometry(0.025, 0.22, 2.33, 2, 0.006);
    const vgaMainPcbMesh = new THREE.Mesh(vgaMainPcbGeo, vgaPcbMat);
    vgaMainPcbMesh.position.set(-1.354, -0.23, -0.685);
    vgaMainPcbMesh.castShadow = true;
    vlbCardGroup.add(vgaMainPcbMesh);

    // 2. Linguetas de contato douradas que penetram EXATAMENTE dentro dos conectores (Edge Connectors)
    // Abaixo de Y = -0.34, apenas as linguetas de encaixe descem para os slots (altura 0.13, Y = -0.405)
    // Secao A: Lingueta ISA 8-bit (encaixa perfeitamente dentro da cavidade ISA 8-bit de Z = -1.30 a -0.70)
    const vgaTabIsa8Geo = new THREE.BoxGeometry(0.024, 0.13, 0.60);
    const vgaTabIsa8 = new THREE.Mesh(vgaTabIsa8Geo, goldMat);
    vgaTabIsa8.position.set(-1.354, -0.405, -1.000);
    vlbCardGroup.add(vgaTabIsa8);

    // Secao B: Lingueta ISA 16-bit (encaixa perfeitamente dentro da cavidade ISA 16-bit de Z = -0.63 a -0.06)
    const vgaTabIsa16Geo = new THREE.BoxGeometry(0.024, 0.13, 0.57);
    const vgaTabIsa16 = new THREE.Mesh(vgaTabIsa16Geo, goldMat);
    vgaTabIsa16.position.set(-1.354, -0.405, -0.345);
    vlbCardGroup.add(vgaTabIsa16);

    // Secao C: Lingueta VLB 32-bit (encaixa perfeitamente dentro da extensao marrom VLB de Z = 0.03 a 0.46)
    const vgaTabVlbGeo = new THREE.BoxGeometry(0.024, 0.13, 0.43);
    const vgaTabVlb = new THREE.Mesh(vgaTabVlbGeo, goldMat);
    vgaTabVlb.position.set(-1.354, -0.405, 0.245);
    vlbCardGroup.add(vgaTabVlb);

    // Observacao mecanica: Entre Z = -1.85 (espelho traseiro) e Z = -1.30 (inicio do slot),
    // ha um recuo livre de 0.55 unidades no qual nao ha material abaixo de Y = -0.34,
    // preservando o ar livre sobre a placa-mae exatamente como nas placas reais da era 486.

    // Processador grafico Tseng Labs ET4000/W32p
    const vgaGpuChip = new THREE.Mesh(
      new RoundedBoxGeometry(0.04, 0.14, 0.14, 2, 0.010),
      darkMetalMat
    );
    vgaGpuChip.position.set(-1.332, -0.25, -0.65);
    vlbCardGroup.add(vgaGpuChip);

    // 4 Chips de memoria de video VRAM SOJ soldados na placa
    for (let vr = 0; vr < 4; vr++) {
      const vram = new THREE.Mesh(
        new RoundedBoxGeometry(0.035, 0.055, 0.11, 2, 0.005),
        blackPlasticMat
      );
      vram.position.set(-1.332, -0.24 - (vr % 2) * 0.08, -0.28 + Math.floor(vr / 2) * 0.15);
      vlbCardGroup.add(vram);
    }

    // Cristal oscilador da placa de video (28.322 MHz)
    const vgaOscGeo = new RoundedBoxGeometry(0.035, 0.05, 0.08, 2, 0.008);
    const vgaOsc = new THREE.Mesh(vgaOscGeo, chromeMat);
    vgaOsc.position.set(-1.332, -0.24, -1.05);
    vlbCardGroup.add(vgaOsc);

    tagInteractive(vlbCardGroup, "gpu");
    chassisGroup.add(vlbCardGroup);

    // 10.3 Quadrante Frontal Esquerdo: BIOS ROM DIP-32 e Modulo Dallas RTC DS12887
    const biosGeo = new RoundedBoxGeometry(0.15, 0.07, 0.32, 2, 0.012);
    const biosLabelTex = createBiosLabelTexture();
    const biosLabelMat = new THREE.MeshStandardMaterial({
      map: biosLabelTex,
      roughness: 0.32,
      metalness: 0.62
    });
    const biosMesh = new THREE.Mesh(biosGeo, [
      blackPlasticMat, blackPlasticMat, biosLabelMat, blackPlasticMat, blackPlasticMat, blackPlasticMat
    ]);
    biosMesh.position.set(-1.632, -0.52, 0.720);
    tagInteractive(biosMesh, "rtc");
    biosMesh.castShadow = true;
    chassisGroup.add(biosMesh);

    const rtcTex = createDallasRtcTexture();
    const rtcMat = new THREE.MeshStandardMaterial({
      map: rtcTex,
      roughness: 0.4,
      metalness: 0.2
    });
    const rtcGeo = new RoundedBoxGeometry(0.17, 0.14, 0.24, 2, 0.015);
    const rtcMesh = new THREE.Mesh(rtcGeo, rtcMat);
    rtcMesh.position.set(-1.632, -0.48, 1.060);
    tagInteractive(rtcMesh, "rtc");
    rtcMesh.castShadow = true;
    chassisGroup.add(rtcMesh);

    // 10.4 Conectores Floppy (34-pin) e Primary IDE (40-pin)
    const fdcHeaderGeo = new RoundedBoxGeometry(0.09, 0.18, 0.30, 2, 0.015);
    const fdcHeaderMesh = new THREE.Mesh(fdcHeaderGeo, blackPlasticMat);
    fdcHeaderMesh.position.set(-1.370, -0.47, 0.720);
    fdcHeaderMesh.castShadow = true;
    chassisGroup.add(fdcHeaderMesh);

    const ideHeaderGeo = new RoundedBoxGeometry(0.09, 0.18, 0.34, 2, 0.015);
    const ideHeaderMesh = new THREE.Mesh(ideHeaderGeo, blackPlasticMat);
    ideHeaderMesh.position.set(-1.370, -0.47, 1.080);
    ideHeaderMesh.castShadow = true;
    chassisGroup.add(ideHeaderMesh);

    // 10.5 Quadrante Traseiro Direito: Chipsets SiS 496/497 e Cristais de Quartzo
    const sis496Tex = createChipsetTexture('SiS 496', 'PCI/VLB HOST');
    const sis496Mat = new THREE.MeshStandardMaterial({
      map: sis496Tex,
      roughness: 0.35,
      metalness: 0.35
    });
    const chip496Geo = new RoundedBoxGeometry(0.28, 0.05, 0.28, 2, 0.012);
    const chip496 = new THREE.Mesh(chip496Geo, sis496Mat);
    chip496.position.set(-0.017, -0.53, -1.145);
    tagInteractive(chip496, "chipset");
    chip496.castShadow = true;
    chassisGroup.add(chip496);

    const leads496 = new THREE.Mesh(
      new RoundedBoxGeometry(0.32, 0.02, 0.32, 1, 0.005),
      chromeMat
    );
    leads496.position.set(-0.017, -0.545, -1.145);
    tagInteractive(leads496, "chipset");
    chassisGroup.add(leads496);

    const osc1Geo = new RoundedBoxGeometry(0.055, 0.10, 0.12, 2, 0.015);
    const osc1Mesh = new THREE.Mesh(osc1Geo, chromeMat);
    osc1Mesh.position.set(0.277, -0.51, -1.145);
    tagInteractive(osc1Mesh, "osc");
    chassisGroup.add(osc1Mesh);

    const sis497Tex = createChipsetTexture('SiS 497', 'ISA/IDE BUS');
    const sis497Mat = new THREE.MeshStandardMaterial({
      map: sis497Tex,
      roughness: 0.35,
      metalness: 0.35
    });
    const chip497Geo = new RoundedBoxGeometry(0.28, 0.05, 0.28, 2, 0.012);
    const chip497 = new THREE.Mesh(chip497Geo, sis497Mat);
    chip497.position.set(-0.017, -0.53, -0.600);
    tagInteractive(chip497, "chipset");
    chip497.castShadow = true;
    chassisGroup.add(chip497);

    const leads497 = new THREE.Mesh(
      new RoundedBoxGeometry(0.32, 0.02, 0.32, 1, 0.005),
      chromeMat
    );
    leads497.position.set(-0.017, -0.545, -0.600);
    tagInteractive(leads497, "chipset");
    chassisGroup.add(leads497);

    const osc2Mesh = new THREE.Mesh(osc1Geo, chromeMat);
    osc2Mesh.position.set(0.277, -0.51, -0.600);
    tagInteractive(osc2Mesh, "osc");
    chassisGroup.add(osc2Mesh);

    // Conector de Alimentacao AT P8/P9 (alinhado com a fonte)
    const p8p9Geo = new RoundedBoxGeometry(0.11, 0.20, 0.50, 2, 0.015);
    const p8p9Mesh = new THREE.Mesh(p8p9Geo, whiteNylonMat);
    p8p9Mesh.position.set(0.277, -0.46, -0.132);
    tagInteractive(p8p9Mesh, "psu_harness");
    p8p9Mesh.castShadow = true;
    chassisGroup.add(p8p9Mesh);

    // 10.6 Centro Longitudinal: Matriz de Cache L2 SRAM (256 KB) e TAG RAM
    const sramTex = createSramTexture();
    const sramMat = new THREE.MeshStandardMaterial({
      map: sramTex,
      roughness: 0.4,
      metalness: 0.3
    });
    const sramGeo = new RoundedBoxGeometry(0.12, 0.045, 0.15, 2, 0.005);

    for (let c = 0; c < 8; c++) {
      const col = c % 4;
      const row = Math.floor(c / 4);
      const cx = -1.05 + col * 0.14;
      const cz = 0.07 + row * 0.19;

      const sock = new THREE.Mesh(
        new RoundedBoxGeometry(0.13, 0.03, 0.15, 1, 0.004),
        blackPlasticMat
      );
      sock.position.set(cx, -0.545, cz);
      chassisGroup.add(sock);

      const chip = new THREE.Mesh(sramGeo, sramMat);
      chip.position.set(cx, -0.515, cz);
      tagInteractive(chip, "cache_l2");
      chip.castShadow = true;
      chassisGroup.add(chip);
    }

    const tagRam = new THREE.Mesh(
      new RoundedBoxGeometry(0.10, 0.045, 0.30, 2, 0.006),
      sramMat
    );
    tagRam.position.set(-0.377, -0.515, 0.165);
    tagInteractive(tagRam, "cache_l2");
    tagRam.castShadow = true;
    chassisGroup.add(tagRam);

    // 10.7 Centro Frontal: Socket 3 ZIF e Processador i486DX2 com Dissipador
    const cpuAssembly = new THREE.Group();

    const zifGeo = new RoundedBoxGeometry(0.60, 0.08, 0.60, 3, 0.02);
    const zifMat = new THREE.MeshStandardMaterial({
      color: 0xd6cbb8,
      roughness: 0.68,
      bumpMap: plasticBump,
      bumpScale: 0.004
    });
    const zifMesh = new THREE.Mesh(zifGeo, zifMat);
    zifMesh.position.set(0, 0.04, 0);
    zifMesh.receiveShadow = true;
    cpuAssembly.add(zifMesh);

    const leverGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.54, 12);
    const leverMesh = new THREE.Mesh(leverGeo, chromeMat);
    leverMesh.rotation.x = Math.PI / 2;
    leverMesh.position.set(0.32, 0.06, 0);
    cpuAssembly.add(leverMesh);

    const cpuTex = createCpuTexture();
    const cpuMat = new THREE.MeshStandardMaterial({
      map: cpuTex,
      roughness: 0.3,
      metalness: 0.45
    });
    const cpuGeo = new RoundedBoxGeometry(0.50, 0.04, 0.50, 2, 0.01);
    const cpuMesh = new THREE.Mesh(cpuGeo, [cpuMat, cpuMat, cpuMat, cpuMat, cpuMat, cpuMat]);
    cpuMesh.position.set(0, 0.10, 0);
    cpuMesh.castShadow = true;
    cpuAssembly.add(cpuMesh);

    const heatsinkBaseGeo = new RoundedBoxGeometry(0.50, 0.06, 0.50, 3, 0.015);
    const heatsinkMat = new THREE.MeshStandardMaterial({
      color: 0x1e2229,
      roughness: 0.32,
      metalness: 0.76,
      bumpMap: metalBump,
      bumpScale: 0.008
    });
    const heatsinkBase = new THREE.Mesh(heatsinkBaseGeo, heatsinkMat);
    heatsinkBase.position.set(0, 0.15, 0);
    heatsinkBase.castShadow = true;
    cpuAssembly.add(heatsinkBase);

    const finGeo = new RoundedBoxGeometry(0.02, 0.22, 0.48, 2, 0.005);
    for (let f = 0; f < 12; f++) {
      const fx = -0.22 + f * 0.040;
      const finMesh = new THREE.Mesh(finGeo, heatsinkMat);
      finMesh.position.set(fx, 0.28, 0);
      finMesh.castShadow = true;
      cpuAssembly.add(finMesh);
    }

    const clipGeo = new RoundedBoxGeometry(0.55, 0.03, 0.08, 2, 0.008);
    const clipMesh = new THREE.Mesh(clipGeo, chromeMat);
    clipMesh.position.set(0, 0.19, 0);
    cpuAssembly.add(clipMesh);

    cpuAssembly.position.set(-0.814, -0.56, 0.783);
    chassisGroup.add(cpuAssembly);

    // Barra de pinos do painel frontal na borda inferior
    const frontPanelHeader = new THREE.Mesh(
      new RoundedBoxGeometry(0.34, 0.08, 0.06, 1, 0.005),
      blackPlasticMat
    );
    frontPanelHeader.position.set(-0.814, -0.52, 1.284);
    chassisGroup.add(frontPanelHeader);

    // 10.8 Quadrante Frontal Direito: Regulador TO-220 e Bancos SIMM-72
    const to220Geo = new RoundedBoxGeometry(0.12, 0.16, 0.04, 1, 0.005);
    const to220Mesh = new THREE.Mesh(to220Geo, blackPlasticMat);
    to220Mesh.position.set(-0.345, -0.48, 0.761);
    chassisGroup.add(to220Mesh);

    const to220TabGeo = new THREE.PlaneGeometry(0.10, 0.06);
    const to220Tab = new THREE.Mesh(to220TabGeo, chromeMat);
    to220Tab.position.set(-0.345, -0.38, 0.761);
    chassisGroup.add(to220Tab);

    const to220SinkGeo = new RoundedBoxGeometry(0.15, 0.22, 0.10, 2, 0.008);
    const to220Sink = new THREE.Mesh(to220SinkGeo, darkMetalMat);
    to220Sink.position.set(-0.345, -0.45, 0.690);
    to220Sink.castShadow = true;
    chassisGroup.add(to220Sink);

    // 4x Bancos de Memoria SIMM-72
    const simmPcbGeo = new RoundedBoxGeometry(0.44, 0.20, 0.025, 2, 0.005);
    const simmPcbMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.38,
      metalness: 0.2
    });
    const chipSojGeo = new RoundedBoxGeometry(0.08, 0.10, 0.035, 2, 0.006);

    for (let b = 0; b < 4; b++) {
      const bz = 0.48 + b * 0.15;
      const simmGroup = new THREE.Group();

      const pcb = new THREE.Mesh(simmPcbGeo, simmPcbMat);
      pcb.castShadow = true;
      simmGroup.add(pcb);

      for (let m = 0; m < 3; m++) {
        const chip = new THREE.Mesh(chipSojGeo, darkMetalMat);
        chip.position.set(-0.13 + m * 0.13, 0, 0.02);
        simmGroup.add(chip);
      }

      const latchGeo = new RoundedBoxGeometry(0.04, 0.22, 0.04, 2, 0.008);
      const latchLeft = new THREE.Mesh(latchGeo, whiteNylonMat);
      latchLeft.position.set(-0.23, 0, 0);
      simmGroup.add(latchLeft);

      const latchRight = latchLeft.clone();
      latchRight.position.set(0.23, 0, 0);
      simmGroup.add(latchRight);

      simmGroup.position.set(0.114, -0.45, bz);
      simmGroup.rotation.x = 0.31; // Angulo de ~72 graus com a placa
      tagInteractive(simmGroup, "dram");
      chassisGroup.add(simmGroup);
    }

    // 10.9 Capacitores Eletroliticos e Componentes Discretos
    const capSideMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.35,
      metalness: 0.15
    });
    const capTopTex = createCapacitorTopTexture();
    const capTopMat = new THREE.MeshStandardMaterial({
      map: capTopTex,
      roughness: 0.25,
      metalness: 0.85
    });

    const makeCapacitor = (r: number, h: number, x: number, z: number) => {
      const capGroup = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(r, r, h, 16, 1, true);
      const bodyMesh = new THREE.Mesh(bodyGeo, capSideMat);
      bodyMesh.castShadow = true;
      capGroup.add(bodyMesh);

      const topGeo = new THREE.CircleGeometry(r, 16);
      const topMesh = new THREE.Mesh(topGeo, capTopMat);
      topMesh.rotation.x = -Math.PI / 2;
      topMesh.position.y = h / 2 + 0.001;
      capGroup.add(topMesh);

      tagInteractive(capGroup, "caps");
      capGroup.position.set(x, -0.56 + h / 2, z);
      chassisGroup.add(capGroup);
    };

    // 4 capacitores de desacoplamento VRM na folga entre o Cache L2 e o Socket 3
    for (let c = 0; c < 4; c++) {
      makeCapacitor(0.04, 0.16, -1.02 + c * 0.14, 0.39);
    }
    // Capacitores de filtragem do barramento ISA e chipset (posicoes livres de colisao)
    makeCapacitor(0.05, 0.20, 0.25, -1.35);
    makeCapacitor(0.05, 0.20, 0.30, -1.35);
    makeCapacitor(0.04, 0.16, 0.42, 0.35);

    // Jumpers de configuracao do clock FSB
    const makeJumper = (x: number, z: number, mat: THREE.Material) => {
      const pinBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.06), blackPlasticMat);
      pinBase.position.set(x, -0.53, z);
      chassisGroup.add(pinBase);

      const cap = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.07, 0.04, 1, 0.005), mat);
      cap.position.set(x, -0.50, z);
      chassisGroup.add(cap);
    };
    makeJumper(0.18, -0.85, redPlasticMat);
    makeJumper(0.24, -0.85, jumperBlueMat);
    makeJumper(0.18, -0.75, jumperYellowMat);

    // 11. UNIDADE DE DISCO RIGIDO 3.5" IDE
    const hddGroup = new THREE.Group();
    const hddTex = createHddTexture();
    const hddTopMat = new THREE.MeshStandardMaterial({
      map: hddTex,
      roughness: 0.3,
      metalness: 0.82
    });
    const hddBodyGeo = new RoundedBoxGeometry(1.05, 0.26, 1.35, 3, 0.03);
    const hddMesh = new THREE.Mesh(hddBodyGeo, [
      darkMetalMat, darkMetalMat, hddTopMat, darkMetalMat, darkMetalMat, darkMetalMat
    ]);
    hddMesh.castShadow = true;
    hddGroup.add(hddMesh);

    const hddIdePort = new THREE.Mesh(
      new RoundedBoxGeometry(0.55, 0.15, 0.08, 2, 0.01),
      blackPlasticMat
    );
    hddIdePort.position.set(-0.15, -0.04, -0.7);
    hddGroup.add(hddIdePort);

    const hddMolexPort = new THREE.Mesh(
      new RoundedBoxGeometry(0.28, 0.15, 0.08, 2, 0.01),
      whiteNylonMat
    );
    hddMolexPort.position.set(0.28, -0.04, -0.7);
    hddGroup.add(hddMolexPort);

    hddGroup.position.set(1.35, -0.48, 0.65);
    tagInteractive(hddGroup, "hdd");
    chassisGroup.add(hddGroup);

    // 12. CABO FLAT IDE 40-VIAS E CHICOTE DA FONTE
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.78,
      metalness: 0.06,
      side: THREE.DoubleSide
    });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.58, side: THREE.DoubleSide });

    // Conector femea de 40 pinos plugado no conector IDE primario da placa-mae
    const ideMoboPlug = new THREE.Mesh(
      new RoundedBoxGeometry(0.10, 0.07, 0.36, 2, 0.008),
      blackPlasticMat
    );
    ideMoboPlug.position.set(-1.370, -0.345, 1.080);
    tagInteractive(ideMoboPlug, "ide_cable");
    ideMoboPlug.castShadow = true;
    chassisGroup.add(ideMoboPlug);

    // Segmento 1: Sai do conector na placa (elevado) e desce em curva para a canaleta frontal
    const ribbonSeg1 = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.44), ribbonMat);
    ribbonSeg1.rotation.x = -Math.PI / 2.2;
    ribbonSeg1.position.set(-1.370, -0.40, 1.30);
    tagInteractive(ribbonSeg1, "ide_cable");
    chassisGroup.add(ribbonSeg1);

    const stripe1 = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.44), stripeMat);
    stripe1.rotation.x = -Math.PI / 2.2;
    stripe1.position.set(-1.465, -0.398, 1.30);
    chassisGroup.add(stripe1);

    // Segmento 2: Percorre a canaleta frontal livre em Z = 1.52 (fora dos limites da placa)
    const ribbonSeg2 = new THREE.Mesh(new THREE.PlaneGeometry(2.06, 0.22), ribbonMat);
    ribbonSeg2.rotation.x = -Math.PI / 2;
    ribbonSeg2.position.set(-0.340, -0.48, 1.52);
    chassisGroup.add(ribbonSeg2);

    const stripe2 = new THREE.Mesh(new THREE.PlaneGeometry(2.06, 0.03), stripeMat);
    stripe2.rotation.x = -Math.PI / 2;
    stripe2.position.set(-0.340, -0.478, 1.425);
    chassisGroup.add(stripe2);

    // Segmento 3: Percorre a canaleta longitudinal desimpedida entre a placa e o HDD (X = 0.69)
    const ribbonSeg3 = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1.57), ribbonMat);
    ribbonSeg3.rotation.x = -Math.PI / 2;
    ribbonSeg3.position.set(0.69, -0.48, 0.735);
    chassisGroup.add(ribbonSeg3);

    const stripe3 = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 1.57), stripeMat);
    stripe3.rotation.x = -Math.PI / 2;
    stripe3.position.set(0.595, -0.478, 0.735);
    chassisGroup.add(stripe3);

    // Segmento 4: Curva e entrada na porta traseira do disco rigido (Z = -0.05)
    const ribbonSeg4 = new THREE.Mesh(new THREE.PlaneGeometry(0.51, 0.22), ribbonMat);
    ribbonSeg4.rotation.x = -Math.PI / 2;
    ribbonSeg4.position.set(0.945, -0.48, -0.05);
    tagInteractive(ribbonSeg4, "ide_cable");
    chassisGroup.add(ribbonSeg4);

    const stripe4 = new THREE.Mesh(new THREE.PlaneGeometry(0.51, 0.03), stripeMat);
    stripe4.rotation.x = -Math.PI / 2;
    stripe4.position.set(0.945, -0.478, -0.145);
    chassisGroup.add(stripe4);

    // Conector femea de 40 pinos plugado na traseira do disco rigido
    const ideHddPlug = new THREE.Mesh(
      new RoundedBoxGeometry(0.10, 0.07, 0.36, 2, 0.008),
      blackPlasticMat
    );
    ideHddPlug.position.set(1.20, -0.52, -0.05);
    tagInteractive(ideHddPlug, "ide_cable");
    ideHddPlug.castShadow = true;
    chassisGroup.add(ideHddPlug);

    // Chicote AT P8/P9 com cabos de terra pretos no centro
    const wireColors = [0xdc2626, 0xeab308, 0x18181b, 0x18181b, 0x2563eb, 0xf97316];
    wireColors.forEach((color, idx) => {
      const zOff = -0.18 + idx * 0.07;
      const wireCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.90, -0.43, -0.47),
        new THREE.Vector3(0.60, -0.38, -0.32 + zOff * 0.5),
        new THREE.Vector3(0.277, -0.45, -0.132 + zOff)
      ]);
      const wireGeo = new THREE.TubeGeometry(wireCurve, 20, 0.014, 8, false);
      const wMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
      const wMesh = new THREE.Mesh(wireGeo, wMat);
      tagInteractive(wMesh, "psu_harness");
      chassisGroup.add(wMesh);
    });

    // 13. TAMPA SUPERIOR DO GABINETE
    const topLidGeo = new RoundedBoxGeometry(4.28, 1.18, 3.84, 4, 0.07);
    const topLidMesh = new THREE.Mesh(topLidGeo, [
      darkBeigeMat, darkBeigeMat, beigeMat, darkBeigeMat, beigeMat, darkBeigeMat
    ]);
    topLidMesh.position.set(0, 0.28, -0.02);
    topLidMesh.castShadow = true;
    topLidMeshRef.current = topLidMesh;
    scene.add(topLidMesh);

    // 14. MONITOR CRT 3D
    const monitorGroup = new THREE.Group();
    monitorGroupRef.current = monitorGroup;

    const pedBaseGeo = new RoundedBoxGeometry(1.6, 0.12, 1.5, 3, 0.04);
    const pedBase = new THREE.Mesh(pedBaseGeo, darkBeigeMat);
    pedBase.position.set(0, 0.92, 0);
    pedBase.castShadow = true;
    monitorGroup.add(pedBase);

    const pedNeckGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.22, 24);
    const pedNeck = new THREE.Mesh(pedNeckGeo, darkBeigeMat);
    pedNeck.position.set(0, 1.05, 0);
    pedNeck.castShadow = true;
    monitorGroup.add(pedNeck);

    const monitorBezelGeo = new RoundedBoxGeometry(3.4, 2.65, 0.48, 4, 0.1);
    const monitorBezel = new THREE.Mesh(monitorBezelGeo, beigeMat);
    monitorBezel.position.set(0, 2.38, 0.45);
    monitorBezel.castShadow = true;
    monitorGroup.add(monitorBezel);

    const monitorBackGeo = new RoundedBoxGeometry(3.1, 2.35, 2.4, 4, 0.18);
    const monitorBack = new THREE.Mesh(monitorBackGeo, darkBeigeMat);
    monitorBack.position.set(0, 2.38, -0.75);
    monitorBack.castShadow = true;
    monitorGroup.add(monitorBack);

    const crtTex = createCRTTexture(0, 'EXEC');
    const crtMat = new THREE.MeshPhysicalMaterial({
      map: crtTex,
      roughness: 0.14,
      metalness: 0.1,
      clearcoat: 0.65,
      clearcoatRoughness: 0.1,
      emissive: 0x062810,
      emissiveIntensity: 0.75
    });
    const crtGeo = new RoundedBoxGeometry(2.7, 1.95, 0.14, 4, 0.1);
    const crtMesh = new THREE.Mesh(crtGeo, crtMat);
    crtMesh.position.set(0, 2.4, 0.66);
    monitorGroup.add(crtMesh);

    scene.add(monitorGroup);

    // 15. PARTICULAS SUAVES NO BARRAMENTO DE DADOS (Visiveis no Modo Aberto)
    const particleCount = 48;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      particlePositions[i * 3] = -0.814 + (Math.random() - 0.5) * 0.12;
      particlePositions[i * 3 + 1] = -0.52;
      particlePositions[i * 3 + 2] = 0.20 + t * 0.58;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.07,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const busParticles = new THREE.Points(particleGeo, particleMat);
    busParticlesRef.current = busParticles;
    scene.add(busParticles);
    const databusHitGeo = new THREE.PlaneGeometry(0.36, 0.72);
    const databusHitMat = new THREE.MeshBasicMaterial({ visible: false });
    const databusHitMesh = new THREE.Mesh(databusHitGeo, databusHitMat);
    databusHitMesh.rotation.x = -Math.PI / 2;
    databusHitMesh.position.set(-0.814, -0.53, 0.49);
    tagInteractive(databusHitMesh, "databus");
    chassisGroup.add(databusHitMesh);

    tagInteractive(busParticles, "databus");

    // 16. LOOP DE RENDERIZACAO COM COREOGRAFIA MECANICA EM FASES
    let animationFrameId: number;

    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
    const easeInOutCubic = (x: number) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const targetOpen = modeRef.current === 'open' ? 1.0 : 0.0;
      animOpenProgress.current += (targetOpen - animOpenProgress.current) * 0.075;
      const p = animOpenProgress.current;

      // 1. Monitor CRT: Eleva-se na fase inicial para desobstruir o topo
      const monitorP = easeInOutCubic(Math.min(1.0, Math.max(0.0, p * 1.25)));
      if (monitorGroupRef.current) {
        monitorGroupRef.current.position.y = monitorP * 2.85;
        monitorGroupRef.current.position.z = -monitorP * 0.20;
      }

      // 2. Tampa do Chassi: Desliza para tras nos trilhos e entao levita com leve inclinacao
      const slideP = easeOutCubic(Math.min(1.0, Math.max(0.0, (p - 0.15) / 0.45)));
      const liftP = easeInOutCubic(Math.min(1.0, Math.max(0.0, (p - 0.35) / 0.65)));
      if (topLidMeshRef.current) {
        topLidMeshRef.current.position.z = -0.02 - slideP * 0.55 - liftP * 0.35;
        topLidMeshRef.current.position.y = 0.28 + liftP * 2.45;
        topLidMeshRef.current.rotation.x = liftP * 0.09; // Inclinacao de 5 graus
      }

      // 2.5 Placa de Video VLB: Encaixada firmemente no Slot 2 com conexao de video ativa
      if (vlbCardGroupRef.current) {
        vlbCardGroupRef.current.position.y = 0.0;
      }

      // 3. Luz de bancada interna
      if (chassisLightRef.current) {
        chassisLightRef.current.intensity = 0.1 + liftP * 2.2;
      }

      // 4. Particulas do barramento de dados
      if (busParticlesRef.current) {
        const pos = busParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          pos[i * 3 + 2] -= 0.008;
          if (pos[i * 3 + 2] < 0.20) {
            pos[i * 3 + 2] = 0.78;
          }
        }
        busParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        busParticlesRef.current.visible = p > 0.25;
      }

      // 5. Voo amortecido da camera
      if (isTransitioningCamera.current) {
        camera.position.lerp(targetCamPos.current, 0.065);
        controls.target.lerp(targetLookAt.current, 0.065);

        if (
          camera.position.distanceTo(targetCamPos.current) < 0.01 &&
          controls.target.distanceTo(targetLookAt.current) < 0.01
        ) {
          camera.position.copy(targetCamPos.current);
          controls.target.copy(targetLookAt.current);
          isTransitioningCamera.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
        // 17. RAYCASTER PARA INSPECAO INTERATIVA E VOO DIRETO DE CAMERA AO CLICAR EM PECAS
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.15;
    const mouseCoord = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const getHitComponentId = (e: PointerEvent): string | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseCoord, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (const hit of hits) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur) {
          if (cur.userData && cur.userData.componentId) {
            return cur.userData.componentId as string;
          }
          cur = cur.parent;
        }
      }
      return null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const hitId = getHitComponentId(e);
      container.style.cursor = hitId ? 'pointer' : 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return; // Arraste de orbita ignorado

      const hitId = getHitComponentId(e);
      if (hitId && HARDWARE_DATA[hitId]) {
        setSelectedComponentRef.current(HARDWARE_DATA[hitId]);
        handleFocusRef.current(hitId as FocusTarget);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    window.addEventListener('resize', handleResize);

    return () => {
            renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      pmremGenerator.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* HEADER: 2 MODOS CLAROS */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-ash">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
            <h2 className="font-serif text-2xl font-normal text-off-black border-0 pb-0 mt-0 mb-0">
              Computador Retrô dos Anos 90 (3D)
            </h2>
          </div>
          <p className="text-xs font-mono text-smoke mt-0.5 mb-0">
            Baby-AT 1994 · Painel Frontal Volumetrico · Slots VLB 32-bit · Cache L2 SRAM · Chipset SiS
          </p>
        </div>

        {/* SELETOR DE MODOS E FOCO DE INSPECAO */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-parchment p-1 rounded-full border border-ash">
            <button
              type="button"
              onClick={() => switchMode('closed')}
              className={`px-4 py-2 min-h-[44px] rounded-full text-xs font-mono transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                mode === 'closed'
                  ? 'bg-off-black text-white font-medium shadow-sm'
                  : 'text-graphite hover:text-off-black'
              }`}
            >
              <HugeiconsIcon icon={ComputerIcon} className="h-4 w-4" />
              Computador Montado (Normal)
            </button>

            <button
              type="button"
              onClick={() => switchMode('open')}
              className={`px-4 py-2 min-h-[44px] rounded-full text-xs font-mono transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                mode === 'open'
                  ? 'bg-off-black text-white font-medium shadow-sm'
                  : 'text-graphite hover:text-off-black'
              }`}
            >
              <HugeiconsIcon icon={Layers01Icon} className="h-4 w-4" />
              Interior Aberto (Engenharia)
            </button>
          </div>

          {/* ATALHOS DE FOCO CENTRALIZADO NO MODO ABERTO */}
          {mode === 'open' && (
            <div className="flex items-center gap-1 bg-parchment p-1 rounded-full border border-ash">
              {[
                { id: 'overview', label: 'Placa Inteira' },
                { id: 'cpu', label: 'CPU 486' },
                { id: 'gpu', label: 'Placa de Video' },
                { id: 'dram', label: 'Bancos RAM' },
                { id: 'vlb', label: 'Slots VLB' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    if (HARDWARE_DATA[f.id]) {
                      setSelectedComponent(HARDWARE_DATA[f.id]);
                    }
                    handleFocus(f.id as FocusTarget);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-mono transition-all ${
                    activeFocus === f.id
                      ? 'bg-off-black text-white font-medium shadow-xs'
                      : 'text-graphite hover:text-off-black'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Botoes Diretos de Zoom na UI */}
          <div className="flex items-center gap-1 bg-parchment border border-ash rounded-full p-1">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full hover:bg-white text-graphite hover:text-off-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
              title="Aproximar Zoom"
              aria-label="Aproximar Zoom"
            >
              <HugeiconsIcon icon={ZoomInIcon} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full hover:bg-white text-graphite hover:text-off-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
              title="Afastar Zoom"
              aria-label="Afastar Zoom"
            >
              <HugeiconsIcon icon={ZoomOutIcon} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleResetCamera}
              className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full hover:bg-white text-smoke hover:text-off-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
              title="Redefinir Camera"
              aria-label="Redefinir Camera"
            >
              <HugeiconsIcon icon={RotateCcwIcon} className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEWPORT THREE.JS PRINCIPAL */}
      <div className="relative w-full h-[580px] rounded-3xl overflow-hidden border border-ash bg-gradient-to-b from-[#0a0d12] to-[#12161f] shadow-inner">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* INDICADOR DE STATUS DO MODO */}
        <div className="absolute bottom-6 left-6 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-ash/80 shadow-lg font-mono">
          <div className="flex items-center gap-2 text-xs text-off-black font-medium">
            <span className="h-2 w-2 rounded-full bg-lake-blue" />
            <span>
              {mode === 'open'
                ? 'Gabinete Aberto: Inspecao interna ativada'
                : 'Gabinete Fechado: Estacao de trabalho 1994'}
            </span>
          </div>
          <div className="text-[10px] text-smoke mt-0.5">
            {mode === 'open'
              ? 'Placa-mae Baby-AT 486, slots VLB/ISA, cache L2 SRAM e chipsets SiS'
              : 'Monitor CRT de 14" e gabinete desktop fechado com painel frontal 3D'}
          </div>
        </div>

        {/* DICAS DE CONTROLE ORBITAL */}
        <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-mono text-white/90 border border-white/10">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Roda do mouse: Zoom · Botao esquerdo: Girar 360° · Botao direito: Pan
        </div>
      </div>

      {/* SELETOR DE INSPECAO DE COMPONENTES INTERNOS */}
      <div className="p-4 md:p-6 rounded-2xl bg-white border border-ash">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={InfoIcon} className="h-4 w-4 text-lake-blue" />
            <h3 className="font-serif text-lg font-normal text-off-black border-0 pb-0 mt-0 mb-0">
              Inspecao Didatica de Hardware (Clique na peca para voar ate ela)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-smoke">
            Dica: clique em qualquer peca no modelo 3D acima ou nos botoes abaixo
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'cpu', label: 'CPU i486' },
            { id: 'gpu', label: 'Placa de Video VLB' },
            { id: 'dram', label: 'Memorias RAM' },
            { id: 'cache_l2', label: 'Cache L2 SRAM' },
            { id: 'vlb', label: 'Slots VLB/ISA' },
            { id: 'chipset', label: 'Chipset SiS' },
            { id: 'rtc', label: 'Relogio RTC Dallas' },
            { id: 'ide_cable', label: 'Cabo Flat IDE' },
            { id: 'psu_harness', label: 'Fonte & Chicote' },
            { id: 'hdd', label: 'Disco Rigido 3.5"' },
            { id: 'caps', label: 'Capacitores' },
            { id: 'databus', label: 'Trilhas de Dados' },
            { id: 'osc', label: 'Cristal 66 MHz' },
            { id: 'front_panel', label: 'Painel Frontal 3D' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedComponent(HARDWARE_DATA[item.id]);
                handleFocus(item.id as FocusTarget);
              }}
              className={`px-3.5 py-2 min-h-[44px] inline-flex items-center rounded-full text-xs font-mono border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                selectedComponent.id === item.id
                  ? 'bg-off-black text-white border-off-black shadow-sm'
                  : 'bg-parchment text-graphite border-ash hover:border-off-black hover:text-off-black'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CARD DO COMPONENTE SELECIONADO: HISTORIA, FABRICANTE E CAPACIDADE REAL */}
        <div className="p-5 md:p-6 rounded-2xl bg-parchment border border-ash/80 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ash/60 pb-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lake-blue/10 text-lake-blue text-xs font-mono font-medium border border-lake-blue/20">
                <span className="h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
                {selectedComponent.category}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white border border-ash text-xs font-mono text-graphite font-medium">
                Fabricante: {selectedComponent.manufacturer}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-ash text-[11px] font-mono text-lake-blue font-medium">
              {selectedComponent.voltage}
            </span>
          </div>

          <h4 className="font-serif text-xl text-off-black mb-1.5 font-medium border-0 pb-0 mt-0">
            {selectedComponent.name}
          </h4>

          <div className="text-xs font-mono text-lake-blue font-medium mb-3">
            {selectedComponent.historicContext}
          </div>

          <p className="text-sm text-graphite leading-relaxed mb-4 font-sans">
            {selectedComponent.description}
          </p>

          <div className="pt-3 border-t border-ash/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-smoke">
            <div>
              <strong className="text-off-black font-medium">Ficha Tecnica:</strong>{' '}
              {selectedComponent.specs}
            </div>
            <div className="text-[11px] text-lake-blue font-medium">
              Foco 3D Ativo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
