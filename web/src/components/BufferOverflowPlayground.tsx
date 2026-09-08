import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ShieldAlertIcon, ShieldCheckIcon, TriangleAlertIcon, TerminalIcon, SecurityLockIcon } from '@hugeicons/core-free-icons';

export default function BufferOverflowPlayground() {
  const [inputStr, setInputStr] = useState('seguro');
  const [canaryEnabled, setCanaryEnabled] = useState(true);

  const CANARY_VAL = '0xDEADBEEFCAFE00';

  // Analisar os bytes inseridos
  const inputBytes = Array.from(inputStr).map(c => c.charCodeAt(0));
  const bufBytes = inputBytes.slice(0, 8);
  const canaryBytes = inputBytes.slice(8, 16);
  const rbpBytes = inputBytes.slice(16, 24);
  const retBytes = inputBytes.slice(24, 32);

  // Status de segurança
  const isOverflow = inputStr.length > 8;
  const isCanaryCorrupted = canaryEnabled && inputStr.length > 8;
  const isRetOverwritten = inputStr.length > (canaryEnabled ? 24 : 16);

  const presetSafe = () => setInputStr('seguro');
  const presetSmash = () => setInputStr('12345678AAAAAAAABBBBBBBB\x90\x11\x40\x00');
  const presetOverflow = () => setInputStr('A'.repeat(30));

  // Formatar bytes em hex
  const formatBytes = (bytes: number[], defaultHex: string, totalLen: number = 8) => {
    if (bytes.length === 0) return defaultHex;
    let hex = bytes.map(b => b.toString(16).padStart(2, '0')).reverse().join('');
    return '0x' + hex.toUpperCase().padStart(totalLen * 2, '0');
  };

  return (
    <div className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-coral/15 p-2.5 text-crimson border border-coral/30">
            <HugeiconsIcon icon={ShieldAlertIcon} className="h-5 w-5" />
          </span>
          <div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
              Laboratório Interativo de Stack Smashing (Buffer Overflow)
            </h4>
            <p className="font-mono text-xs text-smoke mt-0.5">
              Digite qualquer texto e veja como strings longas transbordam gavetas na memória
            </p>
          </div>
        </div>

        {/* Toggle Stack Canary */}
        <button
          onClick={() => setCanaryEnabled(!canaryEnabled)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-mono font-medium border transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
            canaryEnabled
              ? 'bg-mint/30 border-mint text-off-black'
              : 'bg-coral/20 border-coral text-off-black'
          }`}
        >
          <HugeiconsIcon icon={SecurityLockIcon} className="h-3.5 w-3.5" />
          <span>Stack Canary: {canaryEnabled ? 'LIGADO (-fstack-protector)' : 'DESLIGADO'}</span>
        </button>
      </div>

      {/* Caixa de Entrada Interativa */}
      <div className="rounded-2xl border border-ash bg-parchment p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <label className="text-xs font-mono font-medium text-off-black flex items-center gap-2">
            <HugeiconsIcon icon={TerminalIcon} className="h-4 w-4 text-lake-blue" />
            Entrada do Usuário (passada para função vulnerável como gets(buf)):
          </label>
          <div className="flex gap-2">
            <button
              onClick={presetSafe}
              className="rounded-full bg-white border border-ash px-3 py-1 text-xs font-mono text-graphite hover:border-lake-blue hover:text-off-black transition-all"
            >
              Texto Seguro (6B)
            </button>
            <button
              onClick={presetSmash}
              className="rounded-full bg-white border border-ash px-3 py-1 text-xs font-mono text-lake-blue hover:border-lake-blue hover:bg-periwinkle-mist/20 transition-all font-medium"
            >
              Ataque Morris (Invasão)
            </button>
            <button
              onClick={presetOverflow}
              className="rounded-full bg-coral/15 border border-coral/30 px-3 py-1 text-xs font-mono text-crimson hover:bg-coral/25 transition-all font-medium"
            >
              Estouro Puro (30B)
            </button>
          </div>
        </div>

        <input
          type="text"
          value={inputStr}
          onChange={(e) => setInputStr(e.target.value)}
          placeholder="Digite caracteres aqui..."
          className="w-full rounded-xl bg-white border border-ash p-3 font-mono text-xs text-off-black focus:outline-none focus:ring-2 focus:ring-lake-blue"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs font-mono text-smoke">
          <span>Tamanho da string digitada: <strong className="text-off-black">{inputStr.length} bytes</strong> (Gaveta local tem apenas 8 bytes)</span>
          <span>Endereço Base: 0x7FFFFFFF30</span>
        </div>
      </div>

      {/* Alerta de Estado da Pilha */}
      <div className={`rounded-2xl p-4 mb-6 border flex items-start gap-3 font-mono text-xs md:text-sm transition-all ${
        !isOverflow
          ? 'bg-mint/20 border-mint text-off-black'
          : isCanaryCorrupted && !isRetOverwritten
          ? 'bg-coral/15 border-coral/50 text-off-black'
          : 'bg-coral/25 border-coral text-off-black font-medium'
      }`}>
        {!isOverflow ? (
          <>
            <HugeiconsIcon icon={ShieldCheckIcon} className="h-4 w-4 shrink-0 text-[#0e7c54] mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-off-black font-semibold">ESTADO SEGURO: </strong>
              Todos os caracteres cabem perfeitamente dentro dos 8 bytes da variável local <code>buf[8]</code>. O endereço de retorno permanece intacto.
            </div>
          </>
        ) : isCanaryCorrupted ? (
          <>
            <HugeiconsIcon icon={TriangleAlertIcon} className="h-4 w-4 shrink-0 text-crimson mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-crimson font-semibold">PROTEÇÃO DISPARADA (Stack Canary): </strong>
              A string transbordou e corrompeu a palavra sentinela secreta antes do endereço de retorno. O manipulador <code>__stack_chk_fail()</code> do compilador vai abortar o processo com <em>"stack smashing detected"</em> antes da instrução <code>retq</code> executar!
            </div>
          </>
        ) : (
          <>
            <HugeiconsIcon icon={ShieldAlertIcon} className="h-4 w-4 shrink-0 text-crimson mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-crimson font-semibold">STACK SMASHING TOTAL! FLUXO SEQUESTRADO: </strong>
              A string esmagou o endereço de retorno na pilha. Quando a função executar <code>retq</code>, o processador vai pular para o endereço arbitrário fornecido pelo invasor!
            </div>
          </>
        )}
      </div>

      {/* Layout Físico da Pilha Sendo Esmagada */}
      <div className="space-y-2.5 font-mono text-xs">
        <div className="flex items-center justify-between text-xs font-mono font-medium text-smoke uppercase tracking-wider mb-2">
          <span>Layout da Pilha na Memória RAM (Cresce de baixo para cima na leitura física):</span>
        </div>

        {/* 1. Endereço de Retorno (Target Primário de Ataques) */}
        <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
          isRetOverwritten
            ? 'bg-coral/20 border-coral text-off-black font-bold ring-2 ring-coral'
            : 'bg-white border-ash text-graphite'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-off-black font-bold">0x7FFFFFFF48:</span>
            <span className={isRetOverwritten ? 'text-crimson font-semibold' : 'text-graphite'}>
              Return Address (Onde o %rip pula no retq)
            </span>
          </div>
          <div className="text-right">
            <span className={isRetOverwritten ? 'text-crimson font-bold' : 'text-off-black font-medium'}>
              {isRetOverwritten
                ? formatBytes(retBytes, '0x4141414141414141') + ' (CORROMPIDO!)'
                : '0x0000000000401150 (Legítimo)'}
            </span>
          </div>
        </div>

        {/* 2. Saved %rbp */}
        <div className="flex items-center justify-between p-3 rounded-2xl border border-ash bg-white text-graphite">
          <div className="flex items-center gap-2.5">
            <span className="text-off-black font-bold">0x7FFFFFFF40:</span>
            <span>Saved %rbp (Frame Pointer do Chamador)</span>
          </div>
          <div>
            <span className="text-off-black font-medium">{formatBytes(rbpBytes, '0x00007FFFFFFF50')}</span>
          </div>
        </div>

        {/* 3. Stack Canary (Se ativado) */}
        {canaryEnabled && (
          <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
            isCanaryCorrupted
              ? 'bg-coral/15 border-coral text-off-black font-bold'
              : 'bg-mint/20 border-mint text-off-black'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="text-off-black font-bold">0x7FFFFFFF38:</span>
              <span>Stack Canary (Valor Sentinela Secreto do Compilador)</span>
            </div>
            <div>
              <span className="font-semibold">
                {isCanaryCorrupted
                  ? formatBytes(canaryBytes, '0x4141414141414141') + ' (ALTERADO!)'
                  : CANARY_VAL + ' (Íntegro)'}
              </span>
            </div>
          </div>
        )}

        {/* 4. O Buffer de 8 Bytes char buf[8] */}
        <div className="flex items-center justify-between p-3 rounded-2xl border border-lake-blue/40 bg-periwinkle-mist/20 text-off-black">
          <div className="flex items-center gap-2.5">
            <span className="text-off-black font-bold">0x7FFFFFFF30:</span>
            <span className="text-lake-blue font-medium">char buf[8] (A Gaveta Local de 8 Bytes)</span>
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-off-black">
              {bufBytes.length > 0 ? `"${inputStr.slice(0, 8)}"` : '[Vazio]'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
