import * as THREE from 'three';

/**
 * Cria a textura dinamica da tela do monitor CRT com terminal BIOS de 1994
 */
export function createCRTTexture(tick: number, cyclePhase: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Fundo fosforescente escuro
  ctx.fillStyle = '#061309';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Scanlines de feixe de eletrons
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.fillRect(0, y, canvas.width, 2);
  }

  // Vignette suave nas bordas da tela curva
  const grad = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 4,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 1.5
  );
  grad.addColorStop(0, 'rgba(20, 60, 30, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Texto do Terminal
  ctx.font = 'bold 28px monospace';
  ctx.textBaseline = 'top';

  ctx.fillStyle = '#86efac';
  ctx.fillText('TEACHYOURSELF BIOS v4.06 (1994 SYSTEMS CORP)', 50, 60);

  ctx.fillStyle = '#4ade80';
  ctx.font = '24px monospace';
  ctx.fillText('CPU: Intel 80486DX2 at 66 MHz (Clock Multiplier 2x)', 50, 110);
  ctx.fillText('Memory Test: 16384 KB OK (Fast Page Mode 60ns)', 50, 150);
  ctx.fillText('Bus Architecture: VESA Local Bus 2.0 (32-bit Synchronous)', 50, 190);

  ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 230);
  ctx.lineTo(974, 230);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.fillText('teachyourself:~$ ./executar_hardware_loop --trace-silicon', 50, 260);

  ctx.fillStyle = '#facc15';
  ctx.fillText('> [T1/T2] ADDR: 0x00401050 (Program Counter fetch)', 50, 310);

  ctx.fillStyle = '#67e8f9';
  ctx.fillText('> [T3] DATA_BUS: 0x2A [00101010] (Decimal: 42) transferindo', 50, 360);

  ctx.fillStyle = '#4ade80';
  const cursor = tick % 2 === 0 ? '█' : ' ';
  ctx.fillText(`> [T4] %al = 0x2A gravado no acumulador. Fase: ${cyclePhase} ${cursor}`, 50, 410);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '20px monospace';
  ctx.fillText('Pressione [Espaco] para pausar o tour | [S] passo a passo', 50, 680);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura frontal do gabinete desktop: baias de disquete, botoes, display 7 segmentos
 */
