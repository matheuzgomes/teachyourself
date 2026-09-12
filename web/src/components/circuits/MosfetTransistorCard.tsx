import { useState } from "react";

export default function MosfetTransistorCard() {
  const [gateHigh, setGateHigh] = useState(false);

  const vGate = gateHigh ? "3.3V" : "0V";
  const channelFormed = gateHigh;
  const conductionState = gateHigh ? "LINEAR (Conducao Ativa)" : "CUTOFF (Chave Aberta)";
  const currentDrainSource = gateHigh ? "12.4 mA" : "0.0 pA (Corrente Nula)";

  return (
    <div
      data-visual-model="VIS-02-MOSFET-TRANSISTOR"
      className="my-8 rounded-card border border-[#e2ded9] bg-[#fdfcfb] p-5 md:p-8 font-sans shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2ded9] pb-4">
        <div>
          <span className="inline-block rounded px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-[#eae3d2] text-[#2c2825]">
            VIS-02: Microeletronica de Semicondutores
          </span>
          <h3 className="mt-1.5 font-serif text-xl md:text-2xl font-bold text-[#2c2825]">
            Transistor MOSFET NMOS: Formacao de Canal por Campo Eletrostatico
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGateHigh(!gateHigh)}
            className={`min-h-[44px] rounded-button px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all ${
              gateHigh
                ? "bg-[#2d5a27] text-white shadow-sm"
                : "bg-[#eae3d2] text-[#2c2825] hover:bg-[#dfd7c2]"
            }`}
          >
            {gateHigh ? "Tensao no Gate: 3.3V (Nivel 1)" : "Tensao no Gate: 0V (Nivel 0)"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-[#5c554e]">
                Corte Transversal Fisico do Silicio (Escala Nanometrica)
              </span>
              <span className={`rounded px-2.5 py-1 font-mono text-xs md:text-sm font-bold ${
                gateHigh ? "bg-[#2d5a27]/15 text-[#2d5a27]" : "bg-[#8c827a]/15 text-[#5c554e]"
              }`}>
                {conductionState}
              </span>
            </div>

            <svg viewBox="0 0 640 340" className="w-full h-auto select-none" style={{ maxHeight: "340px" }}>
              <defs>
                <pattern id="siliconPattern" width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M 0 12 L 12 0 M 6 12 L 12 6 M 0 6 L 6 0" stroke="#dcd6c8" strokeWidth="0.75" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#3c3836" />
                </marker>
                <marker id="arrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#2d5a27" />
                </marker>
                <marker id="arrowWhite" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#ffffff" />
                </marker>
              </defs>

              {/* Substrato P */}
              <rect x="40" y="140" width="560" height="160" rx="4" fill="#eae3d2" stroke="#3c3836" strokeWidth="1.5" />
              <rect x="40" y="140" width="560" height="160" rx="4" fill="url(#siliconPattern)" opacity="0.6" />
              <text x="60" y="280" fontFamily="monospace" fontSize="13" fill="#5c554e" fontWeight="bold">
                Substrato Semicondutor de Silicio: Tipo P (Lacunas Positivas)
              </text>

              {/* Poco Fonte (Source N+) */}
              <rect x="70" y="140" width="120" height="75" rx="3" fill="#dfd7c2" stroke="#3c3836" strokeWidth="1.5" />
              <text x="85" y="173" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#2c2825">Fonte (Source)</text>
              <text x="85" y="196" fontFamily="monospace" fontSize="12" fill="#5c554e">Tipo N+ (0V)</text>

              {/* Poco Dreno (Drain N+) */}
              <rect x="450" y="140" width="120" height="75" rx="3" fill="#dfd7c2" stroke="#3c3836" strokeWidth="1.5" />
              <text x="465" y="173" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#2c2825">Dreno (Drain)</text>
              <text x="465" y="196" fontFamily="monospace" fontSize="12" fill="#5c554e">Tipo N+ (3.3V)</text>

              {/* Camada Isolante de Oxido SiO2 */}
              <rect x="190" y="116" width="260" height="24" rx="2" fill="#fdfcfb" stroke="#3c3836" strokeWidth="1.5" />
              <text x="215" y="133" fontFamily="monospace" fontSize="12" fill="#5c554e" fontWeight="bold">
                Oxido Isolante SiO2 (Dieletrico)
              </text>

              {/* Eletrodo de Gate */}
              <rect
                x="190"
                y="68"
                width="260"
                height="48"
                rx="3"
                fill={gateHigh ? "#2d5a27" : "#dfd7c2"}
                stroke="#3c3836"
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
              <text
                x="245"
                y="98"
                fontFamily="monospace"
                fontSize="14"
                fontWeight="bold"
                fill={gateHigh ? "#ffffff" : "#2c2825"}
              >
                Eletrodo Gate (Porta)
              </text>

              {/* Fio de Controle de Gate */}
              <line x1="320" y1="20" x2="320" y2="68" stroke={gateHigh ? "#2d5a27" : "#8c827a"} strokeWidth={gateHigh ? "3" : "2"} markerEnd="url(#arrow)" />
              <text x="335" y="45" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={gateHigh ? "#2d5a27" : "#5c554e"}>
                V_gate = {vGate}
              </text>

              {/* Canal Induzido N */}
              {channelFormed ? (
                <g className="transition-all duration-300">
                  <rect x="190" y="140" width="260" height="36" fill="#2d5a27" opacity="0.85" />
                  <text x="210" y="156" fontFamily="monospace" fontSize="12" fill="#ffffff" fontWeight="bold">
                    Canal Condutor N Ativo (Eletrons)
                  </text>
                  {/* Linha de Fluxo de Corrente separada do texto */}
                  <line x1="440" y1="167" x2="200" y2="167" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="6 4" markerEnd="url(#arrowWhite)" />
                </g>
              ) : (
                <g className="transition-all duration-300">
                  <rect x="190" y="140" width="260" height="36" fill="none" stroke="#8c827a" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="210" y="163" fontFamily="monospace" fontSize="12" fill="#5c554e" fontWeight="bold">
                    Canal Desfeito (Barreira Isolante)
                  </text>
                </g>
              )}

              {/* Terminais Externos */}
              <line x1="130" y1="140" x2="130" y2="55" stroke="#3c3836" strokeWidth="2.5" />
              <circle cx="130" cy="55" r="4" fill="#3c3836" />
              <text x="60" y="42" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#2c2825">
                Terminal Fonte (GND)
              </text>

              <line x1="510" y1="140" x2="510" y2="55" stroke={channelFormed ? "#2d5a27" : "#3c3836"} strokeWidth="2.5" />
              <circle cx="510" cy="55" r="4" fill={channelFormed ? "#2d5a27" : "#3c3836"} />
              <text x="440" y="42" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={channelFormed ? "#2d5a27" : "#2c2825"}>
                Terminal Dreno (3.3V)
              </text>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-[#5c554e]">
              Estado das Grandezas Fisicas
            </h4>
            <div className="mt-4 space-y-2.5 font-mono text-xs md:text-sm">
              <div className="flex justify-between border-b border-[#e2ded9] pb-1.5">
                <span className="text-[#5c554e]">Tensao no Gate (V_GS):</span>
                <span className={`font-bold ${gateHigh ? "text-[#2d5a27]" : "text-[#2c2825]"}`}>{vGate}</span>
              </div>
              <div className="flex justify-between border-b border-[#e2ded9] pb-1.5">
                <span className="text-[#5c554e]">Corrente no Gate:</span>
                <span className="font-bold text-[#2d5a27]">0.0 pA (Oxido Isola)</span>
              </div>
              <div className="flex justify-between border-b border-[#e2ded9] pb-1.5">
                <span className="text-[#5c554e]">Canal de Inversao:</span>
                <span className={`font-bold ${channelFormed ? "text-[#2d5a27]" : "text-[#8c827a]"}`}>
                  {channelFormed ? "PRESENTE (N-Type)" : "AUSENTE"}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#e2ded9] pb-1.5">
                <span className="text-[#5c554e]">Fluxo Dreno para Fonte:</span>
                <span className={`font-bold ${gateHigh ? "text-[#2d5a27]" : "text-[#8c827a]"}`}>
                  {currentDrainSource}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#5c554e]">Comportamento Logico:</span>
                <span className={`font-bold ${gateHigh ? "text-[#2d5a27]" : "text-[#5c554e]"}`}>
                  {gateHigh ? "Chave FECHADA (1)" : "Chave ABERTA (0)"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2ded9] bg-[#eae3d2] p-4 text-xs md:text-sm text-[#2c2825] leading-relaxed">
            <strong className="block font-serif font-bold text-sm md:text-base text-[#2c2825] mb-1.5">
              Invariante Eletrostatico:
            </strong>
            O gate esta isolado do silicio por dioxido de silicio (SiO2). A comutacao da chave ocorre sem fluxo de corrente eletrica continua no controle, apenas por atracao e repulsa eletrostatica de cargas.
          </div>
        </div>
      </div>
    </div>
  );
}
