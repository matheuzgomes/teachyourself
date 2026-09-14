import { useState } from "react";

export default function CmosInverterCard() {
  const [inputHigh, setInputHigh] = useState(false);

  const vin = inputHigh ? 1 : 0;
  const vout = inputHigh ? 0 : 1;

  return (
    <div
      data-visual-model="VIS-03-CMOS-INVERTER"
      className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div>
          <span className="inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-periwinkle-mist text-lake-blue border border-lake-blue/20">
            VIS-03: Esquemático CMOS Complementar
          </span>
          <h3 className="mt-2 font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
            Inversor CMOS (Porta NOT): Pull-Up PMOS e Pull-Down NMOS
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setInputHigh(!inputHigh)}
          className={`min-h-[44px] rounded-full px-5 py-2 font-mono text-xs md:text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
            inputHigh
              ? "bg-lake-blue text-white border-lake-blue shadow-sm"
              : "bg-parchment text-graphite border-ash hover:border-lake-blue/50 hover:text-off-black"
          }`}
        >
          {inputHigh ? "Entrada V_in = 1 (3.3V)" : "Entrada V_in = 0 (0V / Terra)"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-graphite">
                Circuito Elétrico dos Dois Transistores Complementares
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-lake-blue">
                Saída V_out = {vout} ({vout === 1 ? "3.3V" : "0V"})
              </span>
            </div>

            <svg viewBox="0 0 620 360" className="w-full h-auto select-none" style={{ maxHeight: "360px" }}>
              <defs>
                <marker id="invArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#2b59d1" />
                </marker>
              </defs>

              {/* Trilho de Alimentação VDD (Topo) */}
              <line x1="180" y1="28" x2="380" y2="28" stroke="#242424" strokeWidth="3" />
              <text x="280" y="20" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">
                + VDD (Alimentação: 3.3V)
              </text>

              {/* Fio do VDD até PMOS */}
              <line
                x1="280"
                y1="28"
                x2="280"
                y2="70"
                stroke={vin === 0 ? "#2b59d1" : "#615e5d"}
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
                  fill={vin === 0 ? "#2b59d1" : "#e8e5e2"}
                  stroke="#242424"
                  strokeWidth="1.5"
                />
                <text
                  x="40"
                  y="26"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="13"
                  fontWeight="bold"
                  fill={vin === 0 ? "#ffffff" : "#242424"}
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
                  fill={vin === 0 ? "#ffffff" : "#615e5d"}
                >
                  {vin === 0 ? "CONDUZ" : "CORTA"}
                </text>
                {/* Bolha de Inversão no Gate PMOS */}
                <circle cx="-6" cy="28" r="6" fill="#ffffff" stroke="#242424" strokeWidth="1.5" />
              </g>

              {/* Fio de Entrada Vin Geral */}
              <line x1="40" y1="98" x2="234" y2="98" stroke={inputHigh ? "#2b59d1" : "#615e5d"} strokeWidth={inputHigh ? "3" : "2"} />
              <circle cx="40" cy="98" r="5" fill={inputHigh ? "#2b59d1" : "#615e5d"} />
              <text x="40" y="78" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={inputHigh ? "#2b59d1" : "#242424"}>
                V_in = {vin}
              </text>

              {/* Ramificação Ortogonal para NMOS */}
              <circle cx="130" cy="98" r="4" fill={inputHigh ? "#2b59d1" : "#615e5d"} />
              <line x1="130" y1="98" x2="130" y2="248" stroke={inputHigh ? "#2b59d1" : "#615e5d"} strokeWidth={inputHigh ? "3" : "2"} />
              <line x1="130" y1="248" x2="240" y2="248" stroke={inputHigh ? "#2b59d1" : "#615e5d"} strokeWidth={inputHigh ? "3" : "2"} />

              {/* Fio Intermediário entre PMOS e NMOS */}
              <line x1="280" y1="126" x2="280" y2="220" stroke="#242424" strokeWidth="2.5" />

              {/* Nó Central e Saída V_out */}
              <circle cx="280" cy="173" r="5" fill="#242424" />
              <line
                x1="280"
                y1="173"
                x2="430"
                y2="173"
                stroke={vout === 1 ? "#2b59d1" : "#615e5d"}
                strokeWidth={vout === 1 ? "3.5" : "2"}
                markerEnd="url(#invArrow)"
              />
              <text x="445" y="168" fontFamily="monospace" fontSize="14" fontWeight="bold" fill={vout === 1 ? "#2b59d1" : "#242424"}>
                V_out = {vout}
              </text>
              <text x="445" y="188" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={vout === 1 ? "#2b59d1" : "#615e5d"}>
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
                  fill={vin === 1 ? "#2b59d1" : "#e8e5e2"}
                  stroke="#242424"
                  strokeWidth="1.5"
                />
                <text
                  x="40"
                  y="26"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize="13"
                  fontWeight="bold"
                  fill={vin === 1 ? "#ffffff" : "#242424"}
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
                  fill={vin === 1 ? "#ffffff" : "#615e5d"}
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
                stroke={vin === 1 ? "#2b59d1" : "#615e5d"}
                strokeWidth={vin === 1 ? "3.5" : "2"}
              />

              {/* Trilho de Terra GND */}
              <line x1="220" y1="318" x2="340" y2="318" stroke="#242424" strokeWidth="3" />
              <line x1="240" y1="324" x2="320" y2="324" stroke="#242424" strokeWidth="2" />
              <line x1="260" y1="330" x2="300" y2="330" stroke="#242424" strokeWidth="1.5" />
              <text x="280" y="348" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">
                - GND (0V / Terra)
              </text>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-smoke">
              Tabela de Condução Estática
            </h4>
            <div className="mt-4 space-y-2.5 font-mono text-xs md:text-sm">
              <div className="flex justify-between border-b border-ash pb-1.5">
                <span className="text-graphite">Entrada V_in:</span>
                <span className="font-bold text-off-black">{vin} ({vin === 1 ? "3.3V" : "0V"})</span>
              </div>
              <div className="flex justify-between border-b border-ash pb-1.5">
                <span className="text-graphite">Rede Pull-Up (PMOS):</span>
                <span className={`font-bold ${vin === 0 ? "text-lake-blue" : "text-smoke"}`}>
                  {vin === 0 ? "CONDUZ (Liga a VDD)" : "CORTA (Isolado)"}
                </span>
              </div>
              <div className="flex justify-between border-b border-ash pb-1.5">
                <span className="text-graphite">Rede Pull-Down (NMOS):</span>
                <span className={`font-bold ${vin === 1 ? "text-lake-blue" : "text-smoke"}`}>
                  {vin === 1 ? "CONDUZ (Drena a GND)" : "CORTA (Isolado)"}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-graphite">Saída Invertida V_out:</span>
                <span className="font-bold text-lake-blue">{vout} ({vout === 1 ? "3.3V" : "0V"})</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ash bg-white p-4 text-xs md:text-sm text-graphite leading-relaxed">
            <strong className="block font-serif font-normal text-base text-off-black mb-1.5">
              Consumo Estático Quase Nulo (Modelo Ideal):
            </strong>
            Em qualquer estado estável (0 ou 1), exatamente um dos transistores está aberto e o outro conduzindo. Nunca há caminho direto entre VDD e GND em regime permanente. No silício real resta a fuga reversa de junção (SCAA035B: ICC de 10 a 40 µA) e corrente extra se a entrada não alcança os trilhos.
          </div>
        </div>
      </div>
    </div>
  );
}
