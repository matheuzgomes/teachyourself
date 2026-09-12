import { useState } from "react";

export default function CmosInverterCard() {
  const [inputHigh, setInputHigh] = useState(false);

  const vin = inputHigh ? 1 : 0;
  const vout = inputHigh ? 0 : 1;

  return (
    <div
      data-visual-model="VIS-03-CMOS-INVERTER"
      className="my-8 rounded-card border border-[#e2ded9] bg-[#fdfcfb] p-5 md:p-8 font-sans shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2ded9] pb-4">
        <div>
          <span className="inline-block rounded px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-[#eae3d2] text-[#2c2825]">
            VIS-03: Esquematico CMOS Complementar
          </span>
          <h3 className="mt-1.5 font-serif text-xl md:text-2xl font-bold text-[#2c2825]">
            Inversor CMOS (Porta NOT): Pull-Up PMOS e Pull-Down NMOS
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setInputHigh(!inputHigh)}
          className={`min-h-[44px] rounded-button px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all ${
            inputHigh
              ? "bg-[#2d5a27] text-white shadow-sm"
              : "bg-[#eae3d2] text-[#2c2825] hover:bg-[#dfd7c2]"
          }`}
        >
          {inputHigh ? "Entrada V_in = 1 (3.3V)" : "Entrada V_in = 0 (0V / Terra)"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-[#5c554e]">
                Circuito Eletrico dos Dois Transistores Complementares
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-[#2d5a27]">
                Saida V_out = {vout} ({vout === 1 ? "3.3V" : "0V"})
              </span>
            </div>

            <svg viewBox="0 0 620 360" className="w-full h-auto select-none" style={{ maxHeight: "360px" }}>
              <defs>
                <marker id="invArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#2d5a27" />
                </marker>
              </defs>

              {/* Trilho de Alimentacao VDD (Topo) */}
              <line x1="180" y1="28" x2="380" y2="28" stroke="#3c3836" strokeWidth="3" />
              <text x="280" y="20" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#2c2825">
                + VDD (Alimentacao: 3.3V)
              </text>

              {/* Fio do VDD ate PMOS */}
              <line
                x1="280"
                y1="28"
                x2="280"
                y2="70"
                stroke={vin === 0 ? "#2d5a27" : "#8c827a"}
                strokeWidth={vin === 0 ? "3.5" : "2"}
              />

              {/* Transistor PMOS (Pull-Up) */}
              <g transform="translate(240, 70)">
                <rect
                  x="0"
                  y="0"
                  width="80"
                  height="56"
                  rx="4"
                  fill={vin === 0 ? "#2d5a27" : "#dfd7c2"}
                  stroke="#3c3836"
                  strokeWidth="1.5"
                />
                <text
                  x="40"
                  y="26"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="13"
                  fontWeight="bold"
                  fill={vin === 0 ? "#ffffff" : "#2c2825"}
                >
                  PMOS
                </text>
                <text
                  x="40"
                  y="44"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="11"
                  fontWeight="bold"
                  fill={vin === 0 ? "#ffffff" : "#5c554e"}
                >
                  {vin === 0 ? "CONDUZ" : "CORTA"}
                </text>
                {/* Bolha de Inversao no Gate PMOS */}
                <circle cx="-6" cy="28" r="6" fill="#fdfcfb" stroke="#3c3836" strokeWidth="1.5" />
              </g>

              {/* Fio de Entrada Vin Geral */}
              <line x1="40" y1="98" x2="234" y2="98" stroke={inputHigh ? "#2d5a27" : "#8c827a"} strokeWidth={inputHigh ? "3" : "2"} />
              <circle cx="40" cy="98" r="5" fill={inputHigh ? "#2d5a27" : "#8c827a"} />
              <text x="40" y="78" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={inputHigh ? "#2d5a27" : "#2c2825"}>
                V_in = {vin}
              </text>

              {/* Ramificacao Ortogonal para NMOS */}
              <circle cx="130" cy="98" r="4" fill={inputHigh ? "#2d5a27" : "#8c827a"} />
              <line x1="130" y1="98" x2="130" y2="248" stroke={inputHigh ? "#2d5a27" : "#8c827a"} strokeWidth={inputHigh ? "3" : "2"} />
              <line x1="130" y1="248" x2="240" y2="248" stroke={inputHigh ? "#2d5a27" : "#8c827a"} strokeWidth={inputHigh ? "3" : "2"} />

              {/* Fio Intermediario entre PMOS e NMOS */}
              <line x1="280" y1="126" x2="280" y2="220" stroke="#3c3836" strokeWidth="2.5" />

              {/* No Central e Saida V_out */}
              <circle cx="280" cy="173" r="5" fill="#3c3836" />
              <line
                x1="280"
                y1="173"
                x2="430"
                y2="173"
                stroke={vout === 1 ? "#2d5a27" : "#8c827a"}
                strokeWidth={vout === 1 ? "3.5" : "2"}
                markerEnd="url(#invArrow)"
              />
              <text x="445" y="168" fontFamily="monospace" fontSize="14" fontWeight="bold" fill={vout === 1 ? "#2d5a27" : "#2c2825"}>
                V_out = {vout}
              </text>
              <text x="445" y="188" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={vout === 1 ? "#2d5a27" : "#5c554e"}>
                {vout === 1 ? "3.3V (VDD Ativo)" : "0V (Terra Drenado)"}
              </text>

              {/* Transistor NMOS (Pull-Down) */}
              <g transform="translate(240, 220)">
                <rect
                  x="0"
                  y="0"
                  width="80"
                  height="56"
                  rx="4"
                  fill={vin === 1 ? "#2d5a27" : "#dfd7c2"}
                  stroke="#3c3836"
                  strokeWidth="1.5"
                />
                <text
                  x="40"
                  y="26"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="13"
                  fontWeight="bold"
                  fill={vin === 1 ? "#ffffff" : "#2c2825"}
                >
                  NMOS
                </text>
                <text
                  x="40"
                  y="44"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="11"
                  fontWeight="bold"
                  fill={vin === 1 ? "#ffffff" : "#5c554e"}
                >
                  {vin === 1 ? "CONDUZ" : "CORTA"}
                </text>
              </g>

              {/* Fio de NMOS para o Terra GND */}
              <line
                x1="280"
                y1="276"
                x2="280"
                y2="318"
                stroke={vin === 1 ? "#2d5a27" : "#8c827a"}
                strokeWidth={vin === 1 ? "3.5" : "2"}
              />

              {/* Trilho de Terra GND */}
              <line x1="220" y1="318" x2="340" y2="318" stroke="#3c3836" strokeWidth="3" />
              <line x1="240" y1="324" x2="320" y2="324" stroke="#3c3836" strokeWidth="2" />
              <line x1="260" y1="330" x2="300" y2="330" stroke="#3c3836" strokeWidth="1.5" />
              <text x="280" y="348" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#2c2825">
                - GND (0V / Terra)
              </text>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-[#5c554e]">
              Tabela de Conducao Estatica
            </h4>
            <div className="mt-4 space-y-2.5 font-mono text-xs md:text-sm">
              <div className="flex justify-between border-b border-[#e2ded9] pb-1.5">
                <span className="text-[#5c554e]">Entrada V_in:</span>
                <span className="font-bold text-[#2c2825]">{vin} ({vin === 1 ? "3.3V" : "0V"})</span>
              </div>
              <div className="flex justify-between border-b border-[#e2ded9] pb-1.5">
                <span className="text-[#5c554e]">Rede Pull-Up (PMOS):</span>
                <span className={`font-bold ${vin === 0 ? "text-[#2d5a27]" : "text-[#8c827a]"}`}>
                  {vin === 0 ? "CONDUZ (Liga a VDD)" : "CORTA (Isolado)"}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#e2ded9] pb-1.5">
                <span className="text-[#5c554e]">Rede Pull-Down (NMOS):</span>
                <span className={`font-bold ${vin === 1 ? "text-[#2d5a27]" : "text-[#8c827a]"}`}>
                  {vin === 1 ? "CONDUZ (Drena a GND)" : "CORTA (Isolado)"}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#5c554e]">Saida Invertida V_out:</span>
                <span className="font-bold text-[#2d5a27]">{vout} ({vout === 1 ? "3.3V" : "0V"})</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2ded9] bg-[#eae3d2] p-4 text-xs md:text-sm text-[#2c2825] leading-relaxed">
            <strong className="block font-serif font-bold text-sm md:text-base text-[#2c2825] mb-1.5">
              Consumo Estatico Quase Nulo:
            </strong>
            Em qualquer estado estavel (0 ou 1), exatamente um dos transistores esta aberto e o outro conduzindo. Nunca ha caminho direto entre VDD e GND em regime permanente.
          </div>
        </div>
      </div>
    </div>
  );
}
