import { useState } from "react";

export default function CmosNandCard() {
  const [inputA, setInputA] = useState(0);
  const [inputB, setInputB] = useState(0);

  const outputY = (inputA === 1 && inputB === 1) ? 0 : 1;
  const isSeriesNmosClosed = inputA === 1 && inputB === 1;

  return (
    <div
      data-visual-model="VIS-04-CMOS-NAND"
      className="my-8 rounded-card border border-[#e2ded9] bg-[#fdfcfb] p-5 md:p-8 font-sans shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2ded9] pb-4">
        <div>
          <span className="inline-block rounded px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-[#eae3d2] text-[#2c2825]">
            VIS-04: Porta Universal NAND no Silicio
          </span>
          <h3 className="mt-1.5 font-serif text-xl md:text-2xl font-bold text-[#2c2825]">
            Porta NAND CMOS: 2 PMOS em Paralelo e 2 NMOS em Serie
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInputA(inputA === 1 ? 0 : 1)}
            className={`min-h-[44px] rounded-button px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all ${
              inputA === 1
                ? "bg-[#2d5a27] text-white shadow-sm"
                : "bg-[#eae3d2] text-[#2c2825] hover:bg-[#dfd7c2]"
            }`}
          >
            Entrada A = {inputA}
          </button>
          <button
            type="button"
            onClick={() => setInputB(inputB === 1 ? 0 : 1)}
            className={`min-h-[44px] rounded-button px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all ${
              inputB === 1
                ? "bg-[#2d5a27] text-white shadow-sm"
                : "bg-[#eae3d2] text-[#2c2825] hover:bg-[#dfd7c2]"
            }`}
          >
            Entrada B = {inputB}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-[#5c554e]">
                Rede Pull-Up (Paralelo) e Pull-Down (Serie)
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-[#2d5a27]">
                Saida Y = {outputY} ({outputY === 1 ? "VDD Ativo" : "GND Conectado"})
              </span>
            </div>

            <svg viewBox="0 0 620 380" className="w-full h-auto select-none" style={{ maxHeight: "380px" }}>
              {/* Trilho Superior VDD */}
              <line x1="160" y1="24" x2="400" y2="24" stroke="#3c3836" strokeWidth="3" />
              <text x="280" y="16" textAnchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#2c2825">
                + VDD (Alimentacao: 3.3V)
              </text>

              {/* Ramificacao VDD para PMOS A e PMOS B em Paralelo */}
              <line x1="280" y1="24" x2="280" y2="48" stroke="#3c3836" strokeWidth="2.5" />
              <line x1="205" y1="48" x2="355" y2="48" stroke="#3c3836" strokeWidth="2.5" />
              <line x1="205" y1="48" x2="205" y2="68" stroke={inputA === 0 ? "#2d5a27" : "#8c827a"} strokeWidth={inputA === 0 ? "3" : "2"} />
              <line x1="355" y1="48" x2="355" y2="68" stroke={inputB === 0 ? "#2d5a27" : "#8c827a"} strokeWidth={inputB === 0 ? "3" : "2"} />

              {/* PMOS A (Esquerda) */}
              <g transform="translate(170, 68)">
                <rect x="0" y="0" width="70" height="52" rx="4" fill={inputA === 0 ? "#2d5a27" : "#dfd7c2"} stroke="#3c3836" strokeWidth="1.5" />
                <text x="35" y="24" textAnchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill={inputA === 0 ? "#ffffff" : "#2c2825"}>PMOS A</text>
                <text x="35" y="42" textAnchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill={inputA === 0 ? "#ffffff" : "#5c554e"}>
                  {inputA === 0 ? "CONDUZ" : "CORTA"}
                </text>
                <circle cx="-6" cy="26" r="5" fill="#fdfcfb" stroke="#3c3836" strokeWidth="1.5" />
              </g>

              {/* PMOS B (Direita) */}
              <g transform="translate(320, 68)">
                <rect x="0" y="0" width="70" height="52" rx="4" fill={inputB === 0 ? "#2d5a27" : "#dfd7c2"} stroke="#3c3836" strokeWidth="1.5" />
                <text x="35" y="24" textAnchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill={inputB === 0 ? "#ffffff" : "#2c2825"}>PMOS B</text>
                <text x="35" y="42" textAnchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill={inputB === 0 ? "#ffffff" : "#5c554e"}>
                  {inputB === 0 ? "CONDUZ" : "CORTA"}
                </text>
                <circle cx="76" cy="26" r="5" fill="#fdfcfb" stroke="#3c3836" strokeWidth="1.5" />
              </g>

              {/* Juncao de Saida do Pull-Up */}
              <line x1="205" y1="120" x2="205" y2="142" stroke="#3c3836" strokeWidth="2.5" />
              <line x1="355" y1="120" x2="355" y2="142" stroke="#3c3836" strokeWidth="2.5" />
              <line x1="205" y1="142" x2="355" y2="142" stroke="#3c3836" strokeWidth="2.5" />

              {/* No de Saida Central Y */}
              <line x1="280" y1="142" x2="280" y2="182" stroke="#3c3836" strokeWidth="2.5" />
              <circle cx="280" cy="182" r="5" fill="#3c3836" />
              <line x1="280" y1="182" x2="435" y2="182" stroke={outputY === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={outputY === 1 ? "3.5" : "2"} />
              <text x="448" y="177" font-family="monospace" font-size="14" font-weight="bold" fill={outputY === 1 ? "#2d5a27" : "#2c2825"}>
                Saida Y = {outputY}
              </text>
              <text x="448" y="197" font-family="monospace" font-size="12" font-weight="bold" fill={outputY === 1 ? "#2d5a27" : "#5c554e"}>
                {outputY === 1 ? "Nivel 1 (VDD Ativo)" : "Nivel 0 (GND Drenado)"}
              </text>

              {/* Fio para NMOS em Serie */}
              <line x1="280" y1="182" x2="280" y2="212" stroke={isSeriesNmosClosed ? "#2d5a27" : "#8c827a"} strokeWidth={isSeriesNmosClosed ? "3" : "2"} />

              {/* NMOS A (Superior da Serie) */}
              <g transform="translate(245, 212)">
                <rect x="0" y="0" width="70" height="50" rx="4" fill={inputA === 1 ? "#2d5a27" : "#dfd7c2"} stroke="#3c3836" strokeWidth="1.5" />
                <text x="35" y="23" textAnchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill={inputA === 1 ? "#ffffff" : "#2c2825"}>NMOS A</text>
                <text x="35" y="40" textAnchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill={inputA === 1 ? "#ffffff" : "#5c554e"}>
                  {inputA === 1 ? "CONDUZ" : "CORTA"}
                </text>
              </g>

              {/* Fio de Interligacao NMOS A para NMOS B */}
              <line x1="280" y1="262" x2="280" y2="282" stroke={inputA === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={inputA === 1 ? "3" : "2"} />

              {/* NMOS B (Inferior da Serie) */}
              <g transform="translate(245, 282)">
                <rect x="0" y="0" width="70" height="50" rx="4" fill={inputB === 1 ? "#2d5a27" : "#dfd7c2"} stroke="#3c3836" strokeWidth="1.5" />
                <text x="35" y="23" textAnchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill={inputB === 1 ? "#ffffff" : "#2c2825"}>NMOS B</text>
                <text x="35" y="40" textAnchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill={inputB === 1 ? "#ffffff" : "#5c554e"}>
                  {inputB === 1 ? "CONDUZ" : "CORTA"}
                </text>
              </g>

              {/* Fio para GND */}
              <line x1="280" y1="332" x2="280" y2="352" stroke={isSeriesNmosClosed ? "#2d5a27" : "#8c827a"} strokeWidth={isSeriesNmosClosed ? "3" : "2"} />

              {/* Trilho GND */}
              <line x1="220" y1="352" x2="340" y2="352" stroke="#3c3836" strokeWidth="3" />
              <line x1="240" y1="358" x2="320" y2="358" stroke="#3c3836" strokeWidth="2" />
              <line x1="260" y1="364" x2="300" y2="364" stroke="#3c3836" strokeWidth="1.5" />
              <text x="280" y="378" textAnchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill="#2c2825">
                - GND (0V / Terra)
              </text>

              {/* Roteamento Ortogonal da Entrada A */}
              <line x1="40" y1="94" x2="164" y2="94" stroke={inputA === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={inputA === 1 ? "3" : "2"} />
              <circle cx="40" cy="94" r="5" fill={inputA === 1 ? "#2d5a27" : "#8c827a"} />
              <text x="40" y="74" font-family="monospace" font-size="13" font-weight="bold" fill={inputA === 1 ? "#2d5a27" : "#2c2825"}>
                A = {inputA}
              </text>
              <circle cx="120" cy="94" r="4" fill={inputA === 1 ? "#2d5a27" : "#8c827a"} />
              <line x1="120" y1="94" x2="120" y2="237" stroke={inputA === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={inputA === 1 ? "3" : "2"} />
              <line x1="120" y1="237" x2="245" y2="237" stroke={inputA === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={inputA === 1 ? "3" : "2"} />

              {/* Roteamento Ortogonal da Entrada B (Sem Cruzamento) */}
              <line x1="40" y1="307" x2="245" y2="307" stroke={inputB === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={inputB === 1 ? "3" : "2"} />
              <circle cx="40" cy="307" r="5" fill={inputB === 1 ? "#2d5a27" : "#8c827a"} />
              <text x="40" y="287" font-family="monospace" font-size="13" font-weight="bold" fill={inputB === 1 ? "#2d5a27" : "#2c2825"}>
                B = {inputB}
              </text>
              <circle cx="70" cy="307" r="4" fill={inputB === 1 ? "#2d5a27" : "#8c827a"} />
              <line x1="70" y1="307" x2="70" y2="38" stroke={inputB === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={inputB === 1 ? "3" : "2"} />
              <line x1="70" y1="38" x2="415" y2="38" stroke={inputB === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={inputB === 1 ? "3" : "2"} />
              <line x1="415" y1="38" x2="415" y2="94" stroke={inputB === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={inputB === 1 ? "3" : "2"} />
              <line x1="415" y1="94" x2="396" y2="94" stroke={inputB === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={inputB === 1 ? "3" : "2"} />
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-[#5c554e]">
              Tabela-Verdade Dinamica
            </h4>
            <div className="mt-3 divide-y divide-[#e2ded9] font-mono text-xs md:text-sm">
              <div className="grid grid-cols-4 py-1.5 font-bold text-[#5c554e]">
                <span>A</span>
                <span>B</span>
                <span>Pull-Down</span>
                <span className="text-right">Y (NAND)</span>
              </div>
              <div className={`grid grid-cols-4 py-2 ${inputA === 0 && inputB === 0 ? "bg-[#2d5a27]/15 font-bold text-[#2d5a27] rounded px-1" : "text-[#2c2825]"}`}>
                <span>0</span>
                <span>0</span>
                <span>Aberto</span>
                <span className="text-right font-bold">1</span>
              </div>
              <div className={`grid grid-cols-4 py-2 ${inputA === 0 && inputB === 1 ? "bg-[#2d5a27]/15 font-bold text-[#2d5a27] rounded px-1" : "text-[#2c2825]"}`}>
                <span>0</span>
                <span>1</span>
                <span>Aberto</span>
                <span className="text-right font-bold">1</span>
              </div>
              <div className={`grid grid-cols-4 py-2 ${inputA === 1 && inputB === 0 ? "bg-[#2d5a27]/15 font-bold text-[#2d5a27] rounded px-1" : "text-[#2c2825]"}`}>
                <span>1</span>
                <span>0</span>
                <span>Aberto</span>
                <span className="text-right font-bold">1</span>
              </div>
              <div className={`grid grid-cols-4 py-2 ${inputA === 1 && inputB === 1 ? "bg-[#2d5a27]/15 font-bold text-[#2d5a27] rounded px-1" : "text-[#2c2825]"}`}>
                <span>1</span>
                <span>1</span>
                <span>Fechado</span>
                <span className="text-right font-bold">0</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2ded9] bg-[#eae3d2] p-4 text-xs md:text-sm text-[#2c2825] leading-relaxed">
            <strong className="block font-serif font-bold text-sm md:text-base text-[#2c2825] mb-1.5">
              Causalidade Topologica:
            </strong>
            Para que a saida Y va para 0, e fisicamente necessario que ambos os transistores NMOS conduzam em serie ate o terra. Se qualquer entrada for 0, o caminho serie se rompe e o PMOS correspondente puxa Y diretamente para VDD (1).
          </div>
        </div>
      </div>
    </div>
  );
}
