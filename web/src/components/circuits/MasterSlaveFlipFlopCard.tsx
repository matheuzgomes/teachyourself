import { useState } from "react";

export default function MasterSlaveFlipFlopCard() {
  const [dataD, setDataD] = useState(1);
  const [clock, setClock] = useState(0);

  // Master Latch captures when Clock is 0 (Transparent on 0, holds on 1)
  // Slave Latch captures when Clock is 1 (via NOT inverter: receives 0 when Clock is 0, holds; transparent on Clock=1)
  // Therefore: Rising edge (0 -> 1) freezes Master and passes to Slave!
  const [qMaster, setQMaster] = useState(1);
  const [qOutput, setQOutput] = useState(0);

  const toggleClock = () => {
    const nextClock = clock === 0 ? 1 : 0;
    setClock(nextClock);

    if (nextClock === 1) {
      // Rising Edge: Slave captures Master value
      setQOutput(qMaster);
    } else {
      // Clock is 0: Master updates to current D
      setQMaster(dataD);
    }
  };

  const handleDataChange = (newD: number) => {
    setDataD(newD);
    if (clock === 0) {
      // Master is transparent when clock is 0
      setQMaster(newD);
    }
  };

  return (
    <div
      data-visual-model="VIS-06-EDGE-TRIGGERED-FLIPFLOP"
      className="my-8 rounded-card border border-[#e2ded9] bg-[#fdfcfb] p-5 md:p-8 font-sans shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2ded9] pb-4">
        <div>
          <span className="inline-block rounded px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-[#eae3d2] text-[#2c2825]">
            VIS-06: Circuitos Sequenciais Sincronos
          </span>
          <h3 className="mt-1.5 font-serif text-xl md:text-2xl font-bold text-[#2c2825]">
            Flip-Flop D Disparado por Borda: Topologia Mestre-Escravo
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDataChange(dataD === 1 ? 0 : 1)}
            className={`min-h-[44px] rounded-button px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all ${
              dataD === 1
                ? "bg-[#2d5a27] text-white shadow-sm"
                : "bg-[#eae3d2] text-[#2c2825] hover:bg-[#dfd7c2]"
            }`}
          >
            Dado D = {dataD}
          </button>
          <button
            type="button"
            onClick={toggleClock}
            className={`min-h-[44px] rounded-button px-4 py-2 font-mono text-xs md:text-sm font-semibold transition-all ${
              clock === 1
                ? "bg-[#2d5a27] text-white shadow-sm"
                : "bg-[#eae3d2] text-[#2c2825] hover:bg-[#dfd7c2]"
            }`}
          >
            Sinal Clock = {clock} ({clock === 1 ? "Nivel 1 (Pos-Borda)" : "Nivel 0 (Preparacao)"})
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-[#5c554e]">
                Dois Latches em Cascata Isolados por Inversor de Clock
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-[#2d5a27]">
                Saida Final Q = {qOutput}
              </span>
            </div>

            <svg viewBox="0 0 620 260" className="w-full h-auto select-none" style={{ maxHeight: "260px" }}>
              <defs>
                <marker id="ffArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#2d5a27" />
                </marker>
              </defs>

              {/* Latch Mestre */}
              <rect
                x="80"
                y="35"
                width="165"
                height="100"
                rx="4"
                fill="#eae3d2"
                stroke="#3c3836"
                strokeWidth="1.5"
              />
              <text x="162" y="60" textAnchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="#2c2825">
                Latch Mestre
              </text>
              <text x="162" y="82" textAnchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill={clock === 0 ? "#2d5a27" : "#5c554e"}>
                {clock === 0 ? "TRANSPARENTE (Le D)" : "TRANCADO (Isolado)"}
              </text>
              <text x="162" y="108" textAnchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#2c2825">
                Q_m = {qMaster}
              </text>

              {/* Latch Escravo */}
              <rect
                x="335"
                y="35"
                width="165"
                height="100"
                rx="4"
                fill="#eae3d2"
                stroke="#3c3836"
                strokeWidth="1.5"
              />
              <text x="417" y="60" textAnchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="#2c2825">
                Latch Escravo
              </text>
              <text x="417" y="82" textAnchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill={clock === 1 ? "#2d5a27" : "#5c554e"}>
                {clock === 1 ? "TRANSPARENTE (Copia Q_m)" : "TRANCADO (Mantem Q)"}
              </text>
              <text x="417" y="108" textAnchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#2c2825">
                Q = {qOutput}
              </text>

              {/* Fio de Entrada D */}
              <line x1="20" y1="85" x2="80" y2="85" stroke={dataD === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={dataD === 1 ? "3.5" : "2"} />
              <circle cx="20" cy="85" r="5" fill={dataD === 1 ? "#2d5a27" : "#8c827a"} />
              <text x="20" y="68" font-family="monospace" font-size="13" font-weight="bold" fill={dataD === 1 ? "#2d5a27" : "#2c2825"}>
                D = {dataD}
              </text>

              {/* Fio entre Mestre e Escravo */}
              <line x1="245" y1="85" x2="335" y2="85" stroke={qMaster === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={qMaster === 1 ? "3" : "2"} />
              <text x="290" y="75" textAnchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill="#5c554e">
                Q_m
              </text>

              {/* Fio de Saida Final Q */}
              <line x1="500" y1="85" x2="550" y2="85" stroke={qOutput === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={qOutput === 1 ? "3.5" : "2"} markerEnd="url(#ffArrow)" />
              <text x="560" y="80" font-family="monospace" font-size="14" font-weight="bold" fill={qOutput === 1 ? "#2d5a27" : "#2c2825"}>
                Q = {qOutput}
              </text>
              <text x="560" y="100" font-family="monospace" font-size="12" font-weight="bold" fill="#5c554e">
                {qOutput === 1 ? "3.3V" : "0V"}
              </text>

              {/* Barramento de Clock para Mestre */}
              <line x1="20" y1="195" x2="162" y2="195" stroke={clock === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={clock === 1 ? "3" : "2"} />
              <line x1="162" y1="195" x2="162" y2="135" stroke={clock === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={clock === 1 ? "3" : "2"} />
              <circle cx="20" cy="195" r="5" fill={clock === 1 ? "#2d5a27" : "#8c827a"} />
              <text x="20" y="180" font-family="monospace" font-size="13" font-weight="bold" fill={clock === 1 ? "#2d5a27" : "#2c2825"}>
                Clock = {clock}
              </text>

              {/* Inversor de Clock para o Escravo */}
              <line x1="162" y1="195" x2="235" y2="195" stroke={clock === 1 ? "#2d5a27" : "#8c827a"} strokeWidth="2" />
              <circle cx="162" cy="195" r="4" fill={clock === 1 ? "#2d5a27" : "#8c827a"} />

              <g transform="translate(235, 180)">
                <polygon points="0,0 28,15 0,30" fill="#eae3d2" stroke="#3c3836" strokeWidth="1.5" />
                <circle cx="33" cy="15" r="5" fill="#fdfcfb" stroke="#3c3836" strokeWidth="1.5" />
              </g>

              {/* Saida Invertida do Clock para o Escravo */}
              <line x1="273" y1="195" x2="417" y2="195" stroke={clock === 0 ? "#2d5a27" : "#8c827a"} strokeWidth="2.5" />
              <line x1="417" y1="195" x2="417" y2="135" stroke={clock === 0 ? "#2d5a27" : "#8c827a"} strokeWidth="2.5" />
              <text x="350" y="218" textAnchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#5c554e">
                Clock Invertido = {clock === 1 ? 0 : 1}
              </text>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-[#5c554e]">
              Prova do Isolamento Anti-Transparencia
            </h4>
            <div className="mt-4 space-y-2.5 font-mono text-xs md:text-sm">
              <div className="flex justify-between border-b border-[#e2ded9] pb-1.5">
                <span className="text-[#5c554e]">Sinal de Clock:</span>
                <span className="font-bold text-[#2c2825]">{clock} ({clock === 1 ? "Alto" : "Baixo"})</span>
              </div>
              <div className="flex justify-between border-b border-[#e2ded9] pb-1.5">
                <span className="text-[#5c554e]">Latch Mestre:</span>
                <span className={`font-bold ${clock === 0 ? "text-[#2d5a27]" : "text-[#5c554e]"}`}>
                  {clock === 0 ? "ABERTO (Segue D)" : "TRANCADO (Isolado)"}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#e2ded9] pb-1.5">
                <span className="text-[#5c554e]">Latch Escravo:</span>
                <span className={`font-bold ${clock === 1 ? "text-[#2d5a27]" : "text-[#5c554e]"}`}>
                  {clock === 1 ? "ABERTO (Atualiza Q)" : "TRANCADO (Mantem Q)"}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#5c554e]">Captura Efetiva:</span>
                <span className="font-bold text-[#2d5a27]">Estritamente na Borda 0-&gt;1</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2ded9] bg-[#eae3d2] p-4 text-xs md:text-sm text-[#2c2825] leading-relaxed">
            <strong className="block font-serif font-bold text-sm md:text-base text-[#2c2825] mb-1.5">
              Experimento Mental:
            </strong>
            Deixe o Clock em 1 e clique em "Dado D". Observe que a saida Q permanece inalterada. Isso impede que sinais corram em loop descontrolado na ALU durante o periodo ativo.
          </div>
        </div>
      </div>
    </div>
  );
}
