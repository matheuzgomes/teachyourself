import { useState } from "react";

export default function MasterSlaveFlipFlopCard() {
  const [dataD, setDataD] = useState(1);
  const [clock, setClock] = useState(0);

  // Master Latch captura quando Clock é 0 (Transparente em 0, trava em 1)
  // Slave Latch captura quando Clock é 1 (via inversor NOT: recebe 0 quando Clock é 0, trava; transparente em Clock=1)
  // Portanto: Borda de subida (0 -> 1) congela o Master e passa para o Slave!
  const [qMaster, setQMaster] = useState(1);
  const [qOutput, setQOutput] = useState(0);

  const toggleClock = () => {
    const nextClock = clock === 0 ? 1 : 0;
    setClock(nextClock);

    if (nextClock === 1) {
      // Rising Edge: Slave captura o valor do Master
      setQOutput(qMaster);
    } else {
      // Clock é 0: Master atualiza para o D atual
      setQMaster(dataD);
    }
  };

  const handleDataChange = (newD: number) => {
    setDataD(newD);
    if (clock === 0) {
      // Master é transparente quando clock é 0
      setQMaster(newD);
    }
  };

  return (
    <div
      data-visual-model="VIS-06-EDGE-TRIGGERED-FLIPFLOP"
      className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div>
          <span className="inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-periwinkle-mist text-lake-blue border border-lake-blue/20">
            VIS-06: Circuitos Sequenciais Síncronos
          </span>
          <h3 className="mt-2 font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
            Flip-Flop D Disparado por Borda: Topologia Mestre-Escravo
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDataChange(dataD === 1 ? 0 : 1)}
            className={`min-h-[44px] rounded-full px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
              dataD === 1
                ? "bg-lake-blue text-white border-lake-blue shadow-sm"
                : "bg-parchment text-graphite border-ash hover:border-lake-blue/50 hover:text-off-black"
            }`}
          >
            Dado D = {dataD}
          </button>
          <button
            type="button"
            onClick={toggleClock}
            className={`min-h-[44px] rounded-full px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
              clock === 1
                ? "bg-lake-blue text-white border-lake-blue shadow-sm"
                : "bg-parchment text-graphite border-ash hover:border-lake-blue/50 hover:text-off-black"
            }`}
          >
            Sinal Clock = {clock} ({clock === 1 ? "Nível 1 (Pós-Borda)" : "Nível 0 (Preparação)"})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-graphite">
                Dois Latches em Cascata Isolados por Inversor de Clock
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-lake-blue">
                Saída Final Q = {qOutput}
              </span>
            </div>

            <svg viewBox="0 0 620 260" className="w-full h-auto select-none" style={{ maxHeight: "260px" }}>
              <defs>
                <marker id="ffArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#2b59d1" />
                </marker>
              </defs>

              {/* Latch Mestre */}
              <rect
                x="80"
                y="35"
                width="165"
                height="100"
                rx="6"
                fill="#ffffff"
                stroke="#242424"
                strokeWidth="1.5"
              />
              <text x="162" y="60" textAnchor="middle" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="#242424">
                Latch Mestre
              </text>
              <text x="162" y="82" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={clock === 0 ? "#2b59d1" : "#615e5d"}>
                {clock === 0 ? "TRANSPARENTE (Lê D)" : "TRANCADO (Isolado)"}
              </text>
              <text x="162" y="108" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">
                Q_m = {qMaster}
              </text>

              {/* Latch Escravo */}
              <rect
                x="335"
                y="35"
                width="165"
                height="100"
                rx="6"
                fill="#ffffff"
                stroke="#242424"
                strokeWidth="1.5"
              />
              <text x="417" y="60" textAnchor="middle" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="#242424">
                Latch Escravo
              </text>
              <text x="417" y="82" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={clock === 1 ? "#2b59d1" : "#615e5d"}>
                {clock === 1 ? "TRANSPARENTE (Copia Q_m)" : "TRANCADO (Mantém Q)"}
              </text>
              <text x="417" y="108" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">
                Q = {qOutput}
              </text>

              {/* Fio de Entrada D */}
              <line x1="20" y1="85" x2="80" y2="85" stroke={dataD === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={dataD === 1 ? "3.5" : "2"} />
              <circle cx="20" cy="85" r="5" fill={dataD === 1 ? "#2b59d1" : "#615e5d"} />
              <text x="20" y="68" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={dataD === 1 ? "#2b59d1" : "#242424"}>
                D = {dataD}
              </text>

              {/* Fio entre Mestre e Escravo */}
              <line x1="245" y1="85" x2="335" y2="85" stroke={qMaster === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={qMaster === 1 ? "3" : "2"} />
              <text x="290" y="75" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#615e5d">
                Q_m
              </text>

              {/* Fio de Saída Final Q */}
              <line x1="500" y1="85" x2="550" y2="85" stroke={qOutput === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={qOutput === 1 ? "3.5" : "2"} markerEnd="url(#ffArrow)" />
              <text x="560" y="80" fontFamily="monospace" fontSize="14" fontWeight="bold" fill={qOutput === 1 ? "#2b59d1" : "#242424"}>
                Q = {qOutput}
              </text>
              <text x="560" y="100" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#615e5d">
                {qOutput === 1 ? "3.3V" : "0V"}
              </text>

              {/* Barramento de Clock para Mestre */}
              <line x1="20" y1="195" x2="162" y2="195" stroke={clock === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={clock === 1 ? "3" : "2"} />
              <line x1="162" y1="195" x2="162" y2="135" stroke={clock === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={clock === 1 ? "3" : "2"} />
              <circle cx="20" cy="195" r="5" fill={clock === 1 ? "#2b59d1" : "#615e5d"} />
              <text x="20" y="180" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={clock === 1 ? "#2b59d1" : "#242424"}>
                Clock = {clock}
              </text>

              {/* Inversor de Clock para o Escravo */}
              <line x1="162" y1="195" x2="235" y2="195" stroke={clock === 1 ? "#2b59d1" : "#615e5d"} strokeWidth="2" />
              <circle cx="162" cy="195" r="4" fill={clock === 1 ? "#2b59d1" : "#615e5d"} />

              <g transform="translate(235, 180)">
                <polygon points="0,0 28,15 0,30" fill="#ffffff" stroke="#242424" strokeWidth="1.5" />
                <circle cx="33" cy="15" r="5" fill="#ffffff" stroke="#242424" strokeWidth="1.5" />
              </g>

              {/* Saída Invertida do Clock para o Escravo */}
              <line x1="273" y1="195" x2="417" y2="195" stroke={clock === 0 ? "#2b59d1" : "#615e5d"} strokeWidth="2.5" />
              <line x1="417" y1="195" x2="417" y2="135" stroke={clock === 0 ? "#2b59d1" : "#615e5d"} strokeWidth="2.5" />
              <text x="350" y="218" textAnchor="middle" fontFamily="monospace" fontSize="11" fontWeight="bold" fill="#615e5d">
                Clock Invertido = {clock === 1 ? 0 : 1}
              </text>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-smoke">
              Prova do Isolamento Anti-Transparência
            </h4>
            <div className="mt-4 space-y-2.5 font-mono text-xs md:text-sm">
              <div className="flex justify-between border-b border-ash pb-1.5">
                <span className="text-graphite">Sinal de Clock:</span>
                <span className="font-bold text-off-black">{clock} ({clock === 1 ? "Alto" : "Baixo"})</span>
              </div>
              <div className="flex justify-between border-b border-ash pb-1.5">
                <span className="text-graphite">Latch Mestre:</span>
                <span className={`font-bold ${clock === 0 ? "text-lake-blue" : "text-smoke"}`}>
                  {clock === 0 ? "ABERTO (Segue D)" : "TRANCADO (Isolado)"}
                </span>
              </div>
              <div className="flex justify-between border-b border-ash pb-1.5">
                <span className="text-graphite">Latch Escravo:</span>
                <span className={`font-bold ${clock === 1 ? "text-lake-blue" : "text-smoke"}`}>
                  {clock === 1 ? "ABERTO (Atualiza Q)" : "TRANCADO (Mantém Q)"}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-graphite">Captura Efetiva:</span>
                <span className="font-bold text-lake-blue">Estritamente na Borda 0-&gt;1</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ash bg-white p-4 text-xs md:text-sm text-graphite leading-relaxed">
            <strong className="block font-serif font-normal text-base text-off-black mb-1.5">
              Experimento Mental:
            </strong>
            Deixe o Clock em 1 e clique em "Dado D". Observe que a saída Q permanece inalterada. Isso impede que sinais corram em loop descontrolado na ALU durante o período ativo.
          </div>
        </div>
      </div>
    </div>
  );
}
