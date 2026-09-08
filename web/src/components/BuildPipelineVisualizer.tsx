import { useState, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CpuIcon, TerminalIcon, Layers01Icon, PlayIcon, PauseIcon, ArrowRight01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons';

interface PipelineStep {
  id: string;
  stageName: string;
  fileName: string;
  tool: string;
  command: string;
  nature: string;
  description: string;
  codePreview: string;
  whatHappens: string[];
}

const STEPS: PipelineStep[] = [
  {
    id: 'c',
    stageName: 'Código Fonte C',
    fileName: 'soma.c',
    tool: 'Pré-processador + Compilador (GCC cc1)',
    command: 'gcc -Og -S soma.c',
    nature: 'Texto ASCII de Alto Nível',
    description: 'Código escrito em linguagem imperativa legível pelo desenvolvedor, com tipos de dados, variáveis nomeadas e abstrações de alto nível.',
    codePreview: `long soma(long a, long b) {\n    long res = a + b;\n    return res;\n}`,
    whatHappens: [
      'O pré-processador (cpp) expande macros e inclui cabeçalhos.',
      'O compilador (cc1) analisa a árvore sintática (AST) e aloca variáveis em registradores.',
      'Gera o arquivo de texto em linguagem Assembly x86-64.'
    ]
  },
  {
    id: 'asm',
    stageName: 'Assembly x86-64',
    fileName: 'soma.s',
    tool: 'Montador GNU (as)',
    command: 'as soma.s -o soma.o',
    nature: 'Texto com Mnemônicos da CPU',
    description: 'Representação textual direta da Arquitetura do Conjunto de Instruções (ISA). Cada linha corresponde a exatamente uma instrução de máquina.',
    codePreview: `.globl soma\nsoma:\n    movq    %rdi, %rax   # Copia argumento 1 para retorno\n    addq    %rsi, %rax   # Soma argumento 2 em %rax\n    retq                 # Retorna para o chamador`,
    whatHappens: [
      'Traduz cada mnemônico textual diretamente para sua sequência de opcodes binários.',
      'Gera símbolos e seções de dados (.text, .data).',
      'Deixa ponteiros para funções externas em aberto para o Linker resolver.'
    ]
  },
  {
    id: 'obj',
    stageName: 'Objeto Relocável',
    fileName: 'soma.o',
    tool: 'Linker GNU (ld)',
    command: 'ld soma.o -o programa',
    nature: 'Binário ELF (Não Executável)',
    description: 'Arquivo em formato binário ELF contendo os bytes brutos que a CPU executa, mas sem endereços absolutos de memória definidos.',
    codePreview: `# Hexdump da seção .text (código de máquina puro):\n00000000: 48 89 f8 48 01 f0 c3                     |H..H...|\n\n# Desmontagem dos bytes:\n# 48 89 f8 -> movq %rdi, %rax (3 bytes)\n# 48 01 f0 -> addq %rsi, %rax (3 bytes)\n# c3       -> retq            (1 byte)`,
    whatHappens: [
      'Os bytes 48 89 f8 48 01 f0 c3 são as instruções de máquina executadas pelo processador.',
      'Contém tabelas de relocação para referências a outras bibliotecas.',
      'Ainda não pode ser executado pelo Kernel de forma independente.'
    ]
  },
  {
    id: 'elf',
    stageName: 'Executável ELF',
    fileName: 'programa',
    tool: 'Kernel Linux (execve)',
    command: './programa',
    nature: 'Binário Executável Pronto',
    description: 'Binário completo com todas as dependências resolvidas e segmentos de memória (.text, .rodata, .data) prontos para carregamento pelo Kernel.',
    codePreview: `# Inspeção via readelf -h programa:\nELF Header:\n  Class:                             ELF64\n  Data:                              2's complement, little endian\n  Machine:                           Advanced Micro Devices X86-64\n  Entry point address:               0x401050\n  Section headers offset:            64 (bytes into file)`,
    whatHappens: [
      'O Linker (ld) une o código com a biblioteca padrão (libc) e runtime C.',
      'Define o ponto de entrada (_start) e os endereços virtuais absolutos.',
      'Ao executar, a chamada execve() cria o espaço de memória virtual e transfere %rip para a CPU.'
    ]
  }
];

export default function BuildPipelineVisualizer() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const current = STEPS[selectedIdx];

  // Auto-play do fluxo com ciclo contínuo
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedIdx((prev) => (prev + 1) % STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <HugeiconsIcon icon={CpuIcon} className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
              O Fluxo de Transformação até o Código de Máquina
            </h4>
            <p className="font-mono text-xs text-smoke mt-0.5">
              Do texto em C até os bytes elétricos decodificados pelo processador
            </p>
          </div>
        </div>

        {/* Controles de Reprodução e Estado */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-mono uppercase tracking-wider font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue min-h-[44px] ${
              isPlaying
                ? 'bg-lake-blue text-white border-lake-blue shadow-sm'
                : 'bg-parchment text-graphite border-ash hover:border-lake-blue hover:text-off-black'
            }`}
          >
            {isPlaying ? (
              <>
                <HugeiconsIcon icon={PauseIcon} className="h-3.5 w-3.5" /> Pausar Fluxo
              </>
            ) : (
              <>
                <HugeiconsIcon icon={PlayIcon} className="h-3.5 w-3.5" /> Animar Fluxo
              </>
            )}
          </button>

          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-ash bg-parchment px-3.5 py-2 font-mono text-xs text-smoke min-h-[44px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lake-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lake-blue"></span>
            </span>
            <span>Etapa {selectedIdx + 1} de 4</span>
          </div>
        </div>
      </div>

      {/* Diagrama Visual Móvel do Fluxo (Pipeline Conduits) */}
      <div className="mb-8 p-4 md:p-6 rounded-2xl bg-parchment border border-ash">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {STEPS.map((step, idx) => {
            const isSelected = selectedIdx === idx;
            const isPast = selectedIdx > idx;

            return (
              <div key={step.id} className="flex items-center flex-1 min-w-[170px] last:flex-none">
                {/* Botão do Nó da Etapa */}
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setSelectedIdx(idx);
                  }}
                  className={`group relative flex items-center gap-2.5 rounded-full px-4 py-2.5 text-xs font-mono transition-all border w-full text-left min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                    isSelected
                      ? 'bg-white border-lake-blue text-lake-blue shadow-sm ring-2 ring-lake-blue/20 font-medium'
                      : isPast
                      ? 'bg-mint/20 border-mint text-off-black hover:bg-mint/30'
                      : 'bg-white/80 border-ash text-smoke hover:border-lake-blue/40 hover:text-off-black'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                      isSelected
                        ? 'bg-lake-blue text-white'
                        : isPast
                        ? 'bg-[#0e7c54] text-white'
                        : 'bg-ash/40 text-smoke'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div className="truncate">
                    <div className="font-semibold truncate text-[11px] leading-tight">
                      {step.fileName}
                    </div>
                    <div className="text-[10px] text-smoke truncate">
                      {step.stageName}
                    </div>
                  </div>
                </button>

                {/* Conector Móvel com Fluxo Causal entre Etapas */}
                {idx < STEPS.length - 1 && (
                  <div className="relative flex-1 mx-2 h-7 flex items-center min-w-[36px]">
                    <svg className="w-full h-4 overflow-visible" preserveAspectRatio="none" viewBox="0 0 40 16">
                      {/* Trilha de barramento estática */}
                      <line x1="0" y1="8" x2="34" y2="8" stroke="#cecac8" strokeWidth="2" strokeLinecap="round" />

                      {/* Fluxo de Dados Ativo quando avançando ou reproduzindo */}
                      {(selectedIdx > idx || (isSelected && isPlaying)) && (
                        <line
                          x1="0"
                          y1="8"
                          x2="34"
                          y2="8"
                          stroke="#2b59d1"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray="6 6"
                          className="animate-pulse"
                        />
                      )}
                    </svg>

                    {/* Sinalizador de Pacote em Trânsito */}
                    {(selectedIdx > idx || (isSelected && isPlaying)) && (
                      <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 px-1.5 py-0.5 rounded-full bg-periwinkle-mist text-lake-blue border border-lake-blue/30 text-[9px] font-mono tracking-tight pointer-events-none">
                        fluxo
                      </span>
                    )}

                    <div className="absolute right-0 text-smoke text-[10px] select-none pointer-events-none font-mono">
                      &rarr;
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Painel Editorial de Detalhes da Etapa Ativa */}
      <div className="rounded-2xl border border-ash bg-white p-6 md:p-8">
        {/* Metadados da Etapa */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ash pb-4 mb-6">
          <div>
            <div className="font-mono text-xs text-lake-blue font-medium uppercase tracking-wider">
              Etapa {selectedIdx + 1} de 4 : {current.stageName}
            </div>
            <div className="font-serif text-xl font-normal text-off-black mt-1">
              Artefato: <span className="font-mono text-off-black font-semibold">{current.fileName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-smoke">Comando executado:</span>
            <code className="rounded-full bg-parchment px-3.5 py-1.5 font-mono text-xs text-off-black border border-ash font-medium">
              {current.command}
            </code>
          </div>
        </div>

        <p className="font-mono text-xs md:text-sm text-graphite leading-relaxed mb-6">
          {current.description}
        </p>

        {/* Grade Comparativa: Artefato vs Transformação Física */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Preview de Conteúdo do Arquivo (Folha de Inspeção Editorial) */}
          <div className="rounded-2xl border border-ash bg-white text-off-black p-5 font-mono text-xs shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-smoke pb-3 border-b border-ash mb-3">
                <span className="flex items-center gap-2 text-off-black font-medium">
                  <HugeiconsIcon icon={TerminalIcon} className="h-4 w-4 text-lake-blue" /> Conteúdo do Arquivo Gerado
                </span>
                <span className="text-[11px] font-mono text-smoke rounded-full bg-parchment border border-ash px-2.5 py-0.5">
                  {current.fileName}
                </span>
              </div>
              <pre className="text-xs text-off-black overflow-x-auto leading-relaxed whitespace-pre font-mono p-3.5 bg-parchment/70 rounded-xl border border-ash/70">
                {current.codePreview}
              </pre>
            </div>
            <div className="mt-4 pt-3 border-t border-ash text-[11px] text-smoke flex items-center justify-between">
              <span>Natureza: <strong className="text-off-black font-medium">{current.nature}</strong></span>
              <span className="text-lake-blue font-semibold bg-periwinkle-mist/40 px-2.5 py-0.5 rounded-full border border-lake-blue/20">
                Decodificável
              </span>
            </div>
          </div>

          {/* Coluna 2: Mecanismo de Ação da Ferramenta */}
          <div className="rounded-2xl border border-ash bg-parchment p-5 font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="text-xs text-smoke mb-2 flex items-center gap-2 pb-3 border-b border-ash">
                <HugeiconsIcon icon={Layers01Icon} className="h-4 w-4 text-lake-blue" /> Mecanismo de Transformação Física:
              </div>
              <div className="font-serif text-lg font-normal text-off-black mb-3">
                {current.tool}
              </div>
              <ul className="space-y-3 text-xs md:text-sm text-graphite">
                {current.whatHappens.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-lake-blue font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Navegação Manual entre Etapas */}
            <div className="mt-6 pt-4 border-t border-ash flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedIdx(Math.max(0, selectedIdx - 1));
                }}
                disabled={selectedIdx === 0}
                className="rounded-full border border-ash bg-white px-4 py-2 font-mono text-graphite hover:text-off-black hover:border-lake-blue disabled:opacity-30 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="h-3.5 w-3.5" /> Etapa Anterior
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedIdx(Math.min(STEPS.length - 1, selectedIdx + 1));
                }}
                disabled={selectedIdx === STEPS.length - 1}
                className="rounded-full bg-lake-blue text-white px-5 py-2 font-mono font-medium hover:bg-lake-blue/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1.5 min-h-[44px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2"
              >
                Próxima Etapa <HugeiconsIcon icon={ArrowRight01Icon} className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
