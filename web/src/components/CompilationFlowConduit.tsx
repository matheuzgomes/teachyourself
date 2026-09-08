import { useState, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CpuIcon, PlayIcon, PauseIcon, Layers01Icon, TerminalIcon } from '@hugeicons/core-free-icons';

interface StageData {
  id: string;
  stepNum: string;
  title: string;
  subtitle: string;
  artifact: string;
  nature: string;
  snippet: string;
  hardwareMechanism: string;
  details: string[];
}

const STAGES: StageData[] = [
  {
    id: 'source',
    stepNum: '01',
    title: 'Fonte em C11',
    subtitle: 'Linguagem Imperativa Estruturada',
    artifact: 'soma.c',
    nature: 'Texto ASCII (Tipagem Estática)',
    snippet: 'long soma(long a, long b) {\n    return a + b;\n}',
    hardwareMechanism: 'O pré-processador expande macros e o compilador (cc1) analisa a sintaxe gerando a árvore AST.',
    details: [
      'Abstração de variáveis nomeadas e tipos de dados estáticos.',
      'Verificação semântica de conformidade com a norma ISO C11.',
      'Alocação preliminar de variáveis em pseudorregistradores.'
    ]
  },
  {
    id: 'assembly',
    stepNum: '02',
    title: 'Assembly x86-64',
    subtitle: 'Instruções Mnemônicas da ISA',
    artifact: 'soma.s',
    nature: 'Mnemônicos da CPU (1:1 com a máquina)',
    snippet: '.globl soma\nsoma:\n    movq    %rdi, %rax   # 1º argumento -> acumulador %rax\n    addq    %rsi, %rax   # Soma 2º argumento em %rax\n    retq                 # Retorno para o chamador',
    hardwareMechanism: 'Cada mnemônico reflete diretamente a microarquitetura do processador e a System V ABI.',
    details: [
      'Passagem dos parâmetros a e b pelos registradores %rdi e %rsi.',
      'Acumulação do resultado da soma no registrador de retorno %rax.',
      'Eliminação total de variáveis simbólicas do C em prol de registradores.'
    ]
  },
  {
    id: 'object',
    stepNum: '03',
    title: 'Opcode Bytes (ELF)',
    subtitle: 'Código de Máquina Relocável',
    artifact: 'soma.o',
    nature: 'Sequência Binária de Bytes',
    snippet: '# Bytes puros gravados na seção .text:\n00000000: 48 89 f8 48 01 f0 c3\n\n# Decodificação de hardware:\n# 48 89 f8 -> movq %rdi, %rax (3 bytes)\n# 48 01 f0 -> addq %rsi, %rax (3 bytes)\n# c3       -> retq            (1 byte)',
    hardwareMechanism: 'O montador GNU (as) codifica mnemônicos em sequências hexadecimais reconhecidas pelo decodificador.',
    details: [
      'Prefixos REX (0x48) sinalizam operações aritméticas em 64 bits.',
      'Símbolos externos preparados com tabelas de relocação.',
      'Empacotamento em formato de arquivo binário padrão ELF64.'
    ]
  },
  {
    id: 'silicon',
    stepNum: '04',
    title: 'Execução no Processador',
    subtitle: 'Comutação de Tensão e Clock',
    artifact: 'CPU Pipeline',
    nature: 'Portas Lógicas e Transistores CMOS',
    snippet: 'Estado dos Barramentos no Ciclo T1 (Execução de soma(20, 22)):\n- Clock (CLK): Borda de subida detectada\n- Instruction Pointer (%rip): 0x00401050\n- Registrador %rax: 0x000000000000002A (Valor decimal 42)\n- ALU Flags: ZF=0, SF=0, OF=0, CF=0 (Sem overflow)',
    hardwareMechanism: 'O decodificador da CPU polariza barramentos de cobre e a ALU comuta portas lógicas em cascata.',
    details: [
      'O valor 42 (0x2A) resulta da soma dos argumentos %rdi (20) e %rsi (22).',
      'Soma executada em ciclo único por circuitos somadores rápidos (CLA).',
      'Sincronização estrita por oscilador de cristal de quartzo.'
    ]
  }
];

