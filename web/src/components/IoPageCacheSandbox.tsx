import { useState } from 'react';

// Icones acessiveis inline com zero dependencias externas
function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function RefreshCwIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function ShieldAlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

interface Block {
  id: number;
  data: string;
  source: 'BUFFERED' | 'O_DIRECT';
  persisted: boolean;
}

export default function IoPageCacheSandbox() {
  const [directMode, setDirectMode] = useState<boolean>(false);
  const [userBuffer, setUserBuffer] = useState<string>('Transacao #1042: Commit de saldo $500');
  const [pageCache, setPageCache] = useState<Block[]>([]);
  const [diskWriteCache, setDiskWriteCache] = useState<Block[]>([]);
  const [storageMedia, setStorageMedia] = useState<Block[]>([]);
  const [blockCounter, setBlockCounter] = useState<number>(1);
  const [crashState, setCrashState] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([
    'Sistema operacional e subsistema de armazenamento inicializados.',
    'Page Cache pronto (RAM do host). Controlador NVMe pronto com cache volatil de escrita.'
  ]);

  const appendLog = (msg: string) => {
    setLog((prev) => [msg, ...prev.slice(0, 4)]);
  };

  const handleWrite = () => {
    setCrashState(null);
    const newId = blockCounter;
    setBlockCounter((prev) => prev + 1);

    if (directMode) {
      appendLog('[O_DIRECT] DMA transferiu bloco #' + newId + ' contornando o Page Cache. Bloco retido na cache volatil do controlador NVMe. AVISO: ainda nao duravel na midia flash!');
      const newBlock: Block = { id: newId, data: userBuffer, source: 'O_DIRECT', persisted: false };
      setDiskWriteCache((prev) => [...prev, newBlock]);
    } else {
      appendLog('[write()] Dados copiados para o Page Cache (RAM do host). Pagina marcada como suja (dirty). Retorno imediato para a aplicacao.');
      const newBlock: Block = { id: newId, data: userBuffer, source: 'BUFFERED', persisted: false };
      setPageCache((prev) => [...prev, newBlock]);
    }
  };

  const handleBackgroundFlush = () => {
    setCrashState(null);
    if (pageCache.length === 0) {
      appendLog('[flusher] Nenhuma pagina suja pendente no Page Cache do host.');
      return;
    }

    const blockToFlush = pageCache[0];
    appendLog('[flusher] Thread em segundo plano enviou bloco #' + blockToFlush.id + ' para a cache de escrita do controlador de disco.');
    setPageCache((prev) => prev.slice(1));
    setDiskWriteCache((prev) => [...prev, blockToFlush]);
  };

  const handleFsync = () => {
    setCrashState(null);
    const dirtyInRam = pageCache.length;
    const volatileInDisk = diskWriteCache.length;
    const totalToSync = dirtyInRam + volatileInDisk;

    if (totalToSync === 0) {
      appendLog('[fsync()] Nenhuma pagina suja no host e nenhuma pendencia na cache do disco. Retorno imediato.');
      return;
    }

    appendLog('[fsync()] Bloqueando processo. Descarregando ' + dirtyInRam + ' paginas do Page Cache e emitindo comando NVMe FLUSH para ' + totalToSync + ' blocos.');

    const allBlocksToPersist: Block[] = [
      ...pageCache.map((b) => ({ ...b, persisted: true })),
      ...diskWriteCache.map((b) => ({ ...b, persisted: true }))
    ];

    setPageCache([]);
    setDiskWriteCache([]);
    setStorageMedia((prev) => [...prev, ...allBlocksToPersist]);
    appendLog('[fsync()] Barreira de escrita (NVMe Flush) confirmada pelo hardware. Blocos agora sao fisicamente duraveis.');
  };

  const handlePowerCut = () => {
    const lostFromRam = pageCache.length;
    const lostFromDiskCache = diskWriteCache.length;
    const totalLost = lostFromRam + lostFromDiskCache;

    setPageCache([]);
    setDiskWriteCache([]);

    if (totalLost > 0) {
      if (lostFromDiskCache > 0 && lostFromRam === 0) {
        setCrashState('CORRUPCAO DETECTADA: ' + lostFromDiskCache + ' bloco(s) gravado(s) com O_DIRECT foram perdidos na cache volatil do disco! O_DIRECT contorna a RAM do SO mas exige fsync() para persistencia fisica.');
        appendLog('[CRASH] Queda de energia! A cache DRAM volatil do controlador perdeu ' + lostFromDiskCache + ' bloco(s) que nao receberam barreira fsync.');
      } else {
        setCrashState('CORRUPCAO DETECTADA: ' + totalLost + ' bloco(s) volateis perdidos na queda eletrica (' + lostFromRam + ' no Page Cache e ' + lostFromDiskCache + ' na cache do disco).');
        appendLog('[CRASH] Queda de energia! ' + totalLost + ' bloco(s) em memoria volatil foram apagados sem confirmacao de fsync.');
      }
    } else {
      setCrashState('SISTEMA INTEGRO: Todos os dados haviam sido confirmados na midia flash permanente atraves de fsync().');
      appendLog('[CRASH] Queda de energia simulada. Nenhum dado perdido pois todos os blocos ja estavam gravados na midia permanente.');
    }
  };

  const handleReset = () => {
    setPageCache([]);
    setDiskWriteCache([]);
    setStorageMedia([]);
    setBlockCounter(1);
    setCrashState(null);
    setLog(['Estado reiniciado com sucesso. Todas as caches limpas.']);
  };

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm">
      {/* Header com identidade editorial Monad */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lake-blue/10 text-lake-blue">
            <DatabaseIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-lake-blue animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-lake-blue">
                Laboratorio Interativo de Persistencia
              </span>
            </div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
              Ciclo de Vida da Escrita: Do Page Cache ao NVMe com fsync
            </h4>
            <p className="font-mono text-xs text-graphite mt-0.5">
              Experimente a diferenca entre escrita em memoria volatil, bypass com O_DIRECT e durabilidade sincrona
            </p>
          </div>
        </div>

        {/* Controles de Modo e Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDirectMode(!directMode)}
            className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-mono font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 ${
              directMode
                ? 'bg-off-black text-white shadow-sm'
                : 'bg-white border border-ash text-graphite hover:text-off-black hover:border-off-black'
            }`}
          >
            {directMode ? 'Modo: O_DIRECT (Bypass Page Cache)' : 'Modo: Bufferizado Pelo Page Cache'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] px-4 py-2 rounded-full text-xs font-mono text-graphite bg-white border border-ash hover:border-off-black hover:text-off-black transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 flex items-center gap-1.5"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            Reiniciar
          </button>
        </div>
      </div>

      {/* Barra de Acoes Interativas */}
      <div className="mt-6 flex flex-wrap gap-2.5 items-center">
        <input
          type="text"
          value={userBuffer}
          onChange={(e) => setUserBuffer(e.target.value)}
          placeholder="Buffer de dados de usuario..."
          className="flex-1 min-w-[260px] min-h-[44px] px-4 py-2 text-xs font-mono rounded-full border border-ash bg-white text-off-black focus:outline-none focus:ring-2 focus:ring-lake-blue"
        />
        <button
          type="button"
          onClick={handleWrite}
          className="min-h-[44px] px-5 py-2.5 rounded-full text-xs font-mono font-medium bg-off-black text-white hover:bg-black transition-all active:scale-[0.98] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 flex items-center gap-1.5"
        >
          <PlayIcon className="h-3.5 w-3.5" />
          1. Executar write()
        </button>
        <button
          type="button"
          onClick={handleBackgroundFlush}
          disabled={pageCache.length === 0}
          className="min-h-[44px] px-5 py-2.5 rounded-full text-xs font-mono font-medium bg-white border border-ash text-off-black hover:border-off-black disabled:opacity-40 disabled:hover:border-ash transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2"
        >
          2. Flush Assincrono
        </button>
        <button
          type="button"
          onClick={handleFsync}
          className="min-h-[44px] px-5 py-2.5 rounded-full text-xs font-mono font-medium bg-mint/40 border border-mint text-off-black hover:bg-mint/60 transition-all active:scale-[0.98] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:ring-offset-2 flex items-center gap-1.5"
        >
          <ShieldCheckIcon className="h-3.5 w-3.5 text-off-black" />
          3. Executar fsync()
        </button>
        <button
          type="button"
          onClick={handlePowerCut}
          className="min-h-[44px] px-5 py-2.5 rounded-full text-xs font-mono font-medium bg-coral/20 border border-coral text-off-black hover:bg-coral/30 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 flex items-center gap-1.5"
        >
          <ZapIcon className="h-3.5 w-3.5 text-off-black" />
          Simular Queda de Luz
        </button>
      </div>

      {/* Alerta de Crash / Integridade */}
      {crashState && (
        <div
          className={`mt-5 p-4 rounded-xl text-xs font-mono border flex items-center gap-3 ${
            crashState.includes('CORRUPCAO')
              ? 'bg-coral/15 border-coral text-off-black'
              : 'bg-mint/30 border-mint text-off-black'
          }`}
        >
          {crashState.includes('CORRUPCAO') ? (
            <ShieldAlertIcon className="h-5 w-5 shrink-0 text-coral" />
          ) : (
            <ShieldCheckIcon className="h-5 w-5 shrink-0 text-forest" />
          )}
          <span className="font-medium">{crashState}</span>
        </div>
      )}

      {/* Painel de 3 Estagios Fisicos */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Estagio 1: Page Cache */}
        <div className="rounded-xl border border-ash bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-ash">
              <span className="text-xs font-mono font-medium text-off-black">
                1. Page Cache (RAM Host)
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gold/40 border border-gold/60 text-off-black font-medium">
                {pageCache.length} sujas
              </span>
            </div>
            <p className="text-xs text-smoke mt-2 mb-4 leading-relaxed">
              Memoria volatil do kernel Linux. Escritas sao concluidas em microssegundos, mas vulneraveis a interrupcao eletrica.
            </p>
          </div>

          <div className="space-y-2 min-h-[140px] flex flex-col justify-center">
            {pageCache.length === 0 ? (
              <div className="text-xs font-mono text-smoke text-center py-6 border border-dashed border-ash rounded-lg">
                {directMode ? '[O_DIRECT ativo: Page Cache contornado]' : '[Nenhuma pagina suja na RAM]'}
              </div>
            ) : (
              pageCache.map((b) => (
                <div key={b.id} className="p-3 rounded-lg border border-gold/60 bg-gold/15 text-xs font-mono">
                  <div className="flex justify-between font-medium text-off-black">
                    <span>Bloco #{b.id} (4 KiB)</span>
                    <span className="text-off-black font-semibold text-xs uppercase tracking-wider px-1.5 py-0.5 bg-gold/50 rounded">DIRTY (RAM)</span>
                  </div>
                  <div className="truncate text-graphite mt-1">{b.data}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Estagio 2: Cache Volatil do Controlador NVMe */}
        <div className="rounded-xl border border-ash bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-ash">
              <span className="text-xs font-mono font-medium text-off-black">
                2. Cache Volatil NVMe (DRAM)
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-periwinkle-mist border border-sky-blue/50 text-off-black font-medium">
                {diskWriteCache.length} na cache
              </span>
            </div>
            <p className="text-xs text-smoke mt-2 mb-4 leading-relaxed">
              DRAM interna do SSD/NVMe. O_DIRECT grava aqui diretamente via DMA. Continua volatil sem comando fsync/flush!
            </p>
          </div>

          <div className="space-y-2 min-h-[140px] flex flex-col justify-center">
            {diskWriteCache.length === 0 ? (
              <div className="text-xs font-mono text-smoke text-center py-6 border border-dashed border-ash rounded-lg">
                [Cache volatil do disco vazia]
              </div>
            ) : (
              diskWriteCache.map((b) => (
                <div key={b.id} className="p-3 rounded-lg border border-sky-blue/50 bg-periwinkle-mist/40 text-xs font-mono">
                  <div className="flex justify-between font-medium text-off-black">
                    <span>Bloco #{b.id}</span>
                    <span className="text-lake-blue font-semibold text-xs uppercase tracking-wider px-1.5 py-0.5 bg-white rounded">
                      {b.source === 'O_DIRECT' ? 'O_DIRECT (VOLATIL)' : 'FLUSHED (VOLATIL)'}
                    </span>
                  </div>
                  <div className="truncate text-graphite mt-1">{b.data}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Estagio 3: Midia Flash Permanente */}
        <div className="rounded-xl border border-ash bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-ash">
              <span className="text-xs font-mono font-medium text-off-black">
                3. Midia Flash Persistente
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-mint/40 border border-mint text-off-black font-medium">
                {storageMedia.length} permanentes
              </span>
            </div>
            <p className="text-xs text-smoke mt-2 mb-4 leading-relaxed">
              Celulas NAND nao-volateis. Dados duraveis e imunes a corte de energia apenas apos confirmacao de fsync().
            </p>
          </div>

          <div className="space-y-2 min-h-[140px] flex flex-col justify-center">
            {storageMedia.length === 0 ? (
              <div className="text-xs font-mono text-smoke text-center py-6 border border-dashed border-ash rounded-lg">
                [Nenhum dado confirmado na midia permanente]
              </div>
            ) : (
              storageMedia.map((b) => (
                <div key={b.id} className="p-3 rounded-lg border border-mint bg-mint/20 text-xs font-mono">
                  <div className="flex justify-between font-medium text-off-black">
                    <span>Bloco #{b.id}</span>
                    <span className="text-off-black font-semibold text-xs uppercase tracking-wider px-1.5 py-0.5 bg-mint rounded">DURAVEL</span>
                  </div>
                  <div className="truncate text-graphite mt-1">{b.data}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Terminal de Registro de Eventos do Kernel */}
      <div className="mt-6 rounded-xl bg-off-black p-4 text-xs font-mono text-white/90 shadow-sm">
        <span className="text-smoke uppercase tracking-wider block font-medium mb-2">
          Registro de Eventos do Sistema Operacional e Hardware:
        </span>
        <div className="space-y-1 text-white/80">
          {log.map((item, idx) => (
            <div key={idx} className="leading-relaxed">
              &gt; {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
