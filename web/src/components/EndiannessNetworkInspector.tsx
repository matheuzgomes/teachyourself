import { useState, useMemo } from 'react';

const NetworkIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <rect x="2" y="16" width="6" height="6" rx="1" />
    <rect x="16" y="16" width="6" height="6" rx="1" />
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
    <line x1="12" y1="8" x2="12" y2="12" />
  </svg>
);

const CheckmarkCircle01Icon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const TriangleAlertIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default function EndiannessNetworkInspector() {
  const [selectedPort, setSelectedPort] = useState<number>(80); // HTTP
  const [useHtons, setUseHtons] = useState<boolean>(false);

  const portPresets = [
    { port: 80, name: 'HTTP', hex: '0x0050', msb: 0x00, lsb: 0x50 },
    { port: 443, name: 'HTTPS', hex: '0x01BB', msb: 0x01, lsb: 0xbb },
    { port: 22, name: 'SSH', hex: '0x0016', msb: 0x00, lsb: 0x16 },
    { port: 53, name: 'DNS', hex: '0x0035', msb: 0x00, lsb: 0x35 },
  ];

  const currentPreset = portPresets.find((p) => p.port === selectedPort) || portPresets[0];

  const simulation = useMemo(() => {
    const { msb, lsb, port } = currentPreset;

    // Memoria do Host x86 (Little Endian: LSB no menor endereco)
    const hostRam = [lsb, msb];

    // Bytes transmitidos no cabo de rede
    const wireBytes = useHtons ? [msb, lsb] : [lsb, msb];

    // Leitura do roteador TCP/IP (Big Endian / Network Byte Order)
    const routerPort = (wireBytes[0] << 8) | wireBytes[1];
    const isSuccess = routerPort === port;

    return {
      hostRam,
      wireBytes,
      routerPort,
      isSuccess,
    };
  }, [currentPreset, useHtons]);

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2b59d1]/10 text-lake-blue">
            <NetworkIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-lake-blue">Redes e Protocolos</span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
              O Ponto de Conflito de Endianness em Redes TCP/IP
            </h4>
            <p className="font-mono text-xs text-graphite mt-0.5">
              Veja o que ocorre quando um host x86 Little Endian transmite pacotes sem a funcao htons()
            </p>
          </div>
        </div>

        {/* Toggle htons() */}
        <div className="flex rounded-full border border-ash bg-parchment p-1">
          <button
            type="button"
            onClick={() => setUseHtons(false)}
            className={`min-h-[38px] px-4 rounded-full font-mono text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
              !useHtons
                ? 'bg-[#ff9473] text-white shadow-sm'
                : 'text-graphite hover:text-off-black'
            }`}
          >
            Sem htons() (Bug)
          </button>
          <button
            type="button"
            onClick={() => setUseHtons(true)}
            className={`min-h-[38px] px-4 rounded-full font-mono text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
              useHtons
                ? 'bg-lake-blue text-white shadow-sm'
                : 'text-graphite hover:text-off-black'
            }`}
          >
            Com htons() (Correto)
          </button>
        </div>
      </div>

      {/* Target Port Selector */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-graphite mr-1 text-[11px]">Porta TCP Pretendida:</span>
        {portPresets.map((p) => (
          <button
            key={p.port}
            type="button"
            onClick={() => setSelectedPort(p.port)}
            className={`min-h-[44px] px-4 rounded-full border transition-all ${
              selectedPort === p.port
                ? 'bg-lake-blue text-white border-lake-blue font-bold shadow-sm'
                : 'bg-parchment text-graphite border-ash hover:border-off-black hover:bg-white'
            }`}
          >
            {p.name} (Porta {p.port})
          </button>
        ))}
      </div>

      {/* Physical Transmission Pipeline with Moving Packet Conduit */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        {/* Stage 1: x86 Host Memory */}
        <div className="rounded-card border border-ash bg-parchment p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-ash/70 pb-3">
            <span className="font-bold text-off-black">1. RAM do Host (x86)</span>
            <span className="rounded-full bg-white border border-ash px-2.5 py-0.5 text-[10px] text-lake-blue font-bold">
              Little Endian
            </span>
          </div>
          <p className="text-[11px] text-graphite font-sans">
            Porta alvo: <strong className="text-off-black">{currentPreset.port}</strong> ({currentPreset.hex})
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-xl bg-white p-3 text-center border border-ash shadow-sm">
              <div className="text-[10px] text-graphite">Addr 0x1000 (LSB)</div>
              <div className="text-base font-bold text-off-black mt-1">
                0x{simulation.hostRam[0].toString(16).padStart(2, '0').toUpperCase()}
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 text-center border border-ash shadow-sm">
              <div className="text-[10px] text-graphite">Addr 0x1001 (MSB)</div>
              <div className="text-base font-bold text-off-black mt-1">
                0x{simulation.hostRam[1].toString(16).padStart(2, '0').toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Stage 2: The Wire Cable with Animated Pulse */}
        <div className="rounded-card border border-ash bg-parchment p-6 space-y-3 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-ash/70 pb-3">
              <span className="font-bold text-off-black flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full animate-ping ${useHtons ? 'bg-lake-blue' : 'bg-[#ff9473]'}`} />
                2. Cabo de Rede
              </span>
              <span className="text-[10px] text-graphite">Ordem Serial</span>
            </div>
            <p className="text-[11px] text-graphite font-sans mt-2">
              {useHtons ? (
                <span className="text-[#0e7c54] font-semibold">
                  htons() converteu os bytes para Network Byte Order antes de colocar no fio.
                </span>
              ) : (
                <span className="text-[#b93815] font-semibold">
                  Bytes enviados diretamente na ordem interna da memoria x86!
                </span>
              )}
            </p>
          </div>

          {/* Wire representation */}
          <div className="rounded-xl bg-white p-4 border border-ash shadow-sm space-y-2">
            <div className="text-[10px] text-graphite flex items-center justify-between">
              <span>Sequencia Serial no Cabo:</span>
              <span className="font-mono text-[10px] text-smoke">Primeiro &rarr; Ultimo</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm font-bold tracking-wider">
              <span className={`px-2.5 py-1 rounded-lg border ${
                useHtons ? 'border-lake-blue bg-lake-blue/10 text-lake-blue' : 'border-coral bg-coral/10 text-crimson'
              }`}>
                0x{simulation.wireBytes[0].toString(16).padStart(2, '0').toUpperCase()}
              </span>
              <span className="text-graphite">&rarr;</span>
              <span className={`px-2.5 py-1 rounded-lg border ${
                useHtons ? 'border-lake-blue bg-lake-blue/10 text-lake-blue' : 'border-coral bg-coral/10 text-crimson'
              }`}>
                0x{simulation.wireBytes[1].toString(16).padStart(2, '0').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Stage 3: Network Router / TCP Socket */}
        <div className={`rounded-card border p-6 space-y-3 transition-all ${
          simulation.isSuccess
            ? 'border-ash bg-parchment'
            : 'border-[#ff9473] bg-[#ff9473]/10'
        }`}>
          <div className="flex items-center justify-between border-b border-ash/70 pb-3">
            <span className="font-bold text-off-black">3. Destino TCP/IP</span>
            <span className="rounded-full bg-white border border-ash px-2.5 py-0.5 text-[10px] text-off-black font-bold">
              Big Endian
            </span>
          </div>
          <p className="text-[11px] text-graphite font-sans">
            A pilha TCP le o primeiro byte do fluxo como MSB:
          </p>

          <div className="rounded-xl bg-white p-3.5 text-center border border-ash shadow-sm">
            <div className="text-[10px] text-graphite">Porta Lida no Roteador:</div>
            <div className={`text-xl font-serif font-normal mt-1 ${
              simulation.isSuccess ? 'text-[#0e7c54]' : 'text-[#b93815]'
            }`}>
              {simulation.routerPort} (0x{simulation.routerPort.toString(16).padStart(4, '0').toUpperCase()})
            </div>
          </div>
        </div>
      </div>

      {/* Engineering Diagnostic Banner */}
      <div className={`mt-6 rounded-card border p-5 flex items-center gap-4 text-xs font-mono ${
        simulation.isSuccess
          ? 'border-[#a7fccd] bg-[#a7fccd]/20 text-off-black'
          : 'border-[#ff9473] bg-[#ff9473]/15 text-off-black'
      }`}>
        {simulation.isSuccess ? (
          <CheckmarkCircle01Icon className="h-6 w-6 text-[#0e7c54] shrink-0" />
        ) : (
          <TriangleAlertIcon className="h-6 w-6 text-[#b93815] shrink-0" />
        )}
        <div className="font-sans leading-relaxed text-xs">
          {simulation.isSuccess ? (
            <span>
              <strong className="font-mono text-[#0e7c54] uppercase tracking-wider font-bold block mb-0.5">
                Comunicacao Estabelecida com Sucesso
              </strong>
              O pacote alcancou a porta pretendida <strong>{currentPreset.port} ({currentPreset.name})</strong>. O handshake TCP foi concluido normalmente.
            </span>
          ) : (
            <span>
              <strong className="font-mono text-[#b93815] uppercase tracking-wider font-bold block mb-0.5">
                Falha Critica de Protocolo (Connection Refused)
              </strong>
              O pacote destinava-se a porta <strong>{currentPreset.port}</strong>, mas a pilha de rede o entregou a porta fantasma <strong>{simulation.routerPort}</strong> por inversao de bytes. O pacote foi descartado.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
