export type CameraView = 'overview' | 'chassis' | 'silicon';
export type ExplodedCameraView = 'overview' | 'chassis' | 'cpu' | 'isa' | 'silicon';

export interface HardwareInspectorData {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  historicContext: string;
  description: string;
  specs: string;
  voltage: string;
}

export const HARDWARE_DATA: Record<string, HardwareInspectorData> = {
  cpu: {
    id: 'cpu',
    name: 'Processador Intel i486DX2 e Dissipador',
    category: 'Processamento Central (CPU)',
    manufacturer: 'Intel Corporation (1992)',
    historicContext: 'O chip que viabilizou jogos 3D como Doom e calculos com coprocessador integrado',
    description: 'Lancado pela Intel em 1992, o 486DX2 foi o grande divisor de aguas da computacao pessoal. Antes dele, processadores 386 precisavam de coprocessadores matematicos 387 comprados a parte para qualquer conta grafica mais pesada. O 486DX2 revolucionou a epoca ao embutir a unidade de calculo de ponto flutuante (FPU) e 8 KB de memoria cache no proprio chip monolitico. Foi o processador que permitiu rodar o lendario Doom da id Software em 35 quadros por segundo e pacotes profissionais de engenharia como o AutoCAD Release 12 em computadores domesticos, sem depender de estacoes de trabalho carissimas da Silicon Graphics.',
    specs: 'Socket 3 ZIF / 1.2 milhao de transistores / Arquitetura x86 32-bit',
    voltage: 'Alimentacao estavel de +5.0V'
  },
  gpu: {
    id: 'gpu',
    name: 'Placa Aceleradora Grafica VLB (Tseng ET4000/W32p)',
    category: 'Controladora de Video VGA',
    manufacturer: 'Tseng Laboratories (Pensilvania, EUA)',
    historicContext: 'A lendaria placa que quebrou a lentidao do video ISA e acelerou o DOS e Windows',
    description: 'Desenvolvida pela famosa fabricante norte-americana Tseng Labs, a placa ET4000/W32p tornou-se o sonho de consumo de qualquer usuario entre 1992 e 1994. Ate entao, as placas de video eram espetadas no barramento ISA antigo e engasgavam terrivelmente para mover janelas ou renderizar animacoes. A Tseng ligava-se direto ao barramento local VESA de 32 bits, transferindo mais de 20 milhoes de pixels por segundo. Essa velocidade permitia jogar simuladores de voo e navegar no Windows em 256 cores solidas sem engasgos, tornando-se o modelo mais copiado da epoca.',
    specs: 'Barramento VESA Local-Bus de 32 bits / 1 MB VRAM / Conector DB-15',
    voltage: '+5.0V e +12V fornecidos pelo slot'
  },
  dram: {
    id: 'dram',
    name: 'Modulos de Memoria RAM SIMM-72 (FPM DRAM)',
    category: 'Memoria Principal do Sistema',
    manufacturer: 'Samsung, NEC, Toshiba e Hitachi',
    historicContext: 'A memoria que permitiu instalar e rodar o multitarefa do Windows 95',
    description: 'Padronizados pelo comite JEDEC e fabricados por pioneiras como Samsung e Toshiba, os pentes SIMM de 72 vias resolveram um pesadelo dos tecnicos dos anos 90. Nos computadores anteriores com pentes de 30 pinos, era obrigatorio comprar quatro pentes identicos para fechar o canal de dados da CPU. O SIMM-72 entregava 32 bits de uma so vez, permitindo colocar um unico pente de 8 MB ou 16 MB. Essa memoria rapida era a condicao obrigatoria para conseguir instalar e rodar o recem-chegado Windows 95 sem travar por falta de memoria.',
    specs: '4 slots SIMM de 72 pinos / Tempo de acesso de 60ns / Modo Fast Page',
    voltage: 'Linha de alimentacao de +5.0V'
  },
  hdd: {
    id: 'hdd',
    name: 'Disco Rigido IDE 3.5 Polegadas (HDD)',
    category: 'Armazenamento Secundario Permanente',
    manufacturer: 'Quantum Corporation, Western Digital e Seagate',
    historicContext: 'Superou a barreira dos disquetes para abrigar programas pesados e multimidia',
    description: 'Produzido por gigantes como Quantum (linha ProDrive) e Western Digital (linha Caviar), este disco de 420 MB marcou a transicao dos PCs para a era do armazenamento farto. Ate o inicio dos anos 90, discos rigidos eram caros e guardavam apenas 20 a 40 MB. Com mais de 400 MB, os usuarios puderam finalmente instalar suites de escritorio completas, jogos em CD-ROM e arquivos de audio gravados em disco sem precisar ficar trocando dezenas de disquetes o tempo todo. O sistema podia ficar anos desligado que os dados magneticos continuavam gravados com seguranca.',
    specs: 'Capacidade de 420 MB / Rotacao de 4500 RPM / Interface ATA/IDE',
    voltage: '+12V para o motor e +5V para a placa logica'
  },
  cache_l2: {
    id: 'cache_l2',
    name: 'Banco de Cache L2 e TAG RAM (SRAM)',
    category: 'Memoria Estatica Ultrarrapida',
    manufacturer: 'Winbond, UMC e ISSI (Taiwan e EUA)',
    historicContext: 'A ponte de circuitos de 15 nanossegundos que impedia a CPU de ficar ociosa',
    description: 'Produzidos por especialistas em memoria estatica como Winbond e UMC, os chips de Cache L2 eram o segredo de desempenho das placas-mae topo de linha. O processador 486 era veloz demais para a memoria RAM comum, e sem o cache ele perdia ate um terco do tempo apenas esperando dados chegarem. A matriz de chips SRAM respondia em impressionantes 15 nanossegundos. Ela armazenava os trechos de codigo mais repetidos em loops de programas e entregava tudo na hora para a CPU, acelerando a maquina em ate 20% em comparacao com placas populares que vinham sem cache instalado.',
    specs: '256 KB em 8 chips SRAM de 15ns mais 1 chip TAG RAM DIP-28',
    voltage: 'Alimentacao de +5.0V em modo Write-Back'
  },
  chipset: {
    id: 'chipset',
    name: 'Conjunto de Chipsets SiS 85C496 e 85C497',
    category: 'Controlador Central do Sistema',
    manufacturer: 'Silicon Integrated Systems - SiS (Hsinchu, Taiwan)',
    historicContext: 'A arquitetura de dois chips que unificou barramentos e criou o padrao da industria',
    description: 'Lancado no final de 1994 pela SiS de Taiwan, este conjunto consagrou-se como o melhor chipset da geracao 486. Antes dele, uma placa-mae precisava de dezenas de circuitos integrados avulsos para controlar teclado, interrupcoes, portas e discos. A SiS integrou tudo em apenas dois chips principais: o Northbridge (que cuidava da memoria e do video VLB de alta velocidade) e o Southbridge (que cuidava das placas ISA, som e discos). Esse projeto era tao eficiente que permitia ao computador desacelerar a CPU e desligar o monitor para economizar energia quando ninguem estava usando.',
    specs: 'Dois chips planos PQFP de 160 pinos com suporte a VLB e ISA',
    voltage: '+5.0V com linhas de arbitragem de barramento'
  },
  rtc: {
    id: 'rtc',
    name: 'Modulo Real-Time Clock Dallas DS12887 e BIOS ROM',
    category: 'Relogio de Sistema e Memoria de Setup',
    manufacturer: 'Dallas Semiconductor (Texas, EUA) e AMI / Award',
    historicContext: 'O modulo blindado que salvou as placas do vazamento de baterias antigas',
    description: 'Fabricado pela Dallas Semiconductor no Texas com o famoso desenho de um relogio despertador estampado na carcaca, o DS12887 resolveu um grande problema das placas dos anos 80: as antigas baterias de Niquel-Cadmio costumavam vazar acido com o tempo e destruir as trilhas de circuito. O modulo Dallas guardava uma bateria de litio selada a vacuo com durabilidade de 10 anos, mantendo a hora e os discos configurados no setup. Ao lado dele, o chip de BIOS gravado pela American Megatrends (AMI) continha o codigo que acordava a maquina e checava a memoria toda vez que o PC era ligado.',
    specs: 'Modulo EDIP-24 com bateria de litio integrada e BIOS ROM DIP-32',
    voltage: 'Bateria interna de 3V e barramento externo de +5V'
  },
  ide_cable: {
    id: 'ide_cable',
    name: 'Cabo Ribbon Flat IDE de 40 Vias (PATA)',
    category: 'Barramento Paralelo de Discos',
    manufacturer: 'Western Digital, Compaq e Padrao ANSI ATA',
    historicContext: 'Eliminou placas controladoras caras e padronizou a instalacao de discos no mundo',
    description: 'Criado pela parceria historica entre a Western Digital e a Compaq, o padrao IDE transferiu os circuitos de controle de disco para dentro do proprio disco rigido, aposentando as placas controladoras volumosas e caras dos anos 80. A fita chata de 40 vias transferia palavras inteiras de 16 bits em paralelo com blindagem entre condutores. A famosa faixa vermelha em uma das pontas do cabo ensinou geracoes de tecnicos a regra sagrada: o pino 1 deve sempre ficar virado para o lado do cabo de forca para o disco nao queimar.',
    specs: 'Cabo de fita paralela de 40 condutores flexiveis de calibre 28 AWG',
    voltage: 'Linhas de transmissao logica de 0V a 5V'
  },
  psu_harness: {
    id: 'psu_harness',
    name: 'Fonte de Alimentacao AT 250W e Chicote P8/P9',
    category: 'Fonte Chaveada e Distribuicao Eletrica',
    manufacturer: 'Lite-On, Astec e Seasonic (Padrao IBM PC/AT)',
    historicContext: 'Alimentacao industrial chaveada com a famosa regra dos fios pretos ao centro',
    description: 'Construida seguindo as especificacoes industriais originadas no IBM PC/AT, esta fonte comutadora de 250 Watts recebia a alta tensao alternada da tomada (110V ou 220V) e a transformava em correntes continuas suaves de 5V para os chips e 12V para os motores mecanicos de disco. Os conectores P8 e P9 que alimentavam a placa-mae renderam a advertencia mais repetida em oficinas de informatica: os fios pretos de aterramento deviam sempre ser plugados encostados um no outro no meio do conector, pois encaixa-los invertidos queimava todos os chips da placa na mesma hora.',
    specs: 'Fonte chaveada de 250W com saidas de +5V, +12V, -5V, -12V e Power Good',
    voltage: 'Entrada AC 110V/220V com retificacao estavel'
  },
  caps: {
    id: 'caps',
    name: 'Capacitores Eletroliticos de Filtragem',
    category: 'Filtro e Desacoplamento de Energia',
    manufacturer: 'Rubycon, Nichicon e Nippon Chemi-Con (Japao)',
    historicContext: 'Componentes quimicos criticos que impediam quedas de voltagem sob carga pesada',
    description: 'Fabricados por especialistas japoneses em quimica de capacitores como Rubycon e Nichicon, esses cilindros azuis eram o escudo protetor da placa-mae. Quando o processador saltava subitamente de um estado ocioso para rodar um calculo pesado de renderizacao, o chip exigia um pico violento de eletricidade em frações de microssegundo. Posicionados estrategicamente ao lado do soquete da CPU, esses capacitores descarregavam sua energia quimica acumulada instantaneamente, impedindo que a voltagem caisse e o computador reiniciasse sozinho no meio de um trabalho.',
    specs: 'Cilindros de aluminio com ranhuras em cruz no topo contra sobrepressao',
    voltage: 'Filtragem continua das linhas principais de +5V e +12V'
  },
  databus: {
    id: 'databus',
    name: 'Barramento de Dados DATA[0..31] e Trilhas de Cobre',
    category: 'Vias Fisicas de Conducao Digital',
    manufacturer: 'Padrao Arquitetural IBM PC/AT e VESA',
    historicContext: 'As avenidas de cobre milimetricamente sincronizadas para transportar 32 bits',
    description: 'Gravadas quimicamente nas camadas de fibra de vidro da placa-mae, essas trilhas douradas sao as rodovias reais por onde as informacoes viajam na velocidade da luz. No processador 486, o barramento transmitia 32 bits completos em paralelo a cada pulso de clock. Os engenheiros projetavam essas trilhas com comprimentos milimetricamente calculados: se uma linha de cobre fosse apenas alguns milimetros mais longa que as outras, o bit correspondente chegaria com atraso, corrompendo a informacao de programas inteiros.',
    specs: '32 trilhas condutoras paralelas de cobre puro sobre substrato FR-4',
    voltage: 'Sinais digitais TTL: 0V para bit 0 e +5V para bit 1'
  },
  osc: {
    id: 'osc',
    name: 'Oscilador de Cristal de Quartzo (Clock de 66 MHz)',
    category: 'Gerador de Sincronismo Temporal',
    manufacturer: 'KDS (Daishinku Corp.), Epson e Citizen (Japao)',
    historicContext: 'O coracao piezoeletrico que ditava a marcha ritmica de todos os chips da maquina',
    description: 'Fabricado por mestres da industria relojoeira japonesa como KDS e Epson dentro de uma capsula metalica blindada, o oscilador e o marcapasso do computador. Utilizando o principio fisico da piezoeletricidade descoberto no seculo XIX, a lamina minuscula de cristal de quartzo vibra mecanicamente em ritmo milimetricamente imutavel ao receber tensao eletrica. Essa vibracao produz uma onda estavel de 66.0000 MHz que dita o passo de marcha com que todos os circuitos integrados executam suas instrucoes sem perder a sincronia.',
    specs: 'Capsula metalica hermetica de alta precisao calibrada em 66.0000 MHz',
    voltage: 'Onda periodica retangular TTL de 0V a 5.0V'
  },
  vlb: {
    id: 'vlb',
    name: 'Slots de Expansao VESA Local-Bus (32-bit) e ISA',
    category: 'Trilhos Modulares de Expansao',
    manufacturer: 'Consorcio VESA (NEC, ATI, Tseng, Trident e Genoa)',
    historicContext: 'A solucao de engenharia de 1992 que salvou os computadores do colapso grafico',
    description: 'Criado em 1992 por um consorcio liderado pela NEC e pelas principais fabricantes de placas graficas, o barramento VESA Local-Bus (VLB) foi a resposta emergencial para uma crise de desempenho. As placas de video da epoca eram limitadas pelo velho barramento ISA da decada de 80, que operava a apenas 8 MHz. O VLB adicionou uma extensao marrom de 112 pinos na ponta do slot ISA que ligava a placa diretamente nas pernas do processador a 33 MHz em 32 bits, quadruplicando a velocidade do video e viabilizando a explosao dos games em primeira pessoa.',
    specs: '7 slots na placa: 2 slots hibridos ISA/VLB de 32 bits e 5 slots ISA de 16 bits',
    voltage: 'Conexoes diretas de barramento com alimentacao multilinear'
  },
  front_panel: {
    id: 'front_panel',
    name: 'Painel Frontal do Gabinete (Baias, Chave Turbo e LEDs)',
    category: 'Interface Mecanica do Gabinete Desktop',
    manufacturer: 'Enlight, InWin e Yeong Yang (Bege Pantone 7527 C)',
    historicContext: 'O comando fisico do usuario com botao Turbo e a era de ouro dos disquetes',
    description: 'Moldado em plastico ABS no tom bege caracteristico dos anos 90, o painel frontal reunia a operacao tatil da maquina. Ele abrigava a chave geral com estalo mecanico pesado, as fendas dos disquetes de 5.25 polegadas (1.2 MB com alavanca giratoria) e 3.5 polegadas (1.44 MB com ejecao por mola) onde circulava todo o software da epoca, e o famoso botao Turbo com display numerico. O botao Turbo existia para reduzir de proposito a velocidade da CPU para 33 MHz caso um jogo antigo de DOS ficasse rapido demais e injogavel, preservando a compatibilidade historica.',
    specs: 'Gabinete desktop com baias para unidades de 5.25 e 3.5 polegadas',
    voltage: 'Chave geral de forca 110V/220V e linhas logicas para LEDs e botoes'
  }
};
