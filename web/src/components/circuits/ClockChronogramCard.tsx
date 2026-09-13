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
      className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div>
          <span className="inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-periwinkle-mist text-lake-blue border border-lake-blue/20">
            VIS-07: Metrologia Temporal e Setup/Hold
          </span>
          <h3 className="mt-2 font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
            Cronograma de Clock e o Limite Físico da Frequência Operacional
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`min-h-[44px] inline-flex items-center rounded-full px-4 py-2 font-mono text-xs md:text-sm font-bold border ${
            isViolation ? "bg-coral/20 border-coral/40 text-crimson" : "bg-mint/30 border-mint text-emerald-800"
          }`}>
            {isViolation ? "VIOLAÇÃO DE SETUP TIME (Metastabilidade)" : "TEMPORIZAÇÃO CONFIÁVEL (Margem Positiva)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-graphite">
                Forma de Onda com Separação Escalonada de Setup e Hold
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-off-black">
                Período T_clock = {tPeriod} ps ({freqMhz} MHz)
              </span>
            </div>

            <svg viewBox="0 0 620 270" className="w-full h-auto select-none" style={{ maxHeight: "270px" }}>
              <defs>
                <marker id="timeArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#242424" />
                </marker>
              </defs>

              {/* Linha de Tempo Horizontal */}
              <line x1="50" y1="225" x2="570" y2="225" stroke="#242424" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#timeArrow)" />
              <text x="510" y="245" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#615e5d">Tempo (ps)</text>

              {/* Onda 1: Clock */}
              <text x="15" y="55" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">CLK</text>
              <polyline
                points="50,75 130,75 130,35 250,35 250,75 370,75 370,35 490,35 490,75 570,75"
                fill="none"
                stroke="#2b59d1"
                strokeWidth="2.5"
              />

              {/* Marcação da Borda de Subida no ciclo (x = 370) */}
              <line x1="370" y1="20" x2="370" y2="220" stroke="#242424" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="376" y="28" fontFamily="monospace" fontSize="11" fontWeight="bold" fill="#242424">
                Borda de Subida (Amostragem)
              </text>

              {/* Onda 2: Dado de Entrada (D) */}
              <text x="15" y="150" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">DADO</text>
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
                      fill={isViolation ? "#ff9473" : "#a7fccd"}
                      opacity={isViolation ? 0.45 : 0.35}
                      stroke={isViolation ? "#f37a0a" : "#2b59d1"}
                      strokeWidth="1.5"
                      rx="3"
                    />
                    {/* Rótulo de Setup POSICIONADO ACIMA (y=94) */}
                    <line x1={setupStartX} y1="98" x2="370" y2="98" stroke={isViolation ? "#f37a0a" : "#2b59d1"} strokeWidth="1.5" />
                    <text x={setupStartX} y="92" fontFamily="monospace" fontSize="11" fill={isViolation ? "#f37a0a" : "#2b59d1"} fontWeight="bold">
                      Janela Setup ({tSetup}ps)
                    </text>

                    {/* Janela de Hold Sombreada */}
                    <rect
                      x="370"
                      y="105"
                      width={holdEndX - 370}
                      height="65"
                      fill="#cfdaf5"
                      opacity="0.5"
                      stroke="#2b59d1"
                      strokeWidth="1.5"
                      rx="3"
                    />
                    {/* Rótulo de Hold POSICIONADO ABAIXO (y=188) */}
                    <line x1="370" y1="176" x2={holdEndX} y2="176" stroke="#2b59d1" strokeWidth="1.5" />
                    <text x="375" y="190" fontFamily="monospace" fontSize="11" fill="#615e5d" fontWeight="bold">
                      Hold ({tHold}ps)
                    </text>

                    {/* Sinal de Dado em comutação */}
                    <path
                      d={`M 50,150 L 130,150 L 150,130 L ${arrivalX},130 L ${arrivalX + 15},150 L 560,150`}
                      fill="none"
                      stroke={isViolation ? "#f37a0a" : "#2b59d1"}
                      strokeWidth="2.5"
                    />

                    {/* Ponto de Estabilização */}
                    <circle cx={arrivalX} cy="130" r="5" fill={isViolation ? "#f37a0a" : "#2b59d1"} />
                    <text x={Math.max(45, arrivalX - 70)} y="120" fontFamily="monospace" fontSize="11" fontWeight="bold" fill={isViolation ? "#f37a0a" : "#2b59d1"}>
                      Dado Estável ({tRequired} ps)
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-smoke">Parâmetros de Frequência</h4>
            <div className="mt-4 space-y-3 font-mono text-xs md:text-sm">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-graphite">Frequência de Clock:</span>
                  <span className="font-bold text-off-black">{freqMhz} MHz</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="250"
                  value={freqMhz}
                  aria-label="Frequência de Clock em MHz"
                  onChange={(e) => setFreqMhz(Number(e.target.value))}
                  className="w-full accent-lake-blue"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-graphite">Atraso Combinacional (T_comb):</span>
                  <span className="font-bold text-off-black">{tComb} ps</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={tComb}
                  aria-label="Atraso combinacional em picosegundos"
                  onChange={(e) => setTComb(Number(e.target.value))}
                  className="w-full accent-lake-blue"
                />
              </div>

              <div className="border-t border-ash pt-2.5 space-y-1.5">
                <div className="flex justify-between"><span>Período Disponível (T):</span><span className="font-bold text-off-black">{tPeriod} ps</span></div>
                <div className="flex justify-between"><span>Tempo Exigido (Cq+Comb+Setup):</span><span className="font-bold text-off-black">{tRequired} ps</span></div>
                <div className="flex justify-between">
                  <span>Margem Temporal:</span>
                  <span className={`font-bold ${margin >= 0 ? "text-emerald-700" : "text-crimson"}`}>
                    {margin >= 0 ? `+${margin} ps (Seguro)` : `${margin} ps (VIOLAÇÃO)`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 text-xs md:text-sm leading-relaxed ${
            isViolation ? "border-coral/50 bg-coral/10 text-off-black" : "border-ash bg-white text-off-black"
          }`}>
            <strong className="block font-serif font-normal text-base text-off-black mb-1.5">Equação Fundamental:</strong>
            <code>T_clock &gt;= T_cq + T_comb + T_setup</code>. Para alcançar frequências operacionais mais altas sem violar a janela de setup, a engenharia de hardware precisa segmentar a lógica combinacional em estágios curtos de pipeline.
          </div>
        </div>
      </div>
    </div>
  );
}
