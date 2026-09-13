import { useState } from "react";

export default function MosfetTransistorCard() {
  const [gateHigh, setGateHigh] = useState(false);

  const vGate = gateHigh ? "3.3V" : "0V";
  const channelFormed = gateHigh;
  const conductionState = gateHigh ? "LINEAR (Condução Ativa)" : "CUTOFF (Chave Aberta)";
  const currentDrainSource = gateHigh ? "12.4 mA" : "0.0 pA (Corrente Nula)";

  return (
    <div
      data-visual-model="VIS-02-MOSFET-TRANSISTOR"
      className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div>
          <span className="inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-periwinkle-mist text-lake-blue border border-lake-blue/20">
            VIS-02: Microeletrônica de Semicondutores
          </span>
          <h3 className="mt-2 font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
            Transistor MOSFET NMOS: Formação de Canal por Campo Eletrostático
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGateHigh(!gateHigh)}
            className={`min-h-[44px] rounded-full px-5 py-2 font-mono text-xs md:text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
              gateHigh
                ? "bg-lake-blue text-white border-lake-blue shadow-sm"
                : "bg-parchment text-graphite border-ash hover:border-lake-blue/50 hover:text-off-black"
            }`}
          >
            {gateHigh ? "Tensão no Gate: 3.3V (Nível 1)" : "Tensão no Gate: 0V (Nível 0)"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-graphite">
                Corte Transversal Físico do Silício (Escala Nanométrica)
              </span>
              <span className={`rounded-full px-3 py-1 font-mono text-xs md:text-sm font-semibold border ${
                gateHigh
                  ? "bg-mint/30 border-mint text-emerald-800"
                  : "bg-white border-ash text-smoke"
              }`}>
                {conductionState}
              </span>
            </div>

            <svg viewBox="0 0 640 340" className="w-full h-auto select-none" style={{ maxHeight: "340px" }}>
              <defs>
                <pattern id="siliconPattern" width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M 0 12 L 12 0 M 6 12 L 12 6 M 0 6 L 6 0" stroke="#cecac8" strokeWidth="0.75" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#242424" />
                </marker>
                <marker id="arrowBlue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#2b59d1" />
                </marker>
                <marker id="arrowWhite" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#ffffff" />
                </marker>
              </defs>

              {/* Substrato P */}
              <rect x="40" y="140" width="560" height="160" rx="6" fill="#f6f3f1" stroke="#cecac8" strokeWidth="1.5" />
              <rect x="40" y="140" width="560" height="160" rx="6" fill="url(#siliconPattern)" opacity="0.6" />
              <text x="60" y="280" fontFamily="monospace" fontSize="13" fill="#615e5d" fontWeight="bold">
                Substrato Semicondutor de Silício: Tipo P (Lacunas Positivas)
              </text>

              {/* Poço Fonte (Source N+) */}
              <rect x="70" y="140" width="120" height="75" rx="4" fill="#cfdaf5" stroke="#2b59d1" strokeWidth="1.5" />
              <text x="85" y="173" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">Fonte (Source)</text>
              <text x="85" y="196" fontFamily="monospace" fontSize="12" fill="#4e4d4d">Tipo N+ (0V)</text>

              {/* Poço Dreno (Drain N+) */}
              <rect x="450" y="140" width="120" height="75" rx="4" fill="#cfdaf5" stroke="#2b59d1" strokeWidth="1.5" />
              <text x="465" y="173" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">Dreno (Drain)</text>
              <text x="465" y="196" fontFamily="monospace" fontSize="12" fill="#4e4d4d">Tipo N+ (3.3V)</text>

              {/* Camada Isolante de Óxido SiO2 */}
              <rect x="190" y="116" width="260" height="24" rx="3" fill="#ffffff" stroke="#cecac8" strokeWidth="1.5" />
              <text x="215" y="133" fontFamily="monospace" fontSize="12" fill="#615e5d" fontWeight="bold">
                Óxido Isolante SiO2 (Dielétrico)
              </text>

              {/* Eletrodo de Gate */}
              <rect
                x="190"
                y="68"
                width="260"
                height="48"
                rx="4"
                fill={gateHigh ? "#2b59d1" : "#e8e5e2"}
                stroke="#242424"
                strokeWidth="1.5"
                className="transition-colors duration-300"
              />
              <text
                x="245"
                y="98"
                fontFamily="monospace"
                fontSize="14"
                fontWeight="bold"
                fill={gateHigh ? "#ffffff" : "#242424"}
              >
                Eletrodo Gate (Porta)
              </text>

              {/* Fio de Controle de Gate */}
              <line x1="320" y1="20" x2="320" y2="68" stroke={gateHigh ? "#2b59d1" : "#615e5d"} strokeWidth={gateHigh ? "3" : "2"} markerEnd="url(#arrow)" />
              <text x="335" y="45" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={gateHigh ? "#2b59d1" : "#615e5d"}>
                V_gate = {vGate}
              </text>

              {/* Canal Induzido N */}
              {channelFormed ? (
                <g className="transition-all duration-300">
                  <rect x="190" y="140" width="260" height="36" fill="#2b59d1" opacity="0.85" rx="3" />
                  <text x="210" y="156" fontFamily="monospace" fontSize="12" fill="#ffffff" fontWeight="bold">
                    Canal Condutor N Ativo (Elétrons)
                  </text>
                  {/* Linha de Fluxo de Corrente separada do texto */}
                  <line x1="440" y1="167" x2="200" y2="167" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="6 4" markerEnd="url(#arrowWhite)" />
                </g>
              ) : (
                <g className="transition-all duration-300">
                  <rect x="190" y="140" width="260" height="36" fill="none" stroke="#cecac8" strokeWidth="1.5" strokeDasharray="4 4" rx="3" />
                  <text x="210" y="163" fontFamily="monospace" fontSize="12" fill="#615e5d" fontWeight="bold">
                    Canal Desfeito (Barreira Isolante)
                  </text>
                </g>
              )}

              {/* Terminais Externos */}
              <line x1="130" y1="140" x2="130" y2="55" stroke="#242424" strokeWidth="2.5" />
              <circle cx="130" cy="55" r="4" fill="#242424" />
              <text x="60" y="42" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#242424">
                Terminal Fonte (GND)
              </text>

              <line x1="510" y1="140" x2="510" y2="55" stroke={channelFormed ? "#2b59d1" : "#242424"} strokeWidth="2.5" />
              <circle cx="510" cy="55" r="4" fill={channelFormed ? "#2b59d1" : "#242424"} />
              <text x="440" y="42" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={channelFormed ? "#2b59d1" : "#242424"}>
                Terminal Dreno (3.3V)
              </text>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-smoke">
              Estado das Grandezas Físicas
            </h4>
            <div className="mt-4 space-y-2.5 font-mono text-xs md:text-sm">
              <div className="flex justify-between border-b border-ash pb-1.5">
                <span className="text-graphite">Tensão no Gate (V_GS):</span>
                <span className={`font-bold ${gateHigh ? "text-lake-blue" : "text-off-black"}`}>{vGate}</span>
              </div>
              <div className="flex justify-between border-b border-ash pb-1.5">
                <span className="text-graphite">Corrente no Gate:</span>
                <span className="font-bold text-emerald-700">0.0 pA (Óxido Isola)</span>
              </div>
              <div className="flex justify-between border-b border-ash pb-1.5">
                <span className="text-graphite">Canal de Inversão:</span>
                <span className={`font-bold ${channelFormed ? "text-lake-blue" : "text-smoke"}`}>
                  {channelFormed ? "PRESENTE (N-Type)" : "AUSENTE"}
                </span>
              </div>
              <div className="flex justify-between border-b border-ash pb-1.5">
                <span className="text-graphite">Fluxo Dreno para Fonte:</span>
                <span className={`font-bold ${gateHigh ? "text-lake-blue" : "text-smoke"}`}>
                  {currentDrainSource}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-graphite">Comportamento Lógico:</span>
                <span className={`font-bold ${gateHigh ? "text-lake-blue" : "text-smoke"}`}>
                  {gateHigh ? "Chave FECHADA (1)" : "Chave ABERTA (0)"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ash bg-white p-4 text-xs md:text-sm text-graphite leading-relaxed">
            <strong className="block font-serif font-normal text-base text-off-black mb-1.5">
              Invariante Eletrostático:
            </strong>
            O gate está isolado do silício por dióxido de silício (SiO2). A comutação da chave ocorre sem fluxo de corrente elétrica contínua no controle, apenas por atração e repulsão eletrostática de cargas.
          </div>
        </div>
      </div>
    </div>
  );
}
