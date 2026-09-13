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
      className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 font-sans shadow-sm transition-all"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div>
          <span className="inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider bg-periwinkle-mist text-lake-blue border border-lake-blue/20">
            VIS-05: Aritmética Digital e Caminho Crítico
          </span>
          <h3 className="mt-2 font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
            Circuitos Somadores: Meio Somador, Somador Completo e Cascata
          </h3>
        </div>
        <div className="flex rounded-full bg-parchment p-1 border border-ash text-xs md:text-sm font-mono font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("half")}
            className={`rounded-full px-4 py-1.5 transition-all ${
              activeTab === "half" ? "bg-lake-blue text-white shadow-sm" : "text-graphite hover:text-off-black"
            }`}
          >
            Meio Somador
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("full")}
            className={`rounded-full px-4 py-1.5 transition-all ${
              activeTab === "full" ? "bg-lake-blue text-white shadow-sm" : "text-graphite hover:text-off-black"
            }`}
          >
            Somador Completo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ripple")}
            className={`rounded-full px-4 py-1.5 transition-all ${
              activeTab === "ripple" ? "bg-lake-blue text-white shadow-sm" : "text-graphite hover:text-off-black"
            }`}
          >
            Cascata (Ripple 4-bit)
          </button>
        </div>
      </div>

      {activeTab === "half" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-xs md:text-sm font-medium text-graphite">
                  Meio Somador: Roteamento Ortogonal (XOR para Soma, AND para Carry)
                </span>
                <span className="font-mono text-xs md:text-sm font-bold text-lake-blue">
                  Soma={haSum}, Carry={haCarry}
                </span>
              </div>
              <svg viewBox="0 0 580 230" className="w-full h-auto select-none" style={{ maxHeight: "230px" }}>
                <defs>
                  <marker id="haArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#2b59d1" />
                  </marker>
                </defs>

                {/* Entrada A */}
                <line x1="40" y1="60" x2="200" y2="60" stroke={haA === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={haA === 1 ? "3" : "2"} />
                <circle cx="40" cy="60" r="5" fill={haA === 1 ? "#2b59d1" : "#615e5d"} />
                <text x="40" y="44" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={haA === 1 ? "#2b59d1" : "#242424"}>
                  Entrada A = {haA}
                </text>

                {/* Entrada B */}
                <line x1="40" y1="90" x2="200" y2="90" stroke={haB === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={haB === 1 ? "3" : "2"} />
                <circle cx="40" cy="90" r="5" fill={haB === 1 ? "#2b59d1" : "#615e5d"} />
                <text x="40" y="112" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={haB === 1 ? "#2b59d1" : "#242424"}>
                  Entrada B = {haB}
                </text>

                {/* Ramificações Ortogonais para Porta AND */}
                <circle cx="100" cy="60" r="4" fill={haA === 1 ? "#2b59d1" : "#615e5d"} />
                <line x1="100" y1="60" x2="100" y2="155" stroke={haA === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={haA === 1 ? "3" : "2"} />
                <line x1="100" y1="155" x2="200" y2="155" stroke={haA === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={haA === 1 ? "3" : "2"} />

                <circle cx="130" cy="90" r="4" fill={haB === 1 ? "#2b59d1" : "#615e5d"} />
                <line x1="130" y1="90" x2="130" y2="175" stroke={haB === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={haB === 1 ? "3" : "2"} />
                <line x1="130" y1="175" x2="200" y2="175" stroke={haB === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={haB === 1 ? "3" : "2"} />

                {/* Porta XOR (Soma) */}
                <g transform="translate(200, 48)">
                  <rect x="0" y="0" width="90" height="54" rx="6" fill="#ffffff" stroke="#242424" strokeWidth="1.5" />
                  <text x="45" y="32" textAnchor="middle" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="#242424">XOR</text>
                </g>
                <line x1="290" y1="75" x2="420" y2="75" stroke={haSum === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={haSum === 1 ? "3.5" : "2"} markerEnd="url(#haArrow)" />
                <text x="435" y="70" fontFamily="monospace" fontSize="14" fontWeight="bold" fill={haSum === 1 ? "#2b59d1" : "#242424"}>
                  Soma (S) = {haSum}
                </text>
                <text x="435" y="88" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#615e5d">
                  S = A ^ B
                </text>

                {/* Porta AND (Carry) */}
                <g transform="translate(200, 138)">
                  <rect x="0" y="0" width="90" height="54" rx="6" fill="#ffffff" stroke="#242424" strokeWidth="1.5" />
                  <text x="45" y="32" textAnchor="middle" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="#242424">AND</text>
                </g>
                <line x1="290" y1="165" x2="420" y2="165" stroke={haCarry === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={haCarry === 1 ? "3.5" : "2"} markerEnd="url(#haArrow)" />
                <text x="435" y="160" fontFamily="monospace" fontSize="14" fontWeight="bold" fill={haCarry === 1 ? "#2b59d1" : "#242424"}>
                  Carry (C) = {haCarry}
                </text>
                <text x="435" y="178" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#615e5d">
                  C = A & B
                </text>
              </svg>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
              <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-smoke">Controle das Entradas</h4>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setHaA(haA === 1 ? 0 : 1)}
                  className={`min-h-[44px] flex-1 rounded-full py-2 font-mono text-xs md:text-sm font-bold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                    haA === 1 ? "bg-lake-blue text-white border-lake-blue shadow-sm" : "bg-white text-off-black border-ash hover:border-lake-blue"
                  }`}
                >
                  Bit A = {haA}
                </button>
                <button
                  type="button"
                  onClick={() => setHaB(haB === 1 ? 0 : 1)}
                  className={`min-h-[44px] flex-1 rounded-full py-2 font-mono text-xs md:text-sm font-bold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                    haB === 1 ? "bg-lake-blue text-white border-lake-blue shadow-sm" : "bg-white text-off-black border-ash hover:border-lake-blue"
                  }`}
                >
                  Bit B = {haB}
                </button>
              </div>
              <div className="mt-4 border-t border-ash pt-3 font-mono text-xs md:text-sm space-y-2 text-off-black">
                <div className="flex justify-between"><span>Aritmética:</span><span className="font-bold">{haA} + {haB} = {haCarry}{haSum}_2</span></div>
                <div className="flex justify-between"><span>Soma (A ^ B):</span><span className="font-bold text-lake-blue">{haSum}</span></div>
                <div className="flex justify-between"><span>Carry (A & B):</span><span className="font-bold text-lake-blue">{haCarry}</span></div>
              </div>
            </div>
            <div className="rounded-2xl border border-ash bg-white p-4 text-xs md:text-sm text-graphite leading-relaxed">
              O Meio Somador resolve a adição de dois bits isolados gerando soma e transporte, mas não possui entrada de Carry-In para receber o transporte da coluna anterior.
            </div>
          </div>
        </div>
      )}

      {activeTab === "full" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-xs md:text-sm font-medium text-graphite">
                  Somador Completo (2 Half Adders em Cascata + Porta OR)
                </span>
                <span className="font-mono text-xs md:text-sm font-bold text-lake-blue">
                  Soma={faSum}, C_out={faCout}
                </span>
              </div>
              <svg viewBox="0 0 650 260" className="w-full h-auto select-none" style={{ maxHeight: "260px" }}>
                <defs>
                  <marker id="faArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#2b59d1" />
                  </marker>
                </defs>

                {/* Half Adder 1 */}
                <rect x="55" y="30" width="130" height="90" rx="6" fill="#ffffff" stroke="#242424" strokeWidth="1.5" />
                <text x="120" y="58" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">Half Adder 1</text>
                <text x="120" y="80" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#615e5d">A ^ B e A & B</text>

                {/* Entradas A e B no HA 1 */}
                <line x1="15" y1="52" x2="55" y2="52" stroke={faA === 1 ? "#2b59d1" : "#615e5d"} strokeWidth="2.5" />
                <circle cx="15" cy="52" r="4" fill={faA === 1 ? "#2b59d1" : "#615e5d"} />
                <text x="18" y="44" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#242424">A={faA}</text>

                <line x1="15" y1="92" x2="55" y2="92" stroke={faB === 1 ? "#2b59d1" : "#615e5d"} strokeWidth="2.5" />
                <circle cx="15" cy="92" r="4" fill={faB === 1 ? "#2b59d1" : "#615e5d"} />
                <text x="18" y="84" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#242424">B={faB}</text>

                {/* Half Adder 2 */}
                <rect x="250" y="30" width="130" height="90" rx="6" fill="#ffffff" stroke="#242424" strokeWidth="1.5" />
                <text x="315" y="58" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">Half Adder 2</text>
                <text x="315" y="80" textAnchor="middle" fontFamily="monospace" fontSize="11" fill="#615e5d">Soma + C_in</text>

                {/* Fio de Soma Intermediária HA1 -> HA2 */}
                <line x1="185" y1="52" x2="250" y2="52" stroke="#242424" strokeWidth="2.5" />
                <text x="217" y="44" textAnchor="middle" fontFamily="monospace" fontSize="10" fontWeight="bold" fill="#615e5d">S_int</text>

                {/* Entrada Cin via Linha Ortogonal */}
                <line x1="15" y1="150" x2="220" y2="150" stroke={faCin === 1 ? "#2b59d1" : "#615e5d"} strokeWidth="2.5" />
                <line x1="220" y1="150" x2="220" y2="92" stroke={faCin === 1 ? "#2b59d1" : "#615e5d"} strokeWidth="2.5" />
                <line x1="220" y1="92" x2="250" y2="92" stroke={faCin === 1 ? "#2b59d1" : "#615e5d"} strokeWidth="2.5" />
                <circle cx="15" cy="150" r="4" fill={faCin === 1 ? "#2b59d1" : "#615e5d"} />
                <text x="18" y="142" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#242424">C_in={faCin}</text>

                {/* Saída de Soma Final */}
                <line x1="380" y1="52" x2="505" y2="52" stroke={faSum === 1 ? "#2b59d1" : "#615e5d"} strokeWidth="3.5" markerEnd="url(#faArrow)" />
                <text x="520" y="48" fontFamily="monospace" fontSize="14" fontWeight="bold" fill={faSum === 1 ? "#2b59d1" : "#242424"}>
                  Soma = {faSum}
                </text>
                <text x="520" y="68" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#615e5d">
                  S = A ^ B ^ Cin
                </text>

                {/* Conexões de Carry para a Porta OR */}
                {/* Carry 1 do HA 1 */}
                <path
                  d="M 185 92 L 205 92 L 205 144 A 6 6 0 0 0 205 156 L 205 185 L 415 185"
                  fill="none"
                  stroke="#242424"
                  strokeWidth="2"
                />
                <text x="215" y="178" fontFamily="monospace" fontSize="10" fill="#615e5d">Carry 1 (A & B)</text>

                {/* Carry 2 do HA 2 */}
                <line x1="380" y1="92" x2="400" y2="92" stroke="#242424" strokeWidth="2" />
                <line x1="400" y1="92" x2="400" y2="160" stroke="#242424" strokeWidth="2" />
                <line x1="400" y1="160" x2="415" y2="160" stroke="#242424" strokeWidth="2" />
                <text x="392" y="145" textAnchor="end" fontFamily="monospace" fontSize="10" fill="#615e5d">Carry 2</text>

                {/* Porta OR */}
                <g transform="translate(415, 145)">
                  <rect x="0" y="0" width="65" height="52" rx="6" fill="#ffffff" stroke="#242424" strokeWidth="1.5" />
                  <text x="32" y="32" textAnchor="middle" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="#242424">OR</text>
                </g>

                {/* Saída Carry Out */}
                <line x1="480" y1="171" x2="505" y2="171" stroke={faCout === 1 ? "#2b59d1" : "#615e5d"} strokeWidth="3.5" markerEnd="url(#faArrow)" />
                <text x="520" y="167" fontFamily="monospace" fontSize="14" fontWeight="bold" fill={faCout === 1 ? "#2b59d1" : "#242424"}>
                  C_out = {faCout}
                </text>
                <text x="520" y="187" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#615e5d">
                  Carry 1 | Carry 2
                </text>
              </svg>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
              <h4 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-smoke">Controle das 3 Entradas</h4>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFaA(faA === 1 ? 0 : 1)}
                  className={`min-h-[44px] rounded-full py-2 font-mono text-xs md:text-sm font-bold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                    faA === 1 ? "bg-lake-blue text-white border-lake-blue shadow-sm" : "bg-white text-off-black border-ash hover:border-lake-blue"
                  }`}
                >
                  A={faA}
                </button>
                <button
                  type="button"
                  onClick={() => setFaB(faB === 1 ? 0 : 1)}
                  className={`min-h-[44px] rounded-full py-2 font-mono text-xs md:text-sm font-bold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                    faB === 1 ? "bg-lake-blue text-white border-lake-blue shadow-sm" : "bg-white text-off-black border-ash hover:border-lake-blue"
                  }`}
                >
                  B={faB}
                </button>
                <button
                  type="button"
                  onClick={() => setFaCin(faCin === 1 ? 0 : 1)}
                  className={`min-h-[44px] rounded-full py-2 font-mono text-xs md:text-sm font-bold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                    faCin === 1 ? "bg-lake-blue text-white border-lake-blue shadow-sm" : "bg-white text-off-black border-ash hover:border-lake-blue"
                  }`}
                >
                  Cin={faCin}
                </button>
              </div>
              <div className="mt-4 border-t border-ash pt-3 font-mono text-xs md:text-sm space-y-2 text-off-black">
                <div className="flex justify-between"><span>Aritmética:</span><span className="font-bold">{faA} + {faB} + {faCin} = {faA + faB + faCin} ({faCout}{faSum}_2)</span></div>
                <div className="flex justify-between"><span>Soma Final:</span><span className="font-bold text-lake-blue">{faSum}</span></div>
                <div className="flex justify-between"><span>Carry Out:</span><span className="font-bold text-lake-blue">{faCout}</span></div>
              </div>
            </div>
            <div className="rounded-2xl border border-ash bg-white p-4 text-xs md:text-sm text-graphite leading-relaxed">
              O Somador Completo é o bloco fundamental da computação aritmética, capaz de encadear-se indefinidamente em barramentos de 32 ou 64 bits propagando o sinal de Carry.
            </div>
          </div>
        </div>
      )}

      {activeTab === "ripple" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-ash bg-parchment p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs md:text-sm font-medium text-graphite">
                Somador em Cascata de 4 bits: Propagação da Onda de Transporte (Carry Ripple)
              </span>
              <span className="font-mono text-xs md:text-sm font-bold text-lake-blue">
                Resultado: {c4}{s3}{s2}{s1}{s0}_2 ({c4 ? "Overflow 5 bits" : "4 bits estáveis"})
              </span>
            </div>

            <svg viewBox="0 0 710 210" className="w-full h-auto select-none" style={{ maxHeight: "210px" }}>
              <defs>
                <marker id="rcArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#2b59d1" />
                </marker>
              </defs>

              {/* 4 Blocos de Full Adder dispostos da direita para esquerda (Bit 0 no canto direito) */}
              {[
                { bit: 0, x: 530, a: rcA[3], b: rcB[3], s: s0, cin: c0, cout: c1 },
                { bit: 1, x: 390, a: rcA[2], b: rcB[2], s: s1, cin: c1, cout: c2 },
                { bit: 2, x: 250, a: rcA[1], b: rcB[1], s: s2, cin: c2, cout: c3 },
                { bit: 3, x: 110, a: rcA[0], b: rcB[0], s: s3, cin: c3, cout: c4 }
              ].map((stage) => (
                <g key={stage.bit}>
                  <rect x={stage.x} y="45" width="105" height="95" rx="6" fill="#ffffff" stroke="#242424" strokeWidth="1.5" />
                  <text x={stage.x + 52} y="70" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#242424">
                    FA Bit {stage.bit}
                  </text>
                  <text x={stage.x + 52} y="88" textAnchor="middle" fontFamily="monospace" fontSize="11" fontWeight="bold" fill="#615e5d">
                    A={stage.a}, B={stage.b}
                  </text>
                  <text x={stage.x + 52} y="122" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={stage.s === 1 ? "#2b59d1" : "#242424"}>
                    Soma = {stage.s}
                  </text>

                  {/* Saída de Soma para baixo */}
                  <line x1={stage.x + 52} y1="140" x2={stage.x + 52} y2="175" stroke={stage.s === 1 ? "#2b59d1" : "#615e5d"} strokeWidth="2.5" markerEnd="url(#rcArrow)" />
                  <text x={stage.x + 52} y="195" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={stage.s === 1 ? "#2b59d1" : "#242424"}>
                    S{stage.bit}={stage.s}
                  </text>

                  {/* Propagação do Carry da direita para esquerda */}
                  {stage.bit > 0 && (
                    <g>
                      <line
                        x1={stage.x + 140}
                        y1="92"
                        x2={stage.x + 105}
                        y2="92"
                        stroke={stage.cin === 1 ? "#2b59d1" : "#615e5d"}
                        strokeWidth={stage.cin === 1 ? "3.5" : "2"}
                      />
                      <text x={stage.x + 122} y="84" textAnchor="middle" fontFamily="monospace" fontSize="11" fontWeight="bold" fill={stage.cin === 1 ? "#2b59d1" : "#615e5d"}>
                        C{stage.bit - 1}={stage.cin}
                      </text>
                    </g>
                  )}
                </g>
              ))}

              {/* Carry In Inicial (Direita) */}
              <line x1="685" y1="92" x2="635" y2="92" stroke={c0 === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={c0 === 1 ? "3.5" : "2"} />
              <text x="660" y="82" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="bold" fill={c0 === 1 ? "#2b59d1" : "#615e5d"}>
                Cin={c0}
              </text>

              {/* Carry Out Final (Esquerda) */}
              <line x1="110" y1="92" x2="45" y2="92" stroke={c4 === 1 ? "#2b59d1" : "#615e5d"} strokeWidth={c4 === 1 ? "3.5" : "2"} markerEnd="url(#rcArrow)" />
              <text x="60" y="82" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="bold" fill={c4 === 1 ? "#2b59d1" : "#242424"}>
                C_out={c4}
              </text>
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ash bg-parchment p-4 md:p-5 text-xs md:text-sm font-mono">
            <div>
              <span className="font-bold text-off-black">Caminho Crítico (Critical Path):</span>
              <span className="ml-2 text-graphite">O Bit 3 só atinge resultado estável após o carry percorrer Bits 0, 1 e 2 (Atraso Linear O(N)).</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRcCin(rcCin === 1 ? 0 : 1)}
                className={`min-h-[44px] rounded-full px-4 py-2 text-xs md:text-sm border font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
                  rcCin === 1 ? "bg-lake-blue text-white border-lake-blue shadow-sm" : "bg-white text-off-black border-ash hover:border-lake-blue"
                }`}
              >
                Cin={rcCin}
              </button>
              <button
                type="button"
                onClick={() => { setRcA([1, 1, 1, 1]); setRcB([0, 0, 0, 1]); setRcCin(0); }}
                className="min-h-[44px] rounded-full bg-white px-4 py-2 text-xs md:text-sm border border-ash text-graphite font-medium hover:text-off-black hover:border-lake-blue transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
              >
                Cenário: 1111 + 0001 (Ripple Máximo)
              </button>
              <button
                type="button"
                onClick={() => { setRcA([0, 1, 0, 1]); setRcB([0, 0, 1, 0]); setRcCin(0); }}
                className="min-h-[44px] rounded-full bg-white px-4 py-2 text-xs md:text-sm border border-ash text-graphite font-medium hover:text-off-black hover:border-lake-blue transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue"
              >
                Cenário: 0101 + 0010 (Sem Carry)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
