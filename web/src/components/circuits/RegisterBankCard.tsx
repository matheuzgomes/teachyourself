import { useState } from "react";

export default function RegisterBankCard() {
  const [writeEnable, setWriteEnable] = useState(1);
  const [inputHex, setInputHex] = useState("0x000000000000002A");
  const [storedHex, setStoredHex] = useState("0x0000000000000000");
  const [lastClockAction, setLastClockAction] = useState("Aguardando borda de subida do relogio...");

  const pulseClock = () => {
    if (writeEnable === 1) {
      setStoredHex(inputHex);
      setLastClockAction(`Gravacao Bem-Sucedida: Borda de subida capturou ${inputHex} em 64 Flip-Flops paralelos.`);
    } else {
      setLastClockAction("Gravacao Bloqueada: Write Enable = 0 isolou os flip-flops. O valor armazenado permaneceu intacto.");
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
      className="my-8 rounded-card border border-[#e2ded9] bg-[#fdfcfb] p-5 md:p-8 font-sans shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2ded9] pb-4">
        <div>
          <span className="inline-block rounded px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-[#eae3d2] text-[#2c2825]">
            VIS-08: Arquitetura de Registradores de CPU
          </span>
          <h3 className="mt-1.5 font-serif text-xl md:text-2xl font-bold text-[#2c2825]">
            Banco de Registradores de 64 bits: Arranjo Paralelo com Write Enable
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWriteEnable(writeEnable === 1 ? 0 : 1)}
            className={`min-h-[44px] rounded-button px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all ${
              writeEnable === 1
                ? "bg-[#2d5a27] text-white shadow-sm"
                : "bg-[#eae3d2] text-[#2c2825] hover:bg-[#dfd7c2]"
            }`}
          >
            {writeEnable === 1 ? "Write Enable (WE) = 1" : "Write Enable (WE) = 0"}
          </button>
          <button
            type="button"
            onClick={pulseClock}
            className="min-h-[44px] rounded-button bg-[#2c2825] text-white px-4 py-2 font-mono text-xs md:text-sm font-bold hover:bg-[#1a1816] transition-all shadow-sm"
          >
            Disparar Clock (CLK 0-&gt;1)
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-[#5c554e]">
                Arranjo Fisico de 64 Flip-Flops D Sincronizados
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-[#2d5a27]">
                Registrador %rax = {storedHex}
              </span>
            </div>

            <svg viewBox="0 0 620 260" className="w-full h-auto select-none" style={{ maxHeight: "260px" }}>
              {/* Barramento de Controle: Linha de Clock Compartilhada */}
              <text x="40" y="22" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#2c2825">
                Arvore de Clock Compartilhada (CLK Tree)
              </text>
              <line x1="40" y1="35" x2="560" y2="35" stroke="#3c3836" strokeWidth="2.5" />
              <circle cx="40" cy="35" r="4" fill="#3c3836" />

              {/* Linha de Write Enable */}
              <text x="40" y="62" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={writeEnable === 1 ? "#2d5a27" : "#5c554e"}>
                Habilitacao de Escrita (Write Enable - WE = {writeEnable})
              </text>
              <line x1="40" y1="75" x2="560" y2="75" stroke={writeEnable === 1 ? "#2d5a27" : "#8c827a"} strokeWidth="2" />
              <circle cx="40" cy="75" r="4" fill={writeEnable === 1 ? "#2d5a27" : "#8c827a"} />

              {/* Representacao Modular dos 64 Flip-Flops em Blocos */}
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
                    rx="4"
                    fill="#eae3d2"
                    stroke="#3c3836"
                    strokeWidth="1.5"
                  />
                  <text x={cell.x + 50} y="115" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#2c2825">
                    {cell.label}
                  </text>
                  <text x={cell.x + 50} y="132" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#5c554e">
                    Flip-Flop D
                  </text>
                  <text x={cell.x + 50} y="165" textAnchor="middle" fontFamily="monospace" fontSize="18" fontWeight="bold" fill="#2d5a27">
                    {cell.val}
                  </text>

                  {/* Derivacao de Clock */}
                  <line x1={cell.x + 28} y1="35" x2={cell.x + 28} y2="92" stroke="#3c3836" strokeWidth="1.5" />
                  <circle cx={cell.x + 28} cy="35" r="3" fill="#3c3836" />

                  {/* Derivacao de WE */}
                  <line x1={cell.x + 72} y1="75" x2={cell.x + 72} y2="92" stroke={writeEnable === 1 ? "#2d5a27" : "#8c827a"} strokeWidth="1.5" />
                  <circle cx={cell.x + 72} cy="75" r="3" fill={writeEnable === 1 ? "#2d5a27" : "#8c827a"} />

                  {/* Saida para o Barramento de Leitura */}
                  <line x1={cell.x + 50} y1="186" x2={cell.x + 50} y2="218" stroke="#2d5a27" strokeWidth="2.5" />
                </g>
              ))}

              {/* Barramento de Saida Q */}
              <line x1="40" y1="218" x2="560" y2="218" stroke="#2d5a27" strokeWidth="3.5" />
              <text x="40" y="244" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#2d5a27">
                Barramento de Saida Q[63:0] (64 bits estaveis em paralelo)
              </text>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-[#5c554e]">Barramento de Dados D[63:0]</h4>
            <div className="mt-4 space-y-3 font-mono text-xs md:text-sm">
              <label className="block text-[#5c554e]">Novo Valor a Gravar (Hex):</label>
              <select
                value={inputHex}
                onChange={(e) => setInputHex(e.target.value)}
                className="w-full rounded border border-[#dcd6c8] bg-white p-2.5 font-mono text-xs md:text-sm font-bold text-[#2c2825]"
              >
                <option value="0x000000000000002A">0x000000000000002A (Valor 42)</option>
                <option value="0xFFFFFFFFFFFFFFFF">0xFFFFFFFFFFFFFFFF (Todos 1s / -1)</option>
                <option value="0x0000000000000000">0x0000000000000000 (Limpeza / Zero)</option>
              </select>

              <div className="border-t border-[#e2ded9] pt-2.5 space-y-1.5">
                <div className="flex justify-between"><span>Valor no Barramento D:</span><span className="font-bold text-[#5c554e]">{inputHex}</span></div>
                <div className="flex justify-between"><span>Valor no Registrador:</span><span className="font-bold text-[#2d5a27]">{storedHex}</span></div>
                <div className="flex justify-between"><span>Linha Write Enable:</span><span className="font-bold">{writeEnable === 1 ? "Ativa (1)" : "Desativada (0)"}</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2ded9] bg-[#eae3d2] p-4 text-xs md:text-sm text-[#2c2825] leading-relaxed">
            <strong className="block font-serif font-bold text-sm md:text-base mb-1.5">Status da Ultima Borda:</strong>
            {lastClockAction}
          </div>
        </div>
      </div>
    </div>
  );
}
