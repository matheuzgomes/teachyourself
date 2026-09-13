import { useState } from "react";

export default function CmosNandCard() {
  const [inputA, setInputA] = useState(0);
  const [inputB, setInputB] = useState(0);

  const outputY = (inputA === 1 && inputB === 1) ? 0 : 1;
  const isSeriesNmosClosed = inputA === 1 && inputB === 1;

  return (
    <div
      data-visual-model="VIS-04-CMOS-NAND"
      className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div>
          <span className="inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-periwinkle-mist text-lake-blue border border-lake-blue/20">
            VIS-04: Porta Universal NAND no Silício
          </span>
          <h3 className="mt-2 font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
            Porta NAND CMOS: 2 PMOS em Paralelo e 2 NMOS em Série
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInputA(inputA === 1 ? 0 : 1)}
            className={`min-h-[44px] rounded-full px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
              inputA === 1
                ? "bg-lake-blue text-white border-lake-blue shadow-sm"
                : "bg-parchment text-graphite border-ash hover:border-lake-blue/50 hover:text-off-black"
            }`}
          >
            Entrada A = {inputA}
          </button>
          <button
            type="button"
            onClick={() => setInputB(inputB === 1 ? 0 : 1)}
            className={`min-h-[44px] rounded-full px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
              inputB === 1
                ? "bg-lake-blue text-white border-lake-blue shadow-sm"
                : "bg-parchment text-graphite border-ash hover:border-lake-blue/50 hover:text-off-black"
            }`}
          >
            Entrada B = {inputB}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-graphite">
                Rede Pull-Up (Paralelo) e Pull-Down (Série)
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-lake-blue">
                Saída Y = {outputY} ({outputY === 1 ? "VDD Ativo" : "GND Conectado"})
              </span>
            </div>

            <svg viewBox="0 0 620 380" className="w-full h-auto select-none" style={{ maxHeight: "380px" }}>
              {/* Trilho Superior VDD */}
              <text x="280" y="30" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">
                + VDD (Alimentação: 3.3V)
              </text>
              <line x1="180" y1="42" x2="380" y2="42" stroke="#242424" strokeWidth="3" />

              {/* Ramificação VDD para PMOS A e PMOS B em Paralelo */}
              <line x1="205" y1="42" x2="205" y2="68" stroke={inputA === 0 ? "#2b59d1" : "#615e5d"} strokeWidth={inputA === 0 ? "3" : "2"} />
              <line x1="355" y1="42" x2="355" y2="68" stroke={inputB === 0 ? "#2b59d1" : "#615e5d"} strokeWidth={inputB === 0 ? "3" : "2"} />

              {/* PMOS A (Esquerda) */}
              <g transform="translate(170, 68)">
                <rect x="0" y="0" width="70" height="52" rx="4" fill={inputA === 0 ? "#2b59d1" : "#e8e5e2"} stroke="#242424" strokeWidth="1.5" />
                <text x="35" y="24" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={inputA === 0 ? "#ffffff" : "#242424"}>PMOS A</text>
                <text x="35" y="42" textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="bold" fill={inputA === 0 ? "#ffffff" : "#615e5d"}>
                  {inputA === 0 ? "CONDUZ" : "CORTA"}
                </text>
                <circle cx="-6" cy="26" r="5" fill="#ffffff" stroke="#242424" strokeWidth="1.5" />
              </g>

              {/* PMOS B (Direita) */}
              <g transform="translate(320, 68)">
                <rect x="0" y="0" width="70" height="52" rx="4" fill={inputB === 0 ? "#2b59d1" : "#e8e5e2"} stroke="#242424" strokeWidth="1.5" />
                <text x="35" y="24" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={inputB === 0 ? "#ffffff" : "#242424"}>PMOS B</text>
                <text x="35" y="42" textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="bold" fill={inputB === 0 ? "#ffffff" : "#615e5d"}>
                  {inputB === 0 ? "CONDUZ" : "CORTA"}
                </text>
                <circle cx="76" cy="26" r="5" fill="#ffffff" stroke="#242424" strokeWidth="1.5" />
              </g>

              {/* Junção de Saída do Pull-Up */}
              <line x1="205" y1="120" x2="205" y2="142" stroke="#242424" strokeWidth="2.5" />
              <line x1="355" y1="120" x2="355" y2="142" stroke="#242424" strokeWidth="2.5" />
              <line x1="205" y1="142" x2="355" y2="142" stroke="#242424" strokeWidth="2.5" />

              {/* Nó de Saída Central Y */}
              <line x1="280" y1="142" x2="280" y2="182" stroke="#242424" strokeWidth="2.5" />
              <circle cx="280" cy="182" r="5" fill="#242424" />
              <line x1="280" y1="182" x2="435" y2="182" stroke={outputY === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={outputY === 1 ? "3.5" : "2"} />
              <text x="448" y="177" fontFamily="monospace" fontSize="14" fontWeight="bold" fill={outputY === 1 ? "#2b59d1" : "#242424"}>
                Saída Y = {outputY}
              </text>
              <text x="448" y="197" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={outputY === 1 ? "#2b59d1" : "#615e5d"}>
                {outputY === 1 ? "Nível 1 (VDD Ativo)" : "Nível 0 (GND Drenado)"}
              </text>

              {/* Fio para NMOS em Série */}
              <line x1="280" y1="182" x2="280" y2="212" stroke={isSeriesNmosClosed ? "#2b59d1" : "#615e5d"} strokeWidth={isSeriesNmosClosed ? "3" : "2"} />

              {/* NMOS A (Superior da Série) */}
              <g transform="translate(245, 212)">
                <rect x="0" y="0" width="70" height="50" rx="4" fill={inputA === 1 ? "#2b59d1" : "#e8e5e2"} stroke="#242424" strokeWidth="1.5" />
                <text x="35" y="23" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={inputA === 1 ? "#ffffff" : "#242424"}>NMOS A</text>
                <text x="35" y="40" textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="bold" fill={inputA === 1 ? "#ffffff" : "#615e5d"}>
                  {inputA === 1 ? "CONDUZ" : "CORTA"}
                </text>
              </g>

              {/* Fio de Interligação NMOS A para NMOS B */}
              <line x1="280" y1="262" x2="280" y2="282" stroke={inputA === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={inputA === 1 ? "3" : "2"} />

              {/* NMOS B (Inferior da Série) */}
              <g transform="translate(245, 282)">
                <rect x="0" y="0" width="70" height="50" rx="4" fill={inputB === 1 ? "#2b59d1" : "#e8e5e2"} stroke="#242424" strokeWidth="1.5" />
                <text x="35" y="23" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={inputB === 1 ? "#ffffff" : "#242424"}>NMOS B</text>
                <text x="35" y="40" textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="bold" fill={inputB === 1 ? "#ffffff" : "#615e5d"}>
                  {inputB === 1 ? "CONDUZ" : "CORTA"}
                </text>
              </g>

              {/* Fio para GND */}
              <line x1="280" y1="332" x2="280" y2="352" stroke={isSeriesNmosClosed ? "#2b59d1" : "#615e5d"} strokeWidth={isSeriesNmosClosed ? "3" : "2"} />

              {/* Trilho GND */}
              <line x1="220" y1="352" x2="340" y2="352" stroke="#242424" strokeWidth="3" />
              <line x1="240" y1="358" x2="320" y2="358" stroke="#242424" strokeWidth="2" />
              <line x1="260" y1="364" x2="300" y2="364" stroke="#242424" strokeWidth="1.5" />
              <text x="280" y="378" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#242424">
                - GND (0V / Terra)
              </text>

              {/* Roteamento Ortogonal da Entrada A */}
              <line x1="40" y1="94" x2="164" y2="94" stroke={inputA === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={inputA === 1 ? "3" : "2"} />
              <circle cx="40" cy="94" r="5" fill={inputA === 1 ? "#2b59d1" : "#615e5d"} />
              <text x="40" y="74" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={inputA === 1 ? "#2b59d1" : "#242424"}>
                A = {inputA}
              </text>
              <circle cx="120" cy="94" r="4" fill={inputA === 1 ? "#2b59d1" : "#615e5d"} />
              <line x1="120" y1="94" x2="120" y2="237" stroke={inputA === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={inputA === 1 ? "3" : "2"} />
              <line x1="120" y1="237" x2="245" y2="237" stroke={inputA === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={inputA === 1 ? "3" : "2"} />

              {/* Roteamento Ortogonal da Entrada B */}
              <line x1="40" y1="307" x2="245" y2="307" stroke={inputB === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={inputB === 1 ? "3" : "2"} />
              <circle cx="40" cy="307" r="5" fill={inputB === 1 ? "#2b59d1" : "#615e5d"} />
              <text x="40" y="287" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={inputB === 1 ? "#2b59d1" : "#242424"}>
                B = {inputB}
              </text>
              <circle cx="70" cy="307" r="4" fill={inputB === 1 ? "#2b59d1" : "#615e5d"} />
              <path
                d="M 70 307 L 70 100 A 6 6 0 0 0 70 88 L 70 16 L 430 16 L 430 94 L 396 94"
                fill="none"
                stroke={inputB === 1 ? "#2b59d1" : "#615e5d"}
                strokeWidth={inputB === 1 ? "3" : "2"}
              />
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-smoke">
              Tabela-Verdade Dinâmica
            </h4>
            <div className="mt-3 divide-y divide-ash font-mono text-xs md:text-sm">
              <div className="grid grid-cols-4 py-1.5 font-bold text-smoke">
                <span>A</span>
                <span>B</span>
                <span>Pull-Down</span>
                <span className="text-right">Y (NAND)</span>
              </div>
              <div className={`grid grid-cols-4 py-2 ${inputA === 0 && inputB === 0 ? "bg-mint/30 font-bold text-emerald-800 rounded-lg px-1.5" : "text-off-black"}`}>
                <span>0</span>
                <span>0</span>
                <span>Aberto</span>
                <span className="text-right font-bold">1</span>
              </div>
              <div className={`grid grid-cols-4 py-2 ${inputA === 0 && inputB === 1 ? "bg-mint/30 font-bold text-emerald-800 rounded-lg px-1.5" : "text-off-black"}`}>
                <span>0</span>
                <span>1</span>
                <span>Aberto</span>
                <span className="text-right font-bold">1</span>
              </div>
              <div className={`grid grid-cols-4 py-2 ${inputA === 1 && inputB === 0 ? "bg-mint/30 font-bold text-emerald-800 rounded-lg px-1.5" : "text-off-black"}`}>
                <span>1</span>
                <span>0</span>
                <span>Aberto</span>
                <span className="text-right font-bold">1</span>
              </div>
              <div className={`grid grid-cols-4 py-2 ${inputA === 1 && inputB === 1 ? "bg-mint/30 font-bold text-emerald-800 rounded-lg px-1.5" : "text-off-black"}`}>
                <span>1</span>
                <span>1</span>
                <span>Fechado</span>
                <span className="text-right font-bold">0</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ash bg-white p-4 text-xs md:text-sm text-graphite leading-relaxed">
            <strong className="block font-serif font-normal text-base text-off-black mb-1.5">
              Causalidade Topológica:
            </strong>
            Para que a saída Y vá para 0, é fisicamente necessário que ambos os transistores NMOS conduzam em série até o terra. Se qualquer entrada for 0, o caminho série se rompe e o PMOS correspondente puxa Y diretamente para VDD (1).
          </div>
        </div>
      </div>
    </div>
  );
}
