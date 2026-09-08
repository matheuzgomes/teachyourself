import { useState } from 'react';

const HardDriveIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="12" x2="2" y2="12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    <line x1="6" y1="16" x2="6.01" y2="16" />
    <line x1="10" y1="16" x2="10.01" y2="16" />
  </svg>
);

const InfoIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default function MemoryRibbon() {
  const [selectedOffset, setSelectedOffset] = useState<number>(0);

  const memoryData = [
    { addr: '0x1000', hex: '0x78', bin: '01111000', dec: 120, label: 'val[0] (LSB)', varName: 'uint32_t val' },
    { addr: '0x1001', hex: '0x56', bin: '01010110', dec: 86, label: 'val[1]', varName: 'uint32_t val' },
    { addr: '0x1002', hex: '0x34', bin: '00110100', dec: 52, label: 'val[2]', varName: 'uint32_t val' },
    { addr: '0x1003', hex: '0x12', bin: '00010010', dec: 18, label: 'val[3] (MSB)', varName: 'uint32_t val' },
    { addr: '0x1004', hex: '0xAA', bin: '10101010', dec: 170, label: 'flags', varName: 'uint8_t flags' },
    { addr: '0x1005', hex: '0x00', bin: '00000000', dec: 0, label: 'padding', varName: 'Alinhamento' },
  ];

  const selected = memoryData[selectedOffset];

  return (
    <div className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <HardDriveIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
              O Modelo Físico da Memória RAM Linear
            </h4>
            <p className="font-mono text-xs text-smoke mt-0.5">
              Cada célula possui um endereço numérico único e armazena exatamente 1 Byte (8 bits)
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-graphite bg-parchment px-3.5 py-1.5 rounded-full border border-ash">
          Largura do Átomo de Memória : 8 bits
        </div>
      </div>

      {/* Fita de Memória (Memory Ribbon) */}
      <div className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {memoryData.map((cell, idx) => {
            const isSelected = idx === selectedOffset;
            const isVal32 = idx < 4;

            return (
              <button
                key={cell.addr}
                onClick={() => setSelectedOffset(idx)}
                className={`group rounded-2xl border p-3.5 text-left transition-all relative overflow-hidden min-h-[96px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                  isSelected
                    ? 'border-lake-blue bg-white ring-2 ring-lake-blue/20 shadow-sm'
                    : 'border-ash bg-parchment hover:border-lake-blue/50 hover:bg-white'
                }`}
              >
                {/* Faixa superior de variável */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isVal32 ? 'bg-lake-blue' : idx === 4 ? 'bg-coral' : 'bg-ash'
                  }`}
                />

                {/* Endereço Físico */}
                <div className="text-[11px] font-mono text-smoke flex justify-between mt-1">
                  <span>{cell.addr}</span>
                </div>

                {/* Valor Hexadecimal */}
                <div className="my-2 text-center font-mono text-xl font-bold text-off-black group-hover:text-lake-blue transition-colors">
                  {cell.hex}
                </div>

                {/* Rótulo da Célula */}
                <div className="rounded-full bg-white border border-ash px-2 py-0.5 text-center text-[10px] font-mono text-graphite truncate">
                  {cell.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel de Inspeção do Byte Selecionado */}
      <div className="rounded-2xl border border-ash bg-parchment p-5 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ash pb-3 mb-4">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4 text-lake-blue" />
            <span className="font-semibold text-off-black">Inspeção da Célula {selected.addr}</span>
            <span className="text-smoke">({selected.varName})</span>
          </div>
          <div className="text-lake-blue font-bold">Conteúdo: {selected.hex} ({selected.dec} dec)</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-smoke block text-[11px] mb-1.5">Padrão Binário de 8 Bits:</span>
            <div className="flex gap-1.5 font-mono text-sm">
              {selected.bin.split('').map((b, i) => (
                <span
                  key={i}
                  className={`h-8 w-7 rounded-xl flex items-center justify-center font-bold border ${
                    b === '1'
                      ? 'bg-mint/30 text-off-black border-mint'
                      : 'bg-white text-smoke border-ash'
                  }`}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-smoke text-[11px]">Papel no Tipo de Dado:</span>
            <span className="text-off-black font-medium mt-1">{selected.label} dentro de {selected.varName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
