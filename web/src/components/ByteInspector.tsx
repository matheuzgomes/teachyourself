import { useState, useMemo } from 'react';

const CpuIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);

const Layers01Icon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

interface ByteInspectorProps {
  initialHex?: string;
  baseAddress?: string;
}

export default function ByteInspector({
  initialHex = '0x12345678',
  baseAddress = '0x1000',
}: ByteInspectorProps) {
  const [inputVal, setInputVal] = useState<string>(initialHex);
  const [isLittleEndian, setIsLittleEndian] = useState<boolean>(true);

  // Converte entrada para 4 bytes (32-bit)
  const rawBytes = useMemo(() => {
    let num = 0;
    try {
      if (inputVal.startsWith('0x') || inputVal.startsWith('0X')) {
        num = parseInt(inputVal, 16) >>> 0;
      } else {
        num = parseInt(inputVal, 10) >>> 0;
      }
    } catch {
      num = 0;
    }
    if (isNaN(num)) num = 0x12345678;

    // Bytes em ordem aritmética (MSB para LSB: b3, b2, b1, b0)
    const b3 = (num >>> 24) & 0xff;
    const b2 = (num >>> 16) & 0xff;
    const b1 = (num >>> 8) & 0xff;
    const b0 = num & 0xff;

    return { b3, b2, b1, b0, num };
  }, [inputVal]);

  // Layout físico na RAM
  const memoryCells = useMemo(() => {
    const base = parseInt(baseAddress, 16);
    const { b3, b2, b1, b0 } = rawBytes;

    if (isLittleEndian) {
      // Little Endian: LSB no menor endereço
      return [
        { addr: `0x${base.toString(16)}`, val: b0, role: 'LSB', weight: '2^0', cycle: 'Endereço base (ponta leve aqui)' },
        { addr: `0x${(base + 1).toString(16)}`, val: b1, role: 'Byte 1', weight: '2^8', cycle: 'Base + 1' },
        { addr: `0x${(base + 2).toString(16)}`, val: b2, role: 'Byte 2', weight: '2^16', cycle: 'Base + 2' },
        { addr: `0x${(base + 3).toString(16)}`, val: b3, role: 'MSB', weight: '2^24', cycle: 'Base + 3' },
      ];
    } else {
      // Big Endian: MSB no menor endereço
      return [
        { addr: `0x${base.toString(16)}`, val: b3, role: 'MSB', weight: '2^24', cycle: 'Endereço base (ponta pesada aqui)' },
        { addr: `0x${(base + 1).toString(16)}`, val: b2, role: 'Byte 2', weight: '2^16', cycle: 'Base + 1' },
        { addr: `0x${(base + 2).toString(16)}`, val: b1, role: 'Byte 1', weight: '2^8', cycle: 'Base + 2' },
        { addr: `0x${(base + 3).toString(16)}`, val: b0, role: 'LSB', weight: '2^0', cycle: 'Base + 3 (ponta leve aqui)' },
      ];
    }
  }, [rawBytes, isLittleEndian, baseAddress]);

  return (
    <div className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all">
      {/* Header do Simulador */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <CpuIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
              Simulador Interativo : Memória RAM e Endianness
            </h4>
            <p className="font-mono text-xs text-smoke mt-0.5">
              Veja a CPU alocando e lendo bytes em tempo real no hardware
            </p>
          </div>
        </div>

        {/* Toggle Endianness */}
        <div className="flex rounded-full border border-ash bg-parchment p-1">
          <button
            type="button"
            onClick={() => setIsLittleEndian(true)}
            aria-pressed={isLittleEndian}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-mono font-medium transition-all min-h-[44px] ${
              isLittleEndian
                ? 'bg-lake-blue text-white shadow-sm'
                : 'text-smoke hover:text-off-black'
            }`}
          >
            Little Endian (x86 / ARM)
          </button>
          <button
            type="button"
            onClick={() => setIsLittleEndian(false)}
            aria-pressed={!isLittleEndian}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-mono font-medium transition-all min-h-[44px] ${
              !isLittleEndian
                ? 'bg-lake-blue text-white shadow-sm'
                : 'text-smoke hover:text-off-black'
            }`}
          >
            Big Endian (Rede TCP/IP)
          </button>
        </div>
      </div>

      {/* Controles de Entrada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="text-xs font-mono text-smoke">Valor de Entrada (Hexadecimal ou Decimal):</label>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ash bg-parchment px-3.5 py-2 font-mono text-xs text-off-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-lake-blue"
            placeholder="0x12345678"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-smoke">Endereço Base do Ponteiro:</label>
          <input
            type="text"
            value={baseAddress}
            disabled
            className="mt-1 w-full rounded-xl border border-ash bg-parchment/60 px-3.5 py-2 font-mono text-xs text-smoke"
          />
        </div>
        <div className="flex items-end">
          <div className="w-full rounded-xl bg-parchment p-2.5 border border-ash text-center font-mono">
            <span className="text-xs text-smoke">Valor Decimal 32 bits: </span>
            <span className="text-xs font-bold text-off-black">{rawBytes.num.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Grid de Células de Memória RAM */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-smoke">
            Layout Físico dos Bytes na Memória RAM
          </span>
          <span className="text-xs font-mono text-lake-blue flex items-center gap-1">
            <Layers01Icon className="h-3.5 w-3.5" /> Ponteiro aponta para: {baseAddress}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {memoryCells.map((cell, idx) => {
            const isFirst = idx === 0;
            const isLsb = cell.role === 'LSB';
            const isMsb = cell.role === 'MSB';

            return (
              <div
                key={cell.addr}
                className={`relative rounded-2xl border p-4 font-mono transition-all ${
                  isFirst
                    ? 'border-lake-blue bg-white shadow-sm ring-2 ring-lake-blue/20'
                    : 'border-ash bg-parchment'
                }`}
              >
                {/* Badge de Endereço */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-smoke font-medium">{cell.addr}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                      isLsb
                        ? 'bg-mint/30 text-off-black border-mint'
                        : isMsb
                        ? 'bg-coral/20 text-off-black border-coral'
                        : 'bg-white text-smoke border-ash'
                    }`}
                  >
                    {cell.role}
                  </span>
                </div>

                {/* Valor do Byte em Hexa */}
                <div className="my-3 text-center">
                  <div className="font-mono text-2xl font-bold tracking-wider text-off-black">
                    0x{cell.val.toString(16).padStart(2, '0').toUpperCase()}
                  </div>
                  <div className="text-[11px] text-smoke mt-0.5">
                    Bin: {cell.val.toString(2).padStart(8, '0')}
                  </div>
                </div>

                {/* Diagnóstico do Ciclo de Clock */}
                <div className="pt-2.5 border-t border-ash text-xs text-center">
                  <div className="text-lake-blue font-medium text-[11px]">{cell.cycle}</div>
                  <div className="text-[10px] text-smoke mt-0.5">Peso: {cell.weight}</div>
                </div>

                {/* Seta do Ponteiro Base */}
                {isFirst && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-lake-blue px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                    *ptr Base
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Explicação da Mecânica em Tempo Real */}
      <div className="rounded-2xl bg-parchment p-5 border border-ash font-mono text-xs md:text-sm text-graphite leading-relaxed">
        {isLittleEndian ? (
          <div>
            <strong className="text-off-black font-semibold">Leitura por tipo menor sem deslocamento: </strong>
            O ponteiro base <code className="text-lake-blue">{baseAddress}</code> contém o <strong className="text-off-black">LSB (0x{rawBytes.b0.toString(16).padStart(2, '0').toUpperCase()})</strong>. Ler esse mesmo endereço como tipo mais estreito entrega direto a porção de menor peso, sem somar deslocamento. Somadores modernos operam sobre a palavra inteira em paralelo: nenhuma ordem é mais rápida por causa do transporte.
          </div>
        ) : (
          <div>
            <strong className="text-off-black font-semibold">Ordem da rede, endereço da ponta pesada: </strong>
            O ponteiro base <code className="text-lake-blue">{baseAddress}</code> contém o <strong className="text-off-black">MSB (0x{rawBytes.b3.toString(16).padStart(2, '0').toUpperCase()})</strong>. Para ler só os bytes leves a partir da base, o compilador soma o deslocamento até <code className="text-lake-blue">0x1003</code>. É a ordem padronizada na rede (network byte order).
          </div>
        )}
      </div>
    </div>
  );
}