export function createCaseFrontTexture(tick: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base bege
  ctx.fillStyle = '#dcd3c1';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Textura sutil de plastico
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  for (let i = 0; i < 3000; i++) {
    const rx = Math.random() * canvas.width;
    const ry = Math.random() * canvas.height;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Grelhas de ventilacao no lado esquerdo
  ctx.fillStyle = '#5c5243';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(60 + i * 24, 120, 10, 260);
  }

  // PAINEL CENTRAL: Display 7 segmentos LED verde 66 MHz
  ctx.fillStyle = '#101416';
  ctx.fillRect(300, 100, 160, 100);
  ctx.strokeStyle = '#615647';
  ctx.lineWidth = 4;
  ctx.strokeRect(300, 100, 160, 100);

  // Digitos verdes 66
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 70px monospace';
  ctx.fillText('66', 320, 175);
  ctx.font = 'bold 20px monospace';
  ctx.fillText('MHz', 405, 185);

  // Botoes Turbo e Reset
  ctx.fillStyle = '#c7bca9';
  ctx.fillRect(480, 100, 70, 42);
  ctx.strokeRect(480, 100, 70, 42);
  ctx.fillStyle = '#26221c';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('TURBO', 490, 127);

  ctx.fillStyle = '#b8ac97';
  ctx.fillRect(480, 155, 70, 42);
  ctx.strokeRect(480, 155, 70, 42);
  ctx.fillStyle = '#26221c';
  ctx.fillText('RESET', 490, 182);

  // Chave Rocker Vermelha
  ctx.fillStyle = '#1c1916';
  ctx.fillRect(570, 100, 80, 95);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(576, 106, 68, 40);
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(576, 146, 68, 43);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(606, 120, 8, 18);
  ctx.beginPath();
  ctx.arc(610, 168, 8, 0, Math.PI * 2);
  ctx.stroke();

  // LEDs de status (Power, Turbo, HDD)
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(320, 235, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5c5243';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('PWR', 336, 241);

  ctx.fillStyle = tick % 2 === 0 ? '#f97316' : '#7c2d12';
  ctx.beginPath();
  ctx.arc(420, 235, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5c5243';
  ctx.fillText('TURBO', 436, 241);

  ctx.fillStyle = tick % 3 === 0 ? '#ef4444' : '#7f1d1d';
  ctx.beginPath();
  ctx.arc(540, 235, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5c5243';
  ctx.fillText('HDD', 556, 241);

  // Emblema TEACHYOURSELF 486
  ctx.fillStyle = '#e8dfce';
  ctx.fillRect(300, 280, 350, 46);
  ctx.strokeStyle = '#857864';
  ctx.lineWidth = 3;
  ctx.strokeRect(300, 280, 350, 46);
  ctx.fillStyle = '#26221c';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('TEACHYOURSELF', 315, 312);
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('486 DX2', 525, 312);

  // BAIA SUPERIOR 5.25"
  ctx.fillStyle = '#262420';
  ctx.fillRect(680, 80, 300, 110);
  ctx.fillStyle = '#c7bba7';
  ctx.fillRect(688, 88, 284, 94);
  // Fenda do disco
  ctx.fillStyle = '#121314';
  ctx.fillRect(710, 125, 240, 12);
  // Trava giratoria
  ctx.fillStyle = '#38342c';
  ctx.fillRect(800, 142, 50, 30);
  ctx.fillStyle = '#5c5243';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('5.25" 1.2MB', 715, 165);

  // BAIA INFERIOR 3.5"
  ctx.fillStyle = '#262420';
  ctx.fillRect(680, 210, 300, 100);
  ctx.fillStyle = '#c7bba7';
  ctx.fillRect(688, 218, 284, 84);
  // Fenda do disco
  ctx.fillStyle = '#121314';
  ctx.fillRect(710, 245, 240, 10);
  // Botao ejetor
  ctx.fillStyle = '#4a443a';
  ctx.fillRect(900, 260, 48, 26);
  // LED
  ctx.fillStyle = tick % 2 === 0 ? '#22c55e' : '#143d20';
  ctx.beginPath();
  ctx.arc(725, 275, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5c5243';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('3.5" 1.44MB', 740, 280);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura da Placa-Mãe verde com trilhas de cobre, serigrafia técnica e ilhas de solda
 */
export function createMotherboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Substrato verde escuro epoxi FR-4
  ctx.fillStyle = '#0f3319';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Textura sutil de fibra de vidro
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.fillRect(0, y, canvas.width, 2);
  }

  // Funcao auxiliar de conversao milimetrica Baby-AT (220mm x 280mm) para pixels (1024x1024)
  const toPxX = (xMm: number) => 40 + (xMm / 220.0) * 944;
  const toPxY = (yMm: number) => 40 + (yMm / 280.0) * 944;
  const toPxW = (wMm: number) => (wMm / 220.0) * 944;
  const toPxH = (hMm: number) => (hMm / 280.0) * 944;

  // 2. Ilhas de aterramento e planos de alimentacao em cobre escuro
  ctx.fillStyle = '#1b4d27';
  ctx.fillRect(toPxX(5), toPxY(5), toPxW(145), toPxH(150)); // Area dos slots ISA
  ctx.fillRect(toPxX(155), toPxY(20), toPxW(60), toPxH(120)); // Area dos chipsets SiS
  ctx.fillRect(toPxX(50), toPxY(155), toPxW(110), toPxH(115)); // Area do Cache e CPU
  ctx.fillRect(toPxX(160), toPxY(155), toPxW(55), toPxH(115)); // Area das memorias SIMM

  // 3. Trilhas de cobre douradas (Barramentos de Dados, Endereço e Clock)
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
  ctx.lineWidth = 2.0;

  // Barramento CPU para SIMM RAM (linhas paralelas a 45 graus)
  for (let i = 0; i < 18; i++) {
    const yStart = toPxY(210) + i * 8;
    ctx.beginPath();
    ctx.moveTo(toPxX(125), yStart);
    ctx.lineTo(toPxX(145), yStart);
    ctx.lineTo(toPxX(160), yStart - 30);
    ctx.lineTo(toPxX(180), yStart - 30);
    ctx.stroke();

    // Vias metalizadas passantes nas conexoes
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(toPxX(145), yStart, 2.5, 0, Math.PI * 2);
    ctx.arc(toPxX(160), yStart - 30, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Barramento CPU para Slots ISA e VLB (linhas horizontais para os barramentos)
  for (let i = 0; i < 16; i++) {
    const x = toPxX(25) + i * 7;
    ctx.beginPath();
    ctx.moveTo(x, toPxY(30));
    ctx.lineTo(x, toPxY(150));
    ctx.stroke();

    ctx.fillStyle = '#d97706';
    for (let py = toPxY(40); py < toPxY(145); py += 35) {
      ctx.beginPath();
      ctx.arc(x, py, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Contornos de serigrafia branca (Silkscreen tecnico)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.8;

  // Demarcacao dos 7 Slots de Expansao ISA e VLB
  const slotXPositions = [28.0, 45.5, 63.0, 80.5, 98.0, 115.5, 133.0];
  slotXPositions.forEach((sxMm, idx) => {
    const px = toPxX(sxMm - 5.5);
    const py = toPxY(25);
    const pw = toPxW(11.0);
    const ph = toPxH(idx < 2 ? 175.0 : idx === 5 ? 100.0 : 125.0);

    ctx.strokeRect(px, py, pw, ph);
    ctx.font = 'bold 10px monospace';
    if (idx < 2) {
      ctx.fillStyle = '#fde68a';
      ctx.fillText(`SLOT ${idx + 1} VLB/ISA`, px - 4, py + ph + 14);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    } else {
      ctx.fillText(`SLOT ${idx + 1} ISA`, px - 2, py + ph + 14);
    }
  });

  // Demarcacao Chipset SiS 496 Northbridge e SiS 497 Southbridge
  ctx.strokeRect(toPxX(155), toPxY(32), toPxW(26), toPxH(26));
  ctx.font = 'bold 11px monospace';
  ctx.fillText('SiS 85C496', toPxX(156), toPxY(48));

  ctx.strokeRect(toPxX(155), toPxY(82), toPxW(26), toPxH(26));
  ctx.fillText('SiS 85C497', toPxX(156), toPxY(98));

  // Demarcacao Conector de Forca AT P8/P9
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(toPxX(190), toPxY(115), toPxW(10), toPxH(46));
  ctx.font = 'bold 10px monospace';
  ctx.fillText('AT POWER P8/P9', toPxX(155), toPxY(140));

  // Demarcacao da Matriz de Cache L2 (8x SRAM) e TAG RAM (layout desimpedido)
  ctx.strokeRect(toPxX(66), toPxY(154), toPxW(54), toPxH(34));
  ctx.fillText('256KB L2 CACHE SRAM', toPxX(68), toPxY(172));
  ctx.strokeRect(toPxX(128), toPxY(154), toPxW(12), toPxH(32));
  ctx.fillText('TAG', toPxX(126), toPxY(190));

  // Demarcacao do Soquete da CPU (Socket 3 ZIF)
  ctx.strokeRect(toPxX(67), toPxY(194), toPxW(56), toPxH(56));
  ctx.font = 'bold 14px monospace';
  ctx.fillText('SOCKET 3 (PGA-168/237)', toPxX(70), toPxY(215));
  ctx.font = 'bold 12px monospace';
  ctx.fillText('INTEL 80486DX2', toPxX(70), toPxY(235));

  // Demarcacao do Regulador TO-220
  ctx.strokeRect(toPxX(131), toPxY(209), toPxW(14), toPxH(22));
  ctx.font = 'bold 9px monospace';
  ctx.fillText('3.45V VRM', toPxX(128), toPxY(238));

  // Demarcacao dos 4 Bancos de Memoria SIMM-72
  for (let b = 0; b < 4; b++) {
    const byMm = 175 + b * 20;
    ctx.strokeRect(toPxX(160), toPxY(byMm), toPxW(42), toPxH(14));
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`BANK ${b} (SIMM-72)`, toPxX(162), toPxY(byMm) + 10);
  }

  // Demarcacao da BIOS ROM e Dallas RTC no quadrante frontal esquerdo
  ctx.strokeRect(toPxX(13), toPxY(201), toPxW(14), toPxH(30));
  ctx.fillText('BIOS ROM', toPxX(12), toPxY(196));

  ctx.strokeRect(toPxX(12), toPxY(236), toPxW(16), toPxH(23));
  ctx.fillText('DALLAS RTC', toPxX(10), toPxY(265));

  // Demarcacao dos conectores Floppy e Primary IDE
  ctx.strokeRect(toPxX(40), toPxY(202), toPxW(9), toPxH(28));
  ctx.fillText('FDD', toPxX(37), toPxY(197));

  ctx.strokeRect(toPxX(40), toPxY(234), toPxW(9), toPxH(31));
  ctx.fillText('PRI-IDE', toPxX(34), toPxY(272));

  // Aneis de aterramento dos furos de fixacao (Mounting Hole GND Pads)
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2.0;
  const screwHolesMm: [number, number][] = [
    [12, 35], [210, 15], [12, 140], [10, 273], [210, 273]
  ];
  screwHolesMm.forEach(([hx, hy]) => {
    ctx.beginPath();
    ctx.arc(toPxX(hx), toPxY(hy), toPxW(4), 0, Math.PI * 2);
    ctx.stroke();
  });

  // Serigrafia de Titulo e Identificacao da Placa
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('TEACHYOURSELF 486-VL BABY-AT BOARD', toPxX(10), toPxY(15));
  ctx.font = 'bold 11px monospace';
  ctx.fillText('CHIPSET: SiS 85C496/497 · 256KB L2 CACHE · REV 2.4 (1994)', toPxX(100), toPxY(278));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura da CPU i486DX2 em ceramica preta com serigrafia dourada e laser
 */
export function createCpuTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Corpo cerâmico cinza chumbo escuro
  ctx.fillStyle = '#1a1816';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Tampa central niquelada / dourada (Heat Spreader)
  const grad = ctx.createLinearGradient(60, 60, 452, 452);
  grad.addColorStop(0, '#2e271d');
  grad.addColorStop(0.5, '#423725');
  grad.addColorStop(1, '#1e1913');
  ctx.fillStyle = grad;
  ctx.fillRect(50, 50, 412, 412);

  // Moldura dourada usinada
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(50, 50, 412, 412);

  // Triangulo indicador do Pino 1
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(60, 60);
  ctx.lineTo(105, 60);
  ctx.lineTo(60, 105);
  ctx.closePath();
  ctx.fill();

  // 3. Tipografia original Intel 486
  ctx.textAlign = 'center';

  // Logotipo intel
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold italic 38px sans-serif';
  ctx.fillText('intel', 256, 140);

  // Modelo
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 46px monospace';
  ctx.fillText('i486™ DX2', 256, 205);

  // Numero de peca e clock
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('&80486DX2-66', 256, 255);
  ctx.font = '20px monospace';
  ctx.fillText('SX911 / L4230198', 256, 290);
  ctx.fillText('INTEL (C) 1989, 1992', 256, 325);

  // Status didatico do TeachYourself
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('PIPELINE: 5 ESTAGIOS', 256, 380);
  ctx.fillText('REG: %al = 0x2A [42]', 256, 415);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura da tampa de aluminio do Disco Rigido IDE 3.5" de 1994
 */
export function createHddTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Metal usinado de fundo
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Etiqueta branca de especificacoes tecnicas
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(40, 50, 432, 412);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 50, 432, 412);

  // Logotipo do Fabricante
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('SEAGATE MEDALIST™ 420', 60, 95);

  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('MODEL: ST3491A · 428 MB IDE', 60, 130);

  // Tabela de Geometria CHS (Cilindros, Cabecas, Setores)
  ctx.fillStyle = '#334155';
  ctx.font = '16px monospace';
  ctx.fillText('CYLINDERS: 1024  HEADS: 16  SECTORS: 51', 60, 175);
  ctx.fillText('LANDING ZONE: 1024  WPC: 0', 60, 205);
  ctx.fillText('INTERFACE: 40-PIN PATA / 4500 RPM', 60, 235);

  // Diagrama de Jumpers
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(60, 260, 390, 80);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('JUMPER CONFIGURATION: [1-2: MASTER] [3-4: SLAVE]', 75, 290);
  ctx.fillText('CURRENT SETTING: DRIVE 0 (MASTER C:)', 75, 318);

  // Codigo de barras
  ctx.fillStyle = '#0f172a';
  for (let x = 60; x < 450; x += 6) {
    const w = (x % 12 === 0) ? 4 : 2;
    ctx.fillRect(x, 365, w, 55);
  }
  ctx.font = '12px monospace';
  ctx.fillText('*ST3491A-420MB-IDE-1994*', 130, 440);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura do topo circular do capacitor eletrolitico (aluminio prensado com ranhura em cruz)
 */
export function createCapacitorTopTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Disco de aluminio
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  // Borda metálica
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Ranhuras de alivio de pressao estampadas em cruz (+)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(64, 20);
  ctx.lineTo(64, 108);
  ctx.moveTo(20, 64);
  ctx.lineTo(108, 64);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura da etiqueta da fonte de alimentacao AT 250W
 */
export function createPsuLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fef08a'; // Papel amarelado industrial
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  ctx.fillStyle = '#1c1917';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('SWITCHING POWER SUPPLY · MODEL PS-250AT', 25, 40);

  ctx.font = 'bold 16px monospace';
  ctx.fillText('AC INPUT: 115V / 230V ~ 50/60Hz 6A/3A', 25, 75);

  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('DC OUTPUT: +5V 25A | +12V 9A | -5V 0.5A | -12V 0.5A', 25, 110);
  ctx.fillText('TOTAL POWER: 250 WATTS MAX (CONTINUOUS)', 25, 135);

  ctx.fillStyle = '#1c1917';
  ctx.font = '13px monospace';
  ctx.fillText('CONNECTOR P8/P9 PINOUT: BLK-BLK GROUND IN CENTER', 25, 175);
  ctx.fillText('SAFETY: UL LISTED · CSA CERTIFIED · TUV APPROVED', 25, 200);

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('CAUTION: HAZARDOUS VOLTAGE INSIDE · DO NOT OPEN', 25, 232);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura do selo holografico da BIOS AMIBIOS
 */
export function createBiosLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Fundo prateado metalizado
  const grad = ctx.createLinearGradient(0, 0, 256, 128);
  grad.addColorStop(0, '#94a3b8');
  grad.addColorStop(0.3, '#f1f5f9');
  grad.addColorStop(0.6, '#cbd5e1');
  grad.addColorStop(1, '#64748b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 248, 120);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AMIBIOS®', 128, 45);

  ctx.font = 'bold 14px monospace';
  ctx.fillText('(C) 1994 AMERICAN MEGATRENDS', 128, 75);
  ctx.fillText('ALL RIGHTS RESERVED · AA5418', 128, 98);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura de micro-granulacao de plastico ABS injetado (Bump map)
 */
export function createPlasticBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 32;
    const val = Math.min(255, Math.max(0, 128 + noise));
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

/**
 * Textura de aco galvanizado e escovado SECC (Bump map)
 */
export function createBrushedMetalBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let y = 0; y < 256; y += 2) {
    if (Math.random() > 0.35) {
      ctx.fillRect(0, y, 256, 1);
    }
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let y = 1; y < 256; y += 3) {
    if (Math.random() > 0.45) {
      ctx.fillRect(0, y, 256, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Textura de relevo de trilhas e solda da placa-mae FR-4 (Bump map)
 */
export function createPcbBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#a4a4a4';
  ctx.lineWidth = 2.5;

  for (let i = 0; i < 20; i++) {
    const y = 180 + i * 14;
    ctx.beginPath();
    ctx.moveTo(140, y);
    ctx.lineTo(220, y);
    ctx.lineTo(270, y - 40);
    ctx.lineTo(360, y - 40);
    ctx.stroke();

    ctx.fillStyle = '#c4c4c4';
    ctx.beginPath();
    ctx.arc(220, y, 2.5, 0, Math.PI * 2);
    ctx.arc(270, y - 40, 2.5, 0, Math.PI * 2);
    ctx.arc(360, y - 40, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 16; i++) {
    const x = 50 + i * 8;
    ctx.beginPath();
    ctx.moveTo(x, 240);
    ctx.lineTo(x, 440);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Sombra de contato suave e difusa para a base de apoio
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(256, 256, 80, 256, 256, 248);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.58)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Textura de cabeca de parafuso Phillips com fenda em cruz (+)
 */
export function createScrewHeadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(29, 12, 6, 40);
  ctx.fillRect(12, 29, 40, 6);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Textura do modulo Dallas RTC DS12887 com icone de relogio
 */
export function createDallasRtcTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 248, 120);

  // Icone de relogio analogico Dallas
  ctx.strokeStyle = '#f4f4f5';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(38, 48, 20, 0, Math.PI * 2);
  ctx.stroke();

  // Ponteiros do relogio
  ctx.beginPath();
  ctx.moveTo(38, 48);
  ctx.lineTo(38, 34);
  ctx.moveTo(38, 48);
  ctx.lineTo(48, 48);
  ctx.stroke();

  // Textos brancos
  ctx.fillStyle = '#f4f4f5';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('DALLAS', 72, 44);

  ctx.font = 'bold 15px monospace';
  ctx.fillText('DS12887', 72, 66);
  ctx.font = '13px monospace';
  ctx.fillText('REAL TIME CLOCK', 20, 94);
  ctx.fillText('9432A1 · TAIWAN', 20, 114);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura de chip de chipset QFP (Northbridge ou Southbridge)
 */
export function createChipsetTexture(model: string, busType: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 256, 256);

  // Borda usinada chanfrada
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 240, 240);

  // Ponto indicador do Pino 1
  ctx.fillStyle = '#3f3f46';
  ctx.beginPath();
  ctx.arc(28, 28, 8, 0, Math.PI * 2);
  ctx.fill();

  // Textos tecnicos serigrafados em prata/dourado
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e4e4e7';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('SiS', 128, 75);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(model, 128, 120);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(busType, 128, 160);
  ctx.fillText('SYSTEM CONTROLLER', 128, 185);
  ctx.fillText('(C) 1994 SiS CORP', 128, 215);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura dos chips de Cache L2 SRAM DIP-28 (15ns)
 */
export function createSramTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 256, 96);

  // Entalhe semicircular de orientacao do pino 1
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(8, 48, 8, -Math.PI / 2, Math.PI / 2);
  ctx.fill();

  ctx.fillStyle = '#d4d4d8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('UM61256K-15', 28, 42);
  ctx.font = '12px monospace';
  ctx.fillText('256K SRAM 15ns 9428', 28, 68);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura emissiva do display de 7 segmentos LED verde (66 MHz)
 */
export function createSevenSegmentTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // Fundo fumê profundo do acrílico
  ctx.fillStyle = '#080d09';
  ctx.fillRect(0, 0, 256, 160);

  // Grade de máscara
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  for (let y = 0; y < 160; y += 4) {
    ctx.fillRect(0, y, 256, 2);
  }

  // Brilho dos digitos 66
  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 84px monospace';
  ctx.fillText('66', 22, 98);

  // Luz emissiva mais clara no centro dos segmentos
  ctx.fillStyle = '#4ade80';
  ctx.fillText('66', 22, 98);

  // Unidade MHz
  ctx.fillStyle = '#86efac';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('MHz', 155, 68);

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('TURBO ON', 155, 102);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Textura do emblema metalico chanfrado da marca
 */
export function createBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Gradiente metalico champagne / prata
  const grad = ctx.createLinearGradient(0, 0, 512, 128);
  grad.addColorStop(0, '#e2e8f0');
  grad.addColorStop(0.5, '#f8fafc');
  grad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 128);

  // Moldura dourada
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 120);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('TEACHYOURSELF', 24, 60);

  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('486 DX2', 360, 60);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('VESA LOCAL BUS · 66 MHz SYSTEM ARCHITECTURE', 24, 98);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

