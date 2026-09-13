import { useState, useMemo } from 'react';
import { useNumericInput } from './simulation/useNumericInput';

const NetworkIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <rect x="2" y="16" width="6" height="6" rx="1" />
    <rect x="16" y="16" width="6" height="6" rx="1" />
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
    <line x1="12" y1="8" x2="12" y2="12" />
  </svg>
);

type HeaderField = {
  id: string;
  name: string;
  bits: string;
  width: number;
  meaning: string;
};

const FIELDS: HeaderField[] = [
  { id: 'version', name: 'Version', bits: '4 bits', width: 4, meaning: 'Formato do cabeçalho. Vale 4 neste protocolo. Versão diferente de 4 sofre descarte silencioso.' },
  { id: 'ihl', name: 'IHL', bits: '4 bits', width: 4, meaning: 'Comprimento do cabeçalho em palavras de 32 bits. Mínimo 5, ou seja, 20 bytes. Aponta onde começam os dados.' },
  { id: 'tos', name: 'Type of Service', bits: '8 bits', width: 8, meaning: 'Qualidade desejada para a próxima rede: precedência, retardo, vazão e confiabilidade.' },
  { id: 'total', name: 'Total Length', bits: '16 bits', width: 16, meaning: 'Datagrama inteiro em octetos, cabeçalho mais dados. Todo host aceita até 576 octetos.' },
  { id: 'ident', name: 'Identification', bits: '16 bits', width: 16, meaning: 'Marca do emissor. Todos os fragmentos do mesmo datagrama carregam o mesmo valor.' },
  { id: 'flags', name: 'Flags', bits: '3 bits', width: 3, meaning: 'DF proíbe fatiar (1 proíbe). MF avisa continuação (1 tem mais fragmentos). Bit 0 reservado em zero.' },
  { id: 'offset', name: 'Fragment Offset', bits: '13 bits', width: 13, meaning: 'Posição do fragmento em unidades de 8 octetos. Primeiro fragmento em zero.' },
  { id: 'ttl', name: 'Time to Live', bits: '8 bits', width: 8, meaning: 'Orçamento de saltos. Cada ponto decrementa ao menos um. Zero destrói o datagrama.' },
  { id: 'proto', name: 'Protocol', bits: '8 bits', width: 8, meaning: 'Quem consome a carga no destino: TCP, UDP ou ICMP.' },
  { id: 'checksum', name: 'Header Checksum', bits: '16 bits', width: 16, meaning: 'Protege somente o cabeçalho e é refeito a cada salto por causa do TTL.' },
  { id: 'src', name: 'Source Address', bits: '32 bits', width: 32, meaning: 'Endereço de origem em 4 octetos de comprimento fixo.' },
  { id: 'dst', name: 'Destination Address', bits: '32 bits', width: 32, meaning: 'Endereço de destino em 4 octetos de comprimento fixo.' },
];

type Fragment = {
  n: number;
  payload: number;
  offsetUnits: number;
  offsetBytes: number;
  totalLength: number;
  mf: number;
};

