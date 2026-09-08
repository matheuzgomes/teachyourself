import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CpuIcon,
  Layers01Icon,
  RotateCcwIcon,
  ZapIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TerminalIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon
} from '@hugeicons/core-free-icons';

type VisualizerTab = 'mode_switch' | 'clone_comparison' | 'context_switch';

interface ContextSwitchStep {
  stepNumber: number;
  title: string;
  ring: 'Ring 3 (Usuário)' | 'Ring 0 (Kernel)';
  activeStack: string;
  action: string;
  detail: string;
  registersSaved: string;
}

const CONTEXT_STEPS_THREAD: ContextSwitchStep[] = [
  {
    stepNumber: 1,
    title: 'Execução da Thread A no Espaço de Usuário',
    ring: 'Ring 3 (Usuário)',
    activeStack: 'Pilha de Usuário da Thread A (RSP: 0x7ffdc3a18040)',
    action: 'CPU executando instruções de aplicação com CPL=3.',
    detail: 'A Thread A executa em modo não-privilegiado. Acesso direto a hardware ou memória de supervisor é bloqueado pela CPU.',
    registersSaved: 'Nenhum (registradores ativos no banco da CPU).'
  },
  {
    stepNumber: 2,
    title: 'Entrada no Kernel via Interrupção ou Syscall Bloqueante',
    ring: 'Ring 0 (Kernel)',
    activeStack: 'Pilha do Kernel da Thread A (RSP: 0xffffc900018a3f80)',
    action: 'Transição atômica para Ring 0 e salvamento do frame de usuário.',
    detail: 'A CPU eleva privilégio para CPL=0, troca para a pilha privada de kernel da Thread A e empilha a struct pt_regs contendo os registradores de usuário (%rax, %rdi, %rsi, etc.).',
    registersSaved: 'struct pt_regs empilhada no topo da pilha de kernel.'
  },
  {
    stepNumber: 3,
    title: 'Seleção da Próxima Tarefa pelo Escalonador (__schedule)',
    ring: 'Ring 0 (Kernel)',
    activeStack: 'Pilha do Kernel da Thread A',
    action: 'O escalonador CFS/EEVDF elege a Thread B na fila de execução (runqueue).',
    detail: 'O kernel consulta o estado das tarefas. A Thread B está pronta (TASK_RUNNING) e com direito a tempo de CPU no mesmo grupo de threads.',
    registersSaved: 'Decisão lógica do escalonador concluída.'
  },
  {
    stepNumber: 4,
    title: 'Comutação de Pilha de Kernel (switch_to)',
    ring: 'Ring 0 (Kernel)',
    activeStack: 'Pilha do Kernel da Thread B (RSP comutado para 0xffffc90002b41f80)',
    action: 'Salva callee-saved da Thread A e carrega o ponteiro RSP da Thread B.',
    detail: 'A rotina em assembly __switch_to_asm empilha %rbx, %rbp, %r12-%r15 na pilha de A, grava %rsp no descritor thread_struct de A, e carrega o %rsp previamente salvo da Thread B. A CPU agora executa sobre a pilha de B!',
    registersSaved: 'Registradores callee-saved preservados na thread_struct de A.'
  },
  {
    stepNumber: 5,
    title: 'Verificação do Espaço de Endereçamento (switch_mm)',
    ring: 'Ring 0 (Kernel)',
    activeStack: 'Pilha do Kernel da Thread B',
    action: 'O kernel compara prev->mm == next->mm e detecta que pertencem ao mesmo processo.',
    detail: 'Como ambas as threads compartilham o mesmo descritor mm_struct via CLONE_VM, o registrador CR3 não é modificado. O TLB e as caches de instruções/dados permanecem quentes!',
    registersSaved: 'CR3 preservado intacto. Zero descargas de TLB.'
  },
  {
    stepNumber: 6,
    title: 'Retorno ao Espaço de Usuário para a Thread B (sysret / iret)',
    ring: 'Ring 3 (Usuário)',
    activeStack: 'Pilha de Usuário da Thread B (RSP: 0x7ffdc3b29040)',
    action: 'Restauração de pt_regs da Thread B e salto para Ring 3.',
    detail: 'O kernel desempilha a struct pt_regs da Thread B, restaura todos os registradores de usuário, restaura o ponteiro de instrução %rip de B e baixa CPL para 3.',
    registersSaved: 'Thread B retoma a execução exatamente onde parou.'
  }
];

