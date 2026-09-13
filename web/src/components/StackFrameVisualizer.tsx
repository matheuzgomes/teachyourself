import { HugeiconsIcon } from '@hugeicons/react';
import { Layers01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { useSimulationPlayback, SimulationToolbar } from './simulation';

interface StackStep {
  stepNumber: number;
  title: string;
  asmCode: string;
  rspOffset: number;
  ripAddress: string;
  registers: { rdi: string; rsi: string; rax: string };
  stackCells: {
    address: string;
    label: string;
    content: string;
    type: 'caller' | 'ret' | 'callee' | 'empty';
    isRsp: boolean;
  }[];
  explanation: string;
}

const STEPS: StackStep[] = [
  {
    stepNumber: 1,
    title: '1. Chamador Prepara os Argumentos na Função main()',
    asmCode: 'movq $10, %rdi\nmovq $20, %rsi',
    rspOffset: 0,
    ripAddress: '0x401145',
    registers: { rdi: '10', rsi: '20', rax: '?' },
    stackCells: [
      { address: '0x7FFFFFFF40', label: 'Frame de main()', content: 'Variáveis locais de main', type: 'caller', isRsp: true },
      { address: '0x7FFFFFFF38', label: 'Livre', content: '[Memória Não Alocada]', type: 'empty', isRsp: false },
      { address: '0x7FFFFFFF30', label: 'Livre', content: '[Memória Não Alocada]', type: 'empty', isRsp: false },
      { address: '0x7FFFFFFF28', label: 'Livre', content: '[Memória Não Alocada]', type: 'empty', isRsp: false }
    ],
    explanation: 'Na convenção System V ABI de 64 bits, argumentos não são empilhados na memória! Eles são passados diretamente nos registradores ultrarrápidos da CPU (%rdi para o 1º argumento, %rsi para o 2º).'
  },
  {
    stepNumber: 2,
    title: '2. Instrução "call soma": Empilhamento do Endereço de Retorno',
    asmCode: 'call soma        # (Endereço seguinte no main: 0x401150)',
    rspOffset: -8,
    ripAddress: '0x401150 (Salvo) -> Pula para 0x401200',
    registers: { rdi: '10', rsi: '20', rax: '?' },
    stackCells: [
      { address: '0x7FFFFFFF40', label: 'Frame de main()', content: 'Variáveis locais de main', type: 'caller', isRsp: false },
      { address: '0x7FFFFFFF38', label: 'Return Address (%rip)', content: '0x401150 (Onde voltar em main)', type: 'ret', isRsp: true },
      { address: '0x7FFFFFFF30', label: 'Livre', content: '[Memória Não Alocada]', type: 'empty', isRsp: false },
      { address: '0x7FFFFFFF28', label: 'Livre', content: '[Memória Não Alocada]', type: 'empty', isRsp: false }
    ],
    explanation: 'A instrução "call" faz duas coisas no mesmo ciclo: ela grava o endereço da instrução seguinte (0x401150) na memória da pilha e decrementa o registrador %rsp em 8 bytes (crescendo a pilha para baixo).'
  },
  {
    stepNumber: 3,
    title: '3. Prólogo da Função: Alocando Espaço para Variáveis Locais',
    asmCode: 'subq $16, %rsp    # Reserva 16 bytes na pilha',
    rspOffset: -24,
    ripAddress: '0x401205',
    registers: { rdi: '10', rsi: '20', rax: '?' },
    stackCells: [
      { address: '0x7FFFFFFF40', label: 'Frame de main()', content: 'Variáveis locais de main', type: 'caller', isRsp: false },
      { address: '0x7FFFFFFF38', label: 'Return Address (%rip)', content: '0x401150 (Endereço de Retorno)', type: 'ret', isRsp: false },
      { address: '0x7FFFFFFF30', label: 'Local: int a', content: '10 (%rdi salvo no slot -8)', type: 'callee', isRsp: false },
      { address: '0x7FFFFFFF28', label: 'Local: int b', content: '20 (%rsi salvo no slot -16)', type: 'callee', isRsp: true }
    ],
    explanation: 'Para alocar espaço para variáveis locais, a CPU não precisa de chamadas de sistema ou malloc! Ela simplesmente subtrai o tamanho desejado (16 bytes) do registrador %rsp.'
  },
  {
    stepNumber: 4,
    title: '4. Execução: Cálculo da Soma e Gravação no %rax',
    asmCode: 'movq -8(%rsp), %rax\naddq -16(%rsp), %rax # %rax = 10 + 20 = 30',
    rspOffset: -24,
    ripAddress: '0x401215',
    registers: { rdi: '10', rsi: '20', rax: '30' },
    stackCells: [
      { address: '0x7FFFFFFF40', label: 'Frame de main()', content: 'Variáveis locais de main', type: 'caller', isRsp: false },
      { address: '0x7FFFFFFF38', label: 'Return Address (%rip)', content: '0x401150 (Endereço de Retorno)', type: 'ret', isRsp: false },
      { address: '0x7FFFFFFF30', label: 'Local: int a', content: '10 (Lido da pilha)', type: 'callee', isRsp: false },
      { address: '0x7FFFFFFF28', label: 'Local: int b', content: '20 (Lido da pilha)', type: 'callee', isRsp: true }
    ],
    explanation: 'A CPU realiza a soma e deposita o resultado final 30 no registrador acumulador %rax. Esse registrador é o canal oficial de devolução de retornos de funções na ABI.'
  },
  {
    stepNumber: 5,
    title: '5. Epílogo: Desalocando Variáveis Locais',
    asmCode: 'addq $16, %rsp    # Libera os 16 bytes locais',
    rspOffset: -8,
    ripAddress: '0x401220',
    registers: { rdi: '10', rsi: '20', rax: '30' },
    stackCells: [
      { address: '0x7FFFFFFF40', label: 'Frame de main()', content: 'Variáveis locais de main', type: 'caller', isRsp: false },
      { address: '0x7FFFFFFF38', label: 'Return Address (%rip)', content: '0x401150 (Pronto para desempilhar)', type: 'ret', isRsp: true },
      { address: '0x7FFFFFFF30', label: 'Liberado', content: '[Memória Liberada]', type: 'empty', isRsp: false },
      { address: '0x7FFFFFFF28', label: 'Liberado', content: '[Memória Liberada]', type: 'empty', isRsp: false }
    ],
    explanation: 'Para destruir as variáveis locais, a CPU não precisa apagar dados na RAM com zeros. Ela simplesmente soma 16 ao %rsp! A memória continua fisicamente lá, mas agora está fora do topo ativo da pilha.'
  },
  {
    stepNumber: 6,
    title: '6. Instrução "retq": Retomando a Execução no Chamador',
    asmCode: 'retq             # Desempilha 0x401150 para o %rip e %rsp += 8',
    rspOffset: 0,
    ripAddress: '0x401150 (De volta em main!)',
    registers: { rdi: '10', rsi: '20', rax: '30 (Resultado disponível!)' },
    stackCells: [
      { address: '0x7FFFFFFF40', label: 'Frame de main()', content: 'Variáveis locais de main', type: 'caller', isRsp: true },
      { address: '0x7FFFFFFF38', label: 'Liberado', content: '[Endereço já consumido]', type: 'empty', isRsp: false },
      { address: '0x7FFFFFFF30', label: 'Liberado', content: '[Memória Liberada]', type: 'empty', isRsp: false },
      { address: '0x7FFFFFFF28', label: 'Liberado', content: '[Memória Liberada]', type: 'empty', isRsp: false }
    ],
    explanation: 'A instrução "retq" lê o endereço de retorno do topo da pilha, carrega esse endereço no ponteiro de instrução %rip e incrementa %rsp em 8 bytes. A função main() continua de onde parou!'
  }
];

export default function StackFrameVisualizer() {
  const playback = useSimulationPlayback({
    totalSteps: STEPS.length,
    stepIntervalMs: 3000,
    loop: false,
  });
  const { currentStep: currentStepIdx } = playback;
  const step = STEPS[currentStepIdx];

  return (
    <div className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <HugeiconsIcon icon={Layers01Icon} className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
              Simulador Dinâmico da Pilha de Execução (Stack Frame)
            </h4>
            <p className="font-mono text-xs text-smoke mt-0.5">
              Acompanhe como a memória RAM cresce para baixo em chamadas de função
            </p>
          </div>
        </div>

        {/* Controles de Passo */}
        <div className="flex items-center gap-2 flex-wrap">
          <SimulationToolbar playback={playback} />
        </div>
      </div>

      {/* Título do Passo Atual */}
      <div className="rounded-2xl bg-parchment p-5 mb-6 border border-ash">
        <div className="font-serif text-lg font-normal text-off-black mb-2">{step.title}</div>
        <div className="font-mono text-xs text-off-black bg-white p-3 rounded-xl border border-ash font-medium mb-3 whitespace-pre-line">
          {step.asmCode}
        </div>
        <p className="font-mono text-xs md:text-sm text-graphite leading-relaxed">{step.explanation}</p>
      </div>

      {/* Grid Principal: Registradores Ativos e Memória da Pilha */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Painel de Registradores da CPU (5 colunas) */}
        <div className="md:col-span-5 space-y-3">
          <div className="text-xs font-mono font-medium text-smoke uppercase tracking-wider">Estado dos Registradores:</div>

          <div className="rounded-2xl border border-ash bg-parchment p-4 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-ash pb-2">
              <span className="text-lake-blue font-semibold">%rip (Ponteiro de Instrução):</span>
              <span className="text-off-black text-[11px] font-medium">{step.ripAddress}</span>
            </div>
            <div className="flex items-center justify-between border-b border-ash pb-2">
              <span className="text-off-black font-bold">%rsp (Topo da Pilha):</span>
              <span className="text-off-black text-[11px] font-bold">
                {step.stackCells.find(c => c.isRsp)?.address || '0x7FFFFFFF40'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-ash pb-2">
              <span className="text-smoke">%rdi (1º Arg):</span>
              <span className="text-off-black font-medium">{step.registers.rdi}</span>
            </div>
            <div className="flex items-center justify-between border-b border-ash pb-2">
              <span className="text-smoke">%rsi (2º Arg):</span>
              <span className="text-off-black font-medium">{step.registers.rsi}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lake-blue font-bold">%rax (Retorno):</span>
              <span className="text-lake-blue font-bold">{step.registers.rax}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-periwinkle-mist/20 border border-lake-blue/20 p-3.5 text-xs font-mono text-graphite leading-relaxed">
            <strong className="text-off-black">Direção da Pilha:</strong> Na arquitetura x86-64, a pilha cresce em direção aos endereços numericamente <strong>menores</strong> (para baixo). Alocar espaço significa subtrair de <code>%rsp</code>.
          </div>
        </div>

        {/* Layout Visual da Pilha de Memória (7 colunas) */}
        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-medium text-smoke uppercase tracking-wider">
            <span>Layout Físico da Memória RAM:</span>
            <span className="text-smoke text-[11px] flex items-center gap-1">
              <span>Endereços Mais Altos</span>
              <HugeiconsIcon icon={ArrowDown01Icon} className="h-3.5 w-3.5 text-lake-blue" />
              <span>Endereços Mais Baixos</span>
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {step.stackCells.map((cell, idx) => {
              let borderClass = 'border-ash bg-white text-smoke';
              if (cell.type === 'caller') {
                borderClass = 'border-ash bg-white text-off-black shadow-sm';
              } else if (cell.type === 'ret') {
                borderClass = 'border-lake-blue/40 bg-periwinkle-mist/30 text-off-black font-semibold shadow-sm';
              } else if (cell.type === 'callee') {
                borderClass = 'border-mint bg-mint/20 text-off-black font-medium shadow-sm';
              }

              return (
                <div
                  key={idx}
                  className={`relative flex items-center justify-between rounded-2xl border p-3 transition-all ${borderClass} ${
                    cell.isRsp ? 'ring-2 ring-lake-blue ring-offset-2 ring-offset-parchment' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {cell.isRsp && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-lake-blue px-2.5 py-0.5 text-[10px] font-bold text-white uppercase shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                        %rsp
                      </span>
                    )}
                    <span className="font-semibold text-xs text-off-black">{cell.address}:</span>
                    <span className="text-xs text-graphite">{cell.label}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-medium text-off-black">{cell.content}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
