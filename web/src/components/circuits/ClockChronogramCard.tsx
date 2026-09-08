import { useState } from "react";

export default function ClockChronogramCard() {
  const [freqMhz, setFreqMhz] = useState(1000); // 1 GHz -> 1000 ps
  const [tComb, setTComb] = useState(400); // 400 ps

  const tCq = 100; // 100 ps
  const tSetup = 100; // 100 ps
  const tHold = 60; // 60 ps

  const tPeriod = Math.round(1000000 / freqMhz); // in ps
  const tRequired = tCq + tComb + tSetup;
  const margin = tPeriod - tRequired;
  const isViolation = margin < 0;

  return (
    <div
      data-visual-model="VIS-07-CLOCK-CHRONOGRAM-SETUP"
      className="my-8 rounded-card border border-[#e2ded9] bg-[#fdfcfb] p-5 md:p-8 font-sans shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2ded9] pb-4">
        <div>
          <span className="inline-block rounded px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-[#eae3d2] text-[#2c2825]">
            VIS-07: Metrologia Temporal e Setup/Hold
          </span>
          <h3 className="mt-1.5 font-serif text-xl md:text-2xl font-bold text-[#2c2825]">
            Cronograma de Clock e o Limite Fisico da Frequencia Operacional
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`min-h-[44px] inline-flex items-center rounded-button px-4 py-2 font-mono text-xs md:text-sm font-bold ${
            isViolation ? "bg-[#b44322]/15 text-[#b44322]" : "bg-[#2d5a27]/15 text-[#2d5a27]"
          }`}>
            {isViolation ? "VIOLACAO DE SETUP TIME (Metastabilidade)" : "TEMPORIZACAO CONFIAVEL (Margem Positiva)"}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-[#5c554e]">
                Forma de Onda com Separacao Escalonada de Setup e Hold
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-[#2c2825]">
                Periodo T_clock = {tPeriod} ps ({freqMhz} MHz)
              </span>
            </div>

            <svg viewBox="0 0 620 270" className="w-full h-auto select-none" style={{ maxHeight: "270px" }}>
              <defs>
                <pattern id="hazardPattern" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 0 8 L 8 0 M 4 8 L 8 4 M 0 4 L 4 0" stroke="#b44322" strokeWidth="1" />
                </pattern>
                <marker id="timeArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#3c3836" />
                </marker>
              </defs>

              {/* Linha de Tempo Horizontal */}
              <line x1="50" y1="225" x2="570" y2="225" stroke="#3c3836" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#timeArrow)" />
              <text x="510" y="245" font-family="monospace" font-size="12" font-weight="bold" fill="#5c554e">Tempo (ps)</text>

              {/* Onda 1: Clock */}
              <text x="15" y="55" font-family="monospace" font-size="13" font-weight="bold" fill="#2c2825">CLK</text>
              <polyline
                points="50,75 130,75 130,35 250,35 250,75 370,75 370,35 490,35 490,75 570,75"
                fill="none"
                stroke="#2d5a27"
                strokeWidth="2.5"
              />

              {/* Marcacao da Borda de Subida no ciclo (x = 370) */}
              <line x1="370" y1="20" x2="370" y2="220" stroke="#3c3836" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="376" y="28" font-family="monospace" font-size="11" font-weight="bold" fill="#2c2825">
                Borda de Subida (Amostragem)
              </text>

              {/* Onda 2: Dado de Entrada (D) */}
              <text x="15" y="150" font-family="monospace" font-size="13" font-weight="bold" fill="#2c2825">DADO</text>
              {(() => {
                const arrivalX = Math.min(540, 130 + (tRequired / tPeriod) * 240);
                const setupStartX = 370 - (tSetup / tPeriod) * 240;
                const holdEndX = 370 + (tHold / tPeriod) * 240;
                return (
                  <g>
                    {/* Janela de Setup Sombreada */}
                    <rect
                      x={setupStartX}
                      y="105"
                      width={370 - setupStartX}
                      height="65"
                      fill={isViolation ? "url(#hazardPattern)" : "#2d5a27"}
                      opacity={isViolation ? 0.4 : 0.15}
                      stroke={isViolation ? "#b44322" : "#2d5a27"}
                      strokeWidth="1.5"
                    />
                    {/* Rotulo de Setup POSICIONADO ACIMA (y=94) - Sem colisao */}
                    <line x1={setupStartX} y1="98" x2="370" y2="98" stroke={isViolation ? "#b44322" : "#2d5a27"} strokeWidth="1.5" />
                    <text x={setupStartX} y="92" font-family="monospace" font-size="11" fill={isViolation ? "#b44322" : "#2d5a27"} font-weight="bold">
                      Janela Setup ({tSetup}ps)
                    </text>

                    {/* Janela de Hold Sombreada */}
                    <rect
                      x="370"
                      y="105"
                      width={holdEndX - 370}
                      height="65"
                      fill="#eae3d2"
                      stroke="#8c827a"
                      strokeWidth="1.5"
                    />
                    {/* Rotulo de Hold POSICIONADO ABAIXO (y=188) - Sem colisao */}
                    <line x1="370" y1="176" x2={holdEndX} y2="176" stroke="#8c827a" strokeWidth="1.5" />
                    <text x="375" y="190" font-family="monospace" font-size="11" fill="#5c554e" font-weight="bold">
                      Hold ({tHold}ps)
                    </text>

                    {/* Sinal de Dado em comutacao */}
                    <path
                      d={`M 50,150 L 130,150 L 150,130 L ${arrivalX},130 L ${arrivalX + 15},150 L 560,150`}
                      fill="none"
                      stroke={isViolation ? "#b44322" : "#2d5a27"}
                      strokeWidth="2.5"
                    />

                    {/* Ponto de Estabilizacao */}
                    <circle cx={arrivalX} cy="130" r="5" fill={isViolation ? "#b44322" : "#2d5a27"} />
                    <text x={Math.max(45, arrivalX - 70)} y="120" font-family="monospace" font-size="11" font-weight="bold" fill={isViolation ? "#b44322" : "#2d5a27"}>
                      Dado Estavel ({tRequired} ps)
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-[#5c554e]">Parametros de Frequencia</h4>
            <div className="mt-4 space-y-3 font-mono text-xs md:text-sm">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[#5c554e]">Frequencia de Clock:</span>
                  <span className="font-bold text-[#2c2825]">{freqMhz} MHz</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="250"
                  value={freqMhz}
                  onChange={(e) => setFreqMhz(Number(e.target.value))}
                  className="w-full accent-[#2d5a27]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[#5c554e]">Atraso Combinacional (T_comb):</span>
                  <span className="font-bold text-[#2c2825]">{tComb} ps</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={tComb}
                  onChange={(e) => setTComb(Number(e.target.value))}
                  className="w-full accent-[#2d5a27]"
                />
              </div>

              <div className="border-t border-[#e2ded9] pt-2.5 space-y-1.5">
                <div className="flex justify-between"><span>Periodo Disponivel (T):</span><span className="font-bold">{tPeriod} ps</span></div>
                <div className="flex justify-between"><span>Tempo Exigido (Cq+Comb+Setup):</span><span className="font-bold">{tRequired} ps</span></div>
                <div className="flex justify-between">
                  <span>Margem Temporal:</span>
                  <span className={`font-bold ${margin >= 0 ? "text-[#2d5a27]" : "text-[#b44322]"}`}>
                    {margin >= 0 ? `+${margin} ps (Seguro)` : `${margin} ps (VIOLACAO)`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 text-xs md:text-sm leading-relaxed ${
            isViolation ? "border-[#b44322] bg-[#b44322]/10 text-[#2c2825]" : "border-[#e2ded9] bg-[#eae3d2] text-[#2c2825]"
          }`}>
            <strong className="block font-serif font-bold text-sm md:text-base mb-1.5">Equacao Fundamental:</strong>
            <code>T_clock &gt;= T_cq + T_comb + T_setup</code>. Para alcancar frequencias operacionais mais altas sem violar a janela de setup, a engenharia de hardware e forcada a segmentar a logica combinacional em estagios curtos de pipeline.
          </div>
        </div>
      </div>
    </div>
  );
}
