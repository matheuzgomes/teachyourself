import { useState } from "react";

export default function AdderCircuitsCard() {
  const [activeTab, setActiveTab] = useState<"half" | "full" | "ripple">("half");

  // Half Adder States
  const [haA, setHaA] = useState(1);
  const [haB, setHaB] = useState(1);
  const haSum = haA ^ haB;
  const haCarry = haA & haB;

  // Full Adder States
  const [faA, setFaA] = useState(1);
  const [faB, setFaB] = useState(1);
  const [faCin, setFaCin] = useState(0);
  const faSum = faA ^ faB ^ faCin;
  const faCout = (faA & faB) | (faCin & (faA ^ faB));

  // Ripple Carry States (4 bits)
  const [rcA, setRcA] = useState([1, 1, 1, 1]); // bits 3..0
  const [rcB, setRcB] = useState([0, 0, 0, 1]); // bits 3..0
  const [rcCin, setRcCin] = useState(0);

  // Compute 4-bit ripple carry
  const c0 = rcCin;
  const s0 = rcA[3] ^ rcB[3] ^ c0;
  const c1 = (rcA[3] & rcB[3]) | (c0 & (rcA[3] ^ rcB[3]));

  const s1 = rcA[2] ^ rcB[2] ^ c1;
  const c2 = (rcA[2] & rcB[2]) | (c1 & (rcA[2] ^ rcB[2]));

  const s2 = rcA[1] ^ rcB[1] ^ c2;
  const c3 = (rcA[1] & rcB[1]) | (c2 & (rcA[1] ^ rcB[1]));

  const s3 = rcA[0] ^ rcB[0] ^ c3;
  const c4 = (rcA[0] & rcB[0]) | (c3 & (rcA[0] ^ rcB[0]));

  return (
    <div
      data-visual-model="VIS-05-ARITHMETIC-ADDERS"
      className="my-8 rounded-card border border-[#e2ded9] bg-[#fdfcfb] p-5 md:p-8 font-sans shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2ded9] pb-4">
        <div>
          <span className="inline-block rounded px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-[#eae3d2] text-[#2c2825]">
            VIS-05: Aritmetica Digital e Caminho Critico
          </span>
          <h3 className="mt-1.5 font-serif text-xl md:text-2xl font-bold text-[#2c2825]">
            Circuitos Somadores: Meio Somador, Somador Completo e Cascata
          </h3>
        </div>
        <div className="flex rounded-button bg-[#eae3d2] p-1 text-xs md:text-sm font-mono font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("half")}
            className={`rounded px-3.5 py-1.5 transition-all ${
              activeTab === "half" ? "bg-[#2d5a27] text-white shadow-sm" : "text-[#5c554e] hover:text-[#2c2825]"
            }`}
          >
            Meio Somador
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("full")}
            className={`rounded px-3.5 py-1.5 transition-all ${
              activeTab === "full" ? "bg-[#2d5a27] text-white shadow-sm" : "text-[#5c554e] hover:text-[#2c2825]"
            }`}
          >
            Somador Completo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ripple")}
            className={`rounded px-3.5 py-1.5 transition-all ${
              activeTab === "ripple" ? "bg-[#2d5a27] text-white shadow-sm" : "text-[#5c554e] hover:text-[#2c2825]"
            }`}
          >
            Cascata (Ripple 4-bit)
          </button>
        </div>
      </div>

      {activeTab === "half" && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-xs md:text-sm font-medium text-[#5c554e]">
                  Meio Somador: Roteamento Ortogonal (XOR para Soma, AND para Carry)
                </span>
                <span className="font-mono text-xs md:text-sm font-bold text-[#2d5a27]">
                  Soma={haSum}, Carry={haCarry}
                </span>
              </div>
              <svg viewBox="0 0 580 230" className="w-full h-auto select-none" style={{ maxHeight: "230px" }}>
                <defs>
                  <marker id="haArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#2d5a27" />
                  </marker>
                </defs>

                {/* Entrada A */}
                <line x1="40" y1="60" x2="200" y2="60" stroke={haA === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={haA === 1 ? "3" : "2"} />
                <circle cx="40" cy="60" r="5" fill={haA === 1 ? "#2d5a27" : "#8c827a"} />
                <text x="40" y="44" font-family="monospace" font-size="13" font-weight="bold" fill={haA === 1 ? "#2d5a27" : "#2c2825"}>
                  Entrada A = {haA}
                </text>

                {/* Entrada B */}
                <line x1="40" y1="90" x2="200" y2="90" stroke={haB === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={haB === 1 ? "3" : "2"} />
                <circle cx="40" cy="90" r="5" fill={haB === 1 ? "#2d5a27" : "#8c827a"} />
                <text x="40" y="112" font-family="monospace" font-size="13" font-weight="bold" fill={haB === 1 ? "#2d5a27" : "#2c2825"}>
                  Entrada B = {haB}
                </text>

                {/* Ramificacoes Ortogonais para Porta AND */}
                <circle cx="100" cy="60" r="4" fill={haA === 1 ? "#2d5a27" : "#8c827a"} />
                <line x1="100" y1="60" x2="100" y2="155" stroke={haA === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={haA === 1 ? "3" : "2"} />
                <line x1="100" y1="155" x2="200" y2="155" stroke={haA === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={haA === 1 ? "3" : "2"} />

                <circle cx="130" cy="90" r="4" fill={haB === 1 ? "#2d5a27" : "#8c827a"} />
                <line x1="130" y1="90" x2="130" y2="175" stroke={haB === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={haB === 1 ? "3" : "2"} />
                <line x1="130" y1="175" x2="200" y2="175" stroke={haB === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={haB === 1 ? "3" : "2"} />

                {/* Porta XOR (Soma) */}
                <g transform="translate(200, 48)">
                  <rect x="0" y="0" width="90" height="54" rx="4" fill="#eae3d2" stroke="#3c3836" strokeWidth="1.5" />
                  <text x="45" y="32" textAnchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="#2c2825">XOR</text>
                </g>
                <line x1="290" y1="75" x2="420" y2="75" stroke={haSum === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={haSum === 1 ? "3.5" : "2"} markerEnd="url(#haArrow)" />
                <text x="435" y="70" font-family="monospace" font-size="14" font-weight="bold" fill={haSum === 1 ? "#2d5a27" : "#2c2825"}>
                  Soma (S) = {haSum}
                </text>
                <text x="435" y="88" font-family="monospace" font-size="12" font-weight="bold" fill="#5c554e">
                  S = A ^ B
                </text>

                {/* Porta AND (Carry) */}
                <g transform="translate(200, 138)">
                  <rect x="0" y="0" width="90" height="54" rx="4" fill="#eae3d2" stroke="#3c3836" strokeWidth="1.5" />
                  <text x="45" y="32" textAnchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="#2c2825">AND</text>
                </g>
                <line x1="290" y1="165" x2="420" y2="165" stroke={haCarry === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={haCarry === 1 ? "3.5" : "2"} markerEnd="url(#haArrow)" />
                <text x="435" y="160" font-family="monospace" font-size="14" font-weight="bold" fill={haCarry === 1 ? "#2d5a27" : "#2c2825"}>
                  Carry (C) = {haCarry}
                </text>
                <text x="435" y="178" font-family="monospace" font-size="12" font-weight="bold" fill="#5c554e">
                  C = A & B
                </text>
              </svg>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
              <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-[#5c554e]">Controle das Entradas</h4>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setHaA(haA === 1 ? 0 : 1)}
                  className={`min-h-[44px] flex-1 rounded-button py-2 font-mono text-xs md:text-sm font-bold transition-all ${
                    haA === 1 ? "bg-[#2d5a27] text-white shadow-sm" : "bg-[#eae3d2] text-[#2c2825]"
                  }`}
                >
                  Bit A = {haA}
                </button>
                <button
                  type="button"
                  onClick={() => setHaB(haB === 1 ? 0 : 1)}
                  className={`min-h-[44px] flex-1 rounded-button py-2 font-mono text-xs md:text-sm font-bold transition-all ${
                    haB === 1 ? "bg-[#2d5a27] text-white shadow-sm" : "bg-[#eae3d2] text-[#2c2825]"
                  }`}
                >
                  Bit B = {haB}
                </button>
              </div>
              <div className="mt-4 border-t border-[#e2ded9] pt-2.5 font-mono text-xs md:text-sm space-y-1.5 text-[#2c2825]">
                <div className="flex justify-between"><span>Aritmetica:</span><span className="font-bold">{haA} + {haB} = {haCarry}{haSum}_2</span></div>
                <div className="flex justify-between"><span>Soma (A ^ B):</span><span className="font-bold text-[#2d5a27]">{haSum}</span></div>
                <div className="flex justify-between"><span>Carry (A & B):</span><span className="font-bold text-[#2d5a27]">{haCarry}</span></div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e2ded9] bg-[#eae3d2] p-4 text-xs md:text-sm text-[#2c2825] leading-relaxed">
              O Meio Somador resolve a adicao de dois bits isolados gerando soma e transporte, mas nao possui entrada de Carry-In para receber o transporte da coluna anterior.
            </div>
          </div>
        </div>
      )}

      {activeTab === "full" && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-xs md:text-sm font-medium text-[#5c554e]">
                  Somador Completo (2 Half Adders em Cascata + Porta OR)
                </span>
                <span className="font-mono text-xs md:text-sm font-bold text-[#2d5a27]">
                  Soma={faSum}, C_out={faCout}
                </span>
              </div>
              <svg viewBox="0 0 620 260" className="w-full h-auto select-none" style={{ maxHeight: "260px" }}>
                <defs>
                  <marker id="faArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#2d5a27" />
                  </marker>
                </defs>

                {/* Half Adder 1 */}
                <rect x="55" y="30" width="130" height="90" rx="4" fill="#eae3d2" stroke="#3c3836" strokeWidth="1.5" />
                <text x="120" y="58" textAnchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#2c2825">Half Adder 1</text>
                <text x="120" y="80" textAnchor="middle" font-family="monospace" font-size="11" fill="#5c554e">A ^ B e A & B</text>

                {/* Entradas A e B no HA 1 */}
                <line x1="15" y1="52" x2="55" y2="52" stroke={faA === 1 ? "#2d5a27" : "#8c827a"} strokeWidth="2.5" />
                <circle cx="15" cy="52" r="4" fill={faA === 1 ? "#2d5a27" : "#8c827a"} />
                <text x="18" y="44" font-family="monospace" font-size="12" font-weight="bold" fill="#2c2825">A={faA}</text>

                <line x1="15" y1="92" x2="55" y2="92" stroke={faB === 1 ? "#2d5a27" : "#8c827a"} strokeWidth="2.5" />
                <circle cx="15" cy="92" r="4" fill={faB === 1 ? "#2d5a27" : "#8c827a"} />
                <text x="18" y="84" font-family="monospace" font-size="12" font-weight="bold" fill="#2c2825">B={faB}</text>

                {/* Half Adder 2 */}
                <rect x="250" y="30" width="130" height="90" rx="4" fill="#eae3d2" stroke="#3c3836" strokeWidth="1.5" />
                <text x="315" y="58" textAnchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#2c2825">Half Adder 2</text>
                <text x="315" y="80" textAnchor="middle" font-family="monospace" font-size="11" fill="#5c554e">Soma + C_in</text>

                {/* Fio de Soma Intermediaria HA1 -> HA2 */}
                <line x1="185" y1="52" x2="250" y2="52" stroke="#3c3836" strokeWidth="2.5" />
                <text x="217" y="44" textAnchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="#5c554e">S_int</text>

                {/* Entrada Cin via Linha Ortogonal */}
                <line x1="15" y1="150" x2="220" y2="150" stroke={faCin === 1 ? "#2d5a27" : "#8c827a"} strokeWidth="2.5" />
                <line x1="220" y1="150" x2="220" y2="92" stroke={faCin === 1 ? "#2d5a27" : "#8c827a"} strokeWidth="2.5" />
                <line x1="220" y1="92" x2="250" y2="92" stroke={faCin === 1 ? "#2d5a27" : "#8c827a"} strokeWidth="2.5" />
                <circle cx="15" cy="150" r="4" fill={faCin === 1 ? "#2d5a27" : "#8c827a"} />
                <text x="18" y="142" font-family="monospace" font-size="12" font-weight="bold" fill="#2c2825">C_in={faCin}</text>

                {/* Saida de Soma Final */}
                <line x1="380" y1="52" x2="480" y2="52" stroke={faSum === 1 ? "#2d5a27" : "#8c827a"} strokeWidth="3.5" markerEnd="url(#faArrow)" />
                <text x="495" y="48" font-family="monospace" font-size="14" font-weight="bold" fill={faSum === 1 ? "#2d5a27" : "#2c2825"}>
                  Soma = {faSum}
                </text>
                <text x="495" y="68" font-family="monospace" font-size="12" font-weight="bold" fill="#5c554e">
                  S = A ^ B ^ Cin
                </text>

                {/* Conexoes de Carry para a Porta OR (100% Ortogonais) */}
                {/* Carry 1 do HA 1 */}
                <line x1="185" y1="92" x2="205" y2="92" stroke="#3c3836" strokeWidth="2" />
                <line x1="205" y1="92" x2="205" y2="185" stroke="#3c3836" strokeWidth="2" />
                <line x1="205" y1="185" x2="415" y2="185" stroke="#3c3836" strokeWidth="2" />
                <text x="215" y="178" font-family="monospace" font-size="10" fill="#5c554e">Carry 1 (A & B)</text>

                {/* Carry 2 do HA 2 */}
                <line x1="380" y1="92" x2="400" y2="92" stroke="#3c3836" strokeWidth="2" />
                <line x1="400" y1="92" x2="400" y2="160" stroke="#3c3836" strokeWidth="2" />
                <line x1="400" y1="160" x2="415" y2="160" stroke="#3c3836" strokeWidth="2" />
                <text x="350" y="152" font-family="monospace" font-size="10" fill="#5c554e">Carry 2</text>

                {/* Porta OR */}
                <g transform="translate(415, 145)">
                  <rect x="0" y="0" width="65" height="52" rx="4" fill="#eae3d2" stroke="#3c3836" strokeWidth="1.5" />
                  <text x="32" y="32" textAnchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="#2c2825">OR</text>
                </g>

                {/* Saida Carry Out */}
                <line x1="480" y1="171" x2="525" y2="171" stroke={faCout === 1 ? "#2d5a27" : "#8c827a"} strokeWidth="3.5" markerEnd="url(#faArrow)" />
                <text x="495" y="210" font-family="monospace" font-size="14" font-weight="bold" fill={faCout === 1 ? "#2d5a27" : "#2c2825"}>
                  C_out = {faCout}
                </text>
                <text x="495" y="228" font-family="monospace" font-size="12" font-weight="bold" fill="#5c554e">
                  Carry 1 | Carry 2
                </text>
              </svg>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
              <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-[#5c554e]">Controle das 3 Entradas</h4>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFaA(faA === 1 ? 0 : 1)}
                  className={`min-h-[44px] rounded-button py-2 font-mono text-xs md:text-sm font-bold transition-all ${
                    faA === 1 ? "bg-[#2d5a27] text-white shadow-sm" : "bg-[#eae3d2] text-[#2c2825]"
                  }`}
                >
                  A={faA}
                </button>
                <button
                  type="button"
                  onClick={() => setFaB(faB === 1 ? 0 : 1)}
                  className={`min-h-[44px] rounded-button py-2 font-mono text-xs md:text-sm font-bold transition-all ${
                    faB === 1 ? "bg-[#2d5a27] text-white shadow-sm" : "bg-[#eae3d2] text-[#2c2825]"
                  }`}
                >
                  B={faB}
                </button>
                <button
                  type="button"
                  onClick={() => setFaCin(faCin === 1 ? 0 : 1)}
                  className={`min-h-[44px] rounded-button py-2 font-mono text-xs md:text-sm font-bold transition-all ${
                    faCin === 1 ? "bg-[#2d5a27] text-white shadow-sm" : "bg-[#eae3d2] text-[#2c2825]"
                  }`}
                >
                  Cin={faCin}
                </button>
              </div>
              <div className="mt-4 border-t border-[#e2ded9] pt-2.5 font-mono text-xs md:text-sm space-y-1.5 text-[#2c2825]">
                <div className="flex justify-between"><span>Aritmetica:</span><span className="font-bold">{faA} + {faB} + {faCin} = {faA + faB + faCin} ({faCout}{faSum}_2)</span></div>
                <div className="flex justify-between"><span>Soma Final:</span><span className="font-bold text-[#2d5a27]">{faSum}</span></div>
                <div className="flex justify-between"><span>Carry Out:</span><span className="font-bold text-[#2d5a27]">{faCout}</span></div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e2ded9] bg-[#eae3d2] p-4 text-xs md:text-sm text-[#2c2825] leading-relaxed">
              O Somador Completo e o bloco fundamental da computacao aritmetica, capaz de encadear-se indefinidamente em barramentos de 32 ou 64 bits propagando o sinal de Carry.
            </div>
          </div>
        </div>
      )}

      {activeTab === "ripple" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-[#e2ded9] bg-[#f4efe6] p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-[#5c554e]">
                Somador em Cascata de 4 bits: Propagacao da Onda de Transporte (Carry Ripple)
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-[#2d5a27]">
                Resultado: {c4}{s3}{s2}{s1}{s0}_2 ({c4 ? "Overflow 5 bits" : "4 bits estaveis"})
              </span>
            </div>

            <svg viewBox="0 0 680 210" className="w-full h-auto select-none" style={{ maxHeight: "210px" }}>
              <defs>
                <marker id="rcArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#2d5a27" />
                </marker>
              </defs>

              {/* 4 Blocos de Full Adder dispostos da direita para esquerda (Bit 0 no canto direito) */}
              {[
                { bit: 0, x: 505, a: rcA[3], b: rcB[3], s: s0, cin: c0, cout: c1 },
                { bit: 1, x: 365, a: rcA[2], b: rcB[2], s: s1, cin: c1, cout: c2 },
                { bit: 2, x: 225, a: rcA[1], b: rcB[1], s: s2, cin: c2, cout: c3 },
                { bit: 3, x: 85,  a: rcA[0], b: rcB[0], s: s3, cin: c3, cout: c4 }
              ].map((stage) => (
                <g key={stage.bit}>
                  <rect x={stage.x} y="45" width="105" height="95" rx="4" fill="#eae3d2" stroke="#3c3836" strokeWidth="1.5" />
                  <text x={stage.x + 52} y="70" textAnchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#2c2825">
                    FA Bit {stage.bit}
                  </text>
                  <text x={stage.x + 52} y="88" textAnchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#5c554e">
                    A={stage.a}, B={stage.b}
                  </text>
                  <text x={stage.x + 52} y="122" textAnchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill={stage.s === 1 ? "#2d5a27" : "#2c2825"}>
                    Soma = {stage.s}
                  </text>

                  {/* Saida de Soma para baixo */}
                  <line x1={stage.x + 52} y1="140" x2={stage.x + 52} y2="175" stroke={stage.s === 1 ? "#2d5a27" : "#8c827a"} strokeWidth="2.5" markerEnd="url(#rcArrow)" />
                  <text x={stage.x + 52} y="195" textAnchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill={stage.s === 1 ? "#2d5a27" : "#2c2825"}>
                    S{stage.bit}={stage.s}
                  </text>

                  {/* Propagacao do Carry da direita para esquerda */}
                  {stage.bit > 0 && (
                    <g>
                      <line
                        x1={stage.x + 140}
                        y1="92"
                        x2={stage.x + 105}
                        y2="92"
                        stroke={stage.cin === 1 ? "#2d5a27" : "#8c827a"}
                        strokeWidth={stage.cin === 1 ? "3.5" : "2"}
                      />
                      <text x={stage.x + 122} y="84" textAnchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill={stage.cin === 1 ? "#2d5a27" : "#5c554e"}>
                        C{stage.bit - 1}={stage.cin}
                      </text>
                    </g>
                  )}
                </g>
              ))}

              {/* Carry In Inicial (Direita) */}
              <line x1="660" y1="92" x2="610" y2="92" stroke={c0 === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={c0 === 1 ? "3.5" : "2"} />
              <text x="635" y="82" textAnchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill={c0 === 1 ? "#2d5a27" : "#5c554e"}>
                Cin={c0}
              </text>

              {/* Carry Out Final (Esquerda) */}
              <line x1="85" y1="92" x2="25" y2="92" stroke={c4 === 1 ? "#2d5a27" : "#8c827a"} strokeWidth={c4 === 1 ? "3.5" : "2"} markerEnd="url(#rcArrow)" />
              <text x="35" y="82" textAnchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill={c4 === 1 ? "#2d5a27" : "#2c2825"}>
                C_out={c4}
              </text>
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e2ded9] bg-[#eae3d2] p-4 md:p-5 text-xs md:text-sm font-mono">
            <div>
              <span className="font-bold text-[#2c2825]">Caminho Critico (Critical Path):</span>
              <span className="ml-2 text-[#5c554e]">O Bit 3 so atinge resultado estavel apos o carry percorrer Bits 0, 1 e 2 (Atraso Linear O(N)).</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRcCin(rcCin === 1 ? 0 : 1)}
                className={`min-h-[44px] rounded px-3.5 py-2 text-xs md:text-sm border border-[#dcd6c8] font-bold transition-all ${
                  rcCin === 1 ? "bg-[#2d5a27] text-white shadow-sm" : "bg-[#fdfcfb] text-[#2c2825] hover:bg-white"
                }`}
              >
                Cin={rcCin}
              </button>
              <button
                type="button"
                onClick={() => { setRcA([1, 1, 1, 1]); setRcB([0, 0, 0, 1]); setRcCin(0); }}
                className="min-h-[44px] rounded bg-[#fdfcfb] px-3.5 py-2 text-xs md:text-sm border border-[#dcd6c8] font-semibold hover:bg-white transition-all shadow-sm"
              >
                Cenario: 1111 + 0001 (Ripple Maximo)
              </button>
              <button
                type="button"
                onClick={() => { setRcA([0, 1, 0, 1]); setRcB([0, 0, 1, 0]); setRcCin(0); }}
                className="min-h-[44px] rounded bg-[#fdfcfb] px-3.5 py-2 text-xs md:text-sm border border-[#dcd6c8] font-semibold hover:bg-white transition-all shadow-sm"
              >
                Cenario: 0101 + 0010 (Sem Carry)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
