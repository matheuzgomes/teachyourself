import { useState, useMemo } from 'react';

const ShieldAlertIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const OctagonAlertIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function CastingTrapVisualizer() {
  const [signedVal, setSignedVal] = useState<number>(-1);
  const [unsignedVal, setUnsignedVal] = useState<number>(0);

  const evaluation = useMemo(() => {
    const u32_promoted = signedVal >>> 0;
    const isSmallerUnsigned = u32_promoted < unsignedVal;
    const isSmallerSigned = signedVal < unsignedVal;
    const isBypass = isSmallerSigned !== isSmallerUnsigned;

    return {
      u32_promoted,
      isSmallerUnsigned,
      isSmallerSigned,
      isBypass,
      hex: `0x${u32_promoted.toString(16).padStart(8, '0').toUpperCase()}`,
      bin: u32_promoted.toString(2).padStart(32, '0'),
    };
  }, [signedVal, unsignedVal]);

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff9473]/15 text-[#b93815]">
            <ShieldAlertIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#b93815] animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#b93815]">Segurança em Hardware</span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
              A Armadilha da Promocao Implicita em C (Signed vs Unsigned)
            </h4>
            <p className="font-mono text-xs text-graphite mt-0.5">
              Por que a expressao (x &lt; y) inverte silenciosamente seu resultado no hardware
            </p>
          </div>
        </div>

        <div className="font-mono text-xs font-semibold text-[#b93815] bg-[#ff9473]/15 px-3 py-1.5 rounded-full border border-[#ff9473]/60">
          CERT C: INT31-C
        </div>
      </div>

      {/* Input Controls */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div className="rounded-card border border-ash bg-parchment p-5 space-y-2">
          <label className="text-graphite font-medium block">
            Operando com Sinal (signed int x):
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={signedVal}
              onChange={(e) => setSignedVal(parseInt(e.target.value) || 0)}
              className="min-h-[44px] w-full rounded-full border border-ash bg-white px-4 font-mono text-sm font-bold text-off-black focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none"
            />
            <span className="font-mono font-bold text-lake-blue whitespace-nowrap bg-white border border-ash px-3 py-2 rounded-full">
              {evaluation.hex}
            </span>
          </div>
        </div>

        <div className="rounded-card border border-ash bg-parchment p-5 space-y-2">
          <label className="text-graphite font-medium block">
            Operando sem Sinal (unsigned int y):
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={unsignedVal}
              onChange={(e) => setUnsignedVal(Math.max(0, parseInt(e.target.value) || 0))}
              className="min-h-[44px] w-full rounded-full border border-ash bg-white px-4 font-mono text-sm font-bold text-off-black focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none"
            />
            <span className="font-mono font-bold text-off-black whitespace-nowrap bg-white border border-ash px-3 py-2 rounded-full">
              0x{unsignedVal.toString(16).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Moving Promotion Pipeline Flow */}
      <div className="mt-6 rounded-card border border-ash bg-parchment p-6 font-mono text-xs relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-ash/70 pb-3 mb-4">
          <span className="font-bold text-off-black uppercase tracking-wider">
            Fluxo de Conversao nos Registradores:
          </span>
          <span className="flex items-center gap-1.5 text-graphite text-[11px]">
            <span className="h-2 w-2 rounded-full bg-lake-blue animate-ping" />
            Cast Implicito do Compilador
          </span>
        </div>

        {/* Conduit visualization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center items-center">
          {/* Source node */}
          <div className="rounded-card border border-ash bg-white p-4 space-y-1">
            <div className="text-[10px] text-graphite uppercase font-bold">1. Entrada Signed</div>
            <div className="text-lg font-serif font-normal text-lake-blue">x = {signedVal}</div>
            <div className="text-[10px] text-graphite">Tipo: int (32 bits com sinal)</div>
          </div>

          {/* Converter Gate */}
          <div className="rounded-card border border-lake-blue/40 bg-[#2b59d1]/5 p-4 space-y-1.5 relative">
            <span className="inline-block h-2 w-2 rounded-full bg-lake-blue animate-pulse absolute top-2 right-2" />
            <div className="text-[10px] text-lake-blue uppercase font-bold">2. Conversao Implicita</div>
            <div className="text-xs text-off-black font-semibold">Regra da Linguagem C:</div>
            <div className="text-[11px] text-graphite">signed int &rarr; unsigned int</div>
            <div className="text-[10px] text-lake-blue font-bold">Bits inalterados: {evaluation.hex}</div>
          </div>

          {/* Reinterpreted Target */}
          <div className={`rounded-card border p-4 space-y-1 ${
            evaluation.isBypass ? 'border-[#ff9473] bg-[#ff9473]/10' : 'border-ash bg-white'
          }`}>
            <div className="text-[10px] text-graphite uppercase font-bold">3. Reinterpretacao</div>
            <div className="text-lg font-serif font-normal text-off-black">
              {evaluation.u32_promoted.toLocaleString('pt-BR')} U
            </div>
            <div className="text-[10px] text-graphite">Peso do bit 31 tornou-se +2³¹</div>
          </div>
        </div>
      </div>

      {/* Side-by-side Human Expectation vs Reality */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* Human Intuition */}
        <div className="rounded-card border border-ash bg-parchment p-5 space-y-2">
          <div className="text-xs uppercase tracking-wider text-graphite font-bold">
            1. Intuicao Matematica Humana:
          </div>
          <div className="text-base text-off-black font-serif pt-1">
            {signedVal} &lt; {unsignedVal} &rarr;{' '}
            <strong className={evaluation.isSmallerSigned ? 'text-[#0e7c54] font-bold' : 'text-[#b93815] font-bold'}>
              {evaluation.isSmallerSigned ? 'VERDADEIRO' : 'FALSO'}
            </strong>
          </div>
          <p className="text-xs text-graphite font-sans leading-relaxed pt-2 border-t border-ash/70">
            O desenvolvedor presume que valores negativos sao sempre inferiores a zero e a inteiros positivos.
          </p>
        </div>

        {/* Real Hardware Execution */}
        <div className={`rounded-card border p-5 space-y-2 ${
          evaluation.isBypass
            ? 'border-[#ff9473] bg-[#ff9473]/10'
            : 'border-ash bg-parchment'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#b93815] font-bold flex items-center gap-1.5">
              <OctagonAlertIcon className="h-4 w-4 text-[#b93815]" />
              2. Execucao Real no Processador:
            </span>
            {evaluation.isBypass && (
              <span className="rounded-full bg-[#ff9473] px-2.5 py-0.5 text-[10px] font-bold text-white shadow animate-pulse">
                Bypass Ativo
              </span>
            )}
          </div>
          <div className="text-base text-off-black font-serif pt-1">
            {evaluation.u32_promoted.toLocaleString('pt-BR')}U &lt; {unsignedVal}U &rarr;{' '}
            <strong className={evaluation.isSmallerUnsigned ? 'text-[#0e7c54] font-bold' : 'text-[#b93815] font-bold'}>
              {evaluation.isSmallerUnsigned ? 'VERDADEIRO' : 'FALSO'}
            </strong>
          </div>
          <p className="text-xs text-off-black font-sans leading-relaxed pt-2 border-t border-ash/70">
            {evaluation.isBypass
              ? 'O compilador promoveu silenciosamente o valor signed para unsigned. O bit de sinal transformou-se em magnitude gigantesca, invertendo o teste de seguranca.'
              : 'Neste caso particular, a ordem dos operandos nao inverteu o sinal resultante.'}
          </p>
        </div>
      </div>
    </div>
  );
}
