import { useState } from "react";

export default function RegisterBankCard() {
  const [writeEnable, setWriteEnable] = useState(1);
  const [inputHex, setInputHex] = useState("0x000000000000002A");
  const [storedHex, setStoredHex] = useState("0x0000000000000000");
  const [lastClockAction, setLastClockAction] = useState("Aguardando borda de subida do relógio...");

  const pulseClock = () => {
    if (writeEnable === 1) {
      setStoredHex(inputHex);
      setLastClockAction(`Gravação Bem-Sucedida: Borda de subida capturou ${inputHex} no modelo de 64 flip-flops paralelos.`);
    } else {
      setLastClockAction("Gravação Bloqueada: Write Enable = 0 isolou os flip-flops. O valor armazenado permaneceu intacto.");
    }
  };

  const valBigInt = BigInt(storedHex);
  const getBit = (index: number): number => {
    try {
      return Number((valBigInt >> BigInt(index)) & 1n);
    } catch {
      return 0;
    }
  };

  return (
    <div
      data-visual-model="VIS-08-REGISTER-BANK-64BIT"
      className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div>
          <span className="inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-periwinkle-mist text-lake-blue border border-lake-blue/20">
            VIS-08: Arquitetura de Registradores de CPU
          </span>
          <h3 className="mt-2 font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
            Banco de Registradores de 64 bits: Arranjo Paralelo com Write Enable
          </h3>
          <p className="mt-1 font-mono text-xs text-smoke">
            Modelo de um registrador (%rax): não representa o banco completo nem os registradores físicos de um processador real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWriteEnable(writeEnable === 1 ? 0 : 1)}
            className={`min-h-[44px] rounded-full px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
              writeEnable === 1
                ? "bg-lake-blue text-white border-lake-blue shadow-sm"
                : "bg-parchment text-graphite border-ash hover:border-lake-blue/50 hover:text-off-black"
            }`}
          >
            {writeEnable === 1 ? "Write Enable (WE) = 1" : "Write Enable (WE) = 0"}
          </button>
          <button
            type="button"
            onClick={pulseClock}
            className="min-h-[44px] rounded-full bg-off-black text-white px-5 py-2 font-mono text-xs md:text-sm font-bold hover:bg-graphite transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
          >
            Disparar Clock (CLK 0-&gt;1)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-graphite">
                Arranjo Modelo de 64 Flip-Flops D (Um Registrador)
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-lake-blue">
                Registrador %rax = {storedHex}
              </span>
            </div>

            <svg viewBox="0 0 620 260" className="w-full h-auto select-none" style={{ maxHeight: "260px" }}>
              {/* Barramento de Controle: Linha de Clock Compartilhada */}
              <text x="40" y="22" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#242424">
                Árvore de Clock Compartilhada (CLK Tree)
              </text>
              <line x1="40" y1="35" x2="560" y2="35" stroke="#242424" strokeWidth="2.5" />
              <circle cx="40" cy="35" r="4" fill="#242424" />

              {/* Linha de Write Enable */}
              <text x="40" y="62" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={writeEnable === 1 ? "#2b59d1" : "#615e5d"}>
                Habilitação de Escrita (Write Enable, WE = {writeEnable})
              </text>
              <line x1="40" y1="75" x2="560" y2="75" stroke={writeEnable === 1 ? "#2b59d1" : "#615e5d"} strokeWidth="2" />
              <circle cx="40" cy="75" r="4" fill={writeEnable === 1 ? "#2b59d1" : "#615e5d"} />

              {/* Representação Modular dos 64 Flip-Flops em Blocos */}
              {[
                { label: "Bit 63", x: 50,  val: getBit(63) },
                { label: "Bit 62", x: 180, val: getBit(62) },
                { label: "Bit 1",  x: 310, val: getBit(1) },
                { label: "Bit 0",  x: 440, val: getBit(0) }
              ].map((cell, idx) => (
                <g key={idx}>
                  <rect
                    x={cell.x}
                    y="92"
                    width="100"
                    height="94"
                    rx="6"
                    fill="#ffffff"
                    stroke="#242424"
                    strokeWidth="1.5"
                  />
                  <text x={cell.x + 50} y="115" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">
                    {cell.label}
                  </text>
                  <text x={cell.x + 50} y="132" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#615e5d">
                    Flip-Flop D
                  </text>
                  <text x={cell.x + 50} y="165" textAnchor="middle" fontFamily="monospace" fontSize="18" fontWeight="bold" fill="#2b59d1">
                    {cell.val}
                  </text>

                  {/* Derivação de Clock */}
                  <line x1={cell.x + 28} y1="35" x2={cell.x + 28} y2="92" stroke="#242424" strokeWidth="1.5" />
                  <circle cx={cell.x + 28} cy="35" r="3" fill="#242424" />

                  {/* Derivação de WE */}
                  <line x1={cell.x + 72} y1="75" x2={cell.x + 72} y2="92" stroke={writeEnable === 1 ? "#2b59d1" : "#615e5d"} strokeWidth="1.5" />
                  <circle cx={cell.x + 72} cy="75" r="3" fill={writeEnable === 1 ? "#2b59d1" : "#615e5d"} />

                  {/* Saída para o Barramento de Leitura */}
                  <line x1={cell.x + 50} y1="186" x2={cell.x + 50} y2="218" stroke="#2b59d1" strokeWidth="2.5" />
                </g>
              ))}

              {/* Barramento de Saída Q */}
              <line x1="40" y1="218" x2="560" y2="218" stroke="#2b59d1" strokeWidth="3.5" />
              <text x="40" y="244" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#2b59d1">
                Barramento de Saída Q[63:0] (64 bits estáveis em paralelo)
              </text>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-smoke">Barramento de Dados D[63:0]</h4>
            <div className="mt-4 space-y-3 font-mono text-xs md:text-sm">
              <label htmlFor="select-hex-val" className="block text-graphite">Novo Valor a Gravar (Hex):</label>
              <select
                id="select-hex-val"
                value={inputHex}
                onChange={(e) => setInputHex(e.target.value)}
                className="w-full rounded-xl border border-ash bg-white p-2.5 font-mono text-xs md:text-sm font-bold text-off-black min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
              >
                <option value="0x000000000000002A">0x000000000000002A (Valor 42)</option>
                <option value="0xFFFFFFFFFFFFFFFF">0xFFFFFFFFFFFFFFFF (Todos 1s / -1)</option>
                <option value="0x0000000000000000">0x0000000000000000 (Limpeza / Zero)</option>
              </select>

              <div className="border-t border-ash pt-3 space-y-2">
                <div className="flex justify-between"><span>Valor no Barramento D:</span><span className="font-bold text-graphite">{inputHex}</span></div>
                <div className="flex justify-between"><span>Valor no Registrador:</span><span className="font-bold text-lake-blue">{storedHex}</span></div>
                <div className="flex justify-between"><span>Linha Write Enable:</span><span className="font-bold text-off-black">{writeEnable === 1 ? "Ativa (1)" : "Desativada (0)"}</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ash bg-white p-4 text-xs md:text-sm text-graphite leading-relaxed">
            <strong className="block font-serif font-normal text-base text-off-black mb-1.5">Status da Última Borda:</strong>
            {lastClockAction}
          </div>
        </div>
      </div>
    </div>
  );
}