export default function Ipv4HeaderInspector() {
  const [selected, setSelected] = useState<string>('ihl');
  const [datagram, setDatagram] = useState<number>(1500);
  const [mtu, setMtu] = useState<number>(576);
  const [dontFragment, setDontFragment] = useState<boolean>(false);

  const datagramInput = useNumericInput({
    value: datagram,
    onChange: setDatagram,
    min: 28,
    max: 65535,
    allowNegative: false,
  });

  const mtuInput = useNumericInput({
    value: mtu,
    onChange: setMtu,
    min: 68,
    max: 9000,
    allowNegative: false,
  });

  const active = FIELDS.find((f) => f.id === selected) || FIELDS[1];

  const fragments: Fragment[] | null = useMemo(() => {
    const header = 20;
    if (datagram < header + 8 || mtu < 68 || datagram > 65535 || mtu > 9000) return null;
    const data = datagram - header;
    const maxLoad = mtu - header;
    if (data <= maxLoad) {
      return [{ n: 1, payload: data, offsetUnits: 0, offsetBytes: 0, totalLength: datagram, mf: 0 }];
    }
    if (dontFragment) return [];
    const chunk = Math.floor(maxLoad / 8) * 8;
    const out: Fragment[] = [];
    let rest = data;
    let units = 0;
    let n = 1;
    while (rest > 0) {
      const piece = rest > chunk ? chunk : rest;
      out.push({
        n,
        payload: piece,
        offsetUnits: units,
        offsetBytes: units * 8,
        totalLength: piece + header,
        mf: rest > chunk ? 1 : 0,
      });
      rest -= piece;
      units += piece / 8;
      n += 1;
    }
    return out;
  }, [datagram, mtu, dontFragment]);

  return (
    <div className="my-10 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm">
      <div className="flex items-center gap-3 border-b border-ash pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2b59d1]/10 text-lake-blue">
          <NetworkIcon className="h-5 w-5" />
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-lake-blue">Redes e Protocolos</span>
          <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black">
            Inspetor do Cabeçalho IPv4 e Calculadora de Fragmentos
          </h4>
          <p className="font-mono text-xs text-graphite mt-0.5">
            Clique em um campo para ler sua função. Ajuste tamanho e MTU para ver o fatiamento.
          </p>
        </div>
      </div>

      <ol className="mt-6 space-y-2 text-xs md:text-sm text-graphite leading-relaxed list-decimal list-inside">
        <li><strong className="text-off-black">Passo 1:</strong> clique nos campos do mapa para entender o que cada grupo do cabeçalho mede, protege ou orçamenta.</li>
        <li><strong className="text-off-black">Passo 2:</strong> ajuste o tamanho do datagrama e o MTU para ver quantos fragmentos nascem e onde cada um se posiciona.</li>
        <li><strong className="text-off-black">Passo 3:</strong> ative DF e observe o descarte, depois confira que a soma dos dados mais 20 bytes remonta o total original.</li>
      </ol>

      <div className="mt-6 flex flex-wrap gap-1.5" role="group" aria-label="Campos do cabeçalho IPv4">
        {FIELDS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelected(f.id)}
            aria-pressed={selected === f.id}
            className={`min-h-[44px] px-3 rounded-xl border font-mono text-xs transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
              selected === f.id
                ? 'bg-lake-blue text-white border-lake-blue font-bold shadow-sm'
                : 'bg-parchment text-graphite border-ash hover:border-off-black hover:bg-white'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-ash bg-parchment p-5">
        <div className="font-mono text-xs text-lake-blue font-bold">{active.name} ({active.bits})</div>
        <p className="mt-1 text-sm text-off-black leading-relaxed">{active.meaning}</p>
      </div>

      {/* Presets Didáticos de Fragmentação */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-smoke text-[11px]">Cenários de Rede:</span>
        {[
          { label: '1500 B / MTU 576 (Padrão Internet)', data: 1500, mtuVal: 576, df: false },
          { label: '4000 B / MTU 1500 (Ethernet Típica)', data: 4000, mtuVal: 1500, df: false },
          { label: '1400 B / MTU 1500 (Sem Fragmentação)', data: 1400, mtuVal: 1500, df: false },
          { label: '1500 B / MTU 576 (Bloqueio DF=1)', data: 1500, mtuVal: 576, df: true },
        ].map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setDatagram(preset.data);
              setMtu(preset.mtuVal);
              setDontFragment(preset.df);
            }}
            aria-pressed={datagram === preset.data && mtu === preset.mtuVal && dontFragment === preset.df}
            className={`flex min-h-[44px] items-center rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
              datagram === preset.data && mtu === preset.mtuVal && dontFragment === preset.df
                ? 'bg-lake-blue text-white border-lake-blue shadow-2xs font-bold'
                : 'bg-white text-graphite border-ash hover:border-off-black hover:text-off-black'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <label htmlFor="ipv4-datagram" className="rounded-2xl border border-ash bg-parchment p-4 text-xs font-mono text-graphite block">
          Datagrama total (bytes)
          <input
            id="ipv4-datagram"
            type="text"
            inputMode="numeric"
            value={datagramInput.value}
            onChange={datagramInput.onChange}
            onBlur={datagramInput.onBlur}
            onKeyDown={datagramInput.onKeyDown}
            aria-label="Tamanho total do datagrama em bytes (28 a 65535)"
            className="mt-2 w-full rounded-xl border border-ash bg-white px-3 py-2.5 min-h-[44px] text-sm text-off-black focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none font-bold"
          />
        </label>
        <label htmlFor="ipv4-mtu" className="rounded-2xl border border-ash bg-parchment p-4 text-xs font-mono text-graphite block">
          MTU do enlace (bytes)
          <input
            id="ipv4-mtu"
            type="text"
            inputMode="numeric"
            value={mtuInput.value}
            onChange={mtuInput.onChange}
            onBlur={mtuInput.onBlur}
            onKeyDown={mtuInput.onKeyDown}
            aria-label="MTU do enlace em bytes (68 a 9000)"
            className="mt-2 w-full rounded-xl border border-ash bg-white px-3 py-2.5 min-h-[44px] text-sm text-off-black focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none font-bold"
          />
        </label>
        <button
          type="button"
          onClick={() => setDontFragment((v) => !v)}
          aria-pressed={dontFragment}
          className={`rounded-2xl border p-4 text-xs font-mono text-left transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
            dontFragment ? 'border-coral bg-coral/10 text-off-black' : 'border-ash bg-parchment text-graphite hover:bg-white'
          }`}
        >
          <span className="font-bold block">Flag DF: {dontFragment ? '1 (proibido fatiar)' : '0 (pode fatiar)'}</span>
          <span className="mt-1 block">Toque para alternar e ver o descarte.</span>
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ash">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="bg-parchment text-graphite text-left">
              <th className="px-4 py-3 font-medium">Fragmento</th>
              <th className="px-4 py-3 font-medium">Dados</th>
              <th className="px-4 py-3 font-medium">Offset (x8)</th>
              <th className="px-4 py-3 font-medium">Offset (bytes)</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">MF</th>
            </tr>
          </thead>
          <tbody className="bg-white text-off-black">
            {fragments === null && (
              <tr><td colSpan={6} className="px-4 py-4 text-graphite">Valores fora da faixa: datagrama entre 28 e 65535, MTU entre 68 e 9000.</td></tr>
            )}
            {fragments !== null && fragments.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-4 text-crimson font-bold">DF igual a 1 e pacote maior que o MTU: datagrama descartado, sem fatiamento.</td></tr>
            )}
            {fragments !== null && fragments.map((f) => (
              <tr key={f.n} className="border-t border-ash/60">
                <td className="px-4 py-2.5 font-bold">{f.n}</td>
                <td className="px-4 py-2.5">{f.payload}</td>
                <td className="px-4 py-2.5">{f.offsetUnits}</td>
                <td className="px-4 py-2.5">{f.offsetBytes}</td>
                <td className="px-4 py-2.5">{f.totalLength}</td>
                <td className="px-4 py-2.5">{f.mf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 rounded-2xl border border-mint bg-mint/20 p-5 text-xs md:text-sm text-off-black leading-relaxed">
        <strong className="font-mono uppercase tracking-wider text-emerald-800 block mb-1">Conclusão</strong>
        O cabeçalho fixo permite a qualquer hardware ler o mesmo envelope, o offset em múltiplos de 8 reposiciona cada fatia sem ambiguidade, e o destino remonta tudo pela quádrupla identificação, origem, destino e protocolo. Com 1500 bytes e MTU 576, nascem 552 mais 552 mais 376, com offsets 0, 69 e 138.
      </p>
    </div>
  );
}