const CONTEXT_STEPS_PROCESS: ContextSwitchStep[] = [
  {
    stepNumber: 1,
    title: 'Execução do Processo A no Espaço de Usuário',
    ring: 'Ring 3 (Usuário)',
    activeStack: 'Pilha de Usuário do Processo A (RSP: 0x7ffdc3a18040)',
    action: 'Processo A executando instruções com CPL=3.',
    detail: 'O Processo A enxerga seu espaço virtual privado de 48 bits ancorado na tabela PML4 física 0x1f4000.',
    registersSaved: 'Nenhum (registradores ativos no banco da CPU).'
  },
  {
    stepNumber: 2,
    title: 'Preempção por Relógio do Processador (APIC Timer)',
    ring: 'Ring 0 (Kernel)',
    activeStack: 'Pilha do Kernel do Processo A (RSP: 0xffffc900018a3f80)',
    action: 'Interrupção periódica de hardware suspende o Processo A.',
    detail: 'A interrupção força a CPU para Ring 0, salva o frame de interrupção em pt_regs e marca a flag TIF_NEED_RESCHED na task_struct de A.',
    registersSaved: 'struct pt_regs gravada na pilha de kernel do Processo A.'
  },
  {
    stepNumber: 3,
    title: 'Seleção do Novo Processo B pelo Escalonador (__schedule)',
    ring: 'Ring 0 (Kernel)',
    activeStack: 'Pilha do Kernel do Processo A',
    action: 'O escalonador escolhe o Processo B (outro aplicativo com PID diferente).',
    detail: 'O Processo B possui memória virtual e descritores de arquivos totalmente independentes do Processo A.',
    registersSaved: 'Decisão do escalonador CFS/EEVDF concluída.'
  },
  {
    stepNumber: 4,
    title: 'Comutação de Registradores de Kernel e Pilha (switch_to)',
    ring: 'Ring 0 (Kernel)',
    activeStack: 'Pilha do Kernel do Processo B (RSP comutado para 0xffffc90003e82f80)',
    action: 'Salva callee-saved do Processo A e substitui RSP pela pilha do Processo B.',
    detail: 'A rotina __switch_to_asm atualiza o ponteiro de pilha ativo. A CPU passa a utilizar a pilha segura de kernel do Processo B.',
    registersSaved: 'Callee-saved do Processo A salvos em sua thread_struct.'
  },
  {
    stepNumber: 5,
    title: 'Comutação de Espaço de Endereçamento: Recarga de CR3 (switch_mm)',
    ring: 'Ring 0 (Kernel)',
    activeStack: 'Pilha do Kernel do Processo B',
    action: 'O kernel detecta prev->mm != next->mm e grava nova raiz PML4 em CR3.',
    detail: 'A instrução mov %rax, %cr3 carrega o novo endereço físico da tabela PML4 do Processo B (0x2b8000). As entradas sem PCID no TLB são descartadas, exigindo reaquecimento de cache na memória RAM.',
    registersSaved: 'CR3 atualizado. TLB sofre invalidação parcial ou troca de PCID.'
  },
  {
    stepNumber: 6,
    title: 'Retorno ao Espaço de Usuário para o Processo B (iretq)',
    ring: 'Ring 3 (Usuário)',
    activeStack: 'Pilha de Usuário do Processo B (RSP: 0x7ffd55102040)',
    action: 'Restauração de pt_regs do Processo B e comutação para CPL=3.',
    detail: 'A CPU restaura registradores gerais do Processo B, desempilha %rsp e %rip de B e retoma o código de usuário sob o novo mapa de memória virtual.',
    registersSaved: 'Processo B retoma execução com isolamento total.'
  }
];

