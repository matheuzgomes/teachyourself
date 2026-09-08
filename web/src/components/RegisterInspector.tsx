import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CpuIcon, ZapIcon, InfoIcon } from '@hugeicons/core-free-icons';

interface RegisterDef {
  name64: string;
  name32: string;
  name16: string;
  name8: string;
  name8h?: string;
  role: string;
  savedBy: 'Callee' | 'Caller';
  abiUsage: string;
  description: string;
}

const REGISTERS: RegisterDef[] = [
  {
    name64: '%rax',
    name32: '%eax',
    name16: '%ax',
    name8: '%al',
    name8h: '%ah',
    role: 'Retorno de Função',
    savedBy: 'Caller',
    abiUsage: 'Valor de retorno de funções de até 64 bits',
    description: 'Registrador acumulador primário. Quando uma função termina, o valor retornado deve estar gravado nele.'
  },
  {
    name64: '%rdi',
    name32: '%edi',
    name16: '%di',
    name8: '%dil',
    role: '1º Argumento',
    savedBy: 'Caller',
    abiUsage: 'Primeiro parâmetro passado para uma função',
    description: 'Ponteiro de destino em operações de bloco. Na convenção System V ABI, carrega o primeiro argumento de qualquer chamada.'
  },
  {
    name64: '%rsi',
    name32: '%esi',
    name16: '%si',
    name8: '%sil',
    role: '2º Argumento',
    savedBy: 'Caller',
    abiUsage: 'Segundo parâmetro passado para uma função',
    description: 'Ponteiro de origem em cópias de memória. Carrega o segundo argumento de funções.'
  },
  {
    name64: '%rdx',
    name32: '%edx',
    name16: '%dx',
    name8: '%dl',
    name8h: '%dh',
    role: '3º Argumento',
    savedBy: 'Caller',
    abiUsage: 'Terceiro parâmetro de função e multiplicador de 128 bits',
    description: 'Registrador de dados. Usado junto com %rax em multiplicações de 128 bits e divisões inteiras.'
  },
  {
    name64: '%rcx',
    name32: '%ecx',
    name16: '%cx',
    name8: '%cl',
    name8h: '%ch',
    role: '4º Argumento',
    savedBy: 'Caller',
    abiUsage: 'Quarto parâmetro de função e contador de loops/shifts',
    description: 'O byte mais baixo (%cl) é o registrador obrigatório para contagens de deslocamentos em shifts de bits.'
  },
  {
    name64: '%r8',
    name32: '%r8d',
    name16: '%r8w',
    name8: '%r8b',
    role: '5º Argumento',
    savedBy: 'Caller',
    abiUsage: 'Quinto parâmetro passado para uma função',
    description: 'Novo registrador adicionado pela AMD na expansão de 64 bits (x86-64).'
  },
  {
    name64: '%r9',
    name32: '%r9d',
    name16: '%r9w',
    name8: '%r9b',
    role: '6º Argumento',
    savedBy: 'Caller',
    abiUsage: 'Sexto parâmetro passado para uma função',
    description: 'Último argumento passado via registrador. Argumentos subsequentes (7º em diante) vão para a memória da pilha.'
  },
  {
    name64: '%rsp',
    name32: '%esp',
    name16: '%sp',
    name8: '%spl',
    role: 'Ponteiro da Pilha',
    savedBy: 'Callee',
    abiUsage: 'Aponta para o endereço do topo da pilha de execução',
    description: 'Modificado automaticamente pelas instruções push, pop, call e ret. Aponta sempre para o endereço de memória mais baixo em uso.'
  },
  {
    name64: '%rbp',
    name32: '%ebp',
    name16: '%bp',
    name8: '%bpl',
    role: 'Frame Pointer',
    savedBy: 'Callee',
    abiUsage: 'Ponteiro de base do stack frame (ou registrador de uso geral)',
    description: 'Historicamente usado para ancorar o início do frame de uma função na pilha. Callee-saved: deve ser preservado.'
  },
  {
    name64: '%rbx',
    name32: '%ebx',
    name16: '%bx',
    name8: '%bl',
    name8h: '%bh',
    role: 'Callee-Saved Geral',
    savedBy: 'Callee',
    abiUsage: 'Variáveis locais preservadas entre chamadas',
    description: 'Se uma função chamada quiser usar %rbx, ela tem a obrigação de salvar o valor anterior na pilha e restaurá-lo antes de retornar.'
  },
  {
    name64: '%r10',
    name32: '%r10d',
    name16: '%r10w',
    name8: '%r10b',
    role: 'Caller-Saved Temporário',
    savedBy: 'Caller',
    abiUsage: 'Cálculos temporários locais',
    description: 'Pode ser sobrescrito livremente por qualquer função chamada sem aviso prévio.'
  },
  {
    name64: '%r11',
    name32: '%r11d',
    name16: '%r11w',
    name8: '%r11b',
    role: 'Caller-Saved Temporário',
    savedBy: 'Caller',
    abiUsage: 'Temporário e usado internamente por instruções de link dinâmico',
    description: 'Também utilizado pela instrução syscall para guardar as flags da CPU.'
  },
  {
    name64: '%r12',
    name32: '%r12d',
    name16: '%r12w',
    name8: '%r12b',
    role: 'Callee-Saved',
    savedBy: 'Callee',
    abiUsage: 'Dados locais de longa duração',
    description: 'Deve ser preservado intacto entre chamadas de função.'
  },
  {
    name64: '%r13',
    name32: '%r13d',
    name16: '%r13w',
    name8: '%r13b',
    role: 'Callee-Saved',
    savedBy: 'Callee',
    abiUsage: 'Dados locais de longa duração',
    description: 'Deve ser preservado intacto entre chamadas de função.'
  },
  {
    name64: '%r14',
    name32: '%r14d',
    name16: '%r14w',
    name8: '%r14b',
    role: 'Callee-Saved',
    savedBy: 'Callee',
    abiUsage: 'Dados locais de longa duração',
    description: 'Deve ser preservado intacto entre chamadas de função.'
  },
  {
    name64: '%r15',
    name32: '%r15d',
    name16: '%r15w',
    name8: '%r15b',
    role: 'Callee-Saved',
    savedBy: 'Callee',
    abiUsage: 'Dados locais de longa duração',
    description: 'Deve ser preservado intacto entre chamadas de função.'
  }
];

