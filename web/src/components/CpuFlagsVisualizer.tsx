import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ZapIcon, Activity01Icon, InfoIcon } from '@hugeicons/core-free-icons';

interface Preset {
  name: string;
  op: string;
  valA: number;
  valB: number;
  explanation: string;
}

const PRESETS: Preset[] = [
  {
    name: 'Igualdade (A == B)',
    op: 'cmpq $5, %rdi',
    valA: 5,
    valB: 5,
    explanation: '5 - 5 = 0. O resultado é exatamente zero, portanto ZF é acionada (1). Todas as outras flags ficam zeradas.'
  },
  {
    name: 'Menor com Sinal (5 < 10)',
    op: 'cmpq $10, %rdi',
    valA: 5,
    valB: 10,
    explanation: '5 - 10 = -5. O resultado é negativo (SF=1), e como não houve overflow, SF != OF indica que 5 < 10 (jl aciona).'
  },
  {
    name: 'Maior com Sinal (10 > 5)',
    op: 'cmpq $5, %rdi',
    valA: 10,
    valB: 5,
    explanation: '10 - 5 = +5. Resultado positivo não nulo: ZF=0, SF=0, OF=0. A condição jg (Jump Greater) é verdadeira.'
  },
  {
    name: 'Estouro Signed (Overflow)',
    op: 'addq (Estouro)',
    valA: 0x7FFFFFFF,
    valB: 1,
    explanation: 'Somar 1 ao maior positivo signed resulta em um número negativo em Complemento de Dois! OF=1 indica estouro de sinal.'
  }
];