export default function CompilationFlowConduit() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isPlaying || isHovered) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % STAGES.length);
    }, 7500);
    return () => clearInterval(interval);
  }, [isPlaying, isHovered]);

  const current = STAGES[activeIdx];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full rounded-card border border-ash bg-white p-6 md:p-10 shadow-sm transition-all font-mono"
    >
      {/* Barra de Controle e Titulo da Secao */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-ash mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <HugeiconsIcon icon={CpuIcon} className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-normal text-off-black tracking-tight [text-wrap:balance]">
              A Escada da Abstração até o Hardware
            </h2>
            <p className="text-xs text-smoke mt-0.5 font-mono">
              Do texto em C até a comutação elétrica de transistores na CPU
            </p>
          </div>
        </div>

        {/* Botao de Controle de Fluxo Movel */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-medium border active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue min-h-[44px] ${
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
                <HugeiconsIcon icon={PlayIcon} className="h-3.5 w-3.5" /> Animar Fluxo Contínuo
              </>
            )}
          </button>

          <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-ash bg-parchment px-3.5 py-2 text-xs text-smoke min-h-[44px]">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-lake-blue ${isPlaying ? 'animate-ping opacity-75' : 'opacity-30'}`} />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lake-blue" />
            </span>
            <span>Estágio {activeIdx + 1} de 4</span>
          </span>
        </div>
      </div>

      {/* CONDUTO VISUAL MOVEL (SVG + Transicao Continua entre Nos) */}
      <div className="mb-8 p-4 md:p-6 rounded-2xl bg-parchment border border-ash">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {STAGES.map((stage, idx) => {
            const isActive = activeIdx === idx;
            const isCompleted = activeIdx > idx;

            return (
              <div key={stage.id} className="flex items-center flex-1 min-w-[190px] last:flex-none">
                {/* Botao do Estagio */}
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveIdx(idx);
                  }}
                  aria-current={isActive ? 'step' : undefined}
                  className={`group relative flex items-center gap-3 rounded-full px-4 py-3 text-xs font-mono active:scale-[0.98] transition-all border w-full text-left min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                    isActive
                      ? 'bg-white border-lake-blue text-off-black shadow-sm ring-2 ring-lake-blue/20 font-medium'
                      : isCompleted
                      ? 'bg-mint/20 border-mint text-off-black hover:bg-mint/30'
                      : 'bg-white/80 border-ash text-smoke hover:border-lake-blue/40 hover:text-off-black'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                      isActive
                        ? 'bg-lake-blue text-white'
                        : isCompleted
                        ? 'bg-[#0e7c54] text-white'
                        : 'bg-ash/40 text-smoke'
                    }`}
                  >
                    {stage.stepNum}
                  </span>

                  <div className="truncate">
                    <div className="font-semibold truncate text-[12px] leading-tight text-off-black">
                      {stage.title}
                    </div>
                    <div className="text-[10px] text-smoke truncate mt-0.5">
                      {stage.artifact}
                    </div>
                  </div>
                </button>

                {/* Linha Condutora Movel entre os Estagios */}
                {idx < STAGES.length - 1 && (
                  <div className="relative flex-1 mx-2 h-7 flex items-center min-w-[36px]">
                    <svg className="w-full h-4 overflow-visible" preserveAspectRatio="none" viewBox="0 0 40 16">
                      <line x1="0" y1="8" x2="34" y2="8" stroke="#cecac8" strokeWidth="2" strokeLinecap="round" />
                      {(activeIdx > idx || (isActive && isPlaying)) && (
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

                    {(activeIdx > idx || (isActive && isPlaying)) && (
                      <span className="absolute left-1/2 -translate-x-1/2 -top-1.5 px-2 py-0.5 rounded-full bg-periwinkle-mist text-off-black border border-lake-blue/40 text-[9px] font-mono font-semibold tracking-tight pointer-events-none">
                        sinal
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

      {/* PAINEL DE INSPECAO DA ETAPA ATIVA */}
      <div className="rounded-2xl border border-ash bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ash pb-4 mb-6">
          <div>
            <div className="text-xs font-mono text-lake-blue font-semibold uppercase tracking-wider">
              Estágio {current.stepNum} de 04 : {current.subtitle}
            </div>
            <div className="font-serif text-2xl font-normal text-off-black mt-1 [text-wrap:balance]">
              {current.title} &middot; <span className="font-mono text-base text-smoke font-normal">{current.artifact}</span>
            </div>
          </div>

          <span className="rounded-full bg-parchment border border-ash px-4 py-1.5 text-xs text-graphite font-mono">
            Natureza: <strong className="text-off-black font-medium">{current.nature}</strong>
          </span>
        </div>

        {/* Grade Comparativa: Artefato de Codigo vs Mecanismo Fisico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lado Esquerdo: Artefato Gerado na Etapa */}
          <div className="rounded-2xl border border-ash bg-parchment p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-smoke pb-3 border-b border-ash mb-3">
                <span className="flex items-center gap-2 text-off-black font-medium">
                  <HugeiconsIcon icon={TerminalIcon} className="h-4 w-4 text-lake-blue" /> Representação Física do Dado
                </span>
                <span className="text-[11px] font-mono text-smoke rounded-full bg-white border border-ash px-2.5 py-0.5">
                  {current.artifact}
                </span>
              </div>
              <pre className="text-xs text-off-black overflow-x-auto leading-relaxed whitespace-pre font-mono tabular-nums p-4 bg-white rounded-xl border border-ash/80">
                {current.snippet}
              </pre>
            </div>
            <div className="mt-4 pt-3 border-t border-ash text-[11px] text-smoke flex items-center justify-between">
              <span>Camada: {current.title}</span>
              <span className="text-lake-blue font-semibold bg-white px-2.5 py-0.5 rounded-full border border-ash">
                Determinístico
              </span>
            </div>
          </div>

          {/* Lado Direito: Mecanismo de Acao no Hardware */}
          <div className="rounded-2xl border border-ash bg-white p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-smoke pb-3 border-b border-ash mb-3">
                <HugeiconsIcon icon={Layers01Icon} className="h-4 w-4 text-lake-blue" /> Mecanismo Físico e Microarquitetura:
              </div>
              <p className="text-sm text-graphite leading-relaxed mb-4 font-sans [text-wrap:pretty]">
                {current.hardwareMechanism}
              </p>
              <ul className="space-y-2.5 text-xs text-graphite font-sans">
                {current.details.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-lake-blue font-bold mt-0.5">&bull;</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Navegacao Manual entre Estagios */}
            <div className="mt-6 pt-4 border-t border-ash flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveIdx(Math.max(0, activeIdx - 1));
                }}
                disabled={activeIdx === 0}
                className="rounded-full border border-ash bg-white px-4 py-2 font-mono text-graphite hover:text-off-black hover:border-lake-blue disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all inline-flex items-center gap-1.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
              >
                &larr; Anterior
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveIdx(Math.min(STAGES.length - 1, activeIdx + 1));
                }}
                disabled={activeIdx === STAGES.length - 1}
                className="rounded-full bg-off-black text-white hover:bg-black px-5 py-2 font-mono font-medium disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all inline-flex items-center gap-1.5 min-h-[44px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-off-black focus-visible:ring-offset-2"
              >
                Avançar &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
