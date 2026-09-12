import { useState, useMemo } from 'react';

const RouteIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="3" />
    <circle cx="18" cy="5" r="3" />
    <path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12" />
  </svg>
);

const HOPS = ['Você', 'Roteador 1', 'Roteador 2', 'Roteador 3', 'Roteador 4', 'Destino'];

export default function TtlTracerouteSimulator() {
  const [ttl, setTtl] = useState<number>(2);
  const [sent, setSent] = useState<boolean>(false);

  const trace = useMemo(() => {
    const rows: { hop: number; name: string; ttlIn: number | null; event: string }[] = [];
    for (let i = 1; i <= 5; i++) {
      const ttlIn = ttl - (i - 1);
      if (ttlIn <= 0) break;
      const after = ttlIn - 1;
      rows.push({
        hop: i,
        name: HOPS[i],
        ttlIn,
        event: after === 0 ? 'TTL zerou: devolve ICMP Time Exceeded' : `Decrementa para ${after} e repassa`,
      });
    }
    const reached = ttl >= 5;
    return { rows, reached };
  }, [ttl]);

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm">
      <div className="flex items-center gap-3 border-b border-ash pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2b59d1]/10 text-lake-blue">
          <RouteIcon className="h-5 w-5" />
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-lake-blue">Redes e Protocolos</span>
          <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
            A Morte Anunciada do Pacote: TTL Salto a Salto
          </h4>
          <p className="font-mono text-xs text-graphite mt-0.5">
            Escolha o TTL inicial e envie a sonda por uma rota de 4 roteadores até o destino.
          </p>
        </div>
      </div>

      <ol className="mt-6 space-y-2 text-xs md:text-sm text-graphite leading-relaxed list-decimal list-inside">
        <li><strong className="text-off-black">Passo 1:</strong> ajuste o TTL inicial e observe quantos saltos a sonda alcança antes de zerar.</li>
        <li><strong className="text-off-black">Passo 2:</strong> envie com TTL 1, 2 e 3 e leia quem devolve Time Exceeded: é assim que o traceroute mapeia a rota.</li>
        <li><strong className="text-off-black">Passo 3:</strong> envie com TTL 5 ou mais e veja a sonda alcançar o destino em vez de morrer no caminho.</li>
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 rounded-2xl border border-ash bg-parchment px-4 py-3 font-mono text-xs text-graphite">
          TTL inicial
          <input
            type="range"
            min={1}
            max={8}
            value={ttl}
            onChange={(e) => { setTtl(Number(e.target.value)); setSent(false); }}
            className="w-40 accent-[#2b59d1]"
            aria-label="TTL inicial da sonda"
          />
          <span className="rounded-xl bg-white border border-ash px-3 py-1.5 text-sm font-bold text-off-black min-w-[3rem] text-center">{ttl}</span>
        </label>
        <button
          type="button"
          onClick={() => setSent(true)}
          className="min-h-[44px] px-6 rounded-full bg-off-black text-white font-mono text-xs uppercase tracking-wider font-medium hover:bg-black transition-all focus-visible:ring-2 focus-visible:ring-off-black focus-visible:outline-none"
        >
          Enviar sonda
        </button>
        {!sent && (
          <span className="font-mono text-xs text-smoke">A sonda ainda não saiu. Escolha o TTL e envie.</span>
        )}
      </div>

      {sent && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-ash">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-parchment text-graphite text-left">
                <th className="px-4 py-3 font-medium">Salto</th>
                <th className="px-4 py-3 font-medium">Ponto da rota</th>
                <th className="px-4 py-3 font-medium">TTL na chegada</th>
                <th className="px-4 py-3 font-medium">Evento</th>
              </tr>
            </thead>
            <tbody className="bg-white text-off-black">
              <tr className="border-b border-ash/60">
                <td className="px-4 py-2.5 font-bold">0</td>
                <td className="px-4 py-2.5">Você</td>
                <td className="px-4 py-2.5">{ttl} (definido)</td>
                <td className="px-4 py-2.5">Emite a sonda</td>
              </tr>
              {trace.rows.map((r) => (
                <tr key={r.hop} className="border-t border-ash/60">
                  <td className="px-4 py-2.5 font-bold">{r.hop}</td>
                  <td className="px-4 py-2.5">{r.name}</td>
                  <td className="px-4 py-2.5">{r.ttlIn}</td>
                  <td className={`px-4 py-2.5 ${r.event.startsWith('TTL zerou') ? 'text-[#b93815] font-bold' : ''}`}>{r.event}</td>
                </tr>
              ))}
              {trace.reached && (
                <tr className="border-t border-ash/60 bg-[#a7fccd]/20">
                  <td className="px-4 py-2.5 font-bold">5</td>
                  <td className="px-4 py-2.5">Destino</td>
                  <td className="px-4 py-2.5">{ttl - 4}</td>
                  <td className="px-4 py-2.5 text-[#0e7c54] font-bold">Sonda entregue: destino responde Echo Reply</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 rounded-2xl border border-[#a7fccd] bg-[#a7fccd]/20 p-5 text-xs md:text-sm text-off-black leading-relaxed">
        <strong className="font-mono uppercase tracking-wider text-[#0e7c54] block mb-1">Conclusao</strong>
        O TTL nunca aumenta e só diminui: cada roteador decrementa ao menos um e zero significa destruição com aviso ICMP. O traceroute explora exatamente isso, enviando sondas com TTL 1, 2 e 3 para forçar cada roteador a se identificar.
      </p>
    </div>
  );
}
