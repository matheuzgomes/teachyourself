import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CalculatorIcon, ZapIcon, DatabaseIcon } from '@hugeicons/core-free-icons';
import { useNumericInput } from './simulation/useNumericInput';

export default function AddressingModeVisualizer() {
  const [mode, setMode] = useState<'memory' | 'leaq'>('memory');
  const [imm, setImm] = useState(8);
  const baseVal = 0x1000;
  const [indexVal, setIndexVal] = useState(2);
  const [scale, setScale] = useState(4);

  const immInput = useNumericInput({
    value: imm,
    onChange: setImm,
    allowNegative: true,
  });

  const indexInput = useNumericInput({
    value: indexVal,
    onChange: setIndexVal,
    allowNegative: true,
  });

  // Cálculo do endereço efetivo
  const scaledIndex = indexVal * scale;
  const effectiveAddress = baseVal + scaledIndex + imm;

  return (
    <div className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <HugeiconsIcon icon={CalculatorIcon} className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
              Calculadora do Circuito de Endereçamento e o Truque do leaq
            </h4>
            <p className="font-mono text-xs text-smoke mt-0.5">
              Como o hardware combina registradores, escala e deslocamento em 1 ciclo de clock
            </p>
          </div>
        </div>

        {/* Alternância de Modo */}
        <div className="flex rounded-full border border-ash bg-parchment p-1">
          <button
            type="button"
            onClick={() => setMode('memory')}
            aria-pressed={mode === 'memory'}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-mono font-medium transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
              mode === 'memory'
                ? 'bg-white text-off-black shadow-sm border border-ash'
                : 'text-smoke hover:text-off-black'
            }`}
          >
            <HugeiconsIcon icon={DatabaseIcon} className="h-3.5 w-3.5 text-lake-blue" />
            <span>Acesso à Memória (movq)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('leaq')}
            aria-pressed={mode === 'leaq'}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-mono font-medium transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
              mode === 'leaq'
                ? 'bg-white text-off-black shadow-sm border border-ash'
                : 'text-smoke hover:text-off-black'
            }`}
          >
            <HugeiconsIcon icon={ZapIcon} className="h-3.5 w-3.5 text-lake-blue" />
            <span>O Truque Aritmético (leaq)</span>
          </button>
        </div>
      </div>

      {/* Sintaxe Assembly Visualizada : Cartao Editorial Branco */}
      <div className="rounded-2xl border border-ash bg-white text-off-black p-5 md:p-6 mb-6 font-mono text-center shadow-sm">
        <div className="text-xs text-smoke mb-2 uppercase tracking-wider font-medium">Instrução de Máquina Executada:</div>
        <div className="text-base md:text-xl font-bold tracking-wide text-off-black">
          {mode === 'memory' ? (
            <>
              <span className="text-crimson font-medium">movq</span>{' '}
              <span className="text-lake-blue">{imm}</span>
              <span className="text-graphite">(</span>
              <span className="text-off-black font-semibold">%rbx</span>,{' '}
              <span className="text-off-black font-semibold">%rcx</span>,{' '}
              <span className="text-coral font-semibold">{scale}</span>
              <span className="text-graphite">), </span>
              <span className="text-lake-blue font-semibold">%rax</span>
            </>
          ) : (
            <>
              <span className="text-crimson font-medium">leaq</span>{' '}
              <span className="text-lake-blue">{imm}</span>
              <span className="text-graphite">(</span>
              <span className="text-off-black font-semibold">%rbx</span>,{' '}
              <span className="text-off-black font-semibold">%rcx</span>,{' '}
              <span className="text-coral font-semibold">{scale}</span>
              <span className="text-graphite">), </span>
              <span className="text-lake-blue font-semibold">%rax</span>
            </>
          )}
        </div>
        <div className="text-xs text-smoke mt-2.5">
          Fórmula de Hardware: <span className="text-off-black font-medium">Imm + Base + (Index &times; Scale)</span>
        </div>
      </div>

      {/* Controles Interativos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Deslocamento (Imm) */}
        <div className="rounded-2xl border border-ash bg-parchment p-3.5">
          <label htmlFor="addr-imm" className="text-xs font-mono text-smoke block mb-1">
            Deslocamento (Imm):
          </label>
          <input
            id="addr-imm"
            type="text"
            inputMode="numeric"
            value={immInput.value}
            onChange={immInput.onChange}
            onBlur={immInput.onBlur}
            onKeyDown={immInput.onKeyDown}
            aria-label="Deslocamento imediato em bytes"
            className="w-full rounded-xl bg-white border border-ash px-3 py-1.5 font-mono text-xs text-off-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue font-bold"
          />
          <span className="text-[10px] font-mono text-smoke block mt-1.5">Offset constante em bytes</span>
        </div>

        {/* Base (%rbx) */}
        <div className="rounded-2xl border border-ash bg-parchment p-3.5">
          <label className="text-xs font-mono text-smoke block mb-1">Base (%rbx):</label>
          <div className="font-mono text-xs font-bold text-off-black bg-white rounded-xl border border-ash px-3 py-1.5">
            0x{baseVal.toString(16).toUpperCase()} ({baseVal})
          </div>
          <span className="text-[10px] font-mono text-smoke block mt-1.5">Endereço base do array</span>
        </div>

        {/* Índice (%rcx) */}
        <div className="rounded-2xl border border-ash bg-parchment p-3.5">
          <label htmlFor="addr-index" className="text-xs font-mono text-smoke block mb-1">
            Índice (%rcx):
          </label>
          <input
            id="addr-index"
            type="text"
            inputMode="numeric"
            value={indexInput.value}
            onChange={indexInput.onChange}
            onBlur={indexInput.onBlur}
            onKeyDown={indexInput.onKeyDown}
            aria-label="Índice de elemento no array"
            className="w-full rounded-xl bg-white border border-ash px-3 py-1.5 font-mono text-xs text-off-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue font-bold"
          />
          <span className="text-[10px] font-mono text-smoke block mt-1.5">Posição do elemento (i)</span>
        </div>

        {/* Escala (Scale: 1, 2, 4, 8) */}
        <div className="rounded-2xl border border-ash bg-parchment p-3.5">
          <label className="text-xs font-mono text-smoke block mb-1">Escala (Scale):</label>
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 4, 8].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                aria-pressed={scale === s}
                className={`flex items-center justify-center min-h-[44px] rounded-lg py-1 font-mono text-xs font-bold border transition-all ${
                  scale === s
                    ? 'bg-lake-blue text-white border-lake-blue shadow-sm'
                    : 'bg-white border-ash text-graphite hover:border-lake-blue hover:text-off-black'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-mono text-smoke block mt-1.5">Largura do tipo (1, 2, 4 ou 8)</span>
        </div>
      </div>

      {/* Diagrama de Cálculo na Unidade de Controle */}
      <div className="rounded-2xl border border-ash bg-parchment p-6">
        <div className="text-xs font-mono text-smoke uppercase tracking-wider mb-3">Cálculo Executado pela Unidade de Geração de Endereços (AGU):</div>

        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs py-4 bg-white rounded-2xl border border-ash shadow-sm">
          <div className="rounded-xl bg-parchment border border-ash px-3 py-1.5 text-center">
            <span className="text-[10px] text-smoke block">Base</span>
            <span className="text-off-black font-bold">{baseVal}</span>
          </div>
          <span className="text-smoke">+</span>
          <div className="rounded-xl bg-parchment border border-ash px-3 py-1.5 text-center">
            <span className="text-[10px] text-smoke block">Index &times; Scale</span>
            <span className="text-off-black font-bold">{indexVal} &times; {scale} = {scaledIndex}</span>
          </div>
          <span className="text-smoke">+</span>
          <div className="rounded-xl bg-parchment border border-ash px-3 py-1.5 text-center">
            <span className="text-[10px] text-smoke block">Deslocamento</span>
            <span className="text-off-black font-bold">{imm}</span>
          </div>
          <span className="text-lake-blue font-bold">&rarr;</span>
          <div className="rounded-xl bg-lake-blue/10 border border-lake-blue/30 px-4 py-1.5 text-center">
            <span className="text-[10px] text-lake-blue font-semibold block">Resultado Calculado</span>
            <span className="text-off-black font-bold text-sm">
              0x{effectiveAddress.toString(16).toUpperCase()} ({effectiveAddress})
            </span>
          </div>
        </div>

        {/* Consequência Operacional de Acordo com o Modo */}
        <div className="mt-4 p-4 rounded-2xl border border-ash bg-white text-xs md:text-sm font-mono leading-relaxed transition-all">
          {mode === 'memory' ? (
            <div className="text-graphite">
              <strong className="text-off-black font-semibold">No movq (Acesso à Memória): </strong>
              O processador envia o endereço <code>0x{effectiveAddress.toString(16).toUpperCase()}</code> para o barramento de memória DRAM/Cache, lê os 8 bytes gravados nessa posição da RAM e copia esse valor para dentro do registrador <code>%rax</code>.
            </div>
          ) : (
            <div className="text-graphite">
              <strong className="text-lake-blue font-semibold">No leaq (O Truque Aritmético): </strong>
              A CPU <strong className="text-off-black">não toca na memória RAM</strong>! Ela usa apenas o circuito somador de endereços para calcular o valor aritmético <code>{effectiveAddress}</code> e salva esse número diretamente em <code>%rax</code>. Compiladores usam o <code>leaq</code> para fazer contas como <code>x * 3</code> ou <code>x * 5 + 7</code> em 1 ciclo de clock!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