export default function CpuFlagsVisualizer() {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const current = PRESETS[selectedPresetIdx];

  // Calcular flags baseadas no preset
  const diff = current.valA - current.valB;
  const zf = diff === 0 ? 1 : 0;
  const sf = diff < 0 ? 1 : 0;
  const of = selectedPresetIdx === 3 ? 1 : 0;
  const cf = (current.valA >>> 0) < (current.valB >>> 0) ? 1 : 0;

  const flags = [
    {
      code: 'ZF',
      name: 'Zero Flag',
      value: zf,
      desc: 'Ativado (1) se a última operação resultou em exatamente ZERO.',
      meaning: zf ? 'Resultado é ZERO (A == B)' : 'Resultado é diferente de zero'
    },
    {
      code: 'SF',
      name: 'Sign Flag',
      value: sf,
      desc: 'Ativado (1) se o bit mais significativo (sinal) resultou em 1 (negativo).',
      meaning: sf ? 'Resultado NEGATIVO (< 0)' : 'Resultado não-negativo (>= 0)'
    },
    {
      code: 'OF',
      name: 'Overflow Flag',
      value: of,
      desc: 'Ativado (1) se ocorreu estouro aritmético em Complemento de Dois.',
      meaning: of ? 'Houve estouro com sinal (soma de positivos virou negativo)' : 'Nenhum estouro com sinal'
    },
    {
      code: 'CF',
      name: 'Carry Flag',
      value: cf,
      desc: 'Ativado (1) se ocorreu transporte sem sinal (overflow unsigned).',
      meaning: cf ? 'Houve transporte ou empréstimo elétrico unsigned' : 'Nenhum transporte unsigned'
    }
  ];

  return (
    <div className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <HugeiconsIcon icon={Activity01Icon} className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
              Os Quatro Bits de Estado da CPU (Condition Codes)
            </h4>
            <p className="font-mono text-xs text-smoke mt-0.5">
              Como a ALU informa o resultado de comparações e operações aritméticas para os saltos
            </p>
          </div>
        </div>

        <span className="rounded-full bg-parchment border border-ash px-4 py-1.5 font-mono text-xs font-medium text-graphite">
          Registrador %rflags
        </span>
      </div>

      {/* Seletor de Cenários de Teste */}
      <div className="mb-6">
        <div className="text-xs font-mono text-smoke mb-3 flex items-center gap-2">
          <HugeiconsIcon icon={ZapIcon} className="h-3.5 w-3.5 text-lake-blue" /> Escolha uma Operação na ALU:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedPresetIdx(idx)}
              aria-pressed={selectedPresetIdx === idx}
              className={`rounded-2xl border p-3.5 text-xs font-mono text-left transition-all min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                selectedPresetIdx === idx
                  ? 'border-lake-blue bg-white text-lake-blue font-medium ring-2 ring-lake-blue/20 shadow-sm'
                  : 'border-ash bg-parchment text-graphite hover:border-lake-blue/50 hover:bg-white hover:text-off-black'
              }`}
            >
              <div className="truncate font-semibold">{p.name}</div>
              <div className="font-mono text-[11px] text-smoke mt-1 truncate">{p.op}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Diagrama Visual Móvel do Fluxo de Execução da ALU */}
      <div className="mb-8 p-5 md:p-6 rounded-2xl bg-parchment border border-ash">
        <div className="text-xs font-mono text-smoke uppercase tracking-wider mb-3">
          Fluxo de Sinal Elétrico no Circuito da CPU
        </div>
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
          {/* Operandos de Entrada */}
          <div className="flex-1 min-w-[140px] rounded-full border border-ash bg-white px-4 py-2.5 text-center font-mono text-xs shadow-sm">
            <div className="text-[10px] text-smoke uppercase">Entrada A (%rdi)</div>
            <div className="text-sm font-semibold text-off-black mt-0.5">0x{current.valA.toString(16).toUpperCase()}</div>
          </div>

          {/* Conector Móvel 1 */}
          <div className="hidden md:flex relative flex-1 items-center h-4">
            <div className="w-full h-[2px] bg-ash" />
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[2px] bg-lake-blue animate-pulse" />
              <div className="absolute h-2 w-2 rounded-full bg-lake-blue shadow-sm -top-[3px] animate-[ping_1.5s_infinite]" />
            </div>
            <span className="absolute right-0 text-smoke/60 text-[10px]">▸</span>
          </div>

          {/* Unidade Aritmética e Lógica (ALU) */}
          <div className="flex-1 min-w-[160px] rounded-2xl border border-lake-blue/40 bg-white p-3 text-center font-mono text-xs shadow-sm ring-1 ring-lake-blue/15">
            <div className="text-[10px] text-lake-blue font-semibold uppercase">Unidade ALU</div>
            <div className="text-xs font-bold text-off-black mt-0.5">{current.op}</div>
          </div>

          {/* Conector Móvel 2 */}
          <div className="hidden md:flex relative flex-1 items-center h-4">
            <div className="w-full h-[2px] bg-ash" />
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[2px] bg-lake-blue/70 animate-pulse" />
              <div className="absolute h-2 w-2 rounded-full bg-mint border border-ash -top-[3px] animate-[ping_1.8s_infinite]" />
            </div>
            <span className="absolute right-0 text-smoke/60 text-[10px]">▸</span>
          </div>

          {/* Barramento de Estado */}
          <div className="flex-1 min-w-[140px] rounded-full border border-ash bg-white px-4 py-2.5 text-center font-mono text-xs shadow-sm">
            <div className="text-[10px] text-smoke uppercase">Barramento de Estado</div>
            <div className="text-xs font-semibold text-lake-blue mt-0.5">Linha de %rflags</div>
          </div>
        </div>
      </div>

      {/* Grade de Cards das 4 Flags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {flags.map((f) => {
          const isActive = f.value === 1;
          return (
            <div
              key={f.code}
              className={`rounded-2xl border p-5 font-mono text-xs transition-all ${
                isActive
                  ? 'border-lake-blue bg-white shadow-sm ring-2 ring-lake-blue/20'
                  : 'border-ash bg-parchment text-graphite'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-mono text-base font-bold text-off-black">
                  {f.code}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold border ${
                  isActive
                    ? 'bg-mint/30 border-mint text-off-black'
                    : 'bg-white border-ash text-smoke'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#0e7c54] animate-pulse' : 'bg-ash'}`} />
                  {f.value}
                </span>
              </div>

              <div className="text-xs font-bold text-off-black mb-1">
                {f.name}
              </div>

              <div className="text-[11px] text-smoke leading-relaxed mb-3">
                {f.desc}
              </div>

              <div className={`pt-2.5 border-t border-ash text-[11px] font-mono leading-tight ${
                isActive ? 'text-lake-blue font-semibold' : 'text-smoke'
              }`}>
                {f.meaning}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explicação Causal do Cenário */}
      <div className="rounded-2xl border border-ash bg-parchment p-5 flex items-start gap-3.5 font-mono text-xs md:text-sm text-graphite">
        <HugeiconsIcon icon={InfoIcon} className="h-4 w-4 text-lake-blue mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-off-black">O que o hardware fez: </span>
          {current.explanation}
        </div>
      </div>
    </div>
  );
}