export default function RegisterInspector() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [simulateWrite32, setSimulateWrite32] = useState(false);

  const reg = REGISTERS[selectedIdx];

  return (
    <div className="my-8 rounded-card border border-ash bg-white p-6 md:p-8 text-graphite shadow-sm transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ash pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-periwinkle-mist p-2.5 text-lake-blue border border-lake-blue/20">
            <HugeiconsIcon icon={CpuIcon} className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-serif text-xl md:text-2xl font-normal text-off-black tracking-tight">
              Os 16 Registradores de Propósito Geral (x86-64)
            </h4>
            <p className="font-mono text-xs text-smoke mt-0.5">
              Clique em qualquer registrador para inspecionar suas fatias de bits e papel na ABI
            </p>
          </div>
        </div>

        <button
          onClick={() => setSimulateWrite32(!simulateWrite32)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs font-medium border transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
            simulateWrite32
              ? 'bg-lake-blue text-white border-lake-blue shadow-sm'
              : 'bg-parchment border-ash text-graphite hover:border-lake-blue hover:text-off-black'
          }`}
        >
          <HugeiconsIcon icon={ZapIcon} className="h-3.5 w-3.5" />
          <span>Regra de Zeramento de 32 Bits: {simulateWrite32 ? 'ATIVA' : 'DESLIGADA'}</span>
        </button>
      </div>

      {/* Grid com os 16 registradores */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
        {REGISTERS.map((r, i) => (
          <button
            key={r.name64}
            onClick={() => setSelectedIdx(i)}
            className={`flex flex-col items-center rounded-2xl p-2.5 text-center transition-all border min-h-[52px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lake-blue ${
              selectedIdx === i
                ? 'bg-white border-lake-blue text-lake-blue font-medium ring-2 ring-lake-blue/20 shadow-sm'
                : 'bg-parchment border-ash text-graphite hover:border-lake-blue/50 hover:bg-white hover:text-off-black'
            }`}
          >
            <span className="font-mono font-bold text-xs">{r.name64}</span>
            <span className="text-[10px] truncate max-w-full text-smoke mt-0.5">{r.role}</span>
          </button>
        ))}
      </div>

      {/* Painel do Registrador Selecionado */}
      <div className="rounded-2xl border border-ash bg-parchment p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-lg font-bold text-off-black">{reg.name64}</span>
            <span className="rounded-full bg-white border border-ash px-3 py-0.5 text-xs font-mono font-medium text-graphite">
              {reg.role}
            </span>
            <span className={`rounded-full px-3 py-0.5 text-xs font-mono font-medium border ${
              reg.savedBy === 'Callee'
                ? 'bg-mint/30 text-off-black border-mint'
                : 'bg-coral/20 text-off-black border-coral'
            }`}>
              Preservado por: {reg.savedBy}
            </span>
          </div>
          <span className="font-mono text-xs text-smoke">{reg.abiUsage}</span>
        </div>

        <p className="font-mono text-xs md:text-sm text-graphite leading-relaxed mb-6">{reg.description}</p>

        {/* Diagrama Físico das Fatias de Bits */}
        <div className="space-y-3">
          <div className="font-mono text-xs font-semibold uppercase tracking-wider text-smoke">Anatomia das Fatias de Bits:</div>

          {/* Barra de 64 bits (%rax) */}
          <div className="rounded-2xl border border-ash bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-mono text-smoke mb-2">
              <span>Bit 63</span>
              <span className="text-off-black font-bold">{reg.name64} (64 bits completos / Quadword)</span>
              <span>Bit 0</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-center text-xs">
              <div className={`rounded-xl p-2.5 border transition-all ${
                simulateWrite32
                  ? 'bg-coral/20 border-coral text-crimson font-medium'
                  : 'bg-parchment border-ash text-smoke'
              }`}>
                {simulateWrite32 ? '00000000 00000000 (ZERADO AUTOMATICAMENTE!)' : 'Bits 63..32 (Metade Superior)'}
              </div>
              <div className="rounded-xl bg-lake-blue/10 border border-lake-blue/30 p-2.5 text-lake-blue font-semibold">
                {simulateWrite32 ? '0x00000042 (Bits 31..0 Gravados)' : `Bits 31..0 (${reg.name32})`}
              </div>
            </div>
          </div>

          {/* Subdivisões: 32 bits, 16 bits e 8 bits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 font-mono text-xs">
            {/* 32 bits */}
            <div className="rounded-2xl border border-ash bg-white p-3.5 shadow-sm">
              <div className="text-xs text-off-black font-semibold mb-1.5">{reg.name32} (Doubleword / 32 bits)</div>
              <div className="rounded-xl bg-parchment p-2 text-center text-graphite border border-ash font-medium">
                Bits 31..0
              </div>
              <div className="text-[11px] text-smoke mt-1.5">Ao gravar aqui, o x86-64 zera os bits 63..32!</div>
            </div>

            {/* 16 bits */}
            <div className="rounded-2xl border border-ash bg-white p-3.5 shadow-sm">
              <div className="text-xs text-off-black font-semibold mb-1.5">{reg.name16} (Word / 16 bits)</div>
              <div className="rounded-xl bg-parchment p-2 text-center text-graphite border border-ash font-medium">
                Bits 15..0
              </div>
              <div className="text-[11px] text-smoke mt-1.5">Herança do processador 8086 original</div>
            </div>

            {/* 8 bits */}
            <div className="rounded-2xl border border-ash bg-white p-3.5 shadow-sm">
              <div className="text-xs text-off-black font-semibold mb-1.5">{reg.name8} (Byte / 8 bits)</div>
              <div className="rounded-xl bg-parchment p-2 text-center text-graphite border border-ash font-medium">
                Bits 7..0
              </div>
              <div className="text-[11px] text-smoke mt-1.5">
                {reg.name8h ? `Também possui ${reg.name8h} (bits 15..8)` : 'Acessa o byte menos significativo'}
              </div>
            </div>
          </div>
        </div>

        {/* Alerta Didático da Regra de Zeramento */}
        {simulateWrite32 && (
          <div className="mt-4 rounded-2xl bg-white border border-lake-blue/30 p-4 text-xs font-mono text-graphite flex items-start gap-3 shadow-sm">
            <HugeiconsIcon icon={InfoIcon} className="h-4 w-4 shrink-0 text-lake-blue mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-off-black">A Regra de Ouro da Arquitetura x86-64: </strong>
              Diferente de operações de 8 ou 16 bits (que preservam os bits superiores intactos), qualquer instrução que grava em um registrador de 32 bits (como <code>movl $42, {reg.name32}</code>) força a CPU a zerar instantaneamente todos os bits 63..32 de {reg.name64}! Os projetistas da AMD implementaram isso para eliminar dependências falsas de pipeline nos circuitos.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