export default function SyscallContextVisualizer() {
  const [activeTab, setActiveTab] = useState<VisualizerTab>('mode_switch');

  // Estado do Modo 1: Mode Switch
  const [modeSwitchStep, setModeSwitchStep] = useState<number>(0);

  // Estado do Modo 2: Clone
  const [selectedEntity, setSelectedEntity] = useState<'parent' | 'process_child' | 'thread_child'>('parent');

  // Estado do Modo 3: Context Switch
  const [isThreadSwitch, setIsThreadSwitch] = useState<boolean>(true);
  const [contextStepIndex, setContextStepIndex] = useState<number>(0);

  const contextSteps = isThreadSwitch ? CONTEXT_STEPS_THREAD : CONTEXT_STEPS_PROCESS;
  const currentContextStep = contextSteps[contextStepIndex];

  return (
    <div className="my-8 rounded-3xl border border-ash/80 bg-chalk p-6 shadow-sm font-sans space-y-6">
      {/* Cabeçalho do Componente */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-ash/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-lake-blue/10 px-2.5 py-0.5 text-xs font-mono font-medium text-lake-blue">
              Laboratório Interativo de Baixo Nível
            </span>
            <span className="text-xs font-mono text-smoke">x86-64 / Linux Kernel 6.x</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-off-black">
            Explorador Mecânico: Syscalls, Clone e Troca de Contexto
          </h3>
        </div>

        {/* Seleção de Abas Principais */}
        <div role="tablist" aria-label="Abas do laboratório de kernel" className="flex flex-wrap gap-1.5 rounded-xl border border-ash bg-parchment/60 p-1.5 font-mono text-xs">
          <button
            role="tab"
            aria-selected={activeTab === 'mode_switch'}
            onClick={() => setActiveTab('mode_switch')}
            className={`rounded-lg px-3 py-2 min-h-[44px] inline-flex items-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
              activeTab === 'mode_switch'
                ? 'bg-white text-off-black shadow-sm'
                : 'text-graphite hover:text-off-black hover:bg-white/50'
            }`}
          >
            1. Transição de Syscall
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'clone_comparison'}
            onClick={() => setActiveTab('clone_comparison')}
            className={`rounded-lg px-3 py-2 min-h-[44px] inline-flex items-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
              activeTab === 'clone_comparison'
                ? 'bg-white text-off-black shadow-sm'
                : 'text-graphite hover:text-off-black hover:bg-white/50'
            }`}
          >
            2. clone() Processo vs Thread
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'context_switch'}
            onClick={() => setActiveTab('context_switch')}
            className={`rounded-lg px-3 py-2 min-h-[44px] inline-flex items-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
              activeTab === 'context_switch'
                ? 'bg-white text-off-black shadow-sm'
                : 'text-graphite hover:text-off-black hover:bg-white/50'
            }`}
          >
            3. Simulador switch_to
          </button>
        </div>
      </div>

      {/* ABA 1: TRANSIÇÃO DE SYSCALL (MODE SWITCH) */}
      {activeTab === 'mode_switch' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-ash bg-parchment/40 p-4 font-mono text-xs text-graphite space-y-2">
            <div className="flex items-center gap-2 font-bold text-off-black uppercase">
              <HugeiconsIcon icon={ZapIcon} className="h-4 w-4 text-lake-blue" />
              <span>A Anatomia da Transição Rápida: Ring 3 &rarr; Ring 0</span>
            </div>
            <p>
              Uma chamada de sistema (syscall) não troca de processo. Ela realiza uma mudança de modo (Mode Switch),
              elevando o privilégio da CPU para CPL=0 e trocando a pilha do usuário pela pilha de kernel privada
              daquela mesma tarefa.
            </p>
          </div>

          {/* Fases da Syscall */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
            {[
              {
                step: 0,
                title: '1. Execução Ring 3',
                cpl: 'CPL = 3',
                rsp: 'Pilha Usuário: 0x7ffdc3a18040',
                detail: 'Aplicação prepara %rax=1 (sys_write), %rdi=1, %rsi=buffer e emite a instrução syscall.'
              },
              {
                step: 1,
                title: '2. Salto via IA32_LSTAR',
                cpl: 'CPL = 0 (Supervisor)',
                rsp: 'Pilha Usuário (Ainda desprotegida)',
                detail: 'Hardware salva %rip em %rcx, RFLAGS em %r11, mascara flags com IA32_FMASK e salta para entry_SYSCALL_64.'
              },
              {
                step: 2,
                title: '3. SWAPGS e Pilha Segura',
                cpl: 'CPL = 0',
                rsp: 'Pilha Kernel: 0xffffc900018a3f80',
                detail: 'Kernel executa SWAPGS para obter ponteiro per-CPU e comuta RSP para a pilha de kernel. Empilha pt_regs.'
              },
              {
                step: 3,
                title: '4. Retorno via SYSRETQ',
                cpl: 'CPL = 3 (Usuário)',
                rsp: 'Pilha Usuário: 0x7ffdc3a18040',
                detail: 'Kernel coloca código de retorno em %rax, restaura registradores e sysretq salta de volta para o usuário.'
              }
            ].map((s) => (
              <button
                key={s.step}
                type="button"
                aria-pressed={modeSwitchStep === s.step}
                onClick={() => setModeSwitchStep(s.step)}
                className={`rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
                  modeSwitchStep === s.step
                    ? 'border-lake-blue bg-white shadow-md'
                    : 'border-ash/60 bg-parchment/30 opacity-75 hover:opacity-100 hover:bg-white/40'
                }`}
              >
                <div className="flex items-center justify-between border-b border-ash/40 pb-2 mb-2">
                  <span className="font-bold text-off-black">{s.title}</span>
                  <span className="rounded bg-ash/40 px-1.5 py-0.5 text-[10px] text-graphite">{s.cpl}</span>
                </div>
                <div className="text-[11px] text-lake-blue mb-2">{s.rsp}</div>
                <p className="text-[11px] text-smoke leading-relaxed">{s.detail}</p>
              </button>
            ))}
          </div>

          {/* Painel de Registradores e Estado Físico */}
          <div className="rounded-2xl border border-ash bg-white p-5 font-mono text-xs space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-ash/60 pb-3">
              <span className="font-bold uppercase tracking-wider text-off-black flex items-center gap-2">
                <HugeiconsIcon icon={CpuIcon} className="h-4 w-4 text-lake-blue" />
                Estado Físico da CPU durante a Fase {modeSwitchStep + 1}
              </span>
              <span className="text-xs text-smoke">Latência estimada de transição: ~70 ciclos (~20 ns)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-ash/70 bg-parchment/30 p-3">
                <div className="text-[10px] uppercase text-smoke">Nível CPL (%cs[1:0])</div>
                <div className={`text-base font-bold ${modeSwitchStep === 0 || modeSwitchStep === 3 ? 'text-graphite' : 'text-lake-blue'}`}>
                  {modeSwitchStep === 0 || modeSwitchStep === 3 ? '3 (User Mode)' : '0 (Kernel Mode)'}
                </div>
              </div>

              <div className="rounded-xl border border-ash/70 bg-parchment/30 p-3">
                <div className="text-[10px] uppercase text-smoke">Ponteiro de Pilha (%rsp)</div>
                <div className="text-xs font-bold text-off-black truncate">
                  {modeSwitchStep >= 2 ? '0xffffc900018a3f80' : '0x7ffdc3a18040'}
                </div>
              </div>

              <div className="rounded-xl border border-ash/70 bg-parchment/30 p-3">
                <div className="text-[10px] uppercase text-smoke">Registrador %rcx (Salva %rip)</div>
                <div className="text-xs font-bold text-graphite truncate">
                  {modeSwitchStep === 0 ? '0x0000000000000000' : '0x00000040129a (Usuário)'}
                </div>
              </div>

              <div className="rounded-xl border border-ash/70 bg-parchment/30 p-3">
                <div className="text-[10px] uppercase text-smoke">Registrador %cr3 (Tabela PML4)</div>
                <div className="text-xs font-bold text-mint truncate">
                  0x1f4000 (Inalterado)
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-ash/60 bg-parchment/50 p-3 text-[11px] text-graphite space-y-1">
              <span className="font-bold text-off-black">Invariante Arquitetural:</span>
              <p>
                O registrador <span className="font-bold text-off-black">%cr3</span> permanece rigorosamente inalterado
                durante uma chamada de sistema. A CPU continua acessando o mesmo espaço de memória virtual,
                apenas desbloqueando o acesso às páginas mapeadas na metade superior do supervisor (bit U/S=0).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: CLONE() PROCESSO VS THREAD */}
      {activeTab === 'clone_comparison' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-ash bg-parchment/40 p-4 font-mono text-xs text-graphite space-y-2">
            <div className="flex items-center gap-2 font-bold text-off-black uppercase">
              <HugeiconsIcon icon={Layers01Icon} className="h-4 w-4 text-lake-blue" />
              <span>A Equivalência Ontológica no Linux: Tudo é struct task_struct</span>
            </div>
            <p>
              O escalonador do Linux não possui classes separadas para processos e threads. Cada fluxo de execução é
              uma <span className="font-bold text-off-black">task</span>. A diferença entre criar um novo processo independente
              ou uma nova thread leve reside unicamente nas flags passadas para a chamada de sistema <span className="font-bold text-lake-blue">clone()</span>.
            </p>
          </div>

          {/* Comparador de Ramificações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {/* Tarefa Pai */}
            <button
              type="button"
              aria-pressed={selectedEntity === 'parent'}
              onClick={() => setSelectedEntity('parent')}
              className={`w-full text-left cursor-pointer rounded-2xl border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
                selectedEntity === 'parent'
                  ? 'border-lake-blue bg-white shadow-md'
                  : 'border-ash/60 bg-parchment/30 opacity-80 hover:opacity-100 hover:bg-white/40'
              }`}
            >
              <div className="flex items-center justify-between border-b border-ash/40 pb-2 mb-3">
                <span className="font-bold text-off-black">Tarefa Pai (task_struct)</span>
                <span className="rounded bg-lake-blue/10 px-2 py-0.5 text-[10px] text-lake-blue font-semibold">Origem</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div><span className="text-smoke">PID / TID:</span> <span className="font-bold text-off-black">4120</span></div>
                <div><span className="text-smoke">TGID (Processo):</span> <span className="font-bold text-off-black">4120</span></div>
                <div><span className="text-smoke">Descritor mm_struct:</span> <span className="font-mono text-lake-blue font-semibold">0x880010</span></div>
                <div><span className="text-smoke">Raiz PML4 (%cr3):</span> <span className="font-mono text-off-black bg-mint/40 px-1 rounded">0x1f4000</span></div>
                <div><span className="text-smoke">Tabela files_struct:</span> <span className="font-mono text-graphite">0x920040</span></div>
              </div>
            </button>

            {/* Filho via fork() */}
            <button
              type="button"
              aria-pressed={selectedEntity === 'process_child'}
              onClick={() => setSelectedEntity('process_child')}
              className={`w-full text-left cursor-pointer rounded-2xl border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
                selectedEntity === 'process_child'
                  ? 'border-lake-blue bg-white shadow-md'
                  : 'border-ash/60 bg-parchment/30 opacity-80 hover:opacity-100 hover:bg-white/40'
              }`}
            >
              <div className="flex items-center justify-between border-b border-ash/40 pb-2 mb-3">
                <span className="font-bold text-off-black">Filho via fork()</span>
                <span className="rounded bg-gold/20 px-2 py-0.5 text-[10px] text-off-black font-semibold">Novo Processo</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div><span className="text-smoke">PID / TID:</span> <span className="font-bold text-off-black">4121</span></div>
                <div><span className="text-smoke">TGID (Processo):</span> <span className="font-bold text-off-black">4121 (Novo)</span></div>
                <div><span className="text-smoke">Descritor mm_struct:</span> <span className="font-mono text-off-black bg-gold/30 px-1 rounded">0x880050 (Novo)</span></div>
                <div><span className="text-smoke">Raiz PML4 (%cr3):</span> <span className="font-mono text-off-black bg-gold/30 px-1 rounded">0x205000 (COW)</span></div>
                <div><span className="text-smoke">Tabela files_struct:</span> <span className="font-mono text-graphite">0x920080 (Cópia)</span></div>
              </div>
            </button>

            {/* Filho via pthread_create() */}
            <button
              type="button"
              aria-pressed={selectedEntity === 'thread_child'}
              onClick={() => setSelectedEntity('thread_child')}
              className={`w-full text-left cursor-pointer rounded-2xl border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
                selectedEntity === 'thread_child'
                  ? 'border-lake-blue bg-white shadow-md'
                  : 'border-ash/60 bg-parchment/30 opacity-80 hover:opacity-100 hover:bg-white/40'
              }`}
            >
              <div className="flex items-center justify-between border-b border-ash/40 pb-2 mb-3">
                <span className="font-bold text-off-black">Filho via pthread_create()</span>
                <span className="rounded bg-mint/30 px-2 py-0.5 text-[10px] text-off-black font-semibold">Nova Thread</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div><span className="text-smoke">PID / TID:</span> <span className="font-bold text-off-black">4122</span></div>
                <div><span className="text-smoke">TGID (Processo):</span> <span className="font-bold text-off-black">4120 (Mesmo)</span></div>
                <div><span className="text-smoke">Descritor mm_struct:</span> <span className="font-mono text-off-black bg-mint/40 px-1 rounded">0x880010 (Compartilhado)</span></div>
                <div><span className="text-smoke">Raiz PML4 (%cr3):</span> <span className="font-mono text-off-black bg-mint/40 px-1 rounded">0x1f4000 (Mesmo)</span></div>
                <div><span className="text-smoke">Tabela files_struct:</span> <span className="font-mono text-off-black bg-mint/40 px-1 rounded">0x920040 (Compartilhado)</span></div>
              </div>
            </button>
          </div>

          {/* Detalhe da Entidade Selecionada */}
          <div className="rounded-2xl border border-ash bg-white p-5 font-mono text-xs space-y-3 shadow-sm">
            <div className="font-bold text-off-black uppercase tracking-wider flex items-center gap-2">
              <HugeiconsIcon icon={TerminalIcon} className="h-4 w-4 text-lake-blue" />
              <span>Análise das Flags de clone() para a Entidade Selecionada</span>
            </div>

            {selectedEntity === 'parent' && (
              <p className="text-graphite">
                A tarefa original possui espaço de memória exclusivo (mm_struct) e tabela de arquivos própria.
                Quando chama getpid(), retorna 4120. Quando chama gettid(), retorna 4120.
              </p>
            )}

            {selectedEntity === 'process_child' && (
              <div className="space-y-2 text-graphite">
                <p>
                  Chamada: <span className="font-bold text-off-black">clone(SIGCHLD, 0)</span> (comportamento de fork).
                </p>
                <div className="rounded-xl border border-gold/40 bg-gold/5 p-3 text-[11px] space-y-1">
                  <div className="font-bold text-gold">Isolamento Completo:</div>
                  <p>
                    A flag <span className="font-bold">CLONE_VM</span> está desligada. O kernel alocou uma nova estrutura mm_struct
                    e duplicou as tabelas de páginas PML4. As páginas de dados foram marcadas como somente leitura (R/W=0)
                    para aplicar Copy-on-Write no primeiro acesso de escrita.
                  </p>
                </div>
              </div>
            )}

            {selectedEntity === 'thread_child' && (
              <div className="space-y-2 text-graphite">
                <p>
                  Chamada: <span className="font-bold text-off-black">clone(CLONE_VM | CLONE_FS | CLONE_FILES | CLONE_SIGHAND | CLONE_THREAD, stack)</span>.
                </p>
                <div className="rounded-xl border border-mint/40 bg-mint/5 p-3 text-[11px] space-y-1">
                  <div className="font-bold text-mint">Compartilhamento Total de Recursos:</div>
                  <p>
                    A flag <span className="font-bold">CLONE_VM</span> está ligada. A nova task_struct não aloca memória nova:
                    ela apenas incrementa o contador de referências de mm_struct (mm_users) e aponta diretamente para a tabela
                    PML4 existente. Ambas as threads executam sob o mesmíssimo registrador %cr3.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 3: SIMULADOR SEQUENCIAL DE TROCA DE CONTEXTO */}
      {activeTab === 'context_switch' && (
        <div className="space-y-6">
          {/* Seletor de Tipo de Troca */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-ash bg-parchment/50 p-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-off-black">Cenário de Escalonamento:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={isThreadSwitch}
                  onClick={() => {
                    setIsThreadSwitch(true);
                    setContextStepIndex(0);
                  }}
                  className={`rounded-lg px-3.5 py-2 min-h-[44px] inline-flex items-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
                    isThreadSwitch
                      ? 'bg-mint text-off-black font-bold shadow-sm border border-mint'
                      : 'border border-ash bg-white text-graphite hover:text-off-black'
                  }`}
                >
                  Entre Threads (Mesmo mm_struct)
                </button>
                <button
                  type="button"
                  aria-pressed={!isThreadSwitch}
                  onClick={() => {
                    setIsThreadSwitch(false);
                    setContextStepIndex(0);
                  }}
                  className={`rounded-lg px-3.5 py-2 min-h-[44px] inline-flex items-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
                    !isThreadSwitch
                      ? 'bg-gold text-off-black font-bold shadow-sm border border-gold'
                      : 'border border-ash bg-white text-graphite hover:text-off-black'
                  }`}
                >
                  Entre Processos (Novo mm_struct)
                </button>
              </div>
            </div>

            {/* Controles de Passo */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setContextStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={contextStepIndex === 0}
                className="rounded-lg border border-ash bg-white p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-graphite hover:text-off-black disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2"
                aria-label="Passo Anterior"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
              </button>
              <span className="font-bold text-off-black px-1 font-mono text-xs tabular-nums">
                Passo {currentContextStep.stepNumber} de {contextSteps.length}
              </span>
              <button
                type="button"
                onClick={() => setContextStepIndex((prev) => Math.min(contextSteps.length - 1, prev + 1))}
                disabled={contextStepIndex === contextSteps.length - 1}
                className="rounded-lg border border-ash bg-white p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-graphite hover:text-off-black disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2"
                aria-label="Próximo Passo"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setContextStepIndex(0)}
                className="rounded-lg border border-ash bg-white p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-graphite hover:text-off-black active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2"
                aria-label="Reiniciar Simulação"
              >
                <HugeiconsIcon icon={RotateCcwIcon} className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Cartão do Passo Atual */}
          <div className="rounded-2xl border border-ash bg-white p-6 font-mono text-xs space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-ash/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-lake-blue/10 px-2 py-0.5 font-bold text-lake-blue">
                  Passo {currentContextStep.stepNumber}
                </span>
                <span className="font-bold text-off-black text-sm">{currentContextStep.title}</span>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                  currentContextStep.ring.includes('Ring 0')
                    ? 'bg-lake-blue/15 text-lake-blue'
                    : 'bg-ash/50 text-graphite'
                }`}
              >
                {currentContextStep.ring}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-ash/60 bg-parchment/40 p-3 space-y-1">
                <span className="text-[10px] uppercase text-smoke font-bold">Pilha Ativa:</span>
                <p className="font-bold text-off-black text-[11px]">{currentContextStep.activeStack}</p>
              </div>

              <div className="rounded-xl border border-ash/60 bg-parchment/40 p-3 space-y-1">
                <span className="text-[10px] uppercase text-smoke font-bold">Estado dos Registradores:</span>
                <p className="text-graphite text-[11px]">{currentContextStep.registersSaved}</p>
              </div>
            </div>

            <div className="rounded-xl border border-ash/60 bg-parchment/60 p-4 space-y-2">
              <div className="font-bold text-off-black">{currentContextStep.action}</div>
              <p className="text-graphite leading-relaxed text-[11px]">{currentContextStep.detail}</p>
            </div>
          </div>

          {/* Comparação de Impacto de Desempenho */}
          <div className="rounded-2xl border border-ash bg-parchment/40 p-5 font-mono text-xs space-y-3">
            <div className="font-bold uppercase tracking-wider text-off-black flex items-center gap-2">
              <HugeiconsIcon icon={ZapIcon} className="h-4 w-4 text-lake-blue" />
              <span>Custo de Hardware no Cenário Ativo</span>
            </div>

            {isThreadSwitch ? (
              <div className="rounded-xl border border-mint/50 bg-mint/10 p-4 text-graphite space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-mint">
                  <HugeiconsIcon icon={ShieldCheckIcon} className="h-4 w-4" />
                  <span>TROCA DE CONTEXTO ENTRE THREADS &bull; Custo Direto: ~1.000 a 2.000 ciclos (~300 a 600 ns)</span>
                </div>
                <p>
                  O registrador CR3 não é modificado. Todas as entradas de tabelas de páginas salvas no TLB permanecem
                  válidas. O impacto em cache de dados L1/L2 é mínimo porque ambas as threads operam sobre o mesmo
                  conjunto de trabalho (Working Set) na memória virtual.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-gold/50 bg-gold/10 p-4 text-graphite space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-gold">
                  <HugeiconsIcon icon={ShieldAlertIcon} className="h-4 w-4" />
                  <span>TROCA DE CONTEXTO ENTRE PROCESSOS &bull; Custo Direto: ~2.000 a 5.000 ciclos (~1 µs) + Penalidade Indireta</span>
                </div>
                <p>
                  A recarga de CR3 força a comutação de espaço de endereçamento. Entradas de TLB sem identificador PCID
                  são invalidadas. Quando o Processo B retoma a execução, a CPU sofre uma sequência de falhas frias de cache
                  L1/L2 e caminhamentos de página na memória RAM física até reconstruir a localidade de referência (penalidade de 5 a 50 µs).
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
